/**
 * Repository Indexing Orchestrator
 * Main entry point for the indexing pipeline with DISCOVER → COLLECT → CONNECT → INTERPRET stages
 * Manages progress tracking, error recovery, and supports QUICK/STANDARD/DEEP modes
 */

import { prisma } from '../db';
import { AppError, RateLimitError, TimeoutError } from '../errors';
import { fetchRepositoryMetadata } from './discover';
import {
  collectCommits,
  collectPullRequests,
  collectIssues,
  collectReleases,
} from './collect';
import {
  linkPullRequestsToCommits,
  linkIssuesToPullRequests,
  linkCommitsToFiles,
  createFileArtifacts,
} from './connect';
import {
  generateRepositoryDNA,
  identifyArchitecturalPhases,
  detectHistoricalEvents,
} from './interpret';

/**
 * Indexing depth modes
 */
export enum IndexingMode {
  QUICK = 'QUICK',       // Last 50 commits, 20 PRs, 20 issues
  STANDARD = 'STANDARD', // Last 200 commits, 100 PRs, 100 issues
  DEEP = 'DEEP',         // All commits (paginated), all PRs, all issues
}

/**
 * Indexing stage
 */
export enum IndexingStage {
  DISCOVER = 'DISCOVER',
  COLLECT = 'COLLECT',
  CONNECT = 'CONNECT',
  INTERPRET = 'INTERPRET',
}

/**
 * Indexing progress status
 */
export interface IndexingProgress {
  stage: IndexingStage;
  progress: number; // 0-100
  itemsProcessed: number;
  totalItems?: number;
  currentOperation?: string;
  startedAt: Date;
  estimatedSecondsRemaining?: number;
}

/**
 * Indexing result
 */
export interface IndexingResult {
  repositoryId: string;
  success: boolean;
  mode: IndexingMode;
  duration: number; // milliseconds
  stages: {
    discover: { success: boolean; itemsProcessed: number; error?: string };
    collect: { success: boolean; itemsProcessed: number; error?: string };
    connect: { success: boolean; itemsProcessed: number; error?: string };
    interpret: { success: boolean; itemsProcessed: number; error?: string };
  };
  error?: string;
}

/**
 * Exponential backoff configuration
 */
interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
};

/**
 * Calculate depth limits based on indexing mode
 */
function getDepthLimits(mode: IndexingMode) {
  switch (mode) {
    case IndexingMode.QUICK:
      return { commits: 50, pullRequests: 20, issues: 20, releases: 10 };
    case IndexingMode.STANDARD:
      return { commits: 200, pullRequests: 100, issues: 100, releases: 20 };
    case IndexingMode.DEEP:
      return { commits: 999999, pullRequests: 999999, issues: 999999, releases: 999999 };
  }
}

/**
 * Sleep utility with exponential backoff
 */
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute function with exponential backoff retry logic
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  operationName: string,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error | undefined;
  let delay = config.initialDelayMs;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on validation or authorization errors
      if (
        lastError.message.includes('401') ||
        lastError.message.includes('403') ||
        lastError.message.includes('VALIDATION_ERROR')
      ) {
        throw lastError;
      }

      // Check if we should retry
      if (attempt < config.maxAttempts) {
        console.warn(
          `${operationName} failed (attempt ${attempt}/${config.maxAttempts}): ${lastError.message}. Retrying in ${delay}ms...`
        );
        await sleep(delay);
        delay = Math.min(delay * 2, config.maxDelayMs);
      }
    }
  }

  throw new Error(
    `${operationName} failed after ${config.maxAttempts} attempts: ${lastError?.message}`
  );
}

/**
 * Update repository indexing status
 */
async function updateIndexingStatus(
  repositoryId: string,
  status: string,
  stage?: IndexingStage
): Promise<void> {
  try {
    await prisma.repository.update({
      where: { id: repositoryId },
      data: {
        indexingStatus: status,
        indexedAt: status === 'completed' ? new Date() : undefined,
      },
    });
  } catch (error) {
    console.error(`Failed to update indexing status for ${repositoryId}:`, error);
  }
}

/**
 * DISCOVER STAGE: Fetch repository metadata
 */
