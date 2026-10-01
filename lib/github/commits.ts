/**
 * Commit-related GitHub API service functions
 * Handles commit retrieval, details, files, and blame information
 */

import { gitHubClient, handleGitHubError } from './client';
import {
  Commit,
  CommitDetails,
  CommitFile,
  BlameRange,
  PaginationOptions,
  PaginatedResponse,
  GitHubAPIError,
} from './types';

/**
 * Get commits from a repository with pagination support
 * @param owner - Repository owner username
 * @param repo - Repository name
 * @param options - Pagination options (page, perPage)
 * @param sha - Optional branch/tag/commit SHA
 * @returns Paginated list of commits
 * @throws {GitHubAPIError} If commits cannot be retrieved
 */
export async function getCommits(
  owner: string,
  repo: string,
  options: PaginationOptions = {},
  sha?: string
): Promise<PaginatedResponse<Commit>> {
  try {
    const client = gitHubClient.getClient();
    const page = options.page || 1;
    const perPage = Math.min(options.perPage || 30, 100);

    const response = await client.rest.repos.listCommits({
      owner,
      repo,
      sha,
      page,
      per_page: perPage,
    });

    const linkHeader = response.headers.link || '';
    const hasNextPage = linkHeader.includes('rel="next"');
    const hasPreviousPage = page > 1;

    return {
      data: response.data.map((commit) => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: {
          name: commit.commit.author?.name || 'Unknown',
          email: commit.commit.author?.email || 'unknown@example.com',
          date: commit.commit.author?.date || new Date().toISOString(),
        },
        committer: {
          name: commit.commit.committer?.name || 'Unknown',
          email: commit.commit.committer?.email || 'unknown@example.com',
          date: commit.commit.committer?.date || new Date().toISOString(),
        },
        url: commit.url,
        htmlUrl: commit.html_url,
        parentShas: commit.parents?.map((p) => p.sha) || [],
        commentCount: commit.commit.comment_count,
      })),
      pagination: {
        page,
        perPage,
        hasNextPage,
        hasPreviousPage,
      },
    };
  } catch (error) {
    throw handleGitHubError(error);
  }
}

/**
 * Get detailed information about a specific commit
 * @param owner - Repository owner username
 * @param repo - Repository name
 * @param ref - Commit SHA or branch/tag reference
 * @returns Detailed commit information with file changes
 * @throws {GitHubAPIError} If commit details cannot be retrieved
 */
export async function getCommitDetails(
  owner: string,
  repo: string,
  ref: string
): Promise<CommitDetails> {
  try {
    const client = gitHubClient.getClient();
    const response = await client.rest.repos.getCommit({
      owner,
      repo,
      ref,
    });

    const commitData = response.data;

    return {
      sha: commitData.sha,
      message: commitData.commit.message,
      author: {
        name: commitData.commit.author?.name || 'Unknown',
        email: commitData.commit.author?.email || 'unknown@example.com',
        date: commitData.commit.author?.date || new Date().toISOString(),
      },
      committer: {
        name: commitData.commit.committer?.name || 'Unknown',
        email: commitData.commit.committer?.email || 'unknown@example.com',
        date: commitData.commit.committer?.date || new Date().toISOString(),
      },
      url: commitData.url,
      htmlUrl: commitData.html_url,
      parentShas: commitData.parents?.map((p) => p.sha) || [],
      commentCount: commitData.commit.comment_count,
      files: (commitData.files || []).map((file) => ({
        filename: file.filename,
        status: file.status as CommitFile['status'],
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patch: file.patch,
        previousFilename: file.previous_filename,
      })),
      stats: {
        total: commitData.stats?.total || 0,
        additions: commitData.stats?.additions || 0,
        deletions: commitData.stats?.deletions || 0,
      },
    };
  } catch (error) {
    throw handleGitHubError(error);
  }
}

/**
 * Get files changed in a specific commit
 * @param owner - Repository owner username
 * @param repo - Repository name
 * @param ref - Commit SHA or branch/tag reference
 * @returns List of files changed in the commit
 * @throws {GitHubAPIError} If commit files cannot be retrieved
 */
export async function getCommitFiles(
  owner: string,
  repo: string,
  ref: string
): Promise<CommitFile[]> {
  try {
    const details = await getCommitDetails(owner, repo, ref);
    return details.files;
  } catch (error) {
    throw handleGitHubError(error);
  }
}

/**
 * Get blame information for a file (which commits changed each line)
 * @param owner - Repository owner username
 * @param repo - Repository name
 * @param path - File path in repository
 * @param options - Additional options (ref for specific branch/tag)
 * @returns List of blame ranges with associated commits
 * @throws {GitHubAPIError} If blame information cannot be retrieved
 */
export async function getCommitBlame(
  owner: string,
  repo: string,
  path: string,
  options: { ref?: string } = {}
): Promise<BlameRange[]> {
  try {
    const client = gitHubClient.getClient();

    const response = await client.rest.repos.getBlame({
      owner,
      repo,
      path,
      ref: options.ref,
    });

    return response.data.ranges.map((range) => ({
      startLine: range.start_line,
      endLine: range.end_line,
      commit: {
        sha: range.commit.sha,
        message: range.commit.message,
        author: {
          name: range.commit.author?.name || 'Unknown',
          email: range.commit.author?.email || 'unknown@example.com',
          date: range.commit.author?.date || new Date().toISOString(),
        },
        committer: {
          name: range.commit.committer?.name || 'Unknown',
          email: range.commit.committer?.email || 'unknown@example.com',
          date: range.commit.committer?.date || new Date().toISOString(),
        },
        url: range.commit.url,
        htmlUrl: range.commit.html_url,
        parentShas: range.commit.parents?.map((p) => p.sha) || [],
        commentCount: range.commit.comment_count,
      },
    }));
  } catch (error) {
    throw handleGitHubError(error);
  }
}
