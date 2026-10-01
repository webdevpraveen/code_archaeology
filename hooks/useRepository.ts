/**
 * Repository context hook
 */
'use client';

import { useContext } from 'react';
import { RepositoryContext } from '@/components/layout/RepositoryProvider';
import { RepositoryContextType } from '@/types/repository';

export function useRepository(): RepositoryContextType {
  const context = useContext(RepositoryContext);
  if (!context) {
    throw new Error('useRepository must be used within RepositoryProvider');
  }
  return context;
}
