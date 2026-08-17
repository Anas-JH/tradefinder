"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useRef, useState } from "react"
import { CheckCircle2Icon, XCircleIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type { CallResult } from "@/lib/call-jobs"

const POLL_INTERVAL_MS = 1500

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchStatus />
    </Suspense>
  )
}

function SearchStatus() {
  const searchParams = useSearchParams()
  const tradeType = searchParams.get("tradeType") ?? ""
  const postcode = searchParams.get("postcode") ?? ""
  const urgency = searchParams.get("urgency") ?? ""
  const description = searchParams.get("description") ?? ""

  const [results, setResults] = useState<CallResult[]>([])
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cancelledRef = useRef(false)

  useEffect(() => {
    cancelledRef.current = false
    let pollTimeout: ReturnType<typeof setTimeout> | undefined

    async function poll(jobId: string) {
      try {
        const response = await fetch(
          `/api/search?jobId=${encodeURIComponent(jobId)}`
        )
        if (!response.ok) throw new Error("Failed to fetch call status")
        const data: { results: CallResult[]; done: boolean } =
          await response.json()
        if (cancelledRef.current) return

        setResults(data.results)
        if (data.done) {
          setDone(true)
        } else {
          pollTimeout = setTimeout(() => poll(jobId), POLL_INTERVAL_MS)
        }
      } catch {
        if (!cancelledRef.current) {
          setError("Something went wrong while checking call status.")
        }
      }
    }

    async function start() {
      try {
        const response = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tradeType, postcode, urgency, description }),
        })
        if (!response.ok) throw new Error("Failed to start calls")
        const data: { jobId: string } = await response.json()
        if (cancelledRef.current) return
        poll(data.jobId)
      } catch {
        if (!cancelledRef.current) {
          setError("Something went wrong while starting calls.")
        }
      }
    }

    start()

    return () => {
      cancelledRef.current = true
      if (pollTimeout) clearTimeout(pollTimeout)
    }
  }, [tradeType, postcode, urgency, description])

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div>
          <h1 className="text-xl font-medium">Calling tradespeople…</h1>
          {(tradeType || postcode) && (
            <p className="mt-1 text-sm text-muted-foreground">
              {[tradeType, postcode].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {results.length > 0 && (
          <ul className="flex flex-col gap-3">
            {results.map((result) => (
              <li
                key={result.id}
                className="flex items-center justify-between rounded-lg border border-border bg-white px-4 py-3 dark:bg-black"
              >
                <span className="text-sm font-medium">{result.name}</span>
                <StatusIndicator status={result.status} />
              </li>
            ))}
          </ul>
        )}

        {done && (
          <Button
            className="w-full"
            nativeButton={false}
            render={<Link href="/results" />}
          >
            View Results
          </Button>
        )}
      </div>
    </div>
  )
}

function StatusIndicator({ status }: { status: CallResult["status"] }) {
  if (status === "calling") {
    return (
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Spinner />
        Calling...
      </span>
    )
  }

  if (status === "complete") {
    return (
      <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-500">
        <CheckCircle2Icon className="size-4" />
        Complete
      </span>
    )
  }

  return (
    <span className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-500">
      <XCircleIcon className="size-4" />
      No answer
    </span>
  )
}
