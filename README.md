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

## Immediate next step (production)
1. Replace in-memory repository with Supabase adapter (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
2. Wire agent run metrics from OpenClaw session events (or gateway status endpoint).
3. Add RainbowKit connect + signed message verification before mutations.
4. Add optimistic UI actions for advance/kill/report and surface API failures cleanly.
