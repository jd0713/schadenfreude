# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Development
```bash
# Install dependencies
npm install

# Run development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint

# Upload entities to Supabase (one-time setup)
npm run upload-entities
```

### Production Deployment
```bash
# Deploy background services with PM2
./scripts/deploy.sh

# PM2 management
pm2 status              # Check process status
pm2 logs               # View all logs
pm2 logs arkham-tiered-sync  # View specific service logs
pm2 restart all        # Restart all processes
pm2 stop all          # Stop all processes
pm2 monit             # Real-time monitoring
```

## Architecture Overview

This is a real-time monitoring dashboard for Hyperliquid positions of identified Arkham entities, tracking liquidation risks. The system uses a Next.js frontend with background sync services managed by PM2.

### Core Components

**Data Flow Architecture:**
1. **Tiered Sync Service** (`services/tieredSyncService.ts`): Main background service that fetches positions from Hyperliquid API with tiered priority monitoring (critical positions checked more frequently)
2. **Entity Sync Service** (`services/entitySyncService.ts`): Watches for entity changes and syncs with database
3. **Supabase Database**: Stores entities, positions, and liquidation alerts with real-time subscriptions
4. **Next.js Frontend**: Dashboard with auto-refresh displaying positions and risk levels
5. **API Routes**: RESTful endpoints for data access and manual operations

### Key Technical Decisions

**Parallel Processing:** The system processes 500 addresses in parallel batches to optimize for local Hyperliquid node performance (localhost:3001).

**Tiered Monitoring:** Positions are monitored at different frequencies based on risk level:
- Critical (<2% to liquidation): Every update cycle
- High risk (2-10%): Less frequent
- Low risk (>10%): Least frequent

**Database Schema:** Uses Supabase with three main tables:
- `entities`: Arkham entity information
- `positions`: Current position data with unique constraint per address/coin
- `liquidation_alerts`: Alert history for risk tracking

### Service Configuration

The system runs multiple services via PM2 (configured in `ecosystem.config.js`):
- `arkham-tiered-sync`: Primary position monitoring service
- `arkham-entity-sync`: Entity data synchronization
- `arkham-sync`: Legacy background sync (disabled by default)

### API Endpoints

All API routes are in `app/api/`:
- `/api/positions`: Get positions with filters
- `/api/positions/risky`: Get only risky positions
- `/api/sync`: Trigger manual synchronization
- `/api/prices`: Current asset prices
- `/api/entities`: Manage tracked entities

### Risk Level Thresholds

The liquidation risk calculation (`lib/liquidation.ts`) uses distance to liquidation:
- Safe: >10% distance
- Warning: 5-10% distance
- Danger: 2-5% distance
- Critical: <2% distance

### Environment Configuration

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `HYPERLIQUID_API_URL`: Local Hyperliquid node endpoint (default: http://localhost:3001/info)

### Frontend State Management

The dashboard uses SWR for data fetching with 30-second auto-refresh intervals. Position data is fetched from Supabase and enhanced with real-time price updates from Hyperliquid.