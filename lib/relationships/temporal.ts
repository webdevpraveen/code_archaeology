/**
 * Temporal relationship extraction based on time-based associations
 * Identifies relationships between entities based on timing and temporal patterns
 */

import {
  ExtractedRelationship,
  RelationshipCategory,
  RelationType,
  RelationshipServices,
} from './types';

/**
 * Time window configurations for different relationship types
 */
const TIME_WINDOWS = {
  // PR closure and issue resolution: within 24 hours
  prIssueResolution: 24 * 60 * 60 * 1000,
  // Files modified in same commit: exact match
  fileModificationInCommit: 0,
  // Related commits in same PR: all within PR
  prCommitRelation: 0,
  // Issue closure within time window: 7 days
  issueRelation: 7 * 24 * 60 * 60 * 1000,
};

/**
 * Extract temporal relationships between files modified in the same commit
 * Files changed together are likely related
 *
 * @param commit - Commit with file information
 * @param repositoryId - Repository ID
 * @param services - Database query services
 * @returns Array of temporal relationships
 */
export async function extractFileComodificationRelationships(
  commit: {
    id: string;
    sha: string;
    committedAt: Date;
    files?: Array<{ path: string }>;
  },
  repositoryId: string,
  services: RelationshipServices
): Promise<ExtractedRelationship[]> {
  const relationships: ExtractedRelationship[] = [];

  if (!commit.files || commit.files.length < 2) {
    return relationships;
  }

  // Find pairs of files modified in the same commit
  for (let i = 0; i < commit.files.length; i++) {
    for (let j = i + 1; j < commit.files.length; j++) {
      const file1 = await services.findFile(repositoryId, commit.files[i].path);
      const file2 = await services.findFile(repositoryId, commit.files[j].path);

      if (file1 && file2) {
        // Avoid duplicate relationships by only creating one direction
        relationships.push({
          repositoryId,
          sourceType: 'file',
          sourceId: file1.id,
          relationType: RelationType.RELATED_TO,
          targetType: 'file',
          targetId: file2.id,
          confidence: 0.75, // Medium confidence for temporal relation
          evidenceJson: {
            category: RelationshipCategory.TEMPORAL,
            evidenceCount: 1,
            evidenceTypes: ['comodification'],
            evidenceDetails: [
              {
                type: 'comodification',
                description: `Files ${commit.files[i].path} and ${commit.files[j].path} were modified together in commit ${commit.sha}`,
                sourceLocation: {
                  url: `${commit.sha}`,
                },
                strength: 'medium',
              },
            ],
            createdAt: new Date().toISOString(),
          },
        });
      }
    }
  }

  return relationships;
}

/**
 * Extract temporal relationships between commits in the same PR
 * Commits related by being in the same PR but not in direct parent-child relationship
 *
 * @param pr - Pull request with commit information
 * @param repositoryId - Repository ID
 * @param services - Database query services
 * @returns Array of temporal relationships
 */
export async function extractPullRequestCommitRelationships(
  pr: {
    id: string;
    number: number;
    mergedAt?: Date;
    commits?: Array<{ sha: string }>;
  },
  repositoryId: string,
  services: RelationshipServices
): Promise<ExtractedRelationship[]> {
  const relationships: ExtractedRelationship[] = [];

  if (!pr.commits || pr.commits.length < 2) {
    return relationships;
  }

  // Create relationships between commits in the same PR
  // These are not parent-child but rather "related via same PR"
  for (let i = 0; i < pr.commits.length; i++) {
    for (let j = i + 1; j < pr.commits.length; j++) {
      const commit1 = await services.findCommitBySha(repositoryId, pr.commits[i].sha);
      const commit2 = await services.findCommitBySha(repositoryId, pr.commits[j].sha);

      if (commit1 && commit2) {
        // Create bidirectional relationships
        relationships.push({
          repositoryId,
          sourceType: 'commit',
          sourceId: commit1.id,
          relationType: RelationType.RELATED_TO,
          targetType: 'commit',
          targetId: commit2.id,
          confidence: 0.7, // Medium-low confidence for temporal grouping
          evidenceJson: {
            category: RelationshipCategory.TEMPORAL,
            evidenceCount: 1,
            evidenceTypes: ['pr_coexistence'],
            evidenceDetails: [
              {
                type: 'pr_coexistence',
                description: `Commits ${pr.commits[i].sha.substring(0, 7)} and ${pr.commits[j].sha.substring(0, 7)} are both part of PR #${pr.number}`,
                strength: 'medium',
              },
            ],
            createdAt: new Date().toISOString(),
          },
        });
      }
    }
  }

  return relationships;
}

