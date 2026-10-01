/**
 * Repository context types
 */

export interface Repository {
  id: string;
  provider: string;
  owner: string;
  name: string;
  fullName: string;
  htmlUrl: string;
  description?: string;
  defaultBranch: string;
  visibility: 'public' | 'private';
  language?: string;
  stars: number;
  forks: number;
  openIssuesCount: number;
  createdAt: Date;
  updatedAt: Date;
  pushedAt?: Date;
  indexedAt?: Date;
  indexingStatus: string;
}

export enum IndexingStatus {
  PENDING = 'PENDING',
  DISCOVERING = 'DISCOVERING',
  COLLECTING = 'COLLECTING',
  CONNECTING = 'CONNECTING',
  INTERPRETING = 'INTERPRETING',
  READY = 'READY',
  FAILED = 'FAILED',
}

export interface IndexingProgress {
  status: IndexingStatus;
  progress: number; // 0-100
  message: string;
  stage: string;
  estimatedTimeRemaining?: number; // milliseconds
  error?: string;
}

export interface RepositoryStats {
  commits: number;
  pullRequests: number;
  issues: number;
  contributors: number;
  releases: number;
  languages: Record<string, number>;
  oldestCommit?: Date;
  newestCommit?: Date;
}

export interface EntitySelection {
  type: 'commit' | 'pr' | 'issue' | 'file' | 'contributor' | 'release' | null;
  id: string | null;
  name?: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  disabled?: boolean;
}

// Navigation items for app sidebar
export const NAVIGATION_ITEMS: NavigationItem[] = [
  { id: 'overview', label: 'Overview', icon: 'layout-grid', href: 'overview' },
  { id: 'timeline', label: 'Timeline', icon: 'timeline', href: 'timeline' },
  { id: 'graph', label: 'Graph', icon: 'share-2', href: 'graph' },
  { id: 'commits', label: 'Commits', icon: 'git-commit', href: 'commits' },
  { id: 'pulls', label: 'Pull Requests', icon: 'git-pull-request', href: 'pulls' },
  { id: 'issues', label: 'Issues', icon: 'alert-circle', href: 'issues' },
  { id: 'files', label: 'Files', icon: 'file', href: 'files' },
  { id: 'people', label: 'People', icon: 'users', href: 'people' },
  { id: 'architecture', label: 'Architecture', icon: 'layers', href: 'architecture' },
];
