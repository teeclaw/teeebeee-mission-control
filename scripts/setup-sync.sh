#!/bin/bash

# Mission Control Sync Setup Script
# Sets up automated sync from OpenClaw to Supabase

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SYNC_SCRIPT="$SCRIPT_DIR/sync-openclaw-data.js"

echo "🚀 Setting up Mission Control sync..."
echo "📂 Project directory: $PROJECT_DIR"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed"
    exit 1
fi

# Check if sync script exists and is executable
if [ ! -x "$SYNC_SCRIPT" ]; then
    echo "📝 Making sync script executable..."
    chmod +x "$SYNC_SCRIPT"
fi

# Test sync script with dry run
echo "🧪 Testing sync script..."
cd "$PROJECT_DIR"

if ! npm list @supabase/supabase-js &> /dev/null; then
    echo "📦 Installing @supabase/supabase-js..."
    npm install @supabase/supabase-js
fi

# Test the sync
echo "🔄 Running test sync..."
node "$SYNC_SCRIPT"

if [ $? -eq 0 ]; then
    echo "✅ Sync test successful"
else
    echo "❌ Sync test failed"
    exit 1
fi

# Set up cron job
CRON_CMD="*/5 * * * * cd $PROJECT_DIR && node $SYNC_SCRIPT >> /tmp/mission-control-sync.log 2>&1"

# Check if cron job already exists
if ! crontab -l 2>/dev/null | grep -q "mission-control-sync"; then
    echo "⏰ Setting up cron job (every 5 minutes)..."
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -
    
    echo "✅ Cron job added successfully"
    echo "📄 Logs will be written to /tmp/mission-control-sync.log"
else
    echo "⏰ Cron job already exists, skipping"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📊 Mission Control will now sync OpenClaw data every 5 minutes"
echo "🌐 Dashboard: https://teeebeee-mission-control.vercel.app"
echo "📄 Logs: tail -f /tmp/mission-control-sync.log"
echo ""
echo "🔧 Manual sync: node $SYNC_SCRIPT"
echo "🗑️  Remove cron: crontab -e (delete the mission-control-sync line)"