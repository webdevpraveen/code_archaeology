/**
 * App Navbar Component
 * Top navigation with logo, repository info, search, and actions
 */
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, RefreshCw, Github, Network } from 'lucide-react';
import { useRepository } from '@/hooks';

interface AppNavbarProps {
  onSearch?: (query: string) => void;
  onRefresh?: () => void;
}

export function AppNavbar({ onSearch, onRefresh }: AppNavbarProps) {
  const { repository, refreshRepository } = useRepository();
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshRepository();
      onRefresh?.();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 left-0 right-0 h-16 bg-slate-950 border-b border-slate-800 z-40"
    >
      <div className="h-full px-6 flex items-center justify-between gap-4">
        {/* Logo & Repository Info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0"
          >
            <a href="/" className="text-xl font-bold text-amber-400">
              📚
            </a>
          </motion.div>

          {repository && (
            <div className="hidden sm:flex items-center gap-2 min-w-0">
              <span className="text-sm text-slate-400">
                {repository.owner}/{repository.name}
              </span>
            </div>
          )}
        </div>

        {/* Search Input */}
        <div className="flex-1 max-w-md hidden md:block">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search in repository..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            />
          </motion.div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh repository data"
          >
            <RefreshCw
              className={`w-5 h-5 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg transition-colors hidden sm:block"
          >
            Ask Repository
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            title="View on GitHub"
          >
            <Github className="w-5 h-5 text-slate-400" />
          </motion.button>

          {/* GitHub API Status Indicator */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 pl-2 border-l border-slate-700"
          >
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-xs text-slate-400 hidden sm:inline">API OK</span>
            </div>
            <Network className="w-4 h-4 text-slate-500" />
          </motion.div>
        </div>
      </div>
    </motion.nav>
  );
}
