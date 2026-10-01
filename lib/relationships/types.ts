/**
 * Type definitions for relationship extraction system
 */

/**
 * Relationship type enumeration
 */
export enum RelationType {
  // Direct causality
  LINKED_TO = 'linked_to',
  CONTAINS = 'contains',
  MODIFIED = 'modified',
  REVIEWED_BY = 'reviewed_by',
  RESOLVED_BY = 'resolved_by',

  // References and mentions
  REFERENCED_BY = 'referenced_by',
  MENTIONED_IN = 'mentioned_in',
  INTRODUCED_IN = 'introduced_in',
  CHANGED_IN = 'changed_in',

  // Related content
  RELATED_TO = 'related_to',
}

/**
 * Relationship category for confidence assessment
 */
export enum RelationshipCategory {
  DIRECT = 'DIRECT',
  REFERENCED = 'REFERENCED',
  TEMPORAL = 'TEMPORAL',
  SEMANTIC = 'SEMANTIC',
  POSSIBLE_RELATION = 'POSSIBLE_RELATION',
}

/**
 * Entity type for relationships
 */
export enum EntityType {
  COMMIT = 'commit',
  PULL_REQUEST = 'pullRequest',
  ISSUE = 'issue',
  ISSUE_COMMENT = 'issueComment',
  PR_COMMENT = 'prComment',
  REVIEW = 'review',
  FILE = 'file',
  USER = 'user',
  TIMELINE_EVENT = 'event',
}

/**
 * Extracted relationship ready for database insertion
 */
export interface ExtractedRelationship {
  repositoryId: string;
  sourceType: string;
  sourceId: string;
  relationType: string;
  targetType: string;
  targetId: string;
  confidence: number;
  evidenceJson: {
    category: RelationshipCategory;
    evidenceCount: number;
    evidenceTypes: string[];
    evidenceDetails: EvidenceDetail[];
    createdAt: string;
  };
}

/**
 * Individual piece of evidence for a relationship
 */
export interface EvidenceDetail {
  type: string;
  description: string;
  sourceLocation?: {
    line?: number;
    lineContent?: string;
    url?: string;
  };
  strength: 'high' | 'medium' | 'low';
}

/**
 * Reference found in text (e.g., "#123", "PR #456")
 */
export interface TextReference {
  type: 'issue' | 'pr' | 'commit';
  number?: number;
  sha?: string;
  lineNumber?: number;
  fullText: string;
}

/**
 * Batch relationship creation result
 */
export interface BatchCreationResult {
  created: number;
  failed: number;
  duplicates: number;
  errors: Array<{
    relationship: ExtractedRelationship;
    error: string;
  }>;
}

/**
 * Service layer dependencies
 */
export interface RelationshipServices {
  findCommitBySha: (repositoryId: string, sha: string) => Promise<{ id: string } | null>;
  findPullRequest: (repositoryId: string, number: number) => Promise<{ id: string } | null>;
  findIssue: (repositoryId: string, number: number) => Promise<{ id: string } | null>;
  findFile: (repositoryId: string, path: string) => Promise<{ id: string } | null>;
}