async function discoverStage(
  owner: string,
  repo: string,
  repositoryId: string
): Promise<{ success: boolean; itemsProcessed: number; error?: string }> {
  try {
    console.log(`[DISCOVER] Starting discovery for ${owner}/${repo}`);

    await withRetry(
      () => fetchRepositoryMetadata(owner, repo, repositoryId),
      'Fetch repository metadata'
    );

    console.log(`[DISCOVER] Successfully discovered repository ${owner}/${repo}`);
    return { success: true, itemsProcessed: 1 };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[DISCOVER] Failed:`, errorMsg);
    return { success: false, itemsProcessed: 0, error: errorMsg };
  }
}

/**
 * COLLECT STAGE: Gather commits, PRs, issues, releases
 */
async function collectStage(
  owner: string,
  repo: string,
  repositoryId: string,
  mode: IndexingMode
): Promise<{ success: boolean; itemsProcessed: number; error?: string }> {
  const limits = getDepthLimits(mode);
  let totalItems = 0;

  try {
    console.log(`[COLLECT] Starting collection for ${owner}/${repo} in ${mode} mode`);

    // Collect commits
    console.log(`[COLLECT] Collecting commits (limit: ${limits.commits})`);
    const commitsResult = await withRetry(
      () => collectCommits(owner, repo, repositoryId, limits.commits),
      'Collect commits'
    );
    totalItems += commitsResult.collected;
    console.log(`[COLLECT] Collected ${commitsResult.collected} commits`);

    // Collect pull requests
    console.log(`[COLLECT] Collecting pull requests (limit: ${limits.pullRequests})`);
    const prsResult = await withRetry(
      () => collectPullRequests(owner, repo, repositoryId, limits.pullRequests),
      'Collect pull requests'
    );
    totalItems += prsResult.collected;
    console.log(`[COLLECT] Collected ${prsResult.collected} pull requests`);

    // Collect issues
    console.log(`[COLLECT] Collecting issues (limit: ${limits.issues})`);
    const issuesResult = await withRetry(
      () => collectIssues(owner, repo, repositoryId, limits.issues),
      'Collect issues'
    );
    totalItems += issuesResult.collected;
    console.log(`[COLLECT] Collected ${issuesResult.collected} issues`);

    // Collect releases
    console.log(`[COLLECT] Collecting releases (limit: ${limits.releases})`);
    const releasesResult = await withRetry(
      () => collectReleases(owner, repo, repositoryId, limits.releases),
      'Collect releases'
    );
    totalItems += releasesResult.collected;
    console.log(`[COLLECT] Collected ${releasesResult.collected} releases`);

    console.log(`[COLLECT] Collection complete: ${totalItems} total items`);
    return { success: true, itemsProcessed: totalItems };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[COLLECT] Failed:`, errorMsg);
    return { success: false, itemsProcessed: totalItems, error: errorMsg };
  }
}

/**
 * CONNECT STAGE: Extract relationships between entities
 */
async function connectStage(
  repositoryId: string
): Promise<{ success: boolean; itemsProcessed: number; error?: string }> {
  let totalRelationships = 0;

  try {
    console.log(`[CONNECT] Starting relationship extraction for ${repositoryId}`);

    // Link pull requests to commits
    console.log(`[CONNECT] Linking pull requests to commits`);
    const prCommitsResult = await withRetry(
      () => linkPullRequestsToCommits(repositoryId),
      'Link PRs to commits'
    );
    totalRelationships += prCommitsResult.relationships;
    console.log(`[CONNECT] Created ${prCommitsResult.relationships} PR-commit relationships`);

    // Link issues to pull requests
    console.log(`[CONNECT] Linking issues to pull requests`);
    const issuesPrsResult = await withRetry(
      () => linkIssuesToPullRequests(repositoryId),
      'Link issues to PRs'
    );
    totalRelationships += issuesPrsResult.relationships;
    console.log(
      `[CONNECT] Created ${issuesPrsResult.relationships} issue-PR relationships`
    );

    // Link commits to files
    console.log(`[CONNECT] Linking commits to files`);
    const commitsFilesResult = await withRetry(
      () => linkCommitsToFiles(repositoryId),
      'Link commits to files'
    );
    totalRelationships += commitsFilesResult.relationships;
    console.log(
      `[CONNECT] Created ${commitsFilesResult.relationships} commit-file relationships`
    );

    // Create file artifacts
    console.log(`[CONNECT] Creating file artifacts`);
    const artifactsResult = await withRetry(
      () => createFileArtifacts(repositoryId),
      'Create file artifacts'
    );
    totalRelationships += artifactsResult.artifacts;
    console.log(`[CONNECT] Created ${artifactsResult.artifacts} file artifacts`);

    console.log(
      `[CONNECT] Relationship extraction complete: ${totalRelationships} total relationships`
    );
    return { success: true, itemsProcessed: totalRelationships };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[CONNECT] Failed:`, errorMsg);
    return { success: false, itemsProcessed: totalRelationships, error: errorMsg };
  }
}

/**
 * INTERPRET STAGE: Generate AI-ready interpretations (placeholder for Groq integration)
 */
async function interpretStage(
  repositoryId: string
): Promise<{ success: boolean; itemsProcessed: number; error?: string }> {
  let totalAnalyses = 0;

  try {
    console.log(`[INTERPRET] Starting interpretation for ${repositoryId}`);

    // Generate repository DNA (placeholder)
    console.log(`[INTERPRET] Generating repository DNA`);
    const dnaResult = await withRetry(
      () => generateRepositoryDNA(repositoryId),
      'Generate repository DNA'
    );
    totalAnalyses += dnaResult.analyses;
    console.log(`[INTERPRET] Generated repository DNA`);

    // Identify architectural phases (placeholder)
    console.log(`[INTERPRET] Identifying architectural phases`);
    const phasesResult = await withRetry(
      () => identifyArchitecturalPhases(repositoryId),
      'Identify architectural phases'
    );
    totalAnalyses += phasesResult.analyses;
    console.log(`[INTERPRET] Identified ${phasesResult.analyses} architectural phases`);

    // Detect historical events (placeholder)
    console.log(`[INTERPRET] Detecting historical events`);
    const eventsResult = await withRetry(
      () => detectHistoricalEvents(repositoryId),
      'Detect historical events'
    );
    totalAnalyses += eventsResult.analyses;
    console.log(`[INTERPRET] Detected ${eventsResult.analyses} historical events`);

    console.log(`[INTERPRET] Interpretation complete: ${totalAnalyses} total analyses`);
    return { success: true, itemsProcessed: totalAnalyses };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[INTERPRET] Failed:`, errorMsg);
    // Note: Interpretation failures are non-critical and don't block completion
    return { success: false, itemsProcessed: totalAnalyses, error: errorMsg };
  }
}

