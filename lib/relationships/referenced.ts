/**
 * Referenced relationship extraction from text content
 * Parses PR body, commit messages, and comments for issue/PR/commit references
 */

import {
  ExtractedRelationship,
  TextReference,
  RelationshipCategory,
  RelationType,
  RelationshipServices,
} from './types';

/**
 * Regex patterns for detecting references in text
 */
const REFERENCE_PATTERNS = {
  // Issue references: #123, #123, fixes #123, closes #456, etc.
  issue: /#(\d+)/g,
  // PR references: PR #123, pull request #456, etc.
  pr: /(?:PR|pr|pull request|pull-request)\s+#?(\d+)/g,
  // Commit references: sha123abc, [sha], etc.
  commit: /(?:commit\s+)?([a-f0-9]{7,40})/gi,
  // Keywords that indicate fixing/resolving
  fixKeywords: /(?:fix|fixes|fixed|close|closes|closed|resolve|resolves|resolved|implements)\s+#(\d+)/gi,
};

/**
 * Parse GitHub issue references from text (e.g., #123, fixes #456)
 * Returns both direct mentions and contextual ones (fixes, closes, etc.)
 *
 * @param text - Text content to parse (PR body, commit message, comment)
 * @returns Array of issue references with metadata
 */
export function parseIssueReferences(text: string): TextReference[] {
  if (!text) return [];

  const references: TextReference[] = [];
  const seen = new Set<number>();

  // Parse standard issue mentions (#123)
  const issueMatches = text.matchAll(REFERENCE_PATTERNS.issue);
  for (const match of issueMatches) {
    const number = parseInt(match[1], 10);
    if (!seen.has(number)) {
      seen.add(number);
      references.push({
        type: 'issue',
        number,
        fullText: match[0],
        lineNumber: countLinesBefore(text, match.index || 0),
      });
    }
  }

  // Parse fix/close keywords (fixes #123, closes #456)
  const fixMatches = text.matchAll(REFERENCE_PATTERNS.fixKeywords);
  for (const match of fixMatches) {
    const number = parseInt(match[1], 10);
    if (!seen.has(number)) {
      seen.add(number);
      references.push({
        type: 'issue',
        number,
        fullText: match[0],
        lineNumber: countLinesBefore(text, match.index || 0),
      });
    }
  }

  return references;
}

/**
 * Parse GitHub pull request references from text
 * Looks for patterns like "PR #123", "pull request #456"
 *
 * @param text - Text content to parse
 * @returns Array of PR references with metadata
 */
export function parsePullRequestReferences(text: string): TextReference[] {
  if (!text) return [];

  const references: TextReference[] = [];
  const seen = new Set<number>();

  const prMatches = text.matchAll(REFERENCE_PATTERNS.pr);
  for (const match of prMatches) {
    const number = parseInt(match[1], 10);
    if (!seen.has(number)) {
      seen.add(number);
      references.push({
        type: 'pr',
        number,
        fullText: match[0],
        lineNumber: countLinesBefore(text, match.index || 0),
      });
    }
  }

  return references;
}

/**
 * Parse commit SHA references from text
 * Looks for 7-40 character hex strings that could be commit SHAs
 *
 * @param text - Text content to parse
 * @param minLength - Minimum SHA length to consider (default 7)
 * @returns Array of commit references with metadata
 */
export function parseCommitReferences(text: string, minLength = 7): TextReference[] {
  if (!text) return [];

  const references: TextReference[] = [];
  const seen = new Set<string>();

  // More specific pattern for commit SHAs
  const commitPattern = /(?:commit\s+)?([a-f0-9]{7,40})(?:\s|$|[,.\-:)\]])/gi;
  let match;

  while ((match = commitPattern.exec(text)) !== null) {
    const sha = match[1];

    if (!seen.has(sha) && sha.length >= minLength) {
      seen.add(sha);
      references.push({
        type: 'commit',
        sha,
        fullText: match[0],
        lineNumber: countLinesBefore(text, match.index || 0),
      });
    }
  }

  return references;
}

