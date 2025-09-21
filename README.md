# Arkham Liquidation Monitor

Real-time monitoring dashboard for Hyperliquid positions of identified Arkham entities, tracking liquidation risks and providing alerts for positions close to liquidation.

## Features

- 🔍 **Real-time Position Monitoring**: Track positions from identified Arkham entities
- 🚨 **Liquidation Risk Alerts**: Visual indicators for positions close to liquidation
- 📊 **Dashboard Statistics**: Overview of total positions, value, and PnL
- 🔄 **Auto-refresh**: Data updates automatically every 30 seconds
- 🎯 **Advanced Filtering**: Filter by risk level and coin
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Risk Levels

- 🟢 **Safe**: >10% distance to liquidation
- 🟡 **Warning**: 5-10% distance to liquidation
- 🔴 **Danger**: 2-5% distance to liquidation
- 🚨 **Critical**: <2% distance to liquidation

## Setup

### Prerequisites

- Node.js 18+ installed
- Local Hyperliquid node running on `localhost:3001`
- Supabase account (free tier works)
- Arkham entity data in `../arkham_entity_collector/data/entities.json`

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor in your Supabase dashboard
3. Run the SQL from `supabase-schema.sql` to create the required tables
4. Get your project URL and anon key from Settings → API

### 3. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and update with your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
HYPERLIQUID_API_URL=http://localhost:3001/info
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project on [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Important Notes for Production

- The data fetching service needs access to the local entities.json file
- Consider setting up a scheduled job (cron) for regular data syncing
- You may need to adjust the file path in `services/positionFetcher.ts` for production

## API Endpoints

- `GET /api/positions` - Get all positions with optional filters
- `GET /api/positions/risky` - Get only risky positions
- `POST /api/sync` - Manually trigger data synchronization
- `GET /api/prices` - Get current prices for all assets

## Project Structure

```
arkham-liquidation-monitor/
├── app/
│   ├── api/              # API routes
│   ├── page.tsx          # Main dashboard
│   └── layout.tsx        # Root layout
├── components/           # React components
├── lib/                  # Core libraries
│   ├── hyperliquid.ts   # Hyperliquid API client
│   ├── supabase.ts      # Database client
│   ├── liquidation.ts   # Liquidation calculations
│   └── types.ts         # TypeScript types
├── services/            # Backend services
│   ├── positionFetcher.ts
│   └── dataSync.ts
└── supabase-schema.sql  # Database schema
```

## Troubleshooting

### "Failed to fetch positions"
- Check if your local Hyperliquid node is running on `localhost:3001`
- Verify your Supabase credentials are correct
- Check if the entities.json file exists in the correct location

### "No positions found"
- Run a manual sync using the Refresh button
- Check if the entities have active positions on Hyperliquid
- Verify the entities.json file contains valid addresses

### Database Issues
- Make sure all tables are created correctly in Supabase
- Check if RLS (Row Level Security) is disabled or properly configured
- Verify your anon key has the necessary permissions

## License

MIT