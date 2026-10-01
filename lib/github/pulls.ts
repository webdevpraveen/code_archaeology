/**
 * Pull Request-related GitHub API service functions
 * Handles pull request retrieval, details, commits, changes, reviews, and comments
 */

import { gitHubClient, handleGitHubError } from './client';
import {
  PullRequest,
  PullRequestReview,
  ReviewComment,
  CommitFile,
  PaginationOptions,
  PaginatedResponse,
  GitHubAPIError,
  Commit,
} from './types';

/**
 * Get pull requests from a repository with pagination support
 * @param owner - Repository owner username
 * @param repo - Repository name
 * @param options - Pagination options (page, perPage)
 * @param state - Filter by state: 'open', 'closed', or 'all'
 * @returns Paginated list of pull requests
 * @throws {GitHubAPIError} If pull requests cannot be retrieved
 */
export async function getPullRequests(
  owner: string,
  repo: string,
  options: PaginationOptions = {},
  state: 'open' | 'closed' | 'all' = 'open'
): Promise<PaginatedResponse<PullRequest>> {
  try {
    const client = gitHubClient.getClient();
    const page = options.page || 1;
    const perPage = Math.min(options.perPage || 30, 100);

    const response = await client.rest.pulls.list({
      owner,
      repo,
      state,
      page,
      per_page: perPage,
    });

    const linkHeader = response.headers.link || '';
    const hasNextPage = linkHeader.includes('rel="next"');
    const hasPreviousPage = page > 1;

    return {
      data: response.data.map((pr) => ({
        id: pr.id,
        number: pr.number,
        title: pr.title,
        body: pr.body,
        state: pr.state as 'open' | 'closed',
        merged: pr.merged || false,
        createdAt: pr.created_at,
        updatedAt: pr.updated_at,
        closedAt: pr.closed_at,
        mergedAt: pr.merged_at,
        user: {
          login: pr.user.login,
          avatarUrl: pr.user.avatar_url,
        },
        head: {
          ref: pr.head.ref,
          sha: pr.head.sha,
          repo: pr.head.repo
            ? {
                name: pr.head.repo.name,
                fullName: pr.head.repo.full_name,
              }
            : null,
        },
        base: {
          ref: pr.base.ref,
          sha: pr.base.sha,
          repo: {
            name: pr.base.repo.name,
            fullName: pr.base.repo.full_name,
          },
        },
        url: pr.url,
        htmlUrl: pr.html_url,
        commitsUrl: pr.commits_url,
        reviewsUrl: pr.review_comments_url,
        commentsUrl: pr.comments_url,
        statusesUrl: pr.statuses_url,
        changedFiles: pr.changed_files,
        additions: pr.additions,
        deletions: pr.deletions,
        commits: pr.commits,
        mergeable: pr.mergeable,
        rebaseable: pr.rebaseable,
        mergeableState: pr.mergeable_state,
        mergedBy: pr.merged_by
          ? {
              login: pr.merged_by.login,
              avatarUrl: pr.merged_by.avatar_url,
            }
          : null,
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
 * Get detailed information about a specific pull request
 * @param owner - Repository owner username
 * @param repo - Repository name
 * @param pullNumber - Pull request number
 * @returns Detailed pull request information
 * @throws {GitHubAPIError} If pull request details cannot be retrieved
 */
export async function getPullRequestDetails(
  owner: string,
  repo: string,
  pullNumber: number
): Promise<PullRequest> {
  try {
    const client = gitHubClient.getClient();
    const response = await client.rest.pulls.get({
      owner,
      repo,
      pull_number: pullNumber,
    });

    const pr = response.data;

    return {
      id: pr.id,
      number: pr.number,
      title: pr.title,
      body: pr.body,
      state: pr.state as 'open' | 'closed',
      merged: pr.merged || false,
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
      closedAt: pr.closed_at,
      mergedAt: pr.merged_at,
      user: {
        login: pr.user.login,
        avatarUrl: pr.user.avatar_url,
      },
      head: {
        ref: pr.head.ref,
        sha: pr.head.sha,
        repo: pr.head.repo
          ? {
              name: pr.head.repo.name,
              fullName: pr.head.repo.full_name,
            }
          : null,
      },
      base: {
        ref: pr.base.ref,
        sha: pr.base.sha,
        repo: {
          name: pr.base.repo.name,
          fullName: pr.base.repo.full_name,
        },
      },
      url: pr.url,
      htmlUrl: pr.html_url,
      commitsUrl: pr.commits_url,
      reviewsUrl: pr.review_comments_url,
      commentsUrl: pr.comments_url,
      statusesUrl: pr.statuses_url,
      changedFiles: pr.changed_files,
      additions: pr.additions,
      deletions: pr.deletions,
      commits: pr.commits,
      mergeable: pr.mergeable,
      rebaseable: pr.rebaseable,
      mergeableState: pr.mergeable_state,
      mergedBy: pr.merged_by
        ? {
            login: pr.merged_by.login,
            avatarUrl: pr.merged_by.avatar_url,
          }
        : null,
    };
  } catch (error) {
    throw handleGitHubError(error);
  }
}

/**
 * Get commits in a pull request with pagination support
 * @param owner - Repository owner username
 * @param repo - Repository name
 * @param pullNumber - Pull request number
 * @param options - Pagination options (page, perPage)
 * @returns Paginated list of commits
 * @throws {GitHubAPIError} If commits cannot be retrieved
 */
export async function getPullRequestCommits(
  owner: string,
  repo: string,
  pullNumber: number,
  options: PaginationOptions = {}
): Promise<PaginatedResponse<Commit>> {
  try {
    const client = gitHubClient.getClient();
    const page = options.page || 1;
    const perPage = Math.min(options.perPage || 30, 100);

    const response = await client.rest.pulls.listCommits({
      owner,
      repo,
      pull_number: pullNumber,
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
 * Get files changed in a pull request with pagination support
 * @param owner - Repository owner username
 * @param repo - Repository name
 * @param pullNumber - Pull request number
 * @param options - Pagination options (page, perPage)
 * @returns Paginated list of changed files
 * @throws {GitHubAPIError} If changed files cannot be retrieved
 */
export async function getPullRequestChangedFiles(
  owner: string,
  repo: string,
  pullNumber: number,
  options: PaginationOptions = {}
): Promise<PaginatedResponse<CommitFile>> {
  try {
    const client = gitHubClient.getClient();
    const page = options.page || 1;
    const perPage = Math.min(options.perPage || 30, 100);

    const response = await client.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: pullNumber,
      page,
      per_page: perPage,
    });

    const linkHeader = response.headers.link || '';
    const hasNextPage = linkHeader.includes('rel="next"');
    const hasPreviousPage = page > 1;

    return {
      data: response.data.map((file) => ({
        filename: file.filename,
        status: file.status as CommitFile['status'],
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patch: file.patch,
        previousFilename: file.previous_filename,
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
 * Get reviews for a pull request with pagination support
 * @param owner - Repository owner username
 * @param repo - Repository name
 * @param pullNumber - Pull request number
 * @param options - Pagination options (page, perPage)
 * @returns Paginated list of reviews
 * @throws {GitHubAPIError} If reviews cannot be retrieved
 */
export async function getPullRequestReviews(
  owner: string,
  repo: string,
  pullNumber: number,
  options: PaginationOptions = {}
): Promise<PaginatedResponse<PullRequestReview>> {
  try {
    const client = gitHubClient.getClient();
    const page = options.page || 1;
    const perPage = Math.min(options.perPage || 30, 100);

    const response = await client.rest.pulls.listReviews({
      owner,
      repo,
      pull_number: pullNumber,
      page,
      per_page: perPage,
    });

    const linkHeader = response.headers.link || '';
    const hasNextPage = linkHeader.includes('rel="next"');
    const hasPreviousPage = page > 1;

    return {
      data: response.data.map((review) => ({
        id: review.id,
        user: {
          login: review.user.login,
          avatarUrl: review.user.avatar_url,
        },
        body: review.body,
        state: review.state as PullRequestReview['state'],
        submittedAt: review.submitted_at || new Date().toISOString(),
        commitId: review.commit_id,
        url: review.url,
        htmlUrl: review.html_url,
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
 * Get review comments on a pull request with pagination support
 * @param owner - Repository owner username
 * @param repo - Repository name
 * @param pullNumber - Pull request number
 * @param options - Pagination options (page, perPage)
 * @returns Paginated list of review comments
 * @throws {GitHubAPIError} If comments cannot be retrieved
 */
export async function getPullRequestComments(
  owner: string,
  repo: string,
  pullNumber: number,
  options: PaginationOptions = {}
): Promise<PaginatedResponse<ReviewComment>> {
  try {
    const client = gitHubClient.getClient();
    const page = options.page || 1;
    const perPage = Math.min(options.perPage || 30, 100);

    const response = await client.rest.pulls.listReviewComments({
      owner,
      repo,
      pull_number: pullNumber,
      page,
      per_page: perPage,
    });

    const linkHeader = response.headers.link || '';
    const hasNextPage = linkHeader.includes('rel="next"');
    const hasPreviousPage = page > 1;

    return {
      data: response.data.map((comment) => ({
        id: comment.id,
        user: {
          login: comment.user.login,
          avatarUrl: comment.user.avatar_url,
        },
        body: comment.body,
        path: comment.path,
        line: comment.line,
        side: (comment.side || 'RIGHT') as 'LEFT' | 'RIGHT',
        diffHunk: comment.diff_hunk,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
        url: comment.url,
        htmlUrl: comment.html_url,
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
