/**
 * Octokit client initialization and configuration
 * Provides a singleton instance of the GitHub API client with proper authentication
 */

import { Octokit } from '@octokit/rest';
import { GitHubAPIError, ClientOptions } from './types';

class GitHubClient {
  private octokit: Octokit | null = null;

  /**
   * Initialize the GitHub API client with authentication
   * @param options - Client initialization options
   * @throws {GitHubAPIError} If authentication fails
   */
  public initialize(options: ClientOptions): void {
    try {
      this.octokit = new Octokit({
        auth: options.auth,
        baseUrl: options.baseUrl || 'https://api.github.com',
        timeout: options.timeout || 15000,
        userAgent: 'code-archaeology/1.0.0',
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const apiError: GitHubAPIError = Object.assign(err, {
        status: 500,
        statusText: 'Client Initialization Error',
      });
      throw apiError;
    }
  }

  /**
   * Get the initialized Octokit instance
   * @returns The Octokit client instance
   * @throws {GitHubAPIError} If client is not initialized
   */
  public getClient(): Octokit {
    if (!this.octokit) {
      const error = new Error('GitHub client not initialized. Call initialize() first.');
      const apiError: GitHubAPIError = Object.assign(error, {
        status: 500,
        statusText: 'Client Not Initialized',
      });
      throw apiError;
    }
    return this.octokit;
  }

  /**
   * Check if client is initialized
   * @returns True if client is initialized
   */
  public isInitialized(): boolean {
    return this.octokit !== null;
  }

  /**
   * Verify authentication by testing API access
   * @returns User authentication information
   * @throws {GitHubAPIError} If authentication fails
   */
  public async verifyAuth(): Promise<unknown> {
    try {
      const client = this.getClient();
      const response = await client.rest.users.getAuthenticated();
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const apiError: GitHubAPIError = Object.assign(err, {
        status: 401,
        statusText: 'Authentication Failed',
        response: error,
      });
      throw apiError;
    }
  }

  /**
   * Reset the client instance (for testing or re-initialization)
   */
  public reset(): void {
    this.octokit = null;
  }
}

// Export singleton instance
export const gitHubClient = new GitHubClient();

/**
 * Helper function to handle GitHub API errors
 * @param error - The error from the GitHub API
 * @returns Formatted GitHubAPIError
 */
export function handleGitHubError(error: unknown): GitHubAPIError {
  if (error instanceof Error) {
    const message = error.message;
    let status = 500;
    let statusText = 'Internal Server Error';

    // Try to extract status from error if available
    if ('status' in error) {
      status = (error as { status?: number }).status ?? status;
    }
    if ('statusText' in error) {
      statusText = (error as { statusText?: string }).statusText ?? statusText;
    }

    const apiError: GitHubAPIError = Object.assign(
      new Error(message),
      {
        status,
        statusText,
        response: error,
      }
    );
    return apiError;
  }

  const apiError: GitHubAPIError = Object.assign(
    new Error('Unknown GitHub API error'),
    {
      status: 500,
      statusText: 'Unknown Error',
      response: error,
    }
  );
  return apiError;
}
