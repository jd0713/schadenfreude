'use client';

import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface HeaderProps {
  currentTime: string;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export default function Header({ currentTime, isRefreshing, onRefresh }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex items-center justify-between"
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[#97FCE4] to-[#7EDDC4] rounded-lg flex items-center justify-center">
            <span className="text-[#1D1D1D] font-pixelify font-bold text-sm">S</span>
          </div>
          <span className="text-[#97FCE4] font-pixelify font-bold text-xl tracking-wider">
            SCHADENFREUDE
          </span>
        </div>

        {/* Last Updated & Refresh */}
        <div className="flex items-center gap-3">
          <span className="text-[#a3a3a3] font-pixelify text-sm">
            Last updated: {currentTime || '--:--:--'}
          </span>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-[#a3a3a3] hover:text-[#97FCE4] transition-colors p-1 rounded"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </motion.div>
    </header>
  );
}