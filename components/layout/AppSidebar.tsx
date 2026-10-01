/**
 * App Sidebar Component
 * Left navigation with menu items
 */
'use client';

import { motion } from 'framer-motion';
import { useNavigation } from '@/hooks';
import {
  BarChart3,
  Zap,
  GitBranch,
  GitCommit,
  PullRequest,
  AlertCircle,
  FileText,
  Users,
  GitGraph,
  Eye,
} from 'lucide-react';

const navigationItems = [
  { id: 'overview', label: 'Overview', icon: Eye },
  { id: 'timeline', label: 'Timeline', icon: Zap },
  { id: 'graph', label: 'Graph', icon: GitGraph },
  { id: 'commits', label: 'Commits', icon: GitCommit },
  { id: 'pull-requests', label: 'Pull Requests', icon: PullRequest },
  { id: 'issues', label: 'Issues', icon: AlertCircle },
  { id: 'files', label: 'Files', icon: FileText },
  { id: 'people', label: 'People', icon: Users },
  { id: 'architecture', label: 'Architecture', icon: GitBranch },
];

interface AppSidebarProps {
  isCollapsed?: boolean;
}

export function AppSidebar({ isCollapsed = false }: AppSidebarProps) {
  const { currentPage, navigate } = useNavigation();

  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`fixed left-0 top-16 bottom-0 bg-slate-950 border-r border-slate-800 z-30 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-56'
      }`}
    >
      <nav className="h-full overflow-y-auto p-4 space-y-2">
        {navigationItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-amber-400/20 text-amber-400 border-l-2 border-amber-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              {isActive && !isCollapsed && (
                <motion.div
                  layoutId="activeIndicator"
                  className="ml-auto w-2 h-2 bg-amber-400 rounded-full"
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-0 left-0 right-0 border-t border-slate-800 bg-slate-900/50 p-4"
      >
        <div className="text-xs text-slate-500">
          {!isCollapsed && <p className="truncate">v1.0.0</p>}
        </div>
      </motion.div>
    </motion.aside>
  );
}
