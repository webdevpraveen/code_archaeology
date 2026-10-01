/**
 * Repository Provider - Context for repository data
 */
'use client';

import { createContext, ReactNode, useEffect, useState } from 'react';
import { Repository, RepositoryStats, RepositoryContextType, IndexStatus } from '@/types/repository';

export const RepositoryContext = createContext<RepositoryContextType | undefined>(undefined);

interface RepositoryProviderProps {
  children: ReactNode;
  repositoryId: string;
}

export function RepositoryProvider({ children, repositoryId }: RepositoryProviderProps) {
  const [repository, setRepository] = useState<Repository | null>(null);
  const [stats, setStats] = useState<RepositoryStats | null>(null);
  const [indexStatus, setIndexStatus] = useState<IndexStatus>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshRepository = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate fetching repository data
      // In production, this would call your API
      const mockRepository: Repository = {
        id: repositoryId,
        name: 'turbo-sniffle',
        owner: 'webdevpraveen',
        description: 'A code archaeology tool for understanding repository history',
        url: `https://github.com/webdevpraveen/turbo-sniffle`,
        stars: 0,
        forks: 0,
        language: 'TypeScript',
        topics: ['archaeology', 'repository', 'analysis'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastIndexedAt: new Date().toISOString(),
      };

      const mockStats: RepositoryStats = {
        commits: 0,
        pullRequests: 0,
        issues: 0,
        branches: 1,
        tags: 0,
      };

      setRepository(mockRepository);
      setStats(mockStats);
      setIndexStatus('indexed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load repository');
      setIndexStatus('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshRepository();
  }, [repositoryId]);

  const value: RepositoryContextType = {
    repository,
    stats,
    indexStatus,
    loading,
    error,
    refreshRepository,
  };

  return (
    <RepositoryContext.Provider value={value}>
      {children}
    </RepositoryContext.Provider>
  );
}