/**
 * Extract temporal relationships between issues and PRs that close them
 * If PR is merged and closes an issue within the time window, create relationship
 *
 * @param pr - Pull request data
 * @param closedIssueIds - Array of issue IDs the PR closed (if known)
 * @param repositoryId - Repository ID
 * @returns Array of temporal relationships
 */
export async function extractIssueResolutionRelationships(
  pr: {
    id: string;
    number: number;
    merged: boolean;
    mergedAt?: Date;
    state: string;
  },
  closedIssueIds: string[],
  repositoryId: string
): Promise<ExtractedRelationship[]> {
  const relationships: ExtractedRelationship[] = [];

  if (!pr.merged || !pr.mergedAt || closedIssueIds.length === 0) {
    return relationships;
  }

  // Create relationships between PR and resolved issues
  for (const issueId of closedIssueIds) {
    relationships.push({
      repositoryId,
      sourceType: 'pullRequest',
      sourceId: pr.id,
      relationType: RelationType.RESOLVED_BY,
      targetType: 'issue',
      targetId: issueId,
      confidence: 0.9, // High confidence when explicitly related
      evidenceJson: {
        category: RelationshipCategory.TEMPORAL,
        evidenceCount: 1,
        evidenceTypes: ['issue_resolution'],
        evidenceDetails: [
          {
            type: 'issue_resolution',
            description: `PR #${pr.number} was merged and resolved this issue`,
            sourceLocation: {
              url: `merged at ${pr.mergedAt?.toISOString()}`,
            },
            strength: 'high',
          },
        ],
        createdAt: new Date().toISOString(),
      },
    });
  }

  return relationships;
}

/**
 * Extract temporal relationships between commits based on authorship and timing
 * Commits by the same author in close temporal proximity may be related
 *
 * @param commits - Array of commits with authorship information
 * @param repositoryId - Repository ID
 * @param timeWindow - Time window in milliseconds (default 24 hours)
 * @returns Array of temporal relationships
 */
export async function extractAuthorTemporalRelationships(
  commits: Array<{
    id: string;
    sha: string;
    authorLogin: string;
    committedAt: Date;
  }>,
  repositoryId: string,
  timeWindow: number = 24 * 60 * 60 * 1000
): Promise<ExtractedRelationship[]> {
  const relationships: ExtractedRelationship[] = [];

  // Group commits by author
  const commitsByAuthor = commits.reduce(
    (acc, commit) => {
      if (!acc[commit.authorLogin]) {
        acc[commit.authorLogin] = [];
      }
      acc[commit.authorLogin].push(commit);
      return acc;
    },
    {} as Record<string, typeof commits>
  );

  // Find related commits by same author within time window
  for (const author in commitsByAuthor) {
    const authorCommits = commitsByAuthor[author].sort(
      (a, b) => a.committedAt.getTime() - b.committedAt.getTime()
    );

    // Check for commits within time window
    for (let i = 0; i < authorCommits.length; i++) {
      for (let j = i + 1; j < authorCommits.length; j++) {
        const timeDiff = authorCommits[j].committedAt.getTime() - authorCommits[i].committedAt.getTime();

        if (timeDiff <= timeWindow) {
          relationships.push({
            repositoryId,
            sourceType: 'commit',
            sourceId: authorCommits[i].id,
            relationType: RelationType.RELATED_TO,
            targetType: 'commit',
            targetId: authorCommits[j].id,
            confidence: Math.max(0.4, 1 - timeDiff / timeWindow), // Higher confidence for closer timing
            evidenceJson: {
              category: RelationshipCategory.TEMPORAL,
              evidenceCount: 1,
              evidenceTypes: ['author_temporal_proximity'],
              evidenceDetails: [
                {
                  type: 'author_temporal_proximity',
                  description: `Commits by ${author} within ${Math.round(timeDiff / (60 * 1000))} minutes of each other`,
                  strength: 'low',
                },
              ],
              createdAt: new Date().toISOString(),
            },
          });
        }
      }
    }
  }

  return relationships;
}

