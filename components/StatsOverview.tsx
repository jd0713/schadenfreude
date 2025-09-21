'use client';

import { TrendingUp, TrendingDown, Skull, DollarSign, BarChart3 } from 'lucide-react';

interface StatsOverviewProps {
  stats: {
    totalPositions: number;
    totalValue: number;
    totalPnL: number;
    criticalCount: number;
    dangerCount: number;
    profitingCount: number;
  };
  isLoading: boolean;
}

export default function StatsOverview({ stats, isLoading }: StatsOverviewProps) {
  const formatLargeUSD = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '$0';
    const absNum = Math.abs(num);
    if (absNum >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (absNum >= 1000) return `$${(num / 1000).toFixed(1)}K`;
    return `$${num.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="mb-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] animate-pulse">
            <div className="h-4 bg-[#333] rounded mb-3"></div>
            <div className="h-8 bg-[#333] rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Positions',
      value: stats.totalPositions,
      icon: BarChart3,
      color: 'text-white',
      formatter: (val: number) => val.toString(),
    },
    {
      title: 'Total Value',
      value: stats.totalValue,
      icon: DollarSign,
      color: 'text-white',
      formatter: formatLargeUSD,
    },
    {
      title: 'PnL',
      value: stats.totalPnL,
      icon: stats.totalPnL >= 0 ? TrendingUp : TrendingDown,
      color: stats.totalPnL >= 0 ? 'text-[#00C950]' : 'text-[#FB2C36]',
      formatter: formatLargeUSD,
    },
    {
      title: 'Critical',
      value: stats.criticalCount,
      icon: Skull,
      color: 'text-[#FB2C36]',
      formatter: (val: number) => val.toString(),
    },
  ];

  return (
    <div className="mb-6">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 shadow-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const IconComponent = card.icon;
            return (
              <div
                key={card.title}
                className="flex items-center justify-between p-3 bg-[#111] rounded-lg border border-[#333] hover:border-[#444] transition-all"
              >
                <div className="flex flex-col">
                  <span className="text-xs text-[#a3a3a3] font-ibm uppercase tracking-wider">
                    {card.title}
                  </span>
                  <span className={`text-lg font-pixelify font-bold ${card.color}`}>
                    {card.formatter(card.value)}
                  </span>
                </div>
                <IconComponent className={`w-5 h-5 ${card.color} opacity-70`} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}