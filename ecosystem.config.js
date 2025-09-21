/**
 * PM2 Configuration File
 * Usage: pm2 start ecosystem.config.js
 */

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
        NODE_ENV: 'production',
      },
      env_development: {
        NODE_ENV: 'development',
      },
      error_file: './logs/tiered-sync-error.log',
      out_file: './logs/tiered-sync-out.log',
      time: true,
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
    },
    
    // Entity Sync Service (watches entities.json)
    {
      name: 'arkham-entity-sync',
      script: './node_modules/.bin/tsx',
      args: 'services/entitySyncService.ts',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/entity-sync-error.log',
      out_file: './logs/entity-sync-out.log',
      time: true,
      restart_delay: 4000,
      max_restarts: 10,
    },
    
    // Legacy Background Sync (Optional - can be disabled if using tiered)
    {
      name: 'arkham-sync',
      script: './node_modules/.bin/tsx',
      args: 'scripts/startBackgroundSync.ts',
      instances: 1,
      autorestart: false, // Disabled by default
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        SYNC_INTERVAL_SECONDS: '30',
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      time: true,
    },
  ],
};