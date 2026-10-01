/**
 * Repository types and contexts
 */

export interface Repository {
  id: string;
  name: string;
  owner: string;
  description: string;
  url: string;
  stars: number;
  forks: number;
  language: string;
  topics: string[];
  createdAt: string;
  updatedAt: string;
  lastIndexedAt: string;
}

export interface RepositoryStats {
  commits: number;
  pullRequests: number;
  issues: number;
  branches: number;
  tags: number;
}

export type IndexStatus = 'indexed' | 'indexing' | 'pending' | 'error';

export interface RepositoryContextType {
  repository: Repository | null;
  stats: RepositoryStats | null;
  indexStatus: IndexStatus;
  loading: boolean;
  error: string | null;
  refreshRepository: () => Promise<void>;
}

export type NavigationItem = 
  | 'overview'
  | 'timeline'
  | 'graph'
  | 'commits'
  | 'pull-requests'
  | 'issues'
  | 'files'
  | 'people'
  | 'architecture';

export interface NavigationMenu {
  id: NavigationItem;
  label: string;
  icon: string;
  href?: string;
}

export type EntityType = 'commit' | 'pull-request' | 'issue' | 'file' | 'person' | 'none';

export interface Entity {
  type: EntityType;
  id: string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface EntitySelection {
  entity: Entity | null;
  isOpen: boolean;
}

export interface GitHubAPIStatus {
  isAvailable: boolean;
  rateLimitRemaining: number;
  rateLimitReset: number;
}
