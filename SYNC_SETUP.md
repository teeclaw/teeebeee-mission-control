# Mission Control Sync Setup

This document explains how to sync OpenClaw data to Supabase for the Mission Control dashboard.

## Architecture

```
OpenClaw Machine → Sync Script → Supabase → Vercel Dashboard
```

## Quick Setup

### 1. Set up Supabase Tables

Run this SQL in your Supabase SQL Editor:

```sql
-- Copy contents of scripts/supabase-schema.sql
```

Or use the schema file:
```bash
cat scripts/supabase-schema.sql
```

### 2. Configure Environment Variables

Add to your `~/.openclaw/.env`:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Run Automated Setup

```bash
cd projects/teeebeee-mission-control
./scripts/setup-sync.sh
```

This will:
- ✅ Test the sync script
- ✅ Install dependencies if needed  
- ✅ Set up cron job (every 5 minutes)
- ✅ Run initial sync

### 4. Verify Dashboard

Visit: https://teeebeee-mission-control.vercel.app/cron

You should see real OpenClaw jobs instead of mock data.

## Manual Operations

### Test Sync
```bash
cd projects/teeebeee-mission-control
node scripts/sync-openclaw-data.js
```

### Check Sync Logs
```bash
tail -f /tmp/mission-control-sync.log
```

### Remove Sync
```bash
crontab -e
# Delete the line containing "mission-control-sync"
```

## Data Synced

- **Cron Jobs**: All enabled OpenClaw cron jobs
- **Agent Status**: Active agents from openclaw.json
- **Future**: Opportunities, validations, portfolio slots

## Troubleshooting

### Sync Script Fails
1. Check environment variables are set
2. Verify Supabase credentials
3. Check OpenClaw files exist at `~/.openclaw/`

### Dashboard Shows Old Data
1. Check sync logs: `tail -f /tmp/mission-control-sync.log`
2. Run manual sync: `node scripts/sync-openclaw-data.js`
3. Verify cron job: `crontab -l | grep mission-control`

### No Data in Dashboard
1. Confirm tables exist in Supabase
2. Check service role permissions
3. Run sync script with debug: `DEBUG=* node scripts/sync-openclaw-data.js`

## Architecture Benefits

- **🌐 Accessible**: Dashboard works from anywhere
- **🔄 Real-time**: 5-minute sync frequency
- **📊 Persistent**: Data survives OpenClaw restarts
- **🔒 Secure**: Uses Supabase service role, no public data
- **⚡ Fast**: Dashboard reads from optimized database