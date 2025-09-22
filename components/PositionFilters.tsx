'use client';

import { Button } from '@/components/ui/button';
import { Skull, AlertTriangle, Flame, X } from 'lucide-react';

interface PositionFiltersProps {
  selectedSizeCategory: 'all' | 'whale' | 'dolphin' | 'shrimp';
  setSelectedSizeCategory: (category: 'all' | 'whale' | 'dolphin' | 'shrimp') => void;
  selectedRiskFilter: string | null;
  setSelectedRiskFilter: (filter: string | null) => void;
  showHighRiskOnly: boolean;
  setShowHighRiskOnly: (show: boolean) => void;
}

export default function PositionFilters({
  selectedSizeCategory,
  setSelectedSizeCategory,
  selectedRiskFilter,
  setSelectedRiskFilter,
  showHighRiskOnly,
  setShowHighRiskOnly,
}: PositionFiltersProps) {
  const clearAllFilters = () => {
    setSelectedRiskFilter(null);
    setSelectedSizeCategory('all');
  };

  const hasActiveFilters = selectedSizeCategory !== 'all' || selectedRiskFilter;

  const sizeCategories = [
    { id: 'whale', label: '🐋 Whales', description: '&gt;$1M', active: selectedSizeCategory === 'whale' },
    { id: 'dolphin', label: '🐬 Dolphins', description: '$100K-$1M', active: selectedSizeCategory === 'dolphin' },
    { id: 'shrimp', label: '🦐 Shrimps', description: '&lt;$100K', active: selectedSizeCategory === 'shrimp' },
  ];

  const riskLevels = [
    {
      id: 'critical',
      label: 'Critical',
      description: '&lt;5%',
      icon: Skull,
      active: selectedRiskFilter === 'critical',
      color: 'border-[#FB2C36] text-[#FB2C36]',
      activeColor: 'bg-[#FB2C36] text-white border-[#FB2C36]',
    },
    {
      id: 'danger',
      label: 'Danger',
      description: '5-10%',
      icon: Flame,
      active: selectedRiskFilter === 'danger',
      color: 'border-[#FE9A00] text-[#FE9A00]',
      activeColor: 'bg-[#FE9A00] text-white border-[#FE9A00]',
    },
    {
      id: 'warning',
      label: 'Warning',
      description: '10-20%',
      icon: AlertTriangle,
      active: selectedRiskFilter === 'warning',
      color: 'border-[#FFA500] text-[#FFA500]',
      activeColor: 'bg-[#FFA500] text-white border-[#FFA500]',
    },
  ];

  return (
    <div className="mb-6">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 shadow-lg">
        <div className="flex flex-wrap items-center gap-3">

          {/* Position Size Filters */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#a3a3a3] font-ibm uppercase tracking-wider">Size:</span>
            {sizeCategories.map((category) => (
              <Button
                key={category.id}
                onClick={() =>
                  selectedSizeCategory === category.id
                    ? setSelectedSizeCategory('all')
                    : setSelectedSizeCategory(category.id as 'whale' | 'dolphin' | 'shrimp')
                }
                size="sm"
                className={`rounded-lg px-3 py-1 font-ibm text-xs transition-all ${
                  category.active
                    ? "bg-[#97FCE4] text-[#1D1D1D] border border-[#97FCE4]"
                    : "bg-[#111] border border-[#444] text-gray-300 hover:bg-[#222] hover:border-[#555]"
                }`}
              >
                <span dangerouslySetInnerHTML={{ __html: category.label.split(' ')[0] }} />
              </Button>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-[#333]"></div>

          {/* Risk Level Filters */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#a3a3a3] font-ibm uppercase tracking-wider">Risk:</span>
            {riskLevels.map((risk) => {
              const IconComponent = risk.icon;
              return (
                <Button
                  key={risk.id}
                  onClick={() =>
                    selectedRiskFilter === risk.id
                      ? setSelectedRiskFilter(null)
                      : setSelectedRiskFilter(risk.id)
                  }
                  size="sm"
                  className={`rounded-lg px-3 py-1 font-ibm text-xs transition-all flex items-center gap-1 ${
                    risk.active
                      ? risk.activeColor
                      : "bg-[#111] " + risk.color + " hover:bg-[" + risk.color.split('[')[1].split(']')[0] + "]/10"
                  }`}
                >
                  <IconComponent className="w-3 h-3" />
                  <span>{risk.label}</span>
                </Button>
              );
            })}

          </div>

          {/* Clear All Button */}
          {hasActiveFilters && (
            <>
              <div className="w-px h-6 bg-[#333]"></div>
              <Button
                onClick={clearAllFilters}
                size="sm"
                className="bg-[#111] border border-[#444] text-[#a3a3a3] hover:bg-[#222] hover:border-[#555] hover:text-white rounded-lg px-3 py-1 font-ibm text-xs transition-all"
              >
                <X className="w-3 h-3 mr-1" />
                Clear All
              </Button>
            </>
          )}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-3 pt-3 border-t border-[#333]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-[#a3a3a3] font-ibm">Active:</span>
              {selectedSizeCategory !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-[#97FCE4]/10 border border-[#97FCE4]/30 text-[#97FCE4] text-xs font-ibm">
                  {selectedSizeCategory}
                  <button
                    onClick={() => setSelectedSizeCategory('all')}
                    className="ml-1 hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedRiskFilter && (
                <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-ibm ${
                  selectedRiskFilter === 'critical'
                    ? 'bg-[#FB2C36]/10 border border-[#FB2C36]/30 text-[#FB2C36]'
                    : selectedRiskFilter === 'danger'
                    ? 'bg-[#FE9A00]/10 border border-[#FE9A00]/30 text-[#FE9A00]'
                    : 'bg-[#FFA500]/10 border border-[#FFA500]/30 text-[#FFA500]'
                }`}>
                  {selectedRiskFilter}
                  <button
                    onClick={() => setSelectedRiskFilter(null)}
                    className="ml-1 hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}