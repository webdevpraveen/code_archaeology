import { prisma } from '@/lib/db';

export interface Evidence {
  type: 'commit' | 'pr' | 'issue' | 'review' | 'file' | 'timeline';
  id: string;
  url?: string;
  content?: string;
  metadata?: Record<string, any>;
}

export interface EvidencePack {
  repository: {
    fullName: string;
    description?: string;
    language?: string;
    stars: number;
  };
  question: string;
  primaryEntity?: {
    type: string;
    id: string;
    name: string;
  };
  evidence: Evidence[];
  timeline?: Array<{
    date: Date;
    event: string;
    entities: string[];
  }>;
  relationships?: Array<{
    source: string;
    target: string;
    type: string;
    evidence: string[];
  }>;
}

/**
 * Build a focused evidence pack for AI analysis
 * Only includes relevant, de-duplicated evidence
 */
export async function buildEvidencePack(
  repositoryId: string,
  question: string,
  entityType?: string,
  entityId?: string
): Promise<EvidencePack> {
  // Fetch repository
  const repository = await prisma.repository.findUnique({
    where: { id: repositoryId },
  });

  if (!repository) {
    throw new Error(`Repository ${repositoryId} not found`);
  }

  const evidence: Evidence[] = [];
  const evidenceSet = new Set<string>();

  /**
   * Helper: Add evidence if not duplicate
   */
  const addEvidence = (ev: Evidence) => {
    const key = `${ev.type}:${ev.id}`;
    if (!evidenceSet.has(key)) {
      evidence.push(ev);
      evidenceSet.add(key);
    }
  };

  // If specific entity is provided, build evidence chain for it
  if (entityType && entityId) {
    await buildEntityEvidenceChain(
      repositoryId,
      entityType,
      entityId,
      addEvidence
    );
  } else {
    // Otherwise, retrieve evidence based on question keywords
    await buildQuestionBasedEvidence(
      repositoryId,
      question,
      addEvidence
    );
  }

  // Build relationship map
  const relationships = await buildRelationshipContext(
    repositoryId,
    evidence
  );

  // Build timeline
  const timeline = buildTimeline(evidence);

  return {
    repository: {
      fullName: repository.fullName,
      description: repository.description || undefined,
      language: repository.language || undefined,
      stars: repository.stars,
    },
    question,
    primaryEntity:
      entityType && entityId
        ? {
            type: entityType,
            id: entityId,
            name: entityId, // In real app, fetch actual name
          }
        : undefined,
    evidence,
    timeline,
    relationships,
  };
}

/**
 * Build evidence chain for a specific entity
 */
