'use client';

import { Position } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Skull, Fire, AlertTriangle, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

interface FunkyPositionCardProps {
  position: Position;
  index: number;
}

export default function FunkyPositionCard({ position, index }: FunkyPositionCardProps) {
  const formatUSD = (num: number) => {
    const absNum = Math.abs(num);
    if (absNum >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (absNum >= 1000) return `$${(num / 1000).toFixed(1)}K`;
    return `$${num.toFixed(2)}`;
  };

  const getRiskGradient = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'critical':
        return 'from-red-900 to-red-600 animate-pulse';
      case 'danger':
        return 'from-orange-800 to-orange-500';
      case 'warning':
        return 'from-yellow-700 to-yellow-500';
      default:
        return 'from-gray-800 to-gray-600';
    }
  };

  const getRiskIcon = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'critical':
        return <Skull className="w-6 h-6 text-red-400 animate-bounce" />;
      case 'danger':
        return <Fire className="w-6 h-6 text-orange-400" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-400" />;
      default:
        return null;
    }
  };

  const isProfiting = position.unrealizedPnl > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ scale: 1.02 }}
      className="relative"
    >
      <Card className={`bg-gradient-to-br ${getRiskGradient(position.riskLevel)} border-0 overflow-hidden`}>
        <div className="absolute top-0 right-0 p-2">
          {getRiskIcon(position.riskLevel)}
        </div>

        <div className="p-6 text-white">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              {position.twitter ? (
                <a
                  href={position.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl font-bold hover:text-cyan-300 transition-colors"
                >
                  {position.entityName}
                </a>
              ) : (
                <h3 className="text-xl font-bold">{position.entityName}</h3>
              )}
              <a
                href={`https://hyperdash.info/trader/${position.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs opacity-70 hover:opacity-100 font-mono"
              >
                {position.address.slice(0, 6)}...{position.address.slice(-4)}
              </a>
            </div>
            <Badge variant={isProfiting ? "default" : "destructive"} className="text-lg px-3 py-1">
              {position.coin}
            </Badge>
          </div>

          {/* Position Size & Leverage */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs opacity-70">Position</p>
              <p className="text-2xl font-bold">{formatUSD(position.positionValue)}</p>
            </div>
            <div>
              <p className="text-xs opacity-70">Leverage</p>
              <p className="text-2xl font-bold">{position.leverage}x</p>
            </div>
          </div>

          {/* PnL Display */}
          <div className={`rounded-lg p-3 mb-4 ${isProfiting ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm opacity-70">Unrealized PnL</span>
              <div className="flex items-center gap-2">
                {isProfiting ? (
                  <TrendingUp className="w-5 h-5 text-green-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                )}
                <span className={`text-xl font-bold ${isProfiting ? 'text-green-400' : 'text-red-400'}`}>
                  {formatUSD(position.unrealizedPnl)}
                </span>
              </div>
            </div>
          </div>

          {/* Liquidation Info */}
          {position.liquidationDistance && (
            <div className="bg-black/30 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm opacity-70">Distance to Liquidation</span>
                <div className="text-right">
                  <p className="text-lg font-bold">
                    {position.liquidationDistance.toFixed(2)}%
                  </p>
                  <p className="text-xs opacity-70">
                    @ {formatUSD(position.liquidationPrice)}
                  </p>
                </div>
              </div>
              {position.riskLevel === 'critical' && (
                <div className="mt-2 text-xs text-red-300 animate-pulse">
                  ⚠️ LIQUIDATION IMMINENT
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}