/**
 * Extract relationships from text references (PR body, commit message, comments)
 * Creates relationships based on parsed issue/PR/commit references
 *
 * @param sourceId - Source entity ID (PR, commit, comment, etc.)
 * @param sourceType - Type of source entity
 * @param text - Text content to parse
 * @param repositoryId - Repository ID
 * @param services - Database query services
 * @param additionalEvidenceDetails - Extra context about the relationship
 * @returns Array of extracted relationships
 */
export async function extractTextReferences(
  sourceId: string,
  sourceType: string,
  text: string,
  repositoryId: string,
  services: RelationshipServices,
  additionalEvidenceDetails?: {
    location: string; // e.g., "PR body", "commit message", "comment"
    context?: string;
  }
): Promise<ExtractedRelationship[]> {
  const relationships: ExtractedRelationship[] = [];

  // Parse issue references
  const issueRefs = parseIssueReferences(text);
  for (const ref of issueRefs) {
    const issue = await services.findIssue(repositoryId, ref.number || 0);

    if (issue) {
      // Determine relationship type based on context
      const isFixKeyword = text.includes(`fixes #${ref.number}`) ||
        text.includes(`closes #${ref.number}`) ||
        text.includes(`resolved #${ref.number}`) ||
        text.includes(`implements #${ref.number}`);

      const relationType = isFixKeyword ? RelationType.RESOLVED_BY : RelationType.REFERENCED_BY;

      relationships.push({
        repositoryId,
        sourceType,
        sourceId,
        relationType,
        targetType: 'issue',
        targetId: issue.id,
        confidence: isFixKeyword ? 0.95 : 0.85,
        evidenceJson: {
          category: RelationshipCategory.REFERENCED,
          evidenceCount: 1,
          evidenceTypes: ['text_reference'],
          evidenceDetails: [
            {
              type: 'text_reference',
              description: `Reference to issue #${ref.number} found in ${additionalEvidenceDetails?.location || 'content'}`,
              sourceLocation: {
                line: ref.lineNumber,
                lineContent: ref.fullText,
              },
              strength: isFixKeyword ? 'high' : 'medium',
            },
          ],
          createdAt: new Date().toISOString(),
        },
      });
    }
  }

  // Parse PR references
  const prRefs = parsePullRequestReferences(text);
  for (const ref of prRefs) {
    const pr = await services.findPullRequest(repositoryId, ref.number || 0);

    if (pr) {
      relationships.push({
        repositoryId,
        sourceType,
        sourceId,
        relationType: RelationType.REFERENCED_BY,
        targetType: 'pullRequest',
        targetId: pr.id,
        confidence: 0.8,
        evidenceJson: {
          category: RelationshipCategory.REFERENCED,
          evidenceCount: 1,
          evidenceTypes: ['text_reference'],
          evidenceDetails: [
            {
              type: 'text_reference',
              description: `Reference to PR #${ref.number} found in ${additionalEvidenceDetails?.location || 'content'}`,
              sourceLocation: {
                line: ref.lineNumber,
                lineContent: ref.fullText,
              },
              strength: 'medium',
            },
          ],
          createdAt: new Date().toISOString(),
        },
      });
    }
  }

  // Parse commit references
  const commitRefs = parseCommitReferences(text);
  for (const ref of commitRefs) {
    const commit = await services.findCommitBySha(repositoryId, ref.sha || '');

    if (commit) {
      relationships.push({
        repositoryId,
        sourceType,
        sourceId,
        relationType: RelationType.REFERENCED_BY,
        targetType: 'commit',
        targetId: commit.id,
        confidence: 0.75,
        evidenceJson: {
          category: RelationshipCategory.REFERENCED,
          evidenceCount: 1,
          evidenceTypes: ['text_reference'],
          evidenceDetails: [
            {
              type: 'text_reference',
              description: `Reference to commit ${ref.sha?.substring(0, 7)} found in ${additionalEvidenceDetails?.location || 'content'}`,
              sourceLocation: {
                line: ref.lineNumber,
                lineContent: ref.fullText,
              },
              strength: 'medium',
            },
          ],
          createdAt: new Date().toISOString(),
        },
      });
    }
  }

  return relationships;
}

