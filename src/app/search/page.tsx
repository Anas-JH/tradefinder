"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import { CheckCircle2Icon, XCircleIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

type CallStatus = "Calling" | "Complete" | "No answer"

interface TradespersonCall {
  name: string
  finalStatus: "Complete" | "No answer"
}

const TRADESPEOPLE: TradespersonCall[] = [
  { name: "Sarah Ahmed", finalStatus: "Complete" },
  { name: "John Smith", finalStatus: "Complete" },
  { name: "Mike O'Brien", finalStatus: "Complete" },
  { name: "Dave Wilson", finalStatus: "No answer" },
  { name: "Priya Patel", finalStatus: "No answer" },
]

const STEP_DELAY_MS = 2000

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchStatus />
    </Suspense>
  )
}

function SearchStatus() {
  const searchParams = useSearchParams()
  const tradeType = searchParams.get("tradeType")
  const postcode = searchParams.get("postcode")

  const [statuses, setStatuses] = useState<CallStatus[]>(() =>
    TRADESPEOPLE.map(() => "Calling")
  )

  // TODO: replace with real CALL-E calls — this simulates status updates
  // that will eventually come from the CALL-E API as calls complete.
  useEffect(() => {
    const timeouts = TRADESPEOPLE.map((tradesperson, index) =>
      setTimeout(
        () => {
          setStatuses((prev) => {
            const next = [...prev]
            next[index] = tradesperson.finalStatus
            return next
          })
        },
        (index + 1) * STEP_DELAY_MS
      )
    )

    return () => timeouts.forEach(clearTimeout)
  }, [])

  const allDone = statuses.every((status) => status !== "Calling")

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

        <ul className="flex flex-col gap-3">
          {TRADESPEOPLE.map((tradesperson, index) => (
            <li
              key={tradesperson.name}
              className="flex items-center justify-between rounded-lg border border-border bg-white px-4 py-3 dark:bg-black"
            >
              <span className="text-sm font-medium">{tradesperson.name}</span>
              <StatusIndicator status={statuses[index]} />
            </li>
          ))}
        </ul>

        {allDone && (
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

function StatusIndicator({ status }: { status: CallStatus }) {
  if (status === "Calling") {
    return (
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Spinner />
        Calling...
      </span>
    )
  }

  if (status === "Complete") {
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
