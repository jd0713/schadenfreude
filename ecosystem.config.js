/**
 * PM2 Configuration File
 * Usage: pm2 start ecosystem.config.js
 */

module.exports = {
  apps: [
    {
      name: 'arkham-sync',
      script: './node_modules/.bin/tsx',
      args: 'scripts/startBackgroundSync.ts',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        SYNC_INTERVAL_SECONDS: '30',
      },
      env_development: {
        NODE_ENV: 'development',
        SYNC_INTERVAL_SECONDS: '60',
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      // Restart delay
      restart_delay: 4000,
      // Max restart count
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};