"use client"

import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Find a Tradesperson</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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

            <Button type="submit" className="w-full">
              Find Tradespeople
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
