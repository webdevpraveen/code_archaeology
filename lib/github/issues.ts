/**
 * Issue-related GitHub API service functions
 * Handles issue retrieval, details, comments, and timeline events
 */

import { gitHubClient, handleGitHubError } from './client';
import {
  Issue,
  IssueComment,
  TimelineEvent,
  PaginationOptions,
  PaginatedResponse,
  GitHubAPIError,
} from './types';

/**
 * Get issues from a repository with pagination support
 * @param owner - Repository owner username
 * @param repo - Repository name
 * @param options - Pagination options (page, perPage)
 * @param state - Filter by state: 'open', 'closed', or 'all'
 * @returns Paginated list of issues
 * @throws {GitHubAPIError} If issues cannot be retrieved
 */
export async function getIssues(
  owner: string,
  repo: string,
  options: PaginationOptions = {},
  state: 'open' | 'closed' | 'all' = 'open'
): Promise<PaginatedResponse<Issue>> {
  try {
    const client = gitHubClient.getClient();
    const page = options.page || 1;
    const perPage = Math.min(options.perPage || 30, 100);

    const response = await client.rest.issues.listForRepo({
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
      data: response.data.map((issue) => ({
        id: issue.id,
        number: issue.number,
        title: issue.title,
        body: issue.body,
        state: issue.state as 'open' | 'closed',
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
        closedAt: issue.closed_at,
        user: {
          login: issue.user.login,
          avatarUrl: issue.user.avatar_url,
        },
        labels: issue.labels?.map((label) => (typeof label === 'string' ? label : label.name)) || [],
        assignees: (issue.assignees || []).map((assignee) => ({
          login: assignee.login,
          avatarUrl: assignee.avatar_url,
        })),
        milestone: issue.milestone
          ? {
              title: issue.milestone.title,
              number: issue.milestone.number,
            }
          : null,
        comments: issue.comments,
        url: issue.url,
        htmlUrl: issue.html_url,
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
 * Get detailed information about a specific issue
 * @param owner - Repository owner username
 * @param repo - Repository name
 * @param issueNumber - Issue number
 * @returns Detailed issue information
 * @throws {GitHubAPIError} If issue details cannot be retrieved
 */
export async function getIssueDetails(
  owner: string,
  repo: string,
  issueNumber: number
): Promise<Issue> {
  try {
    const client = gitHubClient.getClient();
    const response = await client.rest.issues.get({
      owner,
      repo,
      issue_number: issueNumber,
    });

    const issue = response.data;

    return {
      id: issue.id,
      number: issue.number,
      title: issue.title,
      body: issue.body,
      state: issue.state as 'open' | 'closed',
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      closedAt: issue.closed_at,
      user: {
        login: issue.user.login,
        avatarUrl: issue.user.avatar_url,
      },
      labels: issue.labels?.map((label) => (typeof label === 'string' ? label : label.name)) || [],
      assignees: (issue.assignees || []).map((assignee) => ({
        login: assignee.login,
        avatarUrl: assignee.avatar_url,
      })),
      milestone: issue.milestone
        ? {
            title: issue.milestone.title,
            number: issue.milestone.number,
          }
        : null,
      comments: issue.comments,
      url: issue.url,
      htmlUrl: issue.html_url,
    };
  } catch (error) {
    throw handleGitHubError(error);
  }
}

/**
 * Get comments on an issue with pagination support
 * @param owner - Repository owner username
 * @param repo - Repository name
 * @param issueNumber - Issue number
 * @param options - Pagination options (page, perPage)
 * @returns Paginated list of issue comments
 * @throws {GitHubAPIError} If comments cannot be retrieved
 */
export async function getIssueComments(
  owner: string,
  repo: string,
  issueNumber: number,
  options: PaginationOptions = {}
): Promise<PaginatedResponse<IssueComment>> {
  try {
    const client = gitHubClient.getClient();
    const page = options.page || 1;
    const perPage = Math.min(options.perPage || 30, 100);

    const response = await client.rest.issues.listComments({
      owner,
      repo,
      issue_number: issueNumber,
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

/**
 * Get timeline events for an issue with pagination support
 * @param owner - Repository owner username
 * @param repo - Repository name
 * @param issueNumber - Issue number
 * @param options - Pagination options (page, perPage)
 * @returns Paginated list of timeline events
 * @throws {GitHubAPIError} If timeline cannot be retrieved
 */
export async function getIssueTimeline(
  owner: string,
  repo: string,
  issueNumber: number,
  options: PaginationOptions = {}
): Promise<PaginatedResponse<TimelineEvent>> {
  try {
    const client = gitHubClient.getClient();
    const page = options.page || 1;
    const perPage = Math.min(options.perPage || 30, 100);

    const response = await client.rest.issues.listEventsForTimeline({
      owner,
      repo,
      issue_number: issueNumber,
      page,
      per_page: perPage,
    });

    const linkHeader = response.headers.link || '';
    const hasNextPage = linkHeader.includes('rel="next"');
    const hasPreviousPage = page > 1;

    return {
      data: response.data.map((event) => ({
        id: 'id' in event ? (event.id as number) : 0,
        type: (event.event || 'commented') as TimelineEvent['type'],
        actor: event.actor
          ? {
              login: event.actor.login,
              avatarUrl: event.actor.avatar_url,
            }
          : null,
        createdAt: event.created_at,
        event: event,
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
