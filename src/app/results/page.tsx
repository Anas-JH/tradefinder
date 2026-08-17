import Link from "next/link"
import { ArrowLeftIcon, CheckIcon, XIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const TRADESPEOPLE = [
  {
    name: "Sarah Ahmed",
    availability: "Today, 4–6pm",
    calloutFee: 75,
    eta: "45 min",
    handlesJob: true,
  },
  {
    name: "John Smith",
    availability: "Today, 2–3pm",
    calloutFee: 95,
    eta: "30 min",
    handlesJob: true,
  },
  {
    name: "Mike O'Brien",
    availability: "Tomorrow, 9–11am",
    calloutFee: 120,
    eta: "2 hrs",
    handlesJob: false,
  },
] as const

const CONTACTED_COUNT = 5

export default function ResultsPage() {
  const cheapestFee = Math.min(...TRADESPEOPLE.map((t) => t.calloutFee))
  const fees = TRADESPEOPLE.map((t) => t.calloutFee)
  const minFee = Math.min(...fees)
  const maxFee = Math.max(...fees)

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <div className="flex w-full max-w-3xl flex-col gap-6">
        <div>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/" />}
          >
            <ArrowLeftIcon />
            Back to form
          </Button>
        </div>

        <div>
          <h1 className="text-xl font-medium">Tradespeople available</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {CONTACTED_COUNT} tradespeople contacted · {TRADESPEOPLE.length}{" "}
            available · Price range: £{minFee}–£{maxFee}
          </p>
        </div>

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
            {TRADESPEOPLE.map((tradesperson) => (
              <TableRow key={tradesperson.name}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {tradesperson.name}
                    {tradesperson.calloutFee === cheapestFee && (
                      <Badge variant="secondary">Recommended</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{tradesperson.availability}</TableCell>
                <TableCell>£{tradesperson.calloutFee}</TableCell>
                <TableCell>{tradesperson.eta}</TableCell>
                <TableCell>
                  {tradesperson.handlesJob ? (
                    <CheckIcon className="size-4 text-foreground" />
                  ) : (
                    <XIcon className="size-4 text-muted-foreground" />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
