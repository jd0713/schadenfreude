'use client';

import { Position } from '@/lib/types';
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign } from 'lucide-react';

interface DashboardStatsProps {
  positions: Position[];
}

export default function DashboardStats({ positions }: DashboardStatsProps) {
  const stats = {
    totalPositions: positions.length,
    totalValue: positions.reduce((sum, p) => sum + p.positionValue, 0),
    totalPnl: positions.reduce((sum, p) => sum + p.unrealizedPnl, 0),
    riskCounts: {
      critical: positions.filter(p => p.riskLevel === 'critical').length,
      danger: positions.filter(p => p.riskLevel === 'danger').length,
      warning: positions.filter(p => p.riskLevel === 'warning').length,
      safe: positions.filter(p => p.riskLevel === 'safe').length,
    },
  };

  const formatUSD = (num: number) => {
    if (Math.abs(num) >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    } else if (Math.abs(num) >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    }
    return `$${num.toFixed(2)}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Positions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Positions</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalPositions}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-full">
            <DollarSign className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Total Value */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Value</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatUSD(stats.totalValue)}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-full">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      {/* Total PnL */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total PnL</p>
            <p className={`text-2xl font-bold mt-1 ${stats.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatUSD(stats.totalPnl)}
            </p>
          </div>
          <div className={`p-3 rounded-full ${stats.totalPnl >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            {stats.totalPnl >= 0 ? (
              <TrendingUp className="w-6 h-6 text-green-600" />
            ) : (
              <TrendingDown className="w-6 h-6 text-red-600" />
            )}
          </div>
        </div>
      </div>

      {/* Risk Overview */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-600">Risk Overview</p>
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">🚨 Critical</span>
            <span className="text-sm font-medium text-red-600">{stats.riskCounts.critical}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">🔴 Danger</span>
            <span className="text-sm font-medium text-orange-600">{stats.riskCounts.danger}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">🟡 Warning</span>
            <span className="text-sm font-medium text-yellow-600">{stats.riskCounts.warning}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">🟢 Safe</span>
            <span className="text-sm font-medium text-green-600">{stats.riskCounts.safe}</span>
          </div>
        </div>
      </div>
    </div>
  );
}