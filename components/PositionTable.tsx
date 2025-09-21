'use client';

import { Position } from '@/lib/types';
import { getRiskEmoji } from '@/lib/liquidation';
import { ArrowUpDown, Twitter } from 'lucide-react';
import { useState } from 'react';

interface PositionTableProps {
  positions: Position[];
  onSort?: (field: string) => void;
}

export default function PositionTable({ positions, onSort }: PositionTableProps) {
  const [sortField, setSortField] = useState<string>('liquidationDistance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    onSort?.(field);
  };

  const formatNumber = (num: number, decimals: number = 2) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num >= 0 ? '+' : ''}${formatNumber(num, 2)}%`;
  };

  const formatUSD = (num: number) => {
    return `$${formatNumber(Math.abs(num), 2)}`;
  };

  const getRiskColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'danger':
        return 'text-orange-600 bg-orange-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'safe':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Risk
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Player
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Coin
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('positionValue')}
            >
              <div className="flex items-center gap-1">
                Position Value
                <ArrowUpDown className="w-3 h-3" />
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Entry / Current
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('liquidationDistance')}
            >
              <div className="flex items-center gap-1">
                Liq. Distance
                <ArrowUpDown className="w-3 h-3" />
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Liquidation Price
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Leverage
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('unrealizedPnl')}
            >
              <div className="flex items-center gap-1">
                PnL
                <ArrowUpDown className="w-3 h-3" />
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {positions.map((position, index) => (
            <tr key={`${position.address}-${position.coin}-${index}`} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-2xl">{getRiskEmoji(position.riskLevel || 'safe')}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {position.entityName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {position.address.slice(0, 6)}...{position.address.slice(-4)}
                    </div>
                  </div>
                  {position.twitter && (
                    <a
                      href={position.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-600"
                    >
                      <Twitter className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm font-medium text-gray-900">{position.coin}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-900">{formatUSD(position.positionValue)}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm">
                  <div className="text-gray-500">{formatUSD(position.entryPrice)}</div>
                  <div className="text-gray-900 font-medium">
                    {position.currentPrice ? formatUSD(position.currentPrice) : '-'}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-sm rounded-md ${getRiskColor(position.riskLevel)}`}>
                  {position.liquidationDistance ? formatPercentage(position.liquidationDistance) : '-'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-900">{formatUSD(position.liquidationPrice)}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-900">{position.leverage}x</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`text-sm font-medium ${position.unrealizedPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatUSD(position.unrealizedPnl)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}