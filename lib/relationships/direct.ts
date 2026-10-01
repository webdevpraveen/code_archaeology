/**
 * Direct relationship extraction from GitHub entities
 * Extracts relationships directly present in GitHub data structures
 */

import {
  ExtractedRelationship,
  EvidenceDetail,
  RelationshipCategory,
  RelationType,
  RelationshipServices,
} from './types';

/**
 * Extract direct relationships from pull request data
 * - PR's mergeCommitSha → Commit (merged_into)
 * - PR's related files → File relationships
 *
 * @param pr - Pull request with commit and file information
 * @param repositoryId - Repository ID
 * @param services - Database query services
 * @returns Array of extracted relationships
 */
export async function extractPullRequestRelationships(
  pr: {
    id: string;
    number: number;
    mergeCommitSha: string | null;
    changedFiles?: number;
    commits?: Array<{ sha: string }>;
  },
  repositoryId: string,
  services: RelationshipServices
): Promise<ExtractedRelationship[]> {
  const relationships: ExtractedRelationship[] = [];

  // Relationship: PR → merged commit
  if (pr.mergeCommitSha) {
    const mergeCommit = await services.findCommitBySha(repositoryId, pr.mergeCommitSha);

    if (mergeCommit) {
      relationships.push({
        repositoryId,
        sourceType: 'pullRequest',
        sourceId: pr.id,
        relationType: RelationType.CONTAINS,
        targetType: 'commit',
        targetId: mergeCommit.id,
        confidence: 1.0, // Direct relationship with high confidence
        evidenceJson: {
          category: RelationshipCategory.DIRECT,
          evidenceCount: 1,
          evidenceTypes: ['merge_commit_sha'],
          evidenceDetails: [
            {
              type: 'merge_commit_sha',
              description: `PR #${pr.number} was merged with commit ${pr.mergeCommitSha}`,
              strength: 'high',
            },
          ],
          createdAt: new Date().toISOString(),
        },
      });
    }
  }

  // Relationship: PR → related commits
  if (pr.commits && pr.commits.length > 0) {
    for (const commit of pr.commits) {
      const commitRecord = await services.findCommitBySha(repositoryId, commit.sha);

      if (commitRecord) {
        relationships.push({
          repositoryId,
          sourceType: 'pullRequest',
          sourceId: pr.id,
          relationType: RelationType.CONTAINS,
          targetType: 'commit',
          targetId: commitRecord.id,
          confidence: 0.95,
          evidenceJson: {
            category: RelationshipCategory.DIRECT,
            evidenceCount: 1,
            evidenceTypes: ['pr_commit_association'],
            evidenceDetails: [
              {
                type: 'pr_commit_association',
                description: `Commit ${commit.sha} is part of PR #${pr.number}`,
                strength: 'high',
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
 * Extract direct relationships from pull request review data
 * - Review → Commit relationship (reviewCommitSha)
 * - Review → PR relationship
 *
 * @param review - Pull request review with commit information
 * @param repositoryId - Repository ID
 * @param services - Database query services
 * @returns Array of extracted relationships
 */
export async function extractReviewRelationships(
  review: {
    id: string;
    pullRequestId: string;
    commitSha: string;
    state: string;
    authorLogin: string;
  },
  repositoryId: string,
  services: RelationshipServices
): Promise<ExtractedRelationship[]> {
  const relationships: ExtractedRelationship[] = [];

  // Find the commit being reviewed
  const commit = await services.findCommitBySha(repositoryId, review.commitSha);

  if (commit) {
    // Relationship: Review → Commit (what was reviewed)
    relationships.push({
      repositoryId,
      sourceType: 'review',
      sourceId: review.id,
      relationType: RelationType.REVIEWED_BY,
      targetType: 'commit',
      targetId: commit.id,
      confidence: 1.0,
      evidenceJson: {
        category: RelationshipCategory.DIRECT,
        evidenceCount: 1,
        evidenceTypes: ['review_commit_sha'],
        evidenceDetails: [
          {
            type: 'review_commit_sha',
            description: `Review on commit ${review.commitSha} with state: ${review.state}`,
            strength: 'high',
          },
        ],
        createdAt: new Date().toISOString(),
      },
    });

    // Relationship: Commit → Review (inverse, for bidirectional queries)
    relationships.push({
      repositoryId,
      sourceType: 'commit',
      sourceId: commit.id,
      relationType: RelationType.REVIEWED_BY,
      targetType: 'review',
      targetId: review.id,
      confidence: 1.0,
      evidenceJson: {
        category: RelationshipCategory.DIRECT,
        evidenceCount: 1,
        evidenceTypes: ['review_commit_sha'],
        evidenceDetails: [
          {
            type: 'review_commit_sha',
            description: `Commit ${review.commitSha} was reviewed (${review.state}) by ${review.authorLogin}`,
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
 * Extract direct relationships from commit data
 * - Commit → Files (modified files)
 * - Commit → Parent commits (causality)
 *
 * @param commit - Commit with file information
 * @param repositoryId - Repository ID
 * @param services - Database query services
 * @returns Array of extracted relationships
 */
export async function extractCommitRelationships(
  commit: {
    id: string;
    sha: string;
    files?: Array<{
      path: string;
      status: string;
    }>;
    parents?: string[];
  },
  repositoryId: string,
  services: RelationshipServices
): Promise<ExtractedRelationship[]> {
  const relationships: ExtractedRelationship[] = [];

  // Relationship: Commit → Files (modified files)
  if (commit.files && commit.files.length > 0) {
    for (const file of commit.files) {
      const fileRecord = await services.findFile(repositoryId, file.path);

      if (fileRecord) {
        relationships.push({
          repositoryId,
          sourceType: 'commit',
          sourceId: commit.id,
          relationType: RelationType.MODIFIED,
          targetType: 'file',
          targetId: fileRecord.id,
          confidence: 1.0,
          evidenceJson: {
            category: RelationshipCategory.DIRECT,
            evidenceCount: 1,
            evidenceTypes: ['commit_file_modification'],
            evidenceDetails: [
              {
                type: 'commit_file_modification',
                description: `File ${file.path} was ${file.status} in commit ${commit.sha}`,
                strength: 'high',
              },
            ],
            createdAt: new Date().toISOString(),
          },
        });
      }
    }
  }

  // Relationship: Commit → Parent commits (direct causality)
  if (commit.parents && commit.parents.length > 0) {
    for (const parentSha of commit.parents) {
      const parentCommit = await services.findCommitBySha(repositoryId, parentSha);

      if (parentCommit) {
        relationships.push({
          repositoryId,
          sourceType: 'commit',
          sourceId: commit.id,
          relationType: RelationType.LINKED_TO,
          targetType: 'commit',
          targetId: parentCommit.id,
          confidence: 1.0,
          evidenceJson: {
            category: RelationshipCategory.DIRECT,
            evidenceCount: 1,
            evidenceTypes: ['parent_commit_reference'],
            evidenceDetails: [
              {
                type: 'parent_commit_reference',
                description: `Commit ${commit.sha} is child of parent commit ${parentSha}`,
                strength: 'high',
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
 * Extract direct relationships from issue timeline events
 * - Issue → Event relationships
 * - Event → Actor relationships (optional)
 *
 * @param issue - Issue with timeline events
 * @param repositoryId - Repository ID
 * @param services - Database query services
 * @returns Array of extracted relationships
 */
export async function extractIssueTimelineRelationships(
  issue: {
    id: string;
    number: number;
    timelineEvents?: Array<{
      id: string;
      eventType: string;
      commitSha?: string;
      prNumber?: number;
    }>;
  },
  repositoryId: string,
  services: RelationshipServices
): Promise<ExtractedRelationship[]> {
  const relationships: ExtractedRelationship[] = [];

  if (!issue.timelineEvents || issue.timelineEvents.length === 0) {
    return relationships;
  }

  for (const event of issue.timelineEvents) {
    // Handle commit references in timeline events
    if (event.commitSha) {
      const commit = await services.findCommitBySha(repositoryId, event.commitSha);

      if (commit) {
        const confidence = event.eventType === 'committed' ? 1.0 : 0.9;

        relationships.push({
          repositoryId,
          sourceType: 'issue',
          sourceId: issue.id,
          relationType: RelationType.LINKED_TO,
          targetType: 'commit',
          targetId: commit.id,
          confidence,
          evidenceJson: {
            category: RelationshipCategory.DIRECT,
            evidenceCount: 1,
            evidenceTypes: ['issue_timeline_commit'],
            evidenceDetails: [
              {
                type: 'issue_timeline_commit',
                description: `Issue #${issue.number} timeline event (${event.eventType}) references commit ${event.commitSha}`,
                strength: confidence === 1.0 ? 'high' : 'medium',
              },
            ],
            createdAt: new Date().toISOString(),
          },
        });
      }
    }

    // Handle PR references in timeline events
    if (event.prNumber) {
      const pr = await services.findPullRequest(repositoryId, event.prNumber);

      if (pr) {
        relationships.push({
          repositoryId,
          sourceType: 'issue',
          sourceId: issue.id,
          relationType: RelationType.LINKED_TO,
          targetType: 'pullRequest',
          targetId: pr.id,
          confidence: 0.95,
          evidenceJson: {
            category: RelationshipCategory.DIRECT,
            evidenceCount: 1,
            evidenceTypes: ['issue_timeline_pr'],
            evidenceDetails: [
              {
                type: 'issue_timeline_pr',
                description: `Issue #${issue.number} timeline event references PR #${event.prNumber}`,
                strength: 'high',
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
 * Calculate confidence score based on evidence strength
 * - High strength evidence: 0.95-1.0
 * - Medium strength evidence: 0.7-0.95
 * - Low strength evidence: 0.4-0.7
 * - Multiple pieces of evidence increase overall confidence
 *
 * @param evidenceDetails - Array of evidence details
 * @returns Confidence score between 0 and 1
 */
export function calculateDirectConfidence(evidenceDetails: EvidenceDetail[]): number {
  if (evidenceDetails.length === 0) return 0;

  const strengthMap = { high: 1.0, medium: 0.8, low: 0.5 };
  const baseScore = evidenceDetails.reduce((sum, ev) => sum + strengthMap[ev.strength], 0) / evidenceDetails.length;

  // Boost confidence with multiple evidence pieces
  const evidenceBoost = Math.min(evidenceDetails.length * 0.05, 0.15);

  return Math.min(baseScore + evidenceBoost, 1.0);
}
