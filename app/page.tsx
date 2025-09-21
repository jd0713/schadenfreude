'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import FunkyPositionCard from '@/components/FunkyPositionCard';
import { Position } from '@/lib/types';
import { Loader2, TrendingUp, Skull, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { motion } from 'framer-motion';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string | null>(null);
  const [showHighRiskOnly, setShowHighRiskOnly] = useState(true);
  const [selectedSizeCategory, setSelectedSizeCategory] = useState<'all' | 'whale' | 'dolphin' | 'shrimp'>('all');

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

  // Initial sync on mount
  useEffect(() => {
    fetch('/api/sync', { method: 'POST' }).catch(console.error);
  }, []);

  const formatLargeUSD = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '$0';
    const absNum = Math.abs(num);
    if (absNum >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (absNum >= 1000) return `$${(num / 1000).toFixed(1)}K`;
    return `$${num.toFixed(2)}`;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-20">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500 mb-2">
            Schadenfreude
          </h1>
          <p className="text-gray-300 text-lg">
            Watch the whales swim... or sink 🐋💀
          </p>
        </motion.div>

        {/* Stats Dashboard */}
        {!isLoading && !error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8 grid grid-cols-2 md:grid-cols-6 gap-4"
          >
            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <p className="text-xs text-gray-400 mb-1">Positions</p>
              <p className="text-2xl font-bold text-white">{stats.totalPositions}</p>
            </div>
            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <p className="text-xs text-gray-400 mb-1">Total Value</p>
              <p className="text-2xl font-bold text-white">{formatLargeUSD(stats.totalValue)}</p>
            </div>
            <div className={`bg-black/40 backdrop-blur-sm rounded-xl p-4 border ${stats.totalPnL >= 0 ? 'border-green-500/50' : 'border-red-500/50'}`}>
              <p className="text-xs text-gray-400 mb-1">Total PnL</p>
              <p className={`text-2xl font-bold ${stats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatLargeUSD(stats.totalPnL)}
              </p>
            </div>
            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-red-500/50">
              <p className="text-xs text-gray-400 mb-1">Critical</p>
              <div className="flex items-center gap-2">
                <Skull className="w-5 h-5 text-red-400" />
                <p className="text-2xl font-bold text-red-400">{stats.criticalCount}</p>
              </div>
            </div>
            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-orange-500/50">
              <p className="text-xs text-gray-400 mb-1">Danger</p>
              <p className="text-2xl font-bold text-orange-400">{stats.dangerCount}</p>
            </div>
            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-green-500/50">
              <p className="text-xs text-gray-400 mb-1">Winning</p>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <p className="text-2xl font-bold text-green-400">{stats.profitingCount}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Filter Controls */}
        <div className="mb-6 space-y-3">
          {/* Size Categories */}
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              onClick={() => selectedSizeCategory === 'whale' ? setSelectedSizeCategory('all') : setSelectedSizeCategory('whale')}
              variant={selectedSizeCategory === 'whale' ? "default" : "outline"}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              🐋 Whales (&gt;$1M)
            </Button>
            <Button
              onClick={() => selectedSizeCategory === 'dolphin' ? setSelectedSizeCategory('all') : setSelectedSizeCategory('dolphin')}
              variant={selectedSizeCategory === 'dolphin' ? "default" : "outline"}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              🐬 Dolphins ($100K-$1M)
            </Button>
            <Button
              onClick={() => selectedSizeCategory === 'shrimp' ? setSelectedSizeCategory('all') : setSelectedSizeCategory('shrimp')}
              variant={selectedSizeCategory === 'shrimp' ? "default" : "outline"}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              🦐 Shrimps (&lt;$100K)
            </Button>
          </div>

          {/* Risk Filters */}
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              onClick={() => setShowHighRiskOnly(!showHighRiskOnly)}
              variant={showHighRiskOnly ? "destructive" : "outline"}
              className={showHighRiskOnly ? "" : "border-white/20 text-white hover:bg-white/20"}
            >
              <Skull className="w-4 h-4 mr-2" />
              High Risk Only
            </Button>
            <Button
              onClick={() => setSelectedRiskFilter(selectedRiskFilter === 'critical' ? null : 'critical')}
              variant={selectedRiskFilter === 'critical' ? "destructive" : "outline"}
              className="border-red-500/50 text-red-400 hover:bg-red-500/20"
            >
              Critical (&lt;5%)
            </Button>
            <Button
              onClick={() => setSelectedRiskFilter(selectedRiskFilter === 'danger' ? null : 'danger')}
              variant={selectedRiskFilter === 'danger' ? "destructive" : "outline"}
              className="border-orange-500/50 text-orange-400 hover:bg-orange-500/20"
            >
              Danger (5-10%)
            </Button>
            <Button
              onClick={() => setSelectedRiskFilter(null)}
              variant={!selectedRiskFilter && !showHighRiskOnly ? "default" : "outline"}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              All Positions
            </Button>
            <Button
              onClick={handleRefresh}
              disabled={isManualRefreshing}
              className="bg-violet-600 text-white hover:bg-violet-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isManualRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Main Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-16 h-16 animate-spin text-violet-400 mx-auto mb-4" />
              <p className="text-gray-300">Loading positions...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-red-400 font-medium mb-4">Failed to load positions</p>
            <Button onClick={handleRefresh} variant="destructive">
              Retry
            </Button>
          </div>
        ) : positions.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No positions found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {positions
              .sort((a, b) => {
                // Sort by risk level first, then by liquidation distance
                const riskOrder = { critical: 0, danger: 1, warning: 2, safe: 3 };
                const aRisk = riskOrder[a.riskLevel as keyof typeof riskOrder] ?? 4;
                const bRisk = riskOrder[b.riskLevel as keyof typeof riskOrder] ?? 4;
                if (aRisk !== bRisk) return aRisk - bRisk;
                return (a.liquidationDistance || 100) - (b.liquidationDistance || 100);
              })
              .map((position, index) => (
                <FunkyPositionCard key={`${position.address}-${position.coin}`} position={position} index={index} />
              ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </main>
  );
}