/**
 * PM2 Configuration File with Environment Variable Support
 * Usage: pm2 start ecosystem.config.js
 */

// Load environment variables from .env.local
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local file
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

// Common environment variables for all services
const commonEnv = {
  NODE_ENV: process.env.NODE_ENV || 'production',
  SUPABASE_URL: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  // Dual endpoint configuration for Hyperliquid
  HYPERLIQUID_PRIVATE_API_URL: process.env.HYPERLIQUID_PRIVATE_API_URL || process.env.HYPERLIQUID_API_URL || 'http://localhost:3001/info',
  HYPERLIQUID_PUBLIC_API_URL: process.env.HYPERLIQUID_PUBLIC_API_URL || 'https://api.hyperliquid.xyz/info',
  // Legacy support
  HYPERLIQUID_API_URL: process.env.HYPERLIQUID_API_URL || 'http://localhost:3001/info',
};

module.exports = {
  apps: [
    // Tiered Position Sync Service (Main)
    {
      name: 'arkham-tiered-sync',
      script: './node_modules/.bin/tsx',
      args: 'services/tieredSyncService.ts',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        ...commonEnv,
        SERVICE_NAME: 'tiered-sync',
        LOG_LEVEL: 'info',
      },
      env_development: {
        ...commonEnv,
        NODE_ENV: 'development',
        LOG_LEVEL: 'debug',
      },
      error_file: './logs/tiered-sync-error.log',
      out_file: './logs/tiered-sync-out.log',
      time: true,
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      cron_restart: '0 */6 * * *', // Restart every 6 hours for stability
    },

    // Entity Sync Service (watches for entity changes)
    {
      name: 'arkham-entity-sync',
      script: './node_modules/.bin/tsx',
      args: 'services/entitySyncService.ts',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        ...commonEnv,
        SERVICE_NAME: 'entity-sync',
        ENTITY_CHECK_INTERVAL: '300000', // Check every 5 minutes
        LOG_LEVEL: 'info',
      },
      env_development: {
        ...commonEnv,
        NODE_ENV: 'development',
        ENTITY_CHECK_INTERVAL: '60000', // Check every minute in dev
        LOG_LEVEL: 'debug',
      },
      error_file: './logs/entity-sync-error.log',
      out_file: './logs/entity-sync-out.log',
      time: true,
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
    },

    // Health Monitor Service (New)
    {
      name: 'arkham-health-monitor',
      script: './node_modules/.bin/tsx',
      args: 'services/healthMonitor.ts',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '100M',
      env: {
        ...commonEnv,
        SERVICE_NAME: 'health-monitor',
        HEALTH_CHECK_INTERVAL: '60000', // Check every minute
        ALERT_THRESHOLD: '5', // Alert after 5 consecutive failures
        LOG_LEVEL: 'info',
      },
      error_file: './logs/health-monitor-error.log',
      out_file: './logs/health-monitor-out.log',
      time: true,
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
    },

    // Legacy Background Sync (Backup - disabled by default)
    {
      name: 'arkham-sync',
      script: './node_modules/.bin/tsx',
      args: 'scripts/startBackgroundSync.ts',
      instances: 1,
      autorestart: false, // Disabled - using tiered sync instead
      watch: false,
      max_memory_restart: '500M',
      env: {
        ...commonEnv,
        SYNC_INTERVAL_SECONDS: process.env.SYNC_INTERVAL || '30',
        SERVICE_NAME: 'legacy-sync',
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      time: true,
    },
  ],
};