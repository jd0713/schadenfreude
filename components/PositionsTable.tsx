'use client';

import { useState } from 'react';
import { Position } from '@/lib/types';
import { Skull, Flame, AlertTriangle, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PositionsTableProps {
  positions: Position[];
  isRefreshing: boolean;
  onRefresh: () => void;
  lastUpdated: string;
}

export default function PositionsTable({ positions }: PositionsTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const formatLargeUSD = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '$0';
    const absNum = Math.abs(num);
    if (absNum >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (absNum >= 1000) return `$${(num / 1000).toFixed(1)}K`;
    return `$${num.toFixed(2)}`;
  };

  const getRiskColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'critical': return 'text-[#FB2C36]';
      case 'danger': return 'text-[#FE9A00]';
      case 'warning': return 'text-[#FE9A00]';
      default: return 'text-gray-300';
    }
  };

  const getRiskIcon = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'critical': return <Skull className="w-4 h-4 text-[#FB2C36]" />;
      case 'danger': return <Flame className="w-4 h-4 text-[#FE9A00]" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-[#FE9A00]" />;
      default: return null;
    }
  };

  const sortedPositions = positions.sort((a, b) => {
    const riskOrder = { critical: 0, danger: 1, warning: 2, safe: 3 };
    const aRisk = riskOrder[a.riskLevel as keyof typeof riskOrder] ?? 4;
    const bRisk = riskOrder[b.riskLevel as keyof typeof riskOrder] ?? 4;
    if (aRisk !== bRisk) return aRisk - bRisk;
    return (a.liquidationDistance || 100) - (b.liquidationDistance || 100);
  });

  const toggleRowExpansion = (positionId: string) => {
    setExpandedRow(expandedRow === positionId ? null : positionId);
  };

  return (
    <div className="bg-[#0f0f0f] border border-[#333] rounded-xl overflow-hidden shadow-xl">

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-[#333] bg-[#111]">
            <tr>
              <th className="text-left p-5 text-sm font-ibm text-[#a3a3a3] uppercase tracking-wider w-8">

              </th>
              <th className="text-left p-5 text-sm font-ibm text-[#a3a3a3] uppercase tracking-wider">
                Trader
              </th>
              <th className="text-left p-5 text-sm font-ibm text-[#a3a3a3] uppercase tracking-wider">
                Asset
              </th>
              <th className="text-right p-5 text-sm font-ibm text-[#a3a3a3] uppercase tracking-wider">
                Position Value
              </th>
              <th className="text-right p-5 text-sm font-ibm text-[#a3a3a3] uppercase tracking-wider">
                Unrealized PnL
              </th>
              <th className="text-right p-5 text-sm font-ibm text-[#a3a3a3] uppercase tracking-wider">
                Liq Distance
              </th>
              <th className="text-center p-5 text-sm font-ibm text-[#a3a3a3] uppercase tracking-wider">
                Risk Level
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#333]">
            {sortedPositions.map((position, index) => {
              const isProfiting = position.unrealizedPnl > 0;
              const positionId = `${position.address}-${position.coin}`;
              const isExpanded = expandedRow === positionId;

              return (
                <>
                  <motion.tr
                    key={positionId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                    className="hover:bg-[#1a1a1a] transition-all group cursor-pointer"
                    onClick={() => toggleRowExpansion(positionId)}
                  >
                    <td className="p-5">
                      <button className="text-[#a3a3a3] hover:text-white transition-colors">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 bg-gradient-to-br from-[#97FCE4] to-[#7EDDC4] rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-[#1D1D1D] font-pixelify font-bold text-sm">
                            {position.entityName.slice(0, 2).toUpperCase()}
                          </span>
                        </div>

                        <div className="flex flex-col min-w-0">
                          <span className="font-ibm text-white truncate text-sm">
                            {position.entityName}
                          </span>
                          <span className="text-xs text-[#a3a3a3] font-ibm">
                            {position.address.slice(2, 8)}...
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-5">
                      <span className={`inline-flex px-3 py-1 text-xs font-ibm rounded-lg ${
                        isProfiting
                          ? 'bg-[#00C950]/10 text-[#00C950] border border-[#00C950]/30'
                          : 'bg-[#FB2C36]/10 text-[#FB2C36] border border-[#FB2C36]/30'
                      }`}>
                        {position.coin}
                      </span>
                    </td>

                    <td className="p-5 text-right">
                      <span className="font-ibm text-white text-sm">
                        {formatLargeUSD(position.positionValue)}
                      </span>
                    </td>

                    <td className="p-5 text-right">
                      <span className={`font-ibm text-sm ${
                        isProfiting ? 'text-[#00C950]' : 'text-[#FB2C36]'
                      }`}>
                        {formatLargeUSD(position.unrealizedPnl)}
                      </span>
                    </td>

                    <td className="p-5 text-right">
                      <span className={`font-ibm text-sm ${getRiskColor(position.riskLevel)}`}>
                        {position.liquidationDistance?.toFixed(2) ?? 'N/A'}%
                      </span>
                    </td>

                    <td className="p-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {getRiskIcon(position.riskLevel)}
                        <span className={`text-xs font-ibm uppercase ${getRiskColor(position.riskLevel)}`}>
                          {position.riskLevel || 'safe'}
                        </span>
                      </div>
                    </td>
                  </motion.tr>

                  {/* Expanded Row Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-[#111]"
                      >
                        <td colSpan={7} className="p-0">
                          <div className="p-6 border-t border-[#333]">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                              {/* Trader Information Section */}
                              <div className="space-y-3">
                                <h4 className="text-sm font-ibm font-medium text-[#97FCE4] uppercase tracking-wider border-b border-[#97FCE4]/20 pb-2">
                                  Trader Information
                                </h4>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between py-1">
                                    <span className="text-xs text-[#a3a3a3] font-ibm uppercase tracking-wider">Full Address:</span>
                                    <a
                                      href={`https://hyperdash.info/trader/${position.address}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-[#97FCE4] font-ibm hover:underline flex items-center gap-1"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {position.address.slice(0, 6)}...{position.address.slice(-4)}
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>
                                  {position.twitter && (
                                    <div className="flex items-center justify-between py-1">
                                      <span className="text-xs text-[#a3a3a3] font-ibm uppercase tracking-wider">Twitter:</span>
                                      <a
                                        href={position.twitter}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-[#97FCE4] font-ibm hover:underline flex items-center gap-1"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        @{position.twitter.split('/').pop()}
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Position Details Section */}
                              <div className="space-y-3">
                                <h4 className="text-sm font-ibm font-medium text-[#97FCE4] uppercase tracking-wider border-b border-[#97FCE4]/20 pb-2">
                                  Position Details
                                </h4>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between py-1">
                                    <span className="text-xs text-[#a3a3a3] font-ibm uppercase tracking-wider">Asset:</span>
                                    <span className="text-xs text-white font-ibm font-medium">{position.coin}</span>
                                  </div>
                                  <div className="flex items-center justify-between py-1">
                                    <span className="text-xs text-[#a3a3a3] font-ibm uppercase tracking-wider">Position Size:</span>
                                    <span className="text-xs text-white font-ibm font-medium">
                                      {formatLargeUSD(position.positionValue)}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between py-1">
                                    <span className="text-xs text-[#a3a3a3] font-ibm uppercase tracking-wider">Unrealized PnL:</span>
                                    <span className={`text-xs font-ibm font-medium ${
                                      isProfiting ? 'text-[#00C950]' : 'text-[#FB2C36]'
                                    }`}>
                                      {formatLargeUSD(position.unrealizedPnl)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Risk Assessment Section */}
                              <div className="space-y-3">
                                <h4 className="text-sm font-ibm font-medium text-[#97FCE4] uppercase tracking-wider border-b border-[#97FCE4]/20 pb-2">
                                  Risk Assessment
                                </h4>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between py-1">
                                    <span className="text-xs text-[#a3a3a3] font-ibm uppercase tracking-wider">Risk Level:</span>
                                    <div className="flex items-center gap-1">
                                      {getRiskIcon(position.riskLevel)}
                                      <span className={`text-xs font-ibm font-medium uppercase ${getRiskColor(position.riskLevel)}`}>
                                        {position.riskLevel || 'safe'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between py-1">
                                    <span className="text-xs text-[#a3a3a3] font-ibm uppercase tracking-wider">Liquidation Distance:</span>
                                    <span className={`text-xs font-ibm font-medium ${getRiskColor(position.riskLevel)}`}>
                                      {position.liquidationDistance?.toFixed(2) ?? 'N/A'}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}