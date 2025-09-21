'use client';

import { Skull, Flame, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Position } from '@/lib/types';

interface HeroSectionProps {
  stats: {
    totalPositions: number;
    totalValue: number;
    totalPnL: number;
    criticalCount: number;
    dangerCount: number;
    profitingCount: number;
  };
  currentTime: string;
  isLoading: boolean;
  positions: Position[];
}

export default function HeroSection({ positions }: HeroSectionProps) {
  const formatLargeUSD = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '$0';
    const absNum = Math.abs(num);
    if (absNum >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (absNum >= 1000) return `$${(num / 1000).toFixed(1)}K`;
    return `$${num.toFixed(2)}`;
  };

  // Use all positions for sliding background

  const getRiskIcon = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'critical': return <Skull className="w-3 h-3 text-[#FB2C36]" />;
      case 'danger': return <Flame className="w-3 h-3 text-[#FE9A00]" />;
      case 'warning': return <AlertTriangle className="w-3 h-3 text-[#FE9A00]" />;
      default: return null;
    }
  };

  const getRiskColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'critical': return 'border-[#FB2C36]/20 bg-[#FB2C36]/5';
      case 'danger': return 'border-[#FE9A00]/20 bg-[#FE9A00]/5';
      case 'warning': return 'border-[#FE9A00]/20 bg-[#FE9A00]/5';
      default: return 'border-[#333]/30 bg-[#111]/30';
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="relative z-10 text-center max-w-7xl mx-auto px-4">
        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-[#97FCE4] mb-12"
        >
          <h1 className="font-bold text-4xl md:text-6xl lg:text-7xl xl:text-[80px] mb-8 font-unbounded tracking-wider leading-[0.9] sm:text-[48px]">
            Watched The Whales?
          </h1>
          <h2 className="font-bold text-2xl md:text-4xl lg:text-5xl xl:text-6xl mb-8 font-unbounded leading-[0.9] sm:text-[32px]">
            ENTERTAINMENT CENTER
          </h2>
          <p className="text-[#a3a3a3] text-lg md:text-xl font-ibm max-w-5xl mx-auto leading-relaxed font-light sm:text-[16px]">
            Watch the market&apos;s biggest players burn in real-time. Track massive Hyperliquid positions dancing on the edge of liquidation and enjoy the beautiful chaos of overleveraged traders meeting reality.
          </p>
        </motion.div>

        {/* Sliding Position Cards */}
        <div
          className="relative z-5"
          style={{
            maskImage: "linear-gradient(to right, rgba(0, 0, 0, 0) 0%, rgb(0, 0, 0) 12.5%, rgb(0, 0, 0) 87.5%, rgba(0, 0, 0, 0) 100%)",
          }}
        >
        <div className="flex animate-marquee space-x-4">
          {/* First set of all positions */}
          {positions.map((position, index) => (
            <motion.div
              key={`slide1-${position.address}-${position.coin}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.7, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.5 }}
              className={`flex-shrink-0 w-56 p-4 rounded-xl border backdrop-blur-sm ${getRiskColor(position.riskLevel)} hover:opacity-90 transition-all`}
              style={{ filter: "brightness(0.9)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#97FCE4] to-[#7EDDC4] rounded-lg flex items-center justify-center">
                    <span className="text-[#1D1D1D] font-pixelify font-bold text-xs">
                      {position.entityName.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="text-white text-sm font-ibm font-medium">{position.entityName.slice(0, 10)}...</div>
                    <div className="text-[#a3a3a3] text-xs font-ibm">{position.coin}</div>
                  </div>
                </div>
                {getRiskIcon(position.riskLevel)}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#a3a3a3] font-ibm">Value:</span>
                  <span className="text-sm text-white font-ibm font-medium">{formatLargeUSD(position.positionValue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#a3a3a3] font-ibm">PnL:</span>
                  <span className={`text-sm font-ibm font-medium ${position.unrealizedPnl > 0 ? 'text-[#00C950]' : 'text-[#FB2C36]'}`}>
                    {formatLargeUSD(position.unrealizedPnl)}
                  </span>
                </div>
                {position.liquidationDistance && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#a3a3a3] font-ibm">Liq:</span>
                    <span className={`text-xs font-ibm font-medium ${position.liquidationDistance < 5 ? 'text-[#FB2C36]' : position.liquidationDistance < 10 ? 'text-[#FE9A00]' : 'text-[#a3a3a3]'}`}>
                      {position.liquidationDistance.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {/* Duplicate for seamless loop */}
          {positions.map((position, index) => (
            <motion.div
              key={`slide2-${position.address}-${position.coin}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.7, y: 0 }}
              transition={{ delay: (positions.length + index) * 0.05, duration: 0.5 }}
              className={`flex-shrink-0 w-56 p-4 rounded-xl border backdrop-blur-sm ${getRiskColor(position.riskLevel)} hover:opacity-90 transition-all`}
              style={{ filter: "brightness(0.9)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#97FCE4] to-[#7EDDC4] rounded-lg flex items-center justify-center">
                    <span className="text-[#1D1D1D] font-pixelify font-bold text-xs">
                      {position.entityName.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="text-white text-sm font-ibm font-medium">{position.entityName.slice(0, 10)}...</div>
                    <div className="text-[#a3a3a3] text-xs font-ibm">{position.coin}</div>
                  </div>
                </div>
                {getRiskIcon(position.riskLevel)}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#a3a3a3] font-ibm">Value:</span>
                  <span className="text-sm text-white font-ibm font-medium">{formatLargeUSD(position.positionValue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#a3a3a3] font-ibm">PnL:</span>
                  <span className={`text-sm font-ibm font-medium ${position.unrealizedPnl > 0 ? 'text-[#00C950]' : 'text-[#FB2C36]'}`}>
                    {formatLargeUSD(position.unrealizedPnl)}
                  </span>
                </div>
                {position.liquidationDistance && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#a3a3a3] font-ibm">Liq:</span>
                    <span className={`text-xs font-ibm font-medium ${position.liquidationDistance < 5 ? 'text-[#FB2C36]' : position.liquidationDistance < 10 ? 'text-[#FE9A00]' : 'text-[#a3a3a3]'}`}>
                      {position.liquidationDistance.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
        </div>

      </div>
    </div>
  );
}