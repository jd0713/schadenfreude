#!/bin/bash

echo "🚀 Arkham Liquidation Monitor - Deployment Script"
echo "================================================"

# Check if running in arkham-liquidation-monitor directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run this script from arkham-liquidation-monitor directory"
    exit 1
fi

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
npm install

# Step 2: Build Next.js application
echo "🔨 Building Next.js application..."
npm run build

# Step 3: Check if PM2 is installed
if ! command -v pm2 &> /dev/null
then
    echo "📥 PM2 not found. Installing PM2 globally..."
    npm install -g pm2
fi

# Step 4: Create logs directory
echo "📁 Creating logs directory..."
mkdir -p logs

# Step 5: Stop existing PM2 processes
echo "🛑 Stopping existing PM2 processes..."
pm2 stop arkham-tiered-sync 2>/dev/null || true
pm2 stop arkham-entity-sync 2>/dev/null || true
pm2 stop arkham-sync 2>/dev/null || true
pm2 delete arkham-tiered-sync 2>/dev/null || true
pm2 delete arkham-entity-sync 2>/dev/null || true
pm2 delete arkham-sync 2>/dev/null || true

# Step 6: Start new services with PM2
echo "🔄 Starting tiered sync services with PM2..."
pm2 start ecosystem.config.js --only arkham-tiered-sync --env production
pm2 start ecosystem.config.js --only arkham-entity-sync --env production

# Step 7: Save PM2 configuration
echo "💾 Saving PM2 configuration..."
pm2 save

# Step 8: Setup PM2 startup script (optional)
echo ""
echo "📌 To auto-start PM2 on system reboot, run:"
echo "   pm2 startup"
echo "   Then follow the instructions provided"
echo ""

# Step 9: Display status
echo "✅ Deployment complete!"
echo ""
pm2 status

echo ""
echo "📊 Useful commands:"
echo "   pm2 status         - Check process status"
echo "   pm2 logs           - View logs"
echo "   pm2 restart all    - Restart all processes"
echo "   pm2 stop all       - Stop all processes"
echo "   pm2 monit          - Real-time monitoring"
echo ""
echo "🌐 Next.js app should be started separately:"
echo "   npm run start      - Production mode"
echo "   npm run dev        - Development mode"