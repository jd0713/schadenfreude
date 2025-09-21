'use client';

import { Position } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Skull, Flame, AlertTriangle, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

interface FunkyPositionCardProps {
  position: Position;
  index: number;
}

export default function FunkyPositionCard({ position, index }: FunkyPositionCardProps) {
  const formatUSD = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '$0';
    const absNum = Math.abs(num);
    if (absNum >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (absNum >= 1000) return `$${(num / 1000).toFixed(1)}K`;
    return `$${num.toFixed(2)}`;
  };

  const getRiskStyles = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'critical':
        return 'bg-[#1a1a1a] border-[#FB2C36]/30 hover:border-[#FB2C36]/50';
      case 'danger':
        return 'bg-[#1a1a1a] border-[#FE9A00]/30 hover:border-[#FE9A00]/50';
      case 'warning':
        return 'bg-[#1a1a1a] border-[#FE9A00]/30 hover:border-[#FE9A00]/50';
      default:
        return 'bg-[#1a1a1a] border-[#333] hover:border-[#444]';
    }
  };

  const getRiskIcon = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'critical':
        return <Skull className="w-4 h-4 text-[#FB2C36] animate-pulse" />;
      case 'danger':
        return <Flame className="w-4 h-4 text-[#FE9A00]" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-[#FE9A00]" />;
      default:
        return null;
    }
  };

  const getRiskColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'critical': return 'text-[#FB2C36]';
      case 'danger': return 'text-[#FE9A00]';
      case 'warning': return 'text-[#FE9A00]';
      default: return 'text-gray-300';
    }
  };

  const isProfiting = position.unrealizedPnl > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="relative group"
    >
      <Card className={`${getRiskStyles(position.riskLevel)} border overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all group-hover:scale-[1.02]`}>
        {/* Header Section */}
        <div className="p-6 border-b border-[#333]">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#97FCE4] to-[#7EDDC4] flex items-center justify-center flex-shrink-0">
              <span className="text-[#1D1D1D] font-pixelify font-bold text-sm">
                {position.entityName.slice(0, 2).toUpperCase()}
              </span>
            </div>

            {/* Name and Address */}
            <div className="flex-1 min-w-0">
              {position.twitter ? (
                <a
                  href={position.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-lg font-ibm text-white hover:text-[#97FCE4] transition-colors group"
                >
                  <span className="truncate">{position.entityName}</span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </a>
              ) : (
                <h3 className="text-lg font-ibm text-white truncate">{position.entityName}</h3>
              )}
              <a
                href={`https://hyperdash.info/trader/${position.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-[#a3a3a3] hover:text-[#97FCE4] font-ibm group"
              >
                <span>{position.address.slice(2, 8)}...</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>

            {/* Risk Level and Asset */}
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-1">
                {getRiskIcon(position.riskLevel)}
                <span className={`text-xs font-ibm uppercase ${getRiskColor(position.riskLevel)}`}>
                  {position.riskLevel || 'safe'}
                </span>
              </div>
              <Badge
                className={`text-xs px-2 py-1 font-ibm rounded-md ${
                  isProfiting
                    ? 'bg-[#00C950]/10 text-[#00C950] border border-[#00C950]/30'
                    : 'bg-[#FB2C36]/10 text-[#FB2C36] border border-[#FB2C36]/30'
                }`}
              >
                {position.coin}
              </Badge>
            </div>
          </div>
        </div>

        {/* Metrics Section */}
        <div className="p-6 space-y-4">
          {/* Position Value */}
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-[#a3a3a3] font-ibm uppercase tracking-wider">Position Value</p>
              <p className="text-2xl font-pixelify font-bold text-white">{formatUSD(position.positionValue)}</p>
            </div>
          </div>

          {/* PnL */}
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-[#a3a3a3] font-ibm uppercase tracking-wider">Unrealized PnL</p>
              <div className="flex items-center gap-2">
                {isProfiting ? (
                  <TrendingUp className="w-4 h-4 text-[#00C950]" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-[#FB2C36]" />
                )}
                <span className={`text-xl font-pixelify font-bold ${isProfiting ? 'text-[#00C950]' : 'text-[#FB2C36]'}`}>
                  {formatUSD(position.unrealizedPnl)}
                </span>
              </div>
            </div>
          </div>

          {/* Liquidation Distance */}
          {position.liquidationDistance && (
            <div className="bg-[#111] rounded-lg p-3 border border-[#333]">
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#a3a3a3] font-ibm uppercase tracking-wider">Liquidation Distance</span>
                <span className={`text-lg font-pixelify font-bold ${getRiskColor(position.riskLevel)}`}>
                  {position.liquidationDistance?.toFixed(2) ?? 'N/A'}%
                </span>
              </div>
              {position.riskLevel === 'critical' && (
                <div className="mt-2 text-xs text-[#FB2C36] animate-pulse font-ibm font-bold uppercase tracking-wide flex items-center gap-1">
                  <Skull className="w-3 h-3" />
                  Liquidation Risk
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}