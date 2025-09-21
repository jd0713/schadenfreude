/**
 * Script to manually sync positions from Hyperliquid to Supabase
 * This can be run as a one-time job or scheduled via cron
 * Usage: npx tsx scripts/syncPositions.ts
 */

import { PositionFetcher } from '../services/positionFetcher';

async function syncPositions() {
  console.log('🔄 Starting position sync...\n');

  try {
    const fetcher = new PositionFetcher();
    const positions = await fetcher.fetchAllPositions();

    console.log(`\n✅ Successfully synced ${positions.length} positions to database`);

    // Display summary
    const riskCounts = positions.reduce((acc, pos) => {
      acc[pos.riskLevel || 'unknown'] = (acc[pos.riskLevel || 'unknown'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📊 Risk Level Summary:');
    Object.entries(riskCounts).forEach(([level, count]) => {
      const emoji = level === 'critical' ? '🔴' :
                     level === 'danger' ? '🟠' :
                     level === 'warning' ? '🟡' :
                     level === 'safe' ? '🟢' : '⚪';
      console.log(`${emoji} ${level}: ${count} positions`);
    });

    // Show top 5 risky positions
    const riskyPositions = positions
      .filter(p => p.liquidationDistance !== undefined)
      .sort((a, b) => (a.liquidationDistance || 100) - (b.liquidationDistance || 100))
      .slice(0, 5);

    if (riskyPositions.length > 0) {
      console.log('\n⚠️ Top 5 Risky Positions:');
      riskyPositions.forEach((pos, i) => {
        console.log(`${i + 1}. ${pos.entityName} - ${pos.coin}: ${pos.liquidationDistance?.toFixed(2)}% to liquidation`);
      });
    }

  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

// Run the sync
syncPositions().then(() => {
  console.log('\n✨ Sync complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});