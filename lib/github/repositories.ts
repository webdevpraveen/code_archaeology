/**
 * Repository-related GitHub API service functions
 * Handles repository metadata, languages, branches, releases, and tags
 */

import { gitHubClient, handleGitHubError } from './client';
import {
  Repository,
  LanguageStats,
  Contributor,
  Branch,
  Release,
  Tag,
  PaginationOptions,
  PaginatedResponse,
  GitHubAPIError,
} from './types';

/**
 * Get repository metadata
 * @param owner - Repository owner username
 * @param repo - Repository name
 * @returns Repository metadata
 * @throws {GitHubAPIError} If the repository cannot be accessed
 */
export async function getRepositoryMetadata(owner: string, repo: string): Promise<Repository> {
  try {
    const client = gitHubClient.getClient();
    const response = await client.rest.repos.get({ owner, repo });

    return {
      id: response.data.id,
      name: response.data.name,
      fullName: response.data.full_name,
      description: response.data.description,
      url: response.data.url,
      homepage: response.data.homepage,
      isPrivate: response.data.private,
      isFork: response.data.fork,
      createdAt: response.data.created_at,
      updatedAt: response.data.updated_at,
      pushedAt: response.data.pushed_at,
      size: response.data.size,
      stargazersCount: response.data.stargazers_count,
      watchersCount: response.data.watchers_count,
      language: response.data.language,
      forksCount: response.data.forks_count,
      openIssuesCount: response.data.open_issues_count,
      defaultBranch: response.data.default_branch,
      topics: response.data.topics || [],
      license: response.data.license
        ? {
            key: response.data.license.key,
            name: response.data.license.name,
            spdxId: response.data.license.spdx_id,
          }
        : null,
    };
  } catch (error) {
    throw handleGitHubError(error);
  }
}

/**
 * Get programming language statistics for a repository
 * @param owner - Repository owner username
 * @param repo - Repository name
 * @returns Language distribution statistics
 * @throws {GitHubAPIError} If languages cannot be retrieved
 */
export async function getLanguages(owner: string, repo: string): Promise<LanguageStats> {
  try {
    const client = gitHubClient.getClient();
    const response = await client.rest.repos.listLanguages({ owner, repo });
    return response.data as LanguageStats;
  } catch (error) {
    throw handleGitHubError(error);
  }
}

/**
 * Get the default branch of a repository
 * @param owner - Repository owner username
 * @param repo - Repository name
 * @returns Default branch name
 * @throws {GitHubAPIError} If branch cannot be retrieved
 */
export async function getDefaultBranch(owner: string, repo: string): Promise<string> {
  try {
    const response = await getRepositoryMetadata(owner, repo);
    return response.defaultBranch;
  } catch (error) {
    throw handleGitHubError(error);
  }
}

/**
 * Get repository contributors with pagination support
 * @param owner - Repository owner username
 * @param repo - Repository name
 * @param options - Pagination options (page, perPage)
 * @returns Paginated list of contributors
 * @throws {GitHubAPIError} If contributors cannot be retrieved
 */
export async function getContributors(
  owner: string,
  repo: string,
  options: PaginationOptions = {}
): Promise<PaginatedResponse<Contributor>> {
  try {
    const client = gitHubClient.getClient();
    const page = options.page || 1;
    const perPage = Math.min(options.perPage || 30, 100);

    const response = await client.rest.repos.listContributors({
      owner,
      repo,
      page,
      per_page: perPage,
    });

    const linkHeader = response.headers.link || '';
    const hasNextPage = linkHeader.includes('rel="next"');
    const hasPreviousPage = page > 1;

    return {
      data: response.data.map((contributor) => ({
        login: contributor.login,
        id: contributor.id,
        avatarUrl: contributor.avatar_url,
        url: contributor.url,
        contributions: contributor.contributions,
        type: contributor.type as 'User' | 'Bot',
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
 * Get all branches of a repository with pagination support
 * @param owner - Repository owner username
 * @param repo - Repository name
 * @param options - Pagination options (page, perPage)
 * @returns Paginated list of branches
 * @throws {GitHubAPIError} If branches cannot be retrieved
 */
export async function getBranches(
  owner: string,
  repo: string,
  options: PaginationOptions = {}
): Promise<PaginatedResponse<Branch>> {
  try {
    const client = gitHubClient.getClient();
    const page = options.page || 1;
    const perPage = Math.min(options.perPage || 30, 100);

    const response = await client.rest.repos.listBranches({
      owner,
      repo,
      page,
      per_page: perPage,
    });

    const linkHeader = response.headers.link || '';
    const hasNextPage = linkHeader.includes('rel="next"');
    const hasPreviousPage = page > 1;

    return {
      data: response.data.map((branch) => ({
        name: branch.name,
        commit: {
          sha: branch.commit.sha,
          url: branch.commit.url,
        },
        protected: branch.protected,
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
 * Get all releases of a repository with pagination support
 * @param owner - Repository owner username
 * @param repo - Repository name
 * @param options - Pagination options (page, perPage)
 * @returns Paginated list of releases
 * @throws {GitHubAPIError} If releases cannot be retrieved
 */
export async function getReleases(
  owner: string,
  repo: string,
  options: PaginationOptions = {}
): Promise<PaginatedResponse<Release>> {
  try {
    const client = gitHubClient.getClient();
    const page = options.page || 1;
    const perPage = Math.min(options.perPage || 30, 100);

    const response = await client.rest.repos.listReleases({
      owner,
      repo,
      page,
      per_page: perPage,
    });

    const linkHeader = response.headers.link || '';
    const hasNextPage = linkHeader.includes('rel="next"');
    const hasPreviousPage = page > 1;

    return {
      data: response.data.map((release) => ({
        id: release.id,
        tagName: release.tag_name,
        name: release.name,
        body: release.body,
        draft: release.draft,
        prerelease: release.prerelease,
        createdAt: release.created_at,
        publishedAt: release.published_at,
        author: {
          login: release.author.login,
          avatarUrl: release.author.avatar_url,
        },
        url: release.url,
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
 * Get all tags of a repository with pagination support
 * @param owner - Repository owner username
 * @param repo - Repository name
 * @param options - Pagination options (page, perPage)
 * @returns Paginated list of tags
 * @throws {GitHubAPIError} If tags cannot be retrieved
 */
export async function getTags(
  owner: string,
  repo: string,
  options: PaginationOptions = {}
): Promise<PaginatedResponse<Tag>> {
  try {
    const client = gitHubClient.getClient();
    const page = options.page || 1;
    const perPage = Math.min(options.perPage || 30, 100);

    const response = await client.rest.repos.listTags({
      owner,
      repo,
      page,
      per_page: perPage,
    });

    const linkHeader = response.headers.link || '';
    const hasNextPage = linkHeader.includes('rel="next"');
    const hasPreviousPage = page > 1;

    return {
      data: response.data.map((tag) => ({
        name: tag.name,
        commit: {
          sha: tag.commit.sha,
          url: tag.commit.url,
        },
        zipballUrl: tag.zipball_url,
        tarballUrl: tag.tarball_url,
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
