/**
 * TypeScript type definitions and interfaces for GitHub API responses
 */

export interface Repository {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  homepage: string | null;
  isPrivate: boolean;
  isFork: boolean;
  createdAt: string;
  updatedAt: string;
  pushedAt: string | null;
  size: number;
  stargazersCount: number;
  watchersCount: number;
  language: string | null;
  forksCount: number;
  openIssuesCount: number;
  defaultBranch: string;
  topics: string[];
  license: {
    key: string;
    name: string;
    spdxId: string;
  } | null;
}

export interface LanguageStats {
  [language: string]: number;
}

export interface Contributor {
  login: string;
  id: number;
  avatarUrl: string;
  url: string;
  contributions: number;
  type: 'User' | 'Bot';
}

export interface Branch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

export interface Release {
  id: number;
  tagName: string;
  name: string | null;
  body: string | null;
  draft: boolean;
  prerelease: boolean;
  createdAt: string;
  publishedAt: string | null;
  author: {
    login: string;
    avatarUrl: string;
  };
  url: string;
}

export interface Tag {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  zipballUrl: string;
  tarballUrl: string;
}

export interface Commit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  committer: {
    name: string;
    email: string;
    date: string;
  };
  url: string;
  htmlUrl: string;
  parentShas: string[];
  commentCount: number;
}

export interface CommitDetails extends Commit {
  files: CommitFile[];
  stats: {
    total: number;
    additions: number;
    deletions: number;
  };
}

export interface CommitFile {
  filename: string;
  status: 'added' | 'removed' | 'modified' | 'renamed' | 'copied' | 'changed' | 'unchanged';
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  previousFilename?: string;
}

export interface BlameRange {
  startLine: number;
  endLine: number;
  commit: Commit;
}

export interface PullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  merged: boolean;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  mergedAt: string | null;
  user: {
    login: string;
    avatarUrl: string;
  };
  head: {
    ref: string;
    sha: string;
    repo: {
      name: string;
      fullName: string;
    } | null;
  };
  base: {
    ref: string;
    sha: string;
    repo: {
      name: string;
      fullName: string;
    };
  };
  url: string;
  htmlUrl: string;
  commitsUrl: string;
  reviewsUrl: string;
  commentsUrl: string;
  statusesUrl: string;
  changedFiles: number;
  additions: number;
  deletions: number;
  commits: number;
  mergeable: boolean | null;
  rebaseable: boolean;
  mergeableState: string;
  mergedBy: {
    login: string;
    avatarUrl: string;
  } | null;
}

export interface PullRequestReview {
  id: number;
  user: {
    login: string;
    avatarUrl: string;
  };
  body: string | null;
  state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'PENDING' | 'DISMISSED';
  submittedAt: string;
  commitId: string;
  url: string;
  htmlUrl: string;
}

export interface ReviewComment {
  id: number;
  user: {
    login: string;
    avatarUrl: string;
  };
  body: string;
  path: string;
  line: number | null;
  side: 'LEFT' | 'RIGHT';
  diffHunk: string;
  createdAt: string;
  updatedAt: string;
  url: string;
  htmlUrl: string;
}

export interface Issue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  user: {
    login: string;
    avatarUrl: string;
  };
  labels: string[];
  assignees: Array<{
    login: string;
    avatarUrl: string;
  }>;
  milestone: {
    title: string;
    number: number;
  } | null;
  comments: number;
  url: string;
  htmlUrl: string;
}

export interface IssueComment {
  id: number;
  user: {
    login: string;
    avatarUrl: string;
  };
  body: string;
  createdAt: string;
  updatedAt: string;
  url: string;
  htmlUrl: string;
}

export interface TimelineEvent {
  id: number;
  type:
    | 'commented'
    | 'committed'
    | 'cross_referenced'
    | 'labeled'
    | 'unlabeled'
    | 'assigned'
    | 'unassigned'
    | 'milestoned'
    | 'demilestoned'
    | 'mentioned'
    | 'subscribed'
    | 'unsubscribed'
    | 'closed'
    | 'reopened'
    | 'referenced'
    | 'renamed'
    | 'locked'
    | 'unlocked'
    | 'marked_as_duplicate'
    | 'unmarked_as_duplicate'
    | 'converted_note_to_issue';
  actor: {
    login: string;
    avatarUrl: string;
  } | null;
  createdAt: string;
  event: unknown;
}

export interface FileContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: 'file' | 'dir' | 'symlink' | 'submodule';
  downloadUrl: string | null;
  url: string;
  htmlUrl: string;
  gitUrl: string;
  content?: string;
  encoding?: string;
  target?: string; // for symlinks
}

export interface CommitComparison {
  baseCommit: Commit;
  mergeBaseCommit: Commit;
  commits: Commit[];
  files: CommitFile[];
  aheadBy: number;
  behindBy: number;
  status: 'identical' | 'behind' | 'ahead' | 'diverged';
  totalCommits: number;
  url: string;
  htmlUrl: string;
  statusUrl: string;
}

export interface PaginationOptions {
  page?: number;
  perPage?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    perPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    pageCount?: number;
  };
}

export interface GitHubAPIError extends Error {
  status: number;
  statusText: string;
  response?: unknown;
}

export interface ClientOptions {
  auth: string;
  baseUrl?: string;
  timeout?: number;
}