async function buildEntityEvidenceChain(
  repositoryId: string,
  entityType: string,
  entityId: string,
  addEvidence: (ev: Evidence) => void
): Promise<void> {
  switch (entityType) {
    case 'file': {
      // File → introducing commit → PR → issue
      const fileArtifact = await prisma.fileArtifact.findUnique({
        where: { id: entityId },
      });

      if (fileArtifact) {
        addEvidence({
          type: 'file',
          id: entityId,
          content: fileArtifact.path,
        });

        // Find introducing commit
        const introducingCommit = await prisma.commit.findFirst({
          where: {
            repositoryId,
            commitFiles: {
              some: {
                path: fileArtifact.path,
                status: 'added',
              },
            },
          },
          orderBy: { authoredAt: 'asc' },
          take: 1,
        });

        if (introducingCommit) {
          addEvidence({
            type: 'commit',
            id: introducingCommit.id,
            content: introducingCommit.message,
          });

          // Find related PR
          const relatedPr = await prisma.pullRequest.findFirst({
            where: {
              repositoryId,
              mergeCommitSha: introducingCommit.sha,
            },
            take: 1,
          });

          if (relatedPr) {
            addEvidence({
              type: 'pr',
              id: relatedPr.id,
              content: relatedPr.title,
            });

            // Find related issue
            const referenceMatch = relatedPr.body?.match(/#(\d+)/);
            if (referenceMatch) {
              const issue = await prisma.issue.findFirst({
                where: {
                  repositoryId,
                  number: parseInt(referenceMatch[1]),
                },
                take: 1,
              });

              if (issue) {
                addEvidence({
                  type: 'issue',
                  id: issue.id,
                  content: issue.title,
                });
              }
            }
          }
        }

        // Recent modifications
        const recentModifications = await prisma.commitFile.findMany({
          where: {
            path: fileArtifact.path,
            commit: { repositoryId },
          },
          orderBy: { commit: { authoredAt: 'desc' } },
          take: 5,
          include: { commit: true },
        });

        for (const mod of recentModifications) {
          addEvidence({
            type: 'commit',
            id: mod.commit.id,
            content: `Modified: ${mod.commit.message}`,
          });
        }
      }
      break;
    }

    case 'commit': {
      // Commit → files → related PRs
      const commit = await prisma.commit.findUnique({
        where: { id: entityId },
        include: { commitFiles: true },
      });

      if (commit) {
        addEvidence({
          type: 'commit',
          id: commit.id,
          content: commit.message,
        });

        // Related files
        for (const file of commit.commitFiles.slice(0, 10)) {
          addEvidence({
            type: 'file',
            id: file.id,
            content: file.path,
          });
        }

        // Related PR
        const pr = await prisma.pullRequest.findFirst({
          where: {
            repositoryId,
            mergeCommitSha: commit.sha,
          },
        });

        if (pr) {
          addEvidence({
            type: 'pr',
            id: pr.id,
            content: pr.title,
          });
        }
      }
      break;
    }

    case 'pr': {
      // PR → commits → files → reviews → issues
      const pr = await prisma.pullRequest.findUnique({
        where: { id: entityId },
      });

      if (pr) {
        addEvidence({
          type: 'pr',
          id: pr.id,
          content: pr.title,
        });

        // Reviews
        const reviews = await prisma.pullRequestReview.findMany({
          where: { pullRequestId: entityId },
          take: 10,
        });

        for (const review of reviews) {
          addEvidence({
            type: 'review',
            id: review.id,
            content: `Review by ${review.authorLogin}: ${review.state}`,
          });
        }

        // Comments
        const comments = await prisma.pullRequestComment.findMany({
          where: { pullRequestId: entityId },
          take: 10,
        });

        for (const comment of comments) {
          addEvidence({
            type: 'pr',
            id: comment.id,
            content: `Comment: ${comment.body}`,
          });
        }

        // Related issue (from body references)
        const referenceMatch = pr.body?.match(/#(\d+)/);
        if (referenceMatch) {
          const issue = await prisma.issue.findFirst({
            where: {
              repositoryId,
              number: parseInt(referenceMatch[1]),
            },
          });

          if (issue) {
            addEvidence({
              type: 'issue',
              id: issue.id,
              content: issue.title,
            });
          }
        }
      }
      break;
    }

    case 'issue': {
      // Issue → comments → related PRs
      const issue = await prisma.issue.findUnique({
        where: { id: entityId },
      });

      if (issue) {
        addEvidence({
          type: 'issue',
          id: issue.id,
          content: issue.title,
        });

        // Comments
        const comments = await prisma.issueComment.findMany({
          where: { issueId: entityId },
          take: 10,
        });

        for (const comment of comments) {
          addEvidence({
            type: 'issue',
            id: comment.id,
            content: `Comment: ${comment.body}`,
          });
        }

        // Find related PRs (via body references)
        const prs = await prisma.pullRequest.findMany({
          where: {
            repositoryId,
            body: {
              contains: `#${issue.number}`,
            },
          },
          take: 10,
        });

        for (const pr of prs) {
          addEvidence({
            type: 'pr',
            id: pr.id,
            content: pr.title,
          });
        }
      }
      break;
    }
  }
}

/**
 * Build evidence based on question keywords
 */
async function buildQuestionBasedEvidence(
  repositoryId: string,
  question: string,
  addEvidence: (ev: Evidence) => void
): Promise<void> {
  const lowerQuestion = question.toLowerCase();

  // Extract PR/issue numbers
  const numberMatches = question.match(/#(\d+)/g);
  if (numberMatches) {
    for (const match of numberMatches) {
      const num = parseInt(match.slice(1));

      // Try PR first
      const pr = await prisma.pullRequest.findFirst({
        where: { repositoryId, number: num },
      });
      if (pr) {
        addEvidence({
          type: 'pr',
          id: pr.id,
          content: pr.title,
        });
        continue;
      }

      // Then issue
      const issue = await prisma.issue.findFirst({
        where: { repositoryId, number: num },
      });
      if (issue) {
        addEvidence({
          type: 'issue',
          id: issue.id,
          content: issue.title,
        });
      }
    }
  }

  // Extract commit SHAs
  const shaMatches = question.match(/\b[a-f0-9]{7,40}\b/g);
  if (shaMatches) {
    for (const sha of shaMatches) {
      const commit = await prisma.commit.findFirst({
        where: {
          repositoryId,
          sha: { startsWith: sha },
        },
      });
      if (commit) {
        addEvidence({
          type: 'commit',
          id: commit.id,
          content: commit.message,
        });
      }
    }
  }

  // Keyword-based retrieval
  if (lowerQuestion.includes('introduced') || lowerQuestion.includes('created')) {
    const recentCommits = await prisma.commit.findMany({
      where: { repositoryId },
      orderBy: { authoredAt: 'desc' },
      take: 10,
    });

    for (const commit of recentCommits) {
      addEvidence({
        type: 'commit',
        id: commit.id,
        content: commit.message,
      });
    }
  }

  if (
    lowerQuestion.includes('refactor') ||
    lowerQuestion.includes('changed') ||
    lowerQuestion.includes('modified')
  ) {
    const largeCommits = await prisma.commit.findMany({
      where: { repositoryId },
      orderBy: { changedFiles: 'desc' },
      take: 10,
    });

    for (const commit of largeCommits) {
      addEvidence({
        type: 'commit',
        id: commit.id,
        content: commit.message,
      });
    }
  }

  if (lowerQuestion.includes('merged') || lowerQuestion.includes('review')) {
    const mergedPrs = await prisma.pullRequest.findMany({
      where: { repositoryId, merged: true },
      orderBy: { mergedAt: 'desc' },
      take: 10,
    });

    for (const pr of mergedPrs) {
      addEvidence({
        type: 'pr',
        id: pr.id,
        content: pr.title,
      });
    }
  }

  if (lowerQuestion.includes('issue') || lowerQuestion.includes('bug')) {
    const issues = await prisma.issue.findMany({
      where: { repositoryId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    for (const issue of issues) {
      addEvidence({
        type: 'issue',
        id: issue.id,
        content: issue.title,
      });
    }
  }
}

/**
 * Build relationship context for evidence
 */
async function buildRelationshipContext(
  repositoryId: string,
  evidence: Evidence[]
): Promise<
  Array<{
    source: string;
    target: string;
    type: string;
    evidence: string[];
  }>
> {
  const relationships = await prisma.relationship.findMany({
    where: {
      repositoryId,
      OR: [
        { sourceId: { in: evidence.map((e) => e.id) } },
        { targetId: { in: evidence.map((e) => e.id) } },
      ],
    },
    take: 50,
  });

  return relationships.map((rel) => ({
    source: rel.sourceId,
    target: rel.targetId,
    type: rel.relationType,
    evidence: rel.evidenceJson?.evidenceList || [],
  }));
}

/**
 * Build timeline from evidence
 */
function buildTimeline(
  evidence: Evidence[]
): Array<{
  date: Date;
  event: string;
  entities: string[];
}> {
  const timelineEvents: Array<{
    date: Date;
    event: string;
    entities: string[];
  }> = [];

  // In real implementation, would extract dates from evidence metadata
  // For now, return empty timeline - this is skeleton
  return timelineEvents;
}

/**
 * Format evidence pack as string for AI prompt
 */
export function formatEvidencePackForAI(pack: EvidencePack): string {
  let formatted = '';

  formatted += `## REPOSITORY\n${pack.repository.fullName}\n\n`;

  if (pack.repository.description) {
    formatted += `Description: ${pack.repository.description}\n`;
  }

  if (pack.repository.language) {
    formatted += `Language: ${pack.repository.language}\n`;
  }

  formatted += `Stars: ${pack.repository.stars}\n\n`;

  formatted += `## QUESTION\n${pack.question}\n\n`;

  if (pack.primaryEntity) {
    formatted += `## PRIMARY ENTITY\n`;
    formatted += `Type: ${pack.primaryEntity.type}\n`;
    formatted += `Name: ${pack.primaryEntity.name}\n\n`;
  }

  formatted += `## EVIDENCE\n`;
  for (const ev of pack.evidence) {
    formatted += `- [${ev.type.toUpperCase()}] ${ev.id}: ${ev.content || ''}\n`;
  }

  if (pack.relationships && pack.relationships.length > 0) {
    formatted += `\n## RELATIONSHIPS\n`;
    for (const rel of pack.relationships) {
      formatted += `- ${rel.source} → [${rel.type}] → ${rel.target}\n`;
    }
  }

  return formatted;
}
