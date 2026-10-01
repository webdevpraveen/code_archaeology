/**
 * Navigation tracking hook
 */
'use client';

import { useState, useCallback } from 'react';
import { NavigationItem } from '@/types/repository';

export function useNavigation() {
  const [currentPage, setCurrentPage] = useState<NavigationItem>('overview');

  const navigate = useCallback((page: NavigationItem) => {
    setCurrentPage(page);
  }, []);

  return { currentPage, navigate };
}