/**
 * Main indexing orchestrator function
 * Executes all four stages of the indexing pipeline
 *
 * @param repositoryId - Database repository ID
 * @param owner - Repository owner (GitHub username/org)
 * @param repo - Repository name
 * @param mode - Indexing depth mode (QUICK, STANDARD, DEEP)
 * @returns IndexingResult with status and metrics
 *
 * @example
 * ```typescript
 * const result = await startIndexing('repo-123', 'nodejs', 'node', IndexingMode.STANDARD);
 * if (result.success) {
 *   console.log(`Indexed ${result.stages.collect.itemsProcessed} items`);
 * }
 * ```
 */
export async function startIndexing(
  repositoryId: string,
  owner: string,
  repo: string,
  mode: IndexingMode = IndexingMode.STANDARD
): Promise<IndexingResult> {
  const startTime = Date.now();
  const result: IndexingResult = {
    repositoryId,
    success: false,
    mode,
    duration: 0,
    stages: {
      discover: { success: false, itemsProcessed: 0 },
      collect: { success: false, itemsProcessed: 0 },
      connect: { success: false, itemsProcessed: 0 },
      interpret: { success: false, itemsProcessed: 0 },
    },
  };

  try {
    // Update status to in_progress
    await updateIndexingStatus(repositoryId, 'in_progress', IndexingStage.DISCOVER);

    // STAGE 1: DISCOVER
    console.log(`\n=== STAGE 1: DISCOVER ===`);
    result.stages.discover = await discoverStage(owner, repo, repositoryId);

    if (!result.stages.discover.success) {
      throw new Error(`Discovery stage failed: ${result.stages.discover.error}`);
    }

    // STAGE 2: COLLECT
    console.log(`\n=== STAGE 2: COLLECT ===`);
    await updateIndexingStatus(repositoryId, 'in_progress', IndexingStage.COLLECT);
    result.stages.collect = await collectStage(owner, repo, repositoryId, mode);

    if (!result.stages.collect.success) {
      throw new Error(`Collection stage failed: ${result.stages.collect.error}`);
    }

    // STAGE 3: CONNECT
    console.log(`\n=== STAGE 3: CONNECT ===`);
    await updateIndexingStatus(repositoryId, 'in_progress', IndexingStage.CONNECT);
    result.stages.connect = await connectStage(repositoryId);

    if (!result.stages.connect.success) {
      console.warn(`Connection stage failed: ${result.stages.connect.error}`);
    }

    // STAGE 4: INTERPRET
    console.log(`\n=== STAGE 4: INTERPRET ===`);
    await updateIndexingStatus(repositoryId, 'in_progress', IndexingStage.INTERPRET);
    result.stages.interpret = await interpretStage(repositoryId);

    if (!result.stages.interpret.success) {
      console.warn(`Interpretation stage failed: ${result.stages.interpret.error}`);
    }

    // Mark as completed
    result.success = true;
    await updateIndexingStatus(repositoryId, 'completed');

    result.duration = Date.now() - startTime;

    console.log(`\n=== INDEXING COMPLETE ===`);
    console.log(`Repository: ${owner}/${repo}`);
    console.log(`Mode: ${mode}`);
    console.log(`Duration: ${(result.duration / 1000).toFixed(2)}s`);
    console.log(`Items Processed: ${
      result.stages.discover.itemsProcessed +
      result.stages.collect.itemsProcessed +
      result.stages.connect.itemsProcessed +
      result.stages.interpret.itemsProcessed
    }`);

    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    result.error = errorMsg;
    result.duration = Date.now() - startTime;

    // Mark as failed
    await updateIndexingStatus(repositoryId, 'failed');

    console.error(`\n=== INDEXING FAILED ===`);
    console.error(`Repository: ${owner}/${repo}`);
    console.error(`Error: ${errorMsg}`);
    console.error(`Duration: ${(result.duration / 1000).toFixed(2)}s`);

    return result;
  }
}

/**
 * Export types and enums
 */
export type { IndexingProgress, IndexingResult };
export { IndexingStage, IndexingMode };