/**
 * Extract temporal relationships between issues based on creation/closing timing
 * Issues closed around the same time may be related
 *
 * @param issues - Array of issues with timeline information
 * @param repositoryId - Repository ID
 * @param timeWindow - Time window in milliseconds (default 7 days)
 * @returns Array of temporal relationships
 */
export async function extractIssueTemporalRelationships(
  issues: Array<{
    id: string;
    number: number;
    closedAt?: Date;
    createdAt: Date;
  }>,
  repositoryId: string,
  timeWindow: number = 7 * 24 * 60 * 60 * 1000
): Promise<ExtractedRelationship[]> {
  const relationships: ExtractedRelationship[] = [];

  // Find issues closed around the same time
  const closedIssues = issues.filter((i) => i.closedAt);

  for (let i = 0; i < closedIssues.length; i++) {
    for (let j = i + 1; j < closedIssues.length; j++) {
      const issue1 = closedIssues[i];
      const issue2 = closedIssues[j];

      if (issue1.closedAt && issue2.closedAt) {
        const timeDiff = Math.abs(issue1.closedAt.getTime() - issue2.closedAt.getTime());

        if (timeDiff <= timeWindow) {
          relationships.push({
            repositoryId,
            sourceType: 'issue',
            sourceId: issue1.id,
            relationType: RelationType.RELATED_TO,
            targetType: 'issue',
            targetId: issue2.id,
            confidence: 0.5, // Low confidence for temporal grouping only
            evidenceJson: {
              category: RelationshipCategory.TEMPORAL,
              evidenceCount: 1,
              evidenceTypes: ['closure_temporal_proximity'],
              evidenceDetails: [
                {
                  type: 'closure_temporal_proximity',
                  description: `Issues #${issue1.number} and #${issue2.number} closed within ${Math.round(timeDiff / (24 * 60 * 60 * 1000))} days`,
                  strength: 'low',
                },
              ],
              createdAt: new Date().toISOString(),
            },
          });
        }
      }
    }
  }

  return relationships;
}

/**
 * Calculate confidence based on temporal distance
 * Closer in time = higher confidence
 *
 * @param timeDiff - Time difference in milliseconds
 * @param maxTimeWindow - Maximum time window to consider in milliseconds
 * @returns Confidence score between 0 and 1
 */
export function calculateTemporalConfidence(timeDiff: number, maxTimeWindow: number): number {
  if (timeDiff === 0) return 0.9; // Same event
  if (timeDiff > maxTimeWindow) return 0.0; // Outside time window

  // Linear decay: closer to time 0 = higher confidence
  return Math.max(0.3, 1 - timeDiff / maxTimeWindow) * 0.85;
}

/**
 * Check if two timestamps are within a given time window
 *
 * @param date1 - First date
 * @param date2 - Second date
 * @param windowMs - Time window in milliseconds
 * @returns True if dates are within the window
 */
export function isWithinTimeWindow(date1: Date, date2: Date, windowMs: number): boolean {
  return Math.abs(date1.getTime() - date2.getTime()) <= windowMs;
}

/**
 * Format time duration for readable output
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted duration string
 */
export function formatDuration(ms: number): string {
  const seconds = Math.round(ms / 1000);
  const minutes = Math.round(ms / (60 * 1000));
  const hours = Math.round(ms / (60 * 60 * 1000));
  const days = Math.round(ms / (24 * 60 * 60 * 1000));

  if (seconds < 60) return `${seconds}s`;
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
}
