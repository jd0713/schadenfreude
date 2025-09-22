'use client';

import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';

interface HeaderProps {
  currentTime: string;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export default function Header({ currentTime, isRefreshing, onRefresh }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      setIsScrolled(scrollPercent > 80);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 px-6 py-3 transition-all duration-300 ${
      isScrolled ? 'bg-black/80 backdrop-blur-sm' : 'bg-transparent'
    }`}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex items-center justify-between"
      >
        {/* Title */}
        <span className="text-[#97FCE4] font-pixelify font-bold text-xl tracking-wider">
          SCHADENFREUDE
        </span>

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