"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useRef, useState } from "react"
import {
  CheckIcon,
  CircleAlertIcon,
  InfoIcon,
  MinusIcon,
  SearchIcon,
  XIcon,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { CallResult } from "@/lib/call-jobs"

const POLL_INTERVAL_MS = 1500

function isSameDay(availability: string | null) {
  return !!availability && availability.toLowerCase().startsWith("today")
}

export default function ResultsPage() {
  return (
    <Suspense fallback={null}>
      <ResultsContent />
    </Suspense>
  )
}

function ResultsContent() {
  const searchParams = useSearchParams()
  const jobId = searchParams.get("jobId")

  const [results, setResults] = useState<CallResult[] | null>(null)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cancelledRef = useRef(false)

  useEffect(() => {
    if (!jobId) return

    cancelledRef.current = false
    let pollTimeout: ReturnType<typeof setTimeout> | undefined

    async function poll() {
      try {
        const response = await fetch(
          `/api/search?jobId=${encodeURIComponent(jobId!)}`
        )
        if (!response.ok) throw new Error("Failed to fetch results")
        const data: { results: CallResult[]; done: boolean } =
          await response.json()
        if (cancelledRef.current) return

        setResults(data.results)
        setDone(data.done)
        if (!data.done) {
          pollTimeout = setTimeout(poll, POLL_INTERVAL_MS)
        }
      } catch {
        if (!cancelledRef.current) {
          setError("Something went wrong while loading results.")
        }
      }
    }

    poll()

    return () => {
      cancelledRef.current = true
      if (pollTimeout) clearTimeout(pollTimeout)
    }
  }, [jobId])

  const searchAgainButton = (
    <div>
      <Button
        variant="outline"
        size="sm"
        nativeButton={false}
        render={<Link href="/" />}
      >
        <SearchIcon />
        Search Again
      </Button>
    </div>
  )

  if (!jobId) {
    return (
      <PageShell>
        {searchAgainButton}
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertTitle>No search found</AlertTitle>
          <AlertDescription>
            Start a new search to see tradesperson results here.
          </AlertDescription>
        </Alert>
      </PageShell>
    )
  }

  if (error) {
    return (
      <PageShell>
        {searchAgainButton}
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertTitle>Couldn&apos;t load results</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </PageShell>
    )
  }

  if (!results) {
    return (
      <PageShell>
        {searchAgainButton}
        <div className="flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-3 text-sm text-muted-foreground dark:bg-black">
          <Spinner />
          Loading results…
        </div>
      </PageShell>
    )
  }

  const available = results.filter((r) => r.status === "complete")
  const withFee = available.filter((r) => r.calloutFee !== null)
  const sameDayWithFee = withFee.filter((r) => isSameDay(r.availability))
  const recommendationPool = sameDayWithFee.length > 0 ? sameDayWithFee : withFee
  const recommended =
    recommendationPool.length > 0
      ? recommendationPool.reduce((cheapest, r) =>
          r.calloutFee! < cheapest.calloutFee! ? r : cheapest
        )
      : null
  const recommendedIsSameDay = recommended
    ? isSameDay(recommended.availability)
    : false

  const fees = withFee.map((r) => r.calloutFee!)
  const minFee = fees.length > 0 ? Math.min(...fees) : null
  const maxFee = fees.length > 0 ? Math.max(...fees) : null

  const stillCalling = results.length - results.filter((r) => r.status !== "calling").length

  return (
    <PageShell>
      {searchAgainButton}

      <div>
        <h1 className="text-xl font-medium">Tradespeople available</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {results.length} tradespeople contacted · {available.length} available
          {minFee !== null && maxFee !== null && (
            <> · Price range: £{minFee}–£{maxFee}</>
          )}
        </p>
        {!done && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Spinner />
            Still waiting on {stillCalling} call{stillCalling === 1 ? "" : "s"}…
          </p>
        )}
      </div>

      {recommended && (
        <Card>
          <CardContent className="flex items-start gap-3">
            <InfoIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {recommended.name}
              </span>{" "}
              is recommended — lowest call-out fee (£{recommended.calloutFee})
              {recommendedIsSameDay ? " with same-day availability" : ""}.
            </p>
          </CardContent>
        </Card>
      )}

      {available.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          None of the tradespeople contacted were available.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Availability</TableHead>
              <TableHead>Call-out fee</TableHead>
              <TableHead>Est. arrival</TableHead>
              <TableHead>Handles this job</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {available.map((tradesperson) => (
              <TableRow key={tradesperson.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {tradesperson.name}
                    {recommended && tradesperson.id === recommended.id && (
                      <Badge variant="secondary">Recommended</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{tradesperson.availability ?? "—"}</TableCell>
                <TableCell>
                  {tradesperson.calloutFee !== null
                    ? `£${tradesperson.calloutFee}`
                    : "—"}
                </TableCell>
                <TableCell>{tradesperson.eta ?? "—"}</TableCell>
                <TableCell>
                  {tradesperson.handlesJob === true ? (
                    <CheckIcon className="size-4 text-foreground" />
                  ) : tradesperson.handlesJob === false ? (
                    <XIcon className="size-4 text-muted-foreground" />
                  ) : (
                    <MinusIcon className="size-4 text-muted-foreground" />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </PageShell>
  )
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <div className="flex w-full max-w-3xl flex-col gap-6">{children}</div>
    </div>
  )
}
