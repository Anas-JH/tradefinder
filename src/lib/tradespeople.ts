import tradespeopleSeed from "@/data/tradespeople.json"

export interface Tradesperson {
  id: string
  name: string
  phone: string
  tradeTypes: string[]
}

export const TRADESPEOPLE: Tradesperson[] = tradespeopleSeed
