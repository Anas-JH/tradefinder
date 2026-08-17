import { NextRequest, NextResponse } from "next/server"
import { CalleClient } from "@call-e/calle"

import { createJob, getJob, updateResult, type CallJob } from "@/lib/call-jobs"
import { TRADESPEOPLE } from "@/lib/tradespeople"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const isDryRun = () => process.env.DRY_RUN !== "false"

const DRY_RUN_STEP_MS = 2000

const DRY_RUN_OUTCOMES: Record<
  string,
  { calloutFee: number; eta: string; availability: string } | null
> = {
  "tp-1": { calloutFee: 75, eta: "45 min", availability: "Today, 4–6pm" },
  "tp-2": { calloutFee: 95, eta: "30 min", availability: "Today, 2–3pm" },
  "tp-3": { calloutFee: 120, eta: "2 hrs", availability: "Tomorrow, 9–11am" },
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
          const seedEntry = TRADESPEOPLE.find((tp) => tp.id === result.id)
          updateResult(job.id, result.id, {
            status: "complete",
            ...outcome,
            handlesJob: seedEntry?.tradeTypes.includes(job.tradeType) ?? true,
          })
        } else {
          updateResult(job.id, result.id, { status: "no-answer" })
        }
      },
      (index + 1) * DRY_RUN_STEP_MS
    )
  })
}

async function runRealCalls(job: CallJob) {
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

  try {
    const call = await client.calls.createAndWait(
      {
        task: `You are calling on behalf of a customer looking for a ${job.tradeType} tradesperson near postcode ${job.postcode}. The job is needed: ${job.urgency}. Problem description: ${job.description || "not provided"}. Find out whether this tradesperson can take the job, their call-out fee in GBP, when they could arrive, and their general availability.`,
        recipients: job.results.map((result) => ({
          phone: result.phone,
          region: "GB",
          locale: "en-GB",
        })),
        recipientResultSchema: {
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
        },
        metadata: { jobId: job.id },
      },
      { idempotencyKey: job.id, timeoutMs: 10 * 60 * 1000 }
    )

    job.results.forEach((result) => {
      const recipient = call.recipients.find((r) =>
        r.phones.includes(result.phone)
      )
      if (!recipient) {
        updateResult(job.id, result.id, { status: "no-answer" })
        return
      }

      if (recipient.status !== "completed") {
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
    })
  } catch (error) {
    console.error("CALL-E createAndWait failed", error)
    job.results.forEach((result) =>
      updateResult(job.id, result.id, { status: "no-answer" })
    )
  }
}
