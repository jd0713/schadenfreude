'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import PositionTable from '@/components/PositionTable';
import FilterControls from '@/components/FilterControls';
import DashboardStats from '@/components/DashboardStats';
import { Position } from '@/lib/types';
import { AlertCircle, Loader2 } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  const [filters, setFilters] = useState<{ riskLevel?: string; coin?: string }>({});
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  // Build query string
  const queryParams = new URLSearchParams();
  if (filters.riskLevel) queryParams.set('riskLevel', filters.riskLevel);
  if (filters.coin) queryParams.set('coin', filters.coin);
  const queryString = queryParams.toString();
  const apiUrl = `/api/positions${queryString ? `?${queryString}` : ''}`;

  // Fetch positions with SWR for caching and auto-refresh
  const { data, error, mutate, isLoading } = useSWR(apiUrl, fetcher, {
    refreshInterval: 30000, // Auto-refresh every 30 seconds
    revalidateOnFocus: true,
  });

  const positions: Position[] = data?.data || [];

  // Manual refresh handler
  const handleRefresh = async () => {
    setIsManualRefreshing(true);
    
    // Trigger sync first
    try {
      await fetch('/api/sync', { method: 'POST' });
    } catch (err) {
      console.error('Sync failed:', err);
    }

    // Then refresh data
    await mutate();
    setIsManualRefreshing(false);
  };

  // Initial sync on mount
  useEffect(() => {
    fetch('/api/sync', { method: 'POST' }).catch(console.error);
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Arkham Liquidation Monitor
          </h1>
          <p className="text-gray-600">
            Real-time monitoring of Hyperliquid positions for identified Arkham entities
          </p>
        </div>

        {/* Stats Dashboard */}
        {!isLoading && !error && (
          <div className="mb-8">
            <DashboardStats positions={positions} />
          </div>
        )}

        {/* Filter Controls */}
        <div className="mb-6">
          <FilterControls
            onFilterChange={setFilters}
            onRefresh={handleRefresh}
            isRefreshing={isManualRefreshing}
          />
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-gray-900 font-medium mb-2">Failed to load positions</p>
              <p className="text-gray-600 text-sm mb-4">{error.message || 'Unknown error occurred'}</p>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : positions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-gray-900 font-medium mb-2">No positions found</p>
              <p className="text-gray-600 text-sm">
                {filters.riskLevel || filters.coin
                  ? 'Try adjusting your filters'
                  : 'Waiting for position data...'}
              </p>
            </div>
          ) : (
            <PositionTable positions={positions} />
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Data refreshes automatically every 30 seconds</p>
          <p className="mt-1">
            Last updated: {data?.timestamp ? new Date(data.timestamp).toLocaleString() : 'Loading...'}
          </p>
        </div>
      </div>
    </main>
  );
}