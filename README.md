# 🎭 Imposter

A party game for a group in the same room. One host creates a room, everyone
else joins with a code, and the app secretly hands out words: everyone gets
the same word except one unlucky **imposter**, who gets something similar
but different. Talk it out, then vote out who you think doesn't belong.

No sockets, no live server to babysit — it's a normal Next.js app that
polls a small piece of shared state over plain HTTP, so it runs great on
Vercel's serverless platform.

## How it plays

1. **Host creates a room** and shares the 5-letter code (or invite link).
2. Everyone else **joins** with just their name.
3. The host **picks a category** (Everyday Objects, Food, Famous Persons) and
   starts the round. Every player gets a card that's hidden until they
   **press and hold** it — release and it hides again, so it's safe to check
   even with people looking over your shoulder. One random player secretly
   gets the imposter's word instead.
4. Once everyone's had a chance to discuss, the host **calls for a vote**.
   Everyone votes for who they think the imposter is.
5. Whoever gets the most votes is accused. The app reveals the real imposter,
   their word vs. everyone else's word, and whether the **audience** or the
   **imposter** won — plus a running scoreboard across rounds.

## Tech stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4 for styling, Framer Motion for the interactive bits
- SWR for polling room state (no WebSockets — a room just does a lightweight
  `GET` every ~1.5s)
- Pluggable key/value store for room state: in-memory for local dev, Upstash
  Redis (REST API) for production — see below

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. No environment variables are required for local
development — room state lives in memory in the Next.js dev process.

## Deploying to Vercel

The app is stateless except for room data, which needs to be shared across
serverless function instances. **Without a shared store, the game will not
work reliably in production** once there's more than one function instance
(you'll see rooms/votes behave inconsistently between requests).

1. Push this project to a Git repo and import it into Vercel (or run
   `vercel` from this directory).
2. Add Redis: in your Vercel project, go to **Storage → Marketplace Database
   Providers**, add **Upstash → Redis** (there's a free tier). This
   automatically sets `UPSTASH_REDIS_REST_URL` and
   `UPSTASH_REDIS_REST_TOKEN` for you. (Alternatively create a database
   directly at [upstash.com](https://upstash.com) and paste the REST URL/token
   into your Vercel project's Environment Variables — see `.env.example`.)
3. Redeploy. That's it — no other config needed.

Rooms automatically expire after 6 hours of inactivity.

## Project structure

- `lib/rooms.ts` — game rules: creating rooms, assigning words, voting,
  scoring, tie handling. All mutations go through an optimistic
  compare-and-swap (`lib/store.ts`) so concurrent votes from multiple players
  never clobber each other.
- `lib/words.ts` — the categories and word pairs.
- `app/api/rooms/**` — the HTTP endpoints the client polls/calls.
- `components/` — the UI for each game phase (lobby, reveal, voting,
  results) plus the hold-to-reveal card.
