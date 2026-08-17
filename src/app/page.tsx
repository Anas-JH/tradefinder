"use client"

import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Ticket } from "@/components/ticket"

const TRADE_TYPES = [
  "Plumbing",
  "Boiler / Heating",
  "Electrical",
  "Locksmith",
  "General Repairs",
] as const

const URGENCY_OPTIONS = ["Today", "Tomorrow", "This Week"] as const

export default function Home() {
  const router = useRouter()
  const [tradeType, setTradeType] = useState("")
  const [postcode, setPostcode] = useState("")
  const [urgency, setUrgency] = useState("")
  const [description, setDescription] = useState("")

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const params = new URLSearchParams({
      tradeType,
      postcode: postcode.trim().toUpperCase(),
      urgency,
      description,
    })
    router.push(`/search?${params.toString()}`)
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-md">
        <Ticket label="Job ticket" number="NEW">
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Find a Tradesperson
          </h1>

          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="trade-type">Trade type</Label>
              <Select
                value={tradeType}
                onValueChange={(value) => setTradeType(value ?? "")}
              >
                <SelectTrigger id="trade-type" className="w-full">
                  <SelectValue placeholder="Select a trade" />
                </SelectTrigger>
                <SelectContent>
                  {TRADE_TYPES.map((trade) => (
                    <SelectItem key={trade} value={trade}>
                      {trade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="postcode">Postcode</Label>
              <Input
                id="postcode"
                placeholder="e.g. SL1 3AA"
                value={postcode}
                onChange={(event) => setPostcode(event.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="urgency">Urgency</Label>
              <Select
                value={urgency}
                onValueChange={(value) => setUrgency(value ?? "")}
              >
                <SelectTrigger id="urgency" className="w-full">
                  <SelectValue placeholder="Select urgency" />
                </SelectTrigger>
                <SelectContent>
                  {URGENCY_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="e.g. Boiler not firing up, no hot water"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>

            <Button type="submit" className="mt-1 w-full">
              Find Tradespeople
            </Button>
          </form>
        </Ticket>
      </div>
    </div>
  )
}