/**
 * Extract relationships from pull request description and comments
 *
 * @param prId - Pull request ID
 * @param prNumber - Pull request number
 * @param body - PR description body
 * @param comments - Array of PR comments
 * @param repositoryId - Repository ID
 * @param services - Database query services
 * @returns Array of extracted relationships
 */
export async function extractPullRequestTextRelationships(
  prId: string,
  prNumber: number,
  body: string | null | undefined,
  comments: Array<{ id: string; body: string }> | undefined,
  repositoryId: string,
  services: RelationshipServices
): Promise<ExtractedRelationship[]> {
  const relationships: ExtractedRelationship[] = [];

  // Parse PR description
  if (body) {
    const descriptionRels = await extractTextReferences(
      prId,
      'pullRequest',
      body,
      repositoryId,
      services,
      { location: 'PR description' }
    );
    relationships.push(...descriptionRels);
  }

  // Parse PR comments
  if (comments && comments.length > 0) {
    for (const comment of comments) {
      const commentRels = await extractTextReferences(
        comment.id,
        'prComment',
        comment.body,
        repositoryId,
        services,
        { location: 'PR comment' }
      );
      relationships.push(...commentRels);
    }
  }

  return relationships;
}

/**
 * Extract relationships from commit message
 *
 * @param commitId - Commit ID
 * @param message - Commit message
 * @param repositoryId - Repository ID
 * @param services - Database query services
 * @returns Array of extracted relationships
 */
export async function extractCommitMessageRelationships(
  commitId: string,
  message: string,
  repositoryId: string,
  services: RelationshipServices
): Promise<ExtractedRelationship[]> {
  return extractTextReferences(
    commitId,
    'commit',
    message,
    repositoryId,
    services,
    { location: 'commit message' }
  );
}

/**
 * Extract relationships from issue description and comments
 *
 * @param issueId - Issue ID
 * @param issueNumber - Issue number
 * @param body - Issue description body
 * @param comments - Array of issue comments
 * @param repositoryId - Repository ID
 * @param services - Database query services
 * @returns Array of extracted relationships
 */
export async function extractIssueTextRelationships(
  issueId: string,
  issueNumber: number,
  body: string | null | undefined,
  comments: Array<{ id: string; body: string }> | undefined,
  repositoryId: string,
  services: RelationshipServices
): Promise<ExtractedRelationship[]> {
  const relationships: ExtractedRelationship[] = [];

  // Parse issue description
  if (body) {
    const descriptionRels = await extractTextReferences(
      issueId,
      'issue',
      body,
      repositoryId,
      services,
      { location: 'issue description' }
    );
    relationships.push(...descriptionRels);
  }

  // Parse issue comments
  if (comments && comments.length > 0) {
    for (const comment of comments) {
      const commentRels = await extractTextReferences(
        comment.id,
        'issueComment',
        comment.body,
        repositoryId,
        services,
        { location: 'issue comment' }
      );
      relationships.push(...commentRels);
    }
  }

  return relationships;
}

/**
 * Count number of lines before a given position in text
 * Helper function for line number calculation
 *
 * @param text - Full text content
 * @param position - Character position
 * @returns Line number (1-based)
 */
function countLinesBefore(text: string, position: number): number {
  return text.substring(0, position).split('\n').length;
}

/**
 * Detect if a reference is contextually indicating a fix/resolution
 * Used to determine appropriate relationship type
 *
 * @param text - Text containing the reference
 * @param referenceNumber - Issue or PR number
 * @returns True if reference appears to be a fix/resolution
 */
export function isFixReference(text: string, referenceNumber: number): boolean {
  const fixPattern = new RegExp(
    `(?:fix|fixes|fixed|close|closes|closed|resolve|resolves|resolved|implements)\\s+#${referenceNumber}`,
    'i'
  );
  return fixPattern.test(text);
}

/**
 * Validate if a SHA looks like a valid commit reference
 *
 * @param sha - Potential SHA string
 * @returns True if it appears to be a valid SHA
 */
export function isValidSha(sha: string): boolean {
  return /^[a-f0-9]{7,40}$/i.test(sha) && sha.length >= 7;
}
