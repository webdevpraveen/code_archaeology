/**
 * Selected entity tracking hook
 */
'use client';

import { useState, useCallback } from 'react';
import { Entity, EntitySelection } from '@/types/repository';

export function useSelectedEntity() {
  const [selection, setSelection] = useState<EntitySelection>({
    entity: null,
    isOpen: false,
  });

  const selectEntity = useCallback((entity: Entity) => {
    setSelection({ entity, isOpen: true });
  }, []);

  const deselectEntity = useCallback(() => {
    setSelection({ entity: null, isOpen: false });
  }, []);

  const toggleDrawer = useCallback((open?: boolean) => {
    setSelection((prev) => ({
      ...prev,
      isOpen: open !== undefined ? open : !prev.isOpen,
    }));
  }, []);

  return {
    ...selection,
    selectEntity,
    deselectEntity,
    toggleDrawer,
  };
}
