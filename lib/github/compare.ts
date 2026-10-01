/**
 * Comparison-related GitHub API service functions
 * Handles comparisons between commits and refs
 */

import { gitHubClient, handleGitHubError } from './client';
import { CommitComparison, Commit, CommitFile, GitHubAPIError } from './types';

/**
 * Compare two commits
 * @param owner - Repository owner username
 * @param repo - Repository name
 * @param base - Base commit SHA or ref
 * @param head - Head commit SHA or ref
 * @returns Comparison details including commits and changed files
 * @throws {GitHubAPIError} If commits cannot be compared
 */
export async function compareCommits(
  owner: string,
  repo: string,
  base: string,
  head: string
): Promise<CommitComparison> {
  try {
    const client = gitHubClient.getClient();

    // Using the compareCommitsWithBasehead endpoint
    const response = await client.rest.repos.compareCommitsWithBasehead({
      owner,
      repo,
      basehead: `${base}...${head}`,
    });

    const data = response.data;

    return {
      baseCommit: {
        sha: data.merge_base_commit.sha,
        message: data.merge_base_commit.commit.message,
        author: {
          name: data.merge_base_commit.commit.author?.name || 'Unknown',
          email: data.merge_base_commit.commit.author?.email || 'unknown@example.com',
          date: data.merge_base_commit.commit.author?.date || new Date().toISOString(),
        },
        committer: {
          name: data.merge_base_commit.commit.committer?.name || 'Unknown',
          email: data.merge_base_commit.commit.committer?.email || 'unknown@example.com',
          date: data.merge_base_commit.commit.committer?.date || new Date().toISOString(),
        },
        url: data.merge_base_commit.url,
        htmlUrl: data.merge_base_commit.html_url,
        parentShas: data.merge_base_commit.parents?.map((p) => p.sha) || [],
        commentCount: data.merge_base_commit.commit.comment_count,
      },
      mergeBaseCommit: {
        sha: data.merge_base_commit.sha,
        message: data.merge_base_commit.commit.message,
        author: {
          name: data.merge_base_commit.commit.author?.name || 'Unknown',
          email: data.merge_base_commit.commit.author?.email || 'unknown@example.com',
          date: data.merge_base_commit.commit.author?.date || new Date().toISOString(),
        },
        committer: {
          name: data.merge_base_commit.commit.committer?.name || 'Unknown',
          email: data.merge_base_commit.commit.committer?.email || 'unknown@example.com',
          date: data.merge_base_commit.commit.committer?.date || new Date().toISOString(),
        },
        url: data.merge_base_commit.url,
        htmlUrl: data.merge_base_commit.html_url,
        parentShas: data.merge_base_commit.parents?.map((p) => p.sha) || [],
        commentCount: data.merge_base_commit.commit.comment_count,
      },
      commits: (data.commits || []).map((commit) => ({
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
      files: (data.files || []).map((file) => ({
        filename: file.filename,
        status: file.status as CommitFile['status'],
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patch: file.patch,
        previousFilename: file.previous_filename,
      })),
      aheadBy: data.ahead_by,
      behindBy: data.behind_by,
      status: data.status as CommitComparison['status'],
      totalCommits: data.total_commits,
      url: data.url,
      htmlUrl: data.html_url,
      statusUrl: data.status_url,
    };
  } catch (error) {
    throw handleGitHubError(error);
  }
}

/**
 * Compare two refs (branches, tags, or commits)
 * Alias for compareCommits with more descriptive name
 * @param owner - Repository owner username
 * @param repo - Repository name
 * @param baseRef - Base ref (branch, tag, or commit SHA)
 * @param headRef - Head ref (branch, tag, or commit SHA)
 * @returns Comparison details
 * @throws {GitHubAPIError} If refs cannot be compared
 */
export async function compareRefs(
  owner: string,
  repo: string,
  baseRef: string,
  headRef: string
): Promise<CommitComparison> {
  return compareCommits(owner, repo, baseRef, headRef);
}

/**
 * Get the merge base commit between two refs
 * @param owner - Repository owner username
 * @param repo - Repository name
 * @param base - Base ref
 * @param head - Head ref
 * @returns Merge base commit information
 * @throws {GitHubAPIError} If merge base cannot be determined
 */
export async function getMergeBase(
  owner: string,
  repo: string,
  base: string,
  head: string
): Promise<Commit> {
  try {
    const comparison = await compareCommits(owner, repo, base, head);
    return comparison.mergeBaseCommit;
  } catch (error) {
    throw handleGitHubError(error);
  }
}

/**
 * Check if refs are diverged (both have commits the other doesn't)
 * @param owner - Repository owner username
 * @param repo - Repository name
 * @param base - Base ref
 * @param head - Head ref
 * @returns True if refs are diverged
 * @throws {GitHubAPIError} If comparison fails
 */
export async function isRefsDiverged(
  owner: string,
  repo: string,
  base: string,
  head: string
): Promise<boolean> {
  try {
    const comparison = await compareCommits(owner, repo, base, head);
    return comparison.status === 'diverged';
  } catch (error) {
    throw handleGitHubError(error);
  }
}

/**
 * Check if head is ahead of base
 * @param owner - Repository owner username
 * @param repo - Repository name
 * @param base - Base ref
 * @param head - Head ref
 * @returns True if head is ahead
 * @throws {GitHubAPIError} If comparison fails
 */
export async function isHeadAhead(
  owner: string,
  repo: string,
  base: string,
  head: string
): Promise<boolean> {
  try {
    const comparison = await compareCommits(owner, repo, base, head);
    return comparison.status === 'ahead' && comparison.aheadBy > 0;
  } catch (error) {
    throw handleGitHubError(error);
  }
}

/**
 * Check if head is behind base
 * @param owner - Repository owner username
 * @param repo - Repository name
 * @param base - Base ref
 * @param head - Head ref
 * @returns True if head is behind
 * @throws {GitHubAPIError} If comparison fails
 */
export async function isHeadBehind(
  owner: string,
  repo: string,
  base: string,
  head: string
): Promise<boolean> {
  try {
    const comparison = await compareCommits(owner, repo, base, head);
    return comparison.status === 'behind' && comparison.behindBy > 0;
  } catch (error) {
    throw handleGitHubError(error);
  }
}

/**
 * Get count of commits ahead and behind
 * @param owner - Repository owner username
 * @param repo - Repository name
 * @param base - Base ref
 * @param head - Head ref
 * @returns Object with aheadBy and behindBy counts
 * @throws {GitHubAPIError} If comparison fails
 */
export async function getCommitCounts(
  owner: string,
  repo: string,
  base: string,
  head: string
): Promise<{ aheadBy: number; behindBy: number }> {
  try {
    const comparison = await compareCommits(owner, repo, base, head);
    return {
      aheadBy: comparison.aheadBy,
      behindBy: comparison.behindBy,
    };
  } catch (error) {
    throw handleGitHubError(error);
  }
}
