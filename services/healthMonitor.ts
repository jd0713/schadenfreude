/**
 * Health Monitor Service
 * Monitors the health of all Arkham services and provides alerts
 */

import axios from 'axios';
import { db, supabase } from '../lib/supabase';

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  lastCheck: Date;
  consecutiveFailures: number;
  lastError?: string;
  metrics?: {
    responseTime?: number;
    memoryUsage?: number;
    positionsTracked?: number;
  };
}

class HealthMonitorService {
  private services: Map<string, ServiceHealth> = new Map();
  private checkInterval: number = parseInt(process.env.HEALTH_CHECK_INTERVAL || '60000');
  private alertThreshold: number = parseInt(process.env.ALERT_THRESHOLD || '5');
  private isRunning: boolean = false;
  private intervalId?: NodeJS.Timeout;

  constructor() {
    // Initialize service health tracking for dual endpoints
    this.services.set('hyperliquid-private-api', {
      name: 'hyperliquid-private-api',
      status: 'healthy',
      lastCheck: new Date(),
      consecutiveFailures: 0,
    });

    this.services.set('hyperliquid-public-api', {
      name: 'hyperliquid-public-api',
      status: 'healthy',
      lastCheck: new Date(),
      consecutiveFailures: 0,
    });

    this.services.set('supabase', {
      name: 'supabase',
      status: 'healthy',
      lastCheck: new Date(),
      consecutiveFailures: 0,
    });

    this.services.set('position-sync', {
      name: 'position-sync',
      status: 'healthy',
      lastCheck: new Date(),
      consecutiveFailures: 0,
    });
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️  Health monitor already running');
      return;
    }

    console.log('🏥 Starting Health Monitor Service');
    console.log(`📊 Check interval: ${this.checkInterval / 1000}s`);
    console.log(`🚨 Alert threshold: ${this.alertThreshold} consecutive failures`);

    this.isRunning = true;

    // Initial health check
    await this.performHealthChecks();

