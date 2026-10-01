import { z } from 'zod';

// Repository URL validation
export const repositoryUrlSchema = z.string()
  .url('Must be a valid URL')
  .refine(
    (url) => url.includes('github.com'),
    'Must be a GitHub repository URL'
  )
  .refine(
    (url) => {
      const match = url.match(/github\.com\/([^/]+)\/([^//?#]+)/);
      return !!match;
    },
    'URL must be in format: https://github.com/owner/repository'
  );

// Parse GitHub URL
export const parseGitHubUrl = (url: string): { owner: string; repo: string } | null => {
  const match = url.match(/github\.com\/([^/]+)\/([^//?#]+)/);
  if (!match) return null;
  return {
    owner: match[1],
    repo: match[2],
  };
};

// GitHub entity schemas
export const commitSchema = z.object({
  sha: z.string(),
  message: z.string(),
  authorLogin: z.string().optional(),
  authorName: z.string().optional(),
  committerLogin: z.string().optional(),
  committedAt: z.date(),
  authoredAt: z.date().optional(),
  additions: z.number().default(0),
  deletions: z.number().default(0),
  changedFiles: z.number().default(0),
  htmlUrl: z.string().url(),
});

export const pullRequestSchema = z.object({
  number: z.number(),
  title: z.string(),
  body: z.string().optional(),
  authorLogin: z.string(),
  state: z.enum(['open', 'closed']),
  draft: z.boolean().default(false),
  merged: z.boolean().default(false),
  mergeCommitSha: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  closedAt: z.date().optional(),
  mergedAt: z.date().optional(),
  htmlUrl: z.string().url(),
});

export const issueSchema = z.object({
  number: z.number(),
  title: z.string(),
  body: z.string().optional(),
  authorLogin: z.string(),
  state: z.enum(['open', 'closed']),
  createdAt: z.date(),
  updatedAt: z.date(),
  closedAt: z.date().optional(),
  htmlUrl: z.string().url(),
});

export const reviewSchema = z.object({
  state: z.enum(['APPROVED', 'CHANGES_REQUESTED', 'COMMENTED', 'DISMISSED']),
  authorLogin: z.string(),
  body: z.string().optional(),
  commitSha: z.string(),
  submittedAt: z.date(),
  htmlUrl: z.string().url(),
});

export const fileSchema = z.object({
  path: z.string(),
  status: z.enum(['added', 'removed', 'modified', 'renamed', 'copied', 'unchanged', 'untracked']),
  additions: z.number().default(0),
  deletions: z.number().default(0),
  changes: z.number().default(0),
});

export const repositorySchema = z.object({
  owner: z.string(),
  name: z.string(),
  fullName: z.string(),
  description: z.string().optional(),
  htmlUrl: z.string().url(),
  defaultBranch: z.string(),
  visibility: z.enum(['public', 'private']),
  language: z.string().optional(),
  stars: z.number().default(0),
  forks: z.number().default(0),
  openIssuesCount: z.number().default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
  pushedAt: z.date().optional(),
});

// AI Analysis schemas
export const evidenceSchema = z.object({
  type: z.enum(['commit', 'pr', 'issue', 'review', 'file', 'timeline']),
  id: z.string(),
  url: z.string().url().optional(),
  reason: z.string(),
});

export const factSchema = z.object({
  text: z.string(),
  sourceType: z.enum(['commit', 'pr', 'issue', 'review', 'file', 'timeline']),
  sourceId: z.string(),
});

export const inferenceSchema = z.object({
  text: z.string(),
  basis: z.array(z.string()),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
});

export const aiAnalysisResponseSchema = z.object({
  answer: z.string(),
  summary: z.string().optional(),
  facts: z.array(factSchema).default([]),
  inferences: z.array(inferenceSchema).default([]),
  unknowns: z.array(z.string()).default([]),
  relatedEntities: z.array(z.object({
    type: z.enum(['commit', 'pr', 'issue', 'review', 'file', 'contributor']),
    id: z.string(),
  })).default([]),
  evidence: z.array(evidenceSchema).default([]),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
});

// Request/Response schemas for API
export const analyzeRepositoryRequestSchema = z.object({
  repositoryUrl: repositoryUrlSchema,
  indexingDepth: z.enum(['QUICK', 'STANDARD', 'DEEP']).default('STANDARD'),
  githubToken: z.string().optional(),
});

export const askRepositoryRequestSchema = z.object({
  repositoryId: z.string(),
  question: z.string().min(5, 'Question must be at least 5 characters'),
  sessionId: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
});

export const investigateEntityRequestSchema = z.object({
  repositoryId: z.string(),
  entityType: z.enum(['file', 'commit', 'pr', 'issue']),
  entityId: z.string(),
  sessionId: z.string().optional(),
});

// API Response schemas
export const successResponseSchema = z.object({
  success: z.literal(true),
  data: z.any(),
});

export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
  details: z.any().optional(),
});

export const apiResponseSchema = z.union([
  successResponseSchema,
  errorResponseSchema,
]);

// Relationship schema
export const relationshipSchema = z.object({
  sourceType: z.enum(['commit', 'pr', 'issue', 'file', 'contributor', 'release']),
  sourceId: z.string(),
  relationType: z.enum(['linked_to', 'contains', 'modified', 'reviewed_by', 'resolved_by', 'referenced_by', 'introduced_in', 'changed_in', 'related_to']),
  targetType: z.enum(['commit', 'pr', 'issue', 'file', 'contributor', 'release']),
  targetId: z.string(),
  relationshipCategory: z.enum(['DIRECT', 'REFERENCED', 'TEMPORAL', 'SEMANTIC']),
  confidence: z.number().min(0).max(1),
  evidenceJson: z.record(z.any()).optional(),
});

// Indexing status
export enum IndexingStatus {
  PENDING = 'PENDING',
  DISCOVERING = 'DISCOVERING',
  COLLECTING = 'COLLECTING',
  CONNECTING = 'CONNECTING',
  INTERPRETING = 'INTERPRETING',
  READY = 'READY',
  FAILED = 'FAILED',
}

export const indexingStatusSchema = z.object({
  status: z.nativeEnum(IndexingStatus),
  progress: z.number().min(0).max(100),
  message: z.string(),
  repositoryId: z.string(),
});
