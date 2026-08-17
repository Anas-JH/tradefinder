import { NextRequest, NextResponse } from "next/server"
import { CalleClient } from "@call-e/calle"

import {
  createJob,
  getJob,
  updateResult,
  type CallJob,
  type CallResult,
} from "@/lib/call-jobs"
import { TRADESPEOPLE } from "@/lib/tradespeople"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const isDryRun = () => process.env.DRY_RUN !== "false"

const DRY_RUN_STEP_MS = 2000

const DRY_RUN_OUTCOMES: Record<
  string,
  {
    calloutFee: number
    eta: string
    availability: string
    handlesJob: boolean
  } | null
> = {
  "tp-1": {
    calloutFee: 75,
    eta: "45 min",
    availability: "Today, 4–6pm",
    handlesJob: true,
  },
  "tp-2": {
    calloutFee: 95,
    eta: "30 min",
    availability: "Today, 2–3pm",
    handlesJob: false,
  },
  "tp-3": {
    calloutFee: 120,
    eta: "2 hrs",
    availability: "Tomorrow, 9–11am",
    handlesJob: true,
  },
  "tp-4": null,
  "tp-5": null,
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const tradeType = typeof body?.tradeType === "string" ? body.tradeType : ""
  const postcode = typeof body?.postcode === "string" ? body.postcode : ""
  const urgency = typeof body?.urgency === "string" ? body.urgency : ""
  const description =
    typeof body?.description === "string" ? body.description : ""

  if (!tradeType || !postcode || !urgency) {
    return NextResponse.json(
      { error: "tradeType, postcode, and urgency are required" },
      { status: 400 }
    )
  }

  const job = createJob({
    tradeType,
    postcode,
    urgency,
    description,
    results: TRADESPEOPLE.map((tp) => ({
      id: tp.id,
      name: tp.name,
      phone: tp.phone,
      status: "calling",
      availability: null,
      calloutFee: null,
      eta: null,
      handlesJob: null,
    })),
  })

  if (isDryRun()) {
    runDryRun(job)
  } else {
    runRealCalls(job)
  }

  return NextResponse.json({ jobId: job.id })
}

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get("jobId")
  if (!jobId) {
    return NextResponse.json({ error: "jobId is required" }, { status: 400 })
  }

  const job = getJob(jobId)
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 })
  }

  const done = job.results.every((result) => result.status !== "calling")
  return NextResponse.json({ jobId: job.id, results: job.results, done })
}

function runDryRun(job: CallJob) {
  job.results.forEach((result, index) => {
    setTimeout(
      () => {
        const outcome = DRY_RUN_OUTCOMES[result.id]
        if (outcome) {
          updateResult(job.id, result.id, {
            status: "complete",
            ...outcome,
          })
        } else {
          updateResult(job.id, result.id, { status: "no-answer" })
        }
      },
      (index + 1) * DRY_RUN_STEP_MS
    )
  })
}

const RECIPIENT_RESULT_SCHEMA = {
  type: "object",
  required: ["can_help"],
  additionalProperties: false,
  properties: {
    can_help: {
      type: "boolean",
      description: "Whether this tradesperson can take the job.",
    },
    callout_fee_gbp: {
      type: ["number", "null"],
      description: "Quoted call-out fee in GBP, if given.",
    },
    eta: {
      type: ["string", "null"],
      description: "Estimated arrival time, if given.",
    },
    availability: {
      type: ["string", "null"],
      description: "Free-text availability window, if given.",
    },
  },
} as const

function runRealCalls(job: CallJob) {
  const apiKey = process.env.CALLE_API_KEY
  if (!apiKey) {
    console.error("CALLE_API_KEY is not set; cannot place real calls")
    job.results.forEach((result) =>
      updateResult(job.id, result.id, { status: "no-answer" })
    )
    return
  }

  const client = new CalleClient({
    apiKey,
    baseUrl: process.env.CALLE_BASE_URL,
  })

  // Fire one createAndWait per recipient, in parallel, so each result lands
  // in the job store — and gets picked up by polling — as soon as that
  // individual call finishes, instead of waiting for the whole batch.
  job.results.forEach((result) => {
    callOne(client, job, result).catch((error) => {
      console.error(`CALL-E call failed for ${result.name}`, error)
      updateResult(job.id, result.id, { status: "no-answer" })
    })
  })
}

async function callOne(
  client: CalleClient,
  job: CallJob,
  result: CallResult
) {
  const call = await client.calls.createAndWait(
    {
      task: `You are calling on behalf of a customer looking for a ${job.tradeType} tradesperson near postcode ${job.postcode}. The job is needed: ${job.urgency}. Problem description: ${job.description || "not provided"}. Find out whether this tradesperson can take the job, their call-out fee in GBP, when they could arrive, and their general availability.`,
      recipient: {
        phone: result.phone,
        region: "GB",
        locale: "en-GB",
      },
      recipientResultSchema: RECIPIENT_RESULT_SCHEMA,
      metadata: { jobId: job.id, resultId: result.id },
    },
    { idempotencyKey: `${job.id}:${result.id}`, timeoutMs: 10 * 60 * 1000 }
  )

  const recipient =
    call.recipients.find((r) => r.phones.includes(result.phone)) ??
    call.recipients[0]

  if (!recipient || recipient.status !== "completed") {
    updateResult(job.id, result.id, { status: "no-answer" })
    return
  }

  const structured = recipient.structuredResult as {
    can_help?: boolean
    callout_fee_gbp?: number | null
    eta?: string | null
    availability?: string | null
  } | null

  updateResult(job.id, result.id, {
    status: "complete",
    handlesJob: structured?.can_help ?? null,
    calloutFee: structured?.callout_fee_gbp ?? null,
    eta: structured?.eta ?? null,
    availability: structured?.availability ?? null,
  })
}
