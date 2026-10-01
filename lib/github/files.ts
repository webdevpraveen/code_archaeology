/**
 * File/Content-related GitHub API service functions
 * Handles repository contents and file history
 */

import { gitHubClient, handleGitHubError } from './client';
import { FileContent, BlameRange, GitHubAPIError } from './types';
import { getCommitBlame } from './commits';

/**
 * Get repository contents (files and directories)
 * @param owner - Repository owner username
 * @param repo - Repository name
 * @param path - File or directory path (empty string for root)
 * @param ref - Optional branch/tag/commit SHA
 * @returns File or directory contents
 * @throws {GitHubAPIError} If contents cannot be retrieved
 */
export async function getRepositoryContents(
  owner: string,
  repo: string,
  path: string = '',
  ref?: string
): Promise<FileContent | FileContent[]> {
  try {
    const client = gitHubClient.getClient();

    const response = await client.rest.repos.getContent({
      owner,
      repo,
      path,
      ref,
    });

    // Handle single file response
    if (!Array.isArray(response.data)) {
      const file = response.data;
      return {
        name: file.name,
        path: file.path,
        sha: file.sha,
        size: file.size,
        type: file.type as 'file' | 'dir' | 'symlink' | 'submodule',
        downloadUrl: file.download_url,
        url: file.url,
        htmlUrl: file.html_url,
        gitUrl: file.git_url,
        content: file.content ? Buffer.from(file.content, 'base64').toString('utf-8') : undefined,
        encoding: file.encoding,
        target: file.target,
      };
    }

    // Handle directory response
    return response.data.map((item) => ({
      name: item.name,
      path: item.path,
      sha: item.sha,
      size: item.size,
      type: item.type as 'file' | 'dir' | 'symlink' | 'submodule',
      downloadUrl: item.download_url,
      url: item.url,
      htmlUrl: item.html_url,
      gitUrl: item.git_url,
      content: item.content ? Buffer.from(item.content, 'base64').toString('utf-8') : undefined,
      encoding: item.encoding,
      target: item.target,
    }));
  } catch (error) {
    throw handleGitHubError(error);
  }
}

/**
 * Get the history of changes for a file (blame information)
 * @param owner - Repository owner username
 * @param repo - Repository name
 * @param path - File path in repository
 * @param ref - Optional branch/tag/commit SHA
 * @returns File history with blame information
 * @throws {GitHubAPIError} If file history cannot be retrieved
 */
export async function getFileHistory(
  owner: string,
  repo: string,
  path: string,
  ref?: string
): Promise<BlameRange[]> {
  try {
    // Use getCommitBlame to get detailed line-by-line history
    const blame = await getCommitBlame(owner, repo, path, { ref });
    return blame;
  } catch (error) {
    throw handleGitHubError(error);
  }
}

/**
 * Get a file's raw content as text
 * @param owner - Repository owner username
 * @param repo - Repository name
 * @param path - File path in repository
 * @param ref - Optional branch/tag/commit SHA
 * @returns File content as string
 * @throws {GitHubAPIError} If file cannot be retrieved
 */
export async function getFileContent(
  owner: string,
  repo: string,
  path: string,
  ref?: string
): Promise<string> {
  try {
    const content = await getRepositoryContents(owner, repo, path, ref);

    if (Array.isArray(content)) {
      throw new Error('Path is a directory, not a file');
    }

    if (!content.content) {
      // Fetch raw content for files without embedded content
      const client = gitHubClient.getClient();
      const response = await client.repos.getRawContent({
        owner,
        repo,
        path,
        ref: ref || 'HEAD',
      });

      return typeof response.data === 'string'
        ? response.data
        : Buffer.from(response.data as Uint8Array).toString('utf-8');
    }

    return content.content;
  } catch (error) {
    throw handleGitHubError(error);
  }
}

/**
 * Check if a file exists in the repository
 * @param owner - Repository owner username
 * @param repo - Repository name
 * @param path - File path in repository
 * @param ref - Optional branch/tag/commit SHA
 * @returns True if file exists, false otherwise
 */
export async function fileExists(
  owner: string,
  repo: string,
  path: string,
  ref?: string
): Promise<boolean> {
  try {
    const content = await getRepositoryContents(owner, repo, path, ref);
    if (Array.isArray(content)) {
      return false; // It's a directory
    }
    return content.type === 'file';
  } catch (error) {
    // If 404 error, file doesn't exist
    if (error instanceof Error && 'status' in error && (error as { status?: number }).status === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * List files in a directory
 * @param owner - Repository owner username
 * @param repo - Repository name
 * @param dirPath - Directory path (empty string for root)
 * @param ref - Optional branch/tag/commit SHA
 * @returns Array of files and subdirectories
 * @throws {GitHubAPIError} If directory cannot be accessed
 */
export async function listDirectory(
  owner: string,
  repo: string,
  dirPath: string = '',
  ref?: string
): Promise<FileContent[]> {
  try {
    const content = await getRepositoryContents(owner, repo, dirPath, ref);

    if (!Array.isArray(content)) {
      throw new Error('Path is a file, not a directory');
    }

    return content;
  } catch (error) {
    throw handleGitHubError(error);
  }
}

/**
 * Recursively list all files in a directory
 * @param owner - Repository owner username
 * @param repo - Repository name
 * @param dirPath - Directory path (empty string for root)
 * @param ref - Optional branch/tag/commit SHA
 * @returns Array of all files (recursive)
 * @throws {GitHubAPIError} If directory cannot be accessed
 */
export async function listDirectoryRecursive(
  owner: string,
  repo: string,
  dirPath: string = '',
  ref?: string
): Promise<FileContent[]> {
  try {
    const contents = await listDirectory(owner, repo, dirPath, ref);
    const allFiles: FileContent[] = [];

    for (const item of contents) {
      if (item.type === 'file') {
        allFiles.push(item);
      } else if (item.type === 'dir') {
        // Recursively get files from subdirectories
        const subFiles = await listDirectoryRecursive(owner, repo, item.path, ref);
        allFiles.push(...subFiles);
      }
    }

    return allFiles;
  } catch (error) {
    throw handleGitHubError(error);
  }
}
