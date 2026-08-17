export type CallResultStatus = "calling" | "complete" | "no-answer"

export interface CallResult {
  id: string
  name: string
  phone: string
  status: CallResultStatus
  availability: string | null
  calloutFee: number | null
  eta: string | null
  handlesJob: boolean | null
}

export interface CallJob {
  id: string
  tradeType: string
  postcode: string
  urgency: string
  description: string
  results: CallResult[]
  createdAt: number
}

declare global {
  var __calleCallJobs: Map<string, CallJob> | undefined
}

const jobs = globalThis.__calleCallJobs ?? new Map<string, CallJob>()
globalThis.__calleCallJobs = jobs

export function createJob(input: {
  tradeType: string
  postcode: string
  urgency: string
  description: string
  results: CallResult[]
}): CallJob {
  const job: CallJob = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    ...input,
  }
  jobs.set(job.id, job)
  return job
}

export function getJob(id: string): CallJob | undefined {
  return jobs.get(id)
}

export function updateResult(
  jobId: string,
  resultId: string,
  patch: Partial<Omit<CallResult, "id">>
) {
  const job = jobs.get(jobId)
  const result = job?.results.find((r) => r.id === resultId)
  if (!result) return
  Object.assign(result, patch)
}
