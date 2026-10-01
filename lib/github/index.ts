/**
 * GitHub API Service Library
 * Provides typed, easy-to-use service functions for interacting with the GitHub API
 *
 * Usage:
 * ```typescript
 * import { gitHubClient, getRepositoryMetadata, getCommits } from './lib/github';
 *
 * // Initialize client
 * gitHubClient.initialize({ auth: 'github_token' });
 *
 * // Use services
 * const repo = await getRepositoryMetadata('owner', 'repo');
 * const commits = await getCommits('owner', 'repo');
 * ```
 */

// Re-export client
export { gitHubClient, handleGitHubError } from './client';
export type { ClientOptions } from './types';

// Re-export repository functions
export {
  getRepositoryMetadata,
  getLanguages,
  getDefaultBranch,
  getContributors,
  getBranches,
  getReleases,
  getTags,
} from './repositories';

// Re-export commit functions
export {
  getCommits,
  getCommitDetails,
  getCommitFiles,
  getCommitBlame,
} from './commits';

// Re-export pull request functions
export {
  getPullRequests,
  getPullRequestDetails,
  getPullRequestCommits,
  getPullRequestChangedFiles,
  getPullRequestReviews,
  getPullRequestComments,
} from './pulls';

// Re-export issue functions
export {
  getIssues,
  getIssueDetails,
  getIssueComments,
  getIssueTimeline,
} from './issues';

// Re-export file functions
export {
  getRepositoryContents,
  getFileHistory,
  getFileContent,
  fileExists,
  listDirectory,
  listDirectoryRecursive,
} from './files';

// Re-export compare functions
export {
  compareCommits,
  compareRefs,
  getMergeBase,
  isRefsDiverged,
  isHeadAhead,
  isHeadBehind,
  getCommitCounts,
} from './compare';

// Re-export types
export type {
  Repository,
  LanguageStats,
  Contributor,
  Branch,
  Release,
  Tag,
  Commit,
  CommitDetails,
  CommitFile,
  BlameRange,
  PullRequest,
  PullRequestReview,
  ReviewComment,
  Issue,
  IssueComment,
  TimelineEvent,
  FileContent,
  CommitComparison,
  PaginationOptions,
  PaginatedResponse,
  GitHubAPIError,
} from './types';