    // Schedule periodic checks
    this.intervalId = setInterval(() => {
      this.performHealthChecks().catch(console.error);
    }, this.checkInterval);
  }

  async stop() {
    if (!this.isRunning) return;

    console.log('🛑 Stopping Health Monitor Service');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  private async performHealthChecks() {
    const startTime = Date.now();

    console.log(`\n🔍 [${new Date().toISOString()}] Performing health checks...`);

    // Check both Hyperliquid APIs
    await this.checkHyperliquidPrivateAPI();
    await this.checkHyperliquidPublicAPI();

    // Check Supabase connection
    await this.checkSupabase();

    // Check position sync status
    await this.checkPositionSync();

    // Log overall health status
    this.logHealthSummary();

    // Send alerts if needed
    await this.sendAlerts();

    const checkTime = Date.now() - startTime;
    console.log(`✅ Health checks completed in ${checkTime}ms`);
  }

  private async checkHyperliquidPrivateAPI() {
    const health = this.services.get('hyperliquid-private-api')!;
    const startTime = Date.now();

    try {
      // Private API requires POST request with clearinghouseState
      const response = await axios.post(
        process.env.HYPERLIQUID_PRIVATE_API_URL ||
        process.env.HYPERLIQUID_API_URL ||
        'http://localhost:3001/info',
        {
          type: 'clearinghouseState',
          user: '0x0000000000000000000000000000000000000000'  // Test with zero address
        },
        {
          timeout: 5000,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (response.status === 200 && response.data) {
        health.status = 'healthy';
        health.consecutiveFailures = 0;
        health.metrics = {
          responseTime: Date.now() - startTime,
        };
        delete health.lastError;
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (error) {
      health.consecutiveFailures++;
      health.lastError = error instanceof Error ? error.message : 'Unknown error';

      if (health.consecutiveFailures >= this.alertThreshold) {
        health.status = 'down';
      } else if (health.consecutiveFailures >= 2) {
        health.status = 'degraded';
      }

      console.error(`❌ Hyperliquid Private API check failed: ${health.lastError}`);
    }

    health.lastCheck = new Date();
  }

  private async checkHyperliquidPublicAPI() {
    const health = this.services.get('hyperliquid-public-api')!;
    const startTime = Date.now();

    try {
      const response = await axios.post(
        process.env.HYPERLIQUID_PUBLIC_API_URL || 'https://api.hyperliquid.xyz/info',
        { type: 'allMids' },
        {
          timeout: 5000,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (response.status === 200 && response.data) {
        health.status = 'healthy';
        health.consecutiveFailures = 0;
        health.metrics = {
          responseTime: Date.now() - startTime,
        };
        delete health.lastError;
      } else {
        throw new Error(`Unexpected response`);
      }
    } catch (error) {
      health.consecutiveFailures++;
      health.lastError = error instanceof Error ? error.message : 'Unknown error';

      if (health.consecutiveFailures >= this.alertThreshold) {
        health.status = 'down';
      } else if (health.consecutiveFailures >= 2) {
        health.status = 'degraded';
      }

      console.error(`❌ Hyperliquid Public API check failed: ${health.lastError}`);
    }

    health.lastCheck = new Date();
  }

  private async checkSupabase() {
    const health = this.services.get('supabase')!;
    const startTime = Date.now();

    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Try to fetch entity count
      const { count, error } = await supabase
        .from('entities')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;

      health.status = 'healthy';
      health.consecutiveFailures = 0;
      health.metrics = {
        responseTime: Date.now() - startTime,
      };
      delete health.lastError;
    } catch (error) {
      health.consecutiveFailures++;
      health.lastError = error instanceof Error ? error.message : 'Unknown error';

      if (health.consecutiveFailures >= this.alertThreshold) {
        health.status = 'down';
      } else if (health.consecutiveFailures >= 2) {
        health.status = 'degraded';
      }

      console.error(`❌ Supabase check failed: ${health.lastError}`);
    }

    health.lastCheck = new Date();
  }

  private async checkPositionSync() {
    const health = this.services.get('position-sync')!;

    try {
      // Check when positions were last updated
      const positions = await db.getPositions();

      if (positions.length === 0) {
        health.status = 'degraded';
        health.lastError = 'No positions found';
      } else {
        // Check if any positions updated in last 5 minutes
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const recentUpdates = positions.filter(p =>
          p.last_updated && new Date(p.last_updated) > fiveMinutesAgo
        );

        if (recentUpdates.length > 0) {
          health.status = 'healthy';
          health.consecutiveFailures = 0;
          health.metrics = {
            positionsTracked: positions.length,
          };
          delete health.lastError;
        } else {
          health.consecutiveFailures++;
          health.lastError = 'No recent position updates';

          if (health.consecutiveFailures >= this.alertThreshold) {
            health.status = 'down';
          } else if (health.consecutiveFailures >= 2) {
            health.status = 'degraded';
          }
        }
      }
    } catch (error) {
      health.consecutiveFailures++;
      health.lastError = error instanceof Error ? error.message : 'Unknown error';
      health.status = 'down';
      console.error(`❌ Position sync check failed: ${health.lastError}`);
    }

    health.lastCheck = new Date();
  }

  private logHealthSummary() {
    console.log('\n📊 Health Summary:');

    for (const [name, health] of this.services) {
      const statusEmoji =
        health.status === 'healthy' ? '🟢' :
        health.status === 'degraded' ? '🟡' : '🔴';

      let message = `  ${statusEmoji} ${name}: ${health.status.toUpperCase()}`;

      if (health.metrics?.responseTime) {
        message += ` (${health.metrics.responseTime}ms)`;
      }

      if (health.metrics?.positionsTracked) {
        message += ` (${health.metrics.positionsTracked} positions)`;
      }

      if (health.lastError) {
        message += ` - ${health.lastError}`;
      }

      console.log(message);
    }
  }

  private async sendAlerts() {
    // Check for critical services that are down
    const criticalServices = Array.from(this.services.values())
      .filter(s => s.status === 'down');

    if (criticalServices.length > 0) {
      console.log('\n🚨 ALERT: Critical services are down!');

      for (const service of criticalServices) {
        console.error(`  ❌ ${service.name}: ${service.lastError || 'Service is down'}`);

        // Here you could implement additional alerting:
        // - Send email notifications
        // - Post to Slack/Discord
        // - Create Supabase alert records
        // - Trigger PagerDuty
      }
    }

    // Check for degraded services
    const degradedServices = Array.from(this.services.values())
      .filter(s => s.status === 'degraded');

    if (degradedServices.length > 0) {
      console.log('\n⚠️  Warning: Some services are degraded');

      for (const service of degradedServices) {
        console.warn(`  🟡 ${service.name}: ${service.lastError || 'Service is degraded'}`);
      }
    }
  }

  // API endpoint for external health checks
  getHealthStatus() {
    const services = Array.from(this.services.values());
    const overallHealth = services.every(s => s.status === 'healthy') ? 'healthy' :
                          services.some(s => s.status === 'down') ? 'down' : 'degraded';

    return {
      status: overallHealth,
      services: services.map(s => ({
        name: s.name,
        status: s.status,
        lastCheck: s.lastCheck.toISOString(),
        error: s.lastError,
        metrics: s.metrics,
      })),
      timestamp: new Date().toISOString(),
    };
  }
}

// Main execution
async function main() {
  const monitor = new HealthMonitorService();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n📊 Received SIGINT, shutting down gracefully...');
    await monitor.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n📊 Received SIGTERM, shutting down gracefully...');
    await monitor.stop();
    process.exit(0);
  });

  // Start monitoring
  try {
    await monitor.start();
    console.log('🏥 Health Monitor Service is running');
  } catch (error) {
    console.error('Failed to start health monitor:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export default HealthMonitorService;