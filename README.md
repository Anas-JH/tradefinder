# TradeFinder

Tell us what you need, and we'll call local tradespeople to compare availability, pricing and response times.

Built for the [CALL-E](https://heycall-e.com) "Your Code Is Calling" hackathon.

## What it does

When something breaks (a boiler, a leaking pipe, a locked-out front door), the actual availability and call-out fee of a local tradesperson almost never lives online. Trade directories list who exists, not who's free today and what they charge. The only way to find out is to phone around, one at a time, and compare answers you have to remember yourself.

TradeFinder automates that phone-around. You describe the job once; CALL-E phones a shortlist of tradespeople in parallel, on your behalf, and asks each of them the same three questions: can you take this job, what's your call-out fee, and when could you arrive. The answers come back structured, not as call recordings you have to relisten to, so they can be lined up in a single comparison table with a recommendation.

## How it works

```
  Job request form
        │  (trade type, postcode, urgency, description)
        ▼
  POST /api/search
        │  creates a job and fires one CALL-E call per tradesperson, in parallel
        ▼
  CALL-E places outbound calls, holds the conversation,
  and extracts a structured result per recipient
        │
        ▼
  /search polls the job's status and shows each call
  resolving live: Calling → Complete / No answer
        │
        ▼
  /results reads the same job and renders a comparison
  table (availability, call-out fee, ETA, whether they
  handle this job type) with a recommendation for the
  cheapest same-day option that actually handles the work
```

Each tradesperson is called independently (`client.calls.createAndWait()` per recipient, run in parallel with `Promise` fan-out), so results trickle into the comparison as each individual call finishes rather than waiting on the slowest one.

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router, TypeScript)
- [Tailwind CSS](https://tailwindcss.com) v4
- [shadcn/ui](https://ui.shadcn.com) (base-nova preset, on top of [Base UI](https://base-ui.com))
- [`@call-e/calle`](https://www.npmjs.com/package/@call-e/calle): the CALL-E TypeScript server SDK
- An in-memory job store (`src/lib/call-jobs.ts`), sufficient for a single-instance hackathon demo but not durable across restarts

## Setup

```bash
git clone <this-repo-url>
cd tradefinder
npm install
cp .env.example .env.local
npm run dev
```

Then open `http://localhost:3000`.

### Environment variables (`.env.local`)

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `DRY_RUN` | No | `true` | `true` uses fake, staggered results (no CALL-E account needed). Set to `false` to place real calls. |
| `CALLE_API_KEY` | Only if `DRY_RUN=false` | N/A | From the CALL-E dashboard. |
| `CALLE_BASE_URL` | No | `https://api.heycall-e.com` | Override for a different CALL-E environment. |

The tradesperson list is a seed file at `src/data/tradespeople.json`: five entries with placeholder numbers in the shape `+44 7XXX XXXXXX` (masked here; the file itself holds a fake but validly-formatted placeholder per entry). Swap in real E.164 numbers of people who've agreed to receive a demo call before testing with `DRY_RUN=false`.

## Dry-run mode

`DRY_RUN=true` is the default, and it's what runs with zero configuration. No CALL-E account, no API key, no real phone numbers required. `POST /api/search` still creates a real job and the `/search` page still polls it live, but each tradesperson's status resolves on a fixed 2-second stagger with fabricated results (fee, ETA, availability) instead of a real call. The entire flow, including the comparison table and recommendation logic, is fully exercisable offline as a result.

## Side effects

**When `DRY_RUN=false`, this app places real outbound phone calls** to every phone number in `src/data/tradespeople.json`, via the CALL-E API, the moment a search is submitted. Each call is a live phone conversation conducted by CALL-E on your behalf: it will ring the number, speak and expect a human on the other end. Only run with `DRY_RUN=false` once you've replaced the placeholder numbers with real numbers belonging to people who know they're going to receive a test call. This also consumes your CALL-E account's call quota (20 free calls per account).

## Cancellation

There is no recurring schedule, campaign or follow-up call created by this app: every call is a single one-shot `createAndWait` request per tradesperson, scoped to one job search. Nothing keeps running, retrying, or calling again after that one call resolves (or hits its 10-minute timeout). The UI has no "cancel" control for a call already in flight; the only way to stop one early is stopping the dev server, which stops TradeFinder from waiting on the result but does not reach into CALL-E to end a call that's already ringing or in progress.

## Demo

[Demo video](https://www.youtube.com/watch?v=REPLACE_ME)
