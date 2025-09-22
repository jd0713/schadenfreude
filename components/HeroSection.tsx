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

  const getAvatarText = (name: string) => {
    // Remove @ symbol and get first 2 characters
    const cleanName = name.replace('@', '');
    return cleanName.slice(0, 2).toUpperCase();
  };

  const getAvatarColor = (address: string) => {
    // Consistent color palette like GMGN/MetaMask
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Purple-Blue
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // Pink-Red
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', // Blue-Cyan
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', // Green-Teal
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', // Pink-Yellow
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', // Mint-Pink
      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', // Peach
      'linear-gradient(135deg, #ff8a80 0%, #ea6100 100%)', // Orange-Red
      'linear-gradient(135deg, #8fd3f4 0%, #84fab0 100%)', // Sky-Green
      'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)', // Purple-Cream
      'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)', // Cyan-Blue
      'linear-gradient(135deg, #fdbb2d 0%, #22c1c3 100%)', // Yellow-Teal
    ];

    // Use address hash to select color consistently
    const hash = parseInt(address.slice(2, 8), 16);
    return colors[hash % colors.length];
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
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
                    style={{ background: getAvatarColor(position.address) }}
                  >
                    <span className="text-white font-pixelify font-bold text-xs drop-shadow-sm">
                      {getAvatarText(position.entityName)}
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
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
                    style={{ background: getAvatarColor(position.address) }}
                  >
                    <span className="text-white font-pixelify font-bold text-xs drop-shadow-sm">
                      {getAvatarText(position.entityName)}
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