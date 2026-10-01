import { useContext, createContext, ReactNode } from 'react';

export interface RepositoryContextType {
  repositoryId: string;
  repositoryName: string;
  isLoading: boolean;
  selectedEntity: { type: string | null; id: string | null } | null;
  setSelectedEntity: (entity: any) => void;
}

export const RepositoryContext = createContext<RepositoryContextType | undefined>(undefined);

export function useRepository(): RepositoryContextType {
  const context = useContext(RepositoryContext);
  if (!context) {
    throw new Error('useRepository must be used within RepositoryProvider');
  }
  return context;
}
