'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import PositionFilters from '@/components/PositionFilters';
import PositionsTable from '@/components/PositionsTable';
import FunkyPositionCard from '@/components/FunkyPositionCard';
import { Position } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string | null>(null);
  const [showHighRiskOnly, setShowHighRiskOnly] = useState(false);
  const [selectedSizeCategory, setSelectedSizeCategory] = useState<'all' | 'whale' | 'dolphin' | 'shrimp'>('all');
  const [currentTime, setCurrentTime] = useState<string>('');

  // Build query string
  const queryParams = new URLSearchParams();
  if (selectedRiskFilter) queryParams.set('riskLevel', selectedRiskFilter);
  const queryString = queryParams.toString();
  const apiUrl = `/api/positions${queryString ? `?${queryString}` : ''}`;

  // Fetch positions with SWR for caching and auto-refresh
  const { data, error, mutate, isLoading } = useSWR(apiUrl, fetcher, {
    refreshInterval: 30000, // Auto-refresh every 30 seconds
    revalidateOnFocus: true,
  });

  let positions: Position[] = data?.data || [];

  // Apply client-side filtering
  if (showHighRiskOnly) {
    positions = positions.filter(p =>
      (p.liquidationDistance && p.liquidationDistance < 10) ||
      p.positionValue > 100000
    );
  }

  // Apply size category filter
  if (selectedSizeCategory !== 'all') {
    positions = positions.filter(p => {
      if (selectedSizeCategory === 'whale') return p.positionValue > 1000000;
      if (selectedSizeCategory === 'dolphin') return p.positionValue >= 100000 && p.positionValue <= 1000000;
      if (selectedSizeCategory === 'shrimp') return p.positionValue < 100000;
      return true;
    });
  }

  // Calculate stats
  const stats = {
    totalPositions: positions.length,
    totalValue: positions.reduce((acc, p) => acc + (p.positionValue || 0), 0),
    totalPnL: positions.reduce((acc, p) => acc + (p.unrealizedPnl || 0), 0),
    criticalCount: positions.filter(p => p.riskLevel === 'critical').length,
    dangerCount: positions.filter(p => p.riskLevel === 'danger').length,
    profitingCount: positions.filter(p => p.unrealizedPnl > 0).length,
  };

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

  // Initial sync on mount and setup time
  useEffect(() => {
    fetch('/api/sync', { method: 'POST' }).catch(console.error);

    // Set initial time
    setCurrentTime(new Date().toLocaleTimeString());

    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative mx-auto min-h-screen bg-[#0f0f0f]">
      {/* Background Pattern - stereo.avif */}
      <div
        className="absolute top-0 bottom-0 left-0 right-0 z-2 opacity-[0.15]"
        style={{
          backgroundImage: `url('/background/stereo.avif')`,
          backgroundSize: "128px auto",
          backgroundRepeat: "repeat",
        }}
      />

      {/* Top Decorative SVG */}
      <div
        className="opacity-10 absolute top-0 left-0 right-0 z-2 w-full h-[var(auto, 648px)] bg-no-repeat bg-top bg-cover aspect-[1.8518518518518519/1]"
        style={{
          backgroundImage: `url('/background/top.svg')`,
          objectFit: "cover",
          objectPosition: "center center",
          filter: "hue-rotate(160deg) saturate(1.2)",
        }}
      />

      {/* Header */}
      <Header
        currentTime={currentTime}
        isRefreshing={isManualRefreshing}
        onRefresh={handleRefresh}
      />

      {/* Main Content */}
      <main className="relative z-10">
        <div className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <HeroSection
            stats={stats}
            currentTime={currentTime}
            isLoading={isLoading || !!error}
            positions={positions}
          />

          {/* Position Filters */}
          <PositionFilters
            selectedSizeCategory={selectedSizeCategory}
            setSelectedSizeCategory={setSelectedSizeCategory}
            selectedRiskFilter={selectedRiskFilter}
            setSelectedRiskFilter={setSelectedRiskFilter}
            showHighRiskOnly={showHighRiskOnly}
            setShowHighRiskOnly={setShowHighRiskOnly}
          />

          {/* Main Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-16 h-16 animate-spin text-[#97FCE4] mx-auto mb-4" />
                <p className="text-[#a3a3a3]">Loading positions...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-[#FB2C36] font-medium mb-4">Failed to load positions</p>
              <Button
                onClick={handleRefresh}
                className="bg-[#FB2C36] hover:bg-[#E02833] text-white rounded-lg"
              >
                Retry
              </Button>
            </div>
          ) : positions.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[#a3a3a3] text-lg">No positions found</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block">
                <PositionsTable
                  positions={positions}
                  isRefreshing={isManualRefreshing}
                  onRefresh={handleRefresh}
                  lastUpdated={currentTime || '--:--:--'}
                />
              </div>

              {/* Mobile Card View */}
              <div className="block lg:hidden grid grid-cols-1 md:grid-cols-2 gap-6">
                {positions
                  .sort((a, b) => {
                    const riskOrder = { critical: 0, danger: 1, warning: 2, safe: 3 };
                    const aRisk = riskOrder[a.riskLevel as keyof typeof riskOrder] ?? 4;
                    const bRisk = riskOrder[b.riskLevel as keyof typeof riskOrder] ?? 4;
                    if (aRisk !== bRisk) return aRisk - bRisk;
                    return (a.liquidationDistance || 100) - (b.liquidationDistance || 100);
                  })
                  .map((position, index) => (
                    <FunkyPositionCard
                      key={`${position.address}-${position.coin}`}
                      position={position}
                      index={index}
                    />
                  ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Bottom Decorative SVG */}
      <div
        className="opacity-10 absolute bottom-0 left-0 right-0 z-2 w-full h-[var(auto, 648px)] bg-no-repeat bg-bottom bg-cover aspect-[1.8518518518518519/1]"
        style={{
          backgroundImage: `url('/background/bot.svg')`,
          filter: "hue-rotate(160deg) saturate(1.2)",
        }}
      />
    </div>
  );
}