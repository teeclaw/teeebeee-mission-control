# Teeebeee Mission Control (MVP v1)

Operational dashboard for autonomous opportunity execution.

## Scope shipped in this MVP
- Opportunity Pipeline Board
- Validation Queue
- Portfolio Slot Manager
- Agent Run Monitor
- Daily Report Feed

## Architecture (strict)
`UI -> API -> Business Logic -> Repository -> Data`

- UI: `app/page.tsx`
- API: `app/api/*`
- Business Logic: `lib/use-cases.ts`
- Repository: `lib/repository.ts`
- Types/Contracts: `lib/types.ts`

## API endpoints
### Read
- `GET /api/opportunities`
- `GET /api/validation-queue`
- `GET /api/portfolio`
- `GET /api/agent-runs`
- `GET /api/reports`
- `GET /api/kill-logs`

### Mutations (chairman-gated)
- `POST /api/opportunities/:id/advance` with `{ "nextStage": "validation|build|launch", "wallet": "0x..." }`
- `POST /api/portfolio/:slotId/kill` with `{ "reason": "...", "wallet": "0x..." }`
- `POST /api/reports` with `{ "summary": "...", "wallet": "0x..." }`
- `POST /api/auth/chairman` with `{ "wallet": "0x..." }`

## Chairman wallet gate
- Uses `CHAIRMAN_WALLETS` from `.env`
- If empty, gate is in dev-open mode
- If set, only allowlisted wallets pass

## Run
```bash
npm install
npm run dev
```

## Supabase setup
1. Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to `.env`.
2. Run `supabase/schema.sql` in your Supabase SQL editor.
3. Restart `npm run dev`.

Repository mode:
- If Supabase envs exist, Mission Control uses Supabase.
- If not, it falls back to in-memory mode.

## Immediate next step (production)
1. Wire agent run metrics from OpenClaw session events (or gateway status endpoint).
2. Add RainbowKit connect + signed message verification before mutations.
3. Add optimistic UI actions for advance/kill/report and surface API failures cleanly.
4. Add RLS policies and a dedicated service-role-only API boundary.
