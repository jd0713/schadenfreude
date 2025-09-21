'use client';

import { useState } from 'react';
import { Filter, RefreshCw } from 'lucide-react';

interface FilterControlsProps {
  onFilterChange: (filters: {
    riskLevel?: string;
    coin?: string;
  }) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export default function FilterControls({ onFilterChange, onRefresh, isRefreshing }: FilterControlsProps) {
  const [riskLevel, setRiskLevel] = useState<string>('all');
  const [coin, setCoin] = useState<string>('');

  const handleRiskLevelChange = (level: string) => {
    setRiskLevel(level);
    onFilterChange({
      riskLevel: level === 'all' ? undefined : level,
      coin: coin || undefined,
    });
  };

  const handleCoinChange = (value: string) => {
    setCoin(value);
    onFilterChange({
      riskLevel: riskLevel === 'all' ? undefined : riskLevel,
      coin: value || undefined,
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-medium">Filters</h3>
        </div>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Risk Level
          </label>
          <select
            value={riskLevel}
            onChange={(e) => handleRiskLevelChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Levels</option>
            <option value="safe">🟢 Safe (10%+)</option>
            <option value="warning">🟡 Warning (5-10%)</option>
            <option value="danger">🔴 Danger (2-5%)</option>
            <option value="critical">🚨 Critical (&lt;2%)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Coin
          </label>
          <input
            type="text"
            value={coin}
            onChange={(e) => handleCoinChange(e.target.value)}
            placeholder="e.g., BTC, ETH"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => handleRiskLevelChange('critical')}
          className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200"
        >
          Show Critical Only
        </button>
        <button
          onClick={() => handleRiskLevelChange('danger')}
          className="px-3 py-1 bg-orange-100 text-orange-700 rounded-md text-sm hover:bg-orange-200"
        >
          Show Risky Positions
        </button>
        <button
          onClick={() => {
            setRiskLevel('all');
            setCoin('');
            onFilterChange({});
          }}
          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
}