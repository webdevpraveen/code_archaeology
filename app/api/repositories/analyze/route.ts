import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { parseGitHubUrl } from '@/lib/validation';
import { IndexingStatus } from '@/lib/validation';

/**
 * Analyze a GitHub repository
 * POST /api/repositories/analyze
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repositoryUrl, indexingDepth = 'STANDARD', githubToken } = body;

    if (!repositoryUrl) {
      return NextResponse.json(
        { success: false, error: 'Repository URL is required', code: 'MISSING_URL' },
        { status: 400 }
      );
    }

    // Parse URL
    const parsed = parseGitHubUrl(repositoryUrl);
    if (!parsed) {
      return NextResponse.json(
        { success: false, error: 'Invalid GitHub repository URL', code: 'INVALID_URL' },
        { status: 400 }
      );
    }

    const { owner, repo } = parsed;

    // Check if repository already exists
    let repository = await prisma.repository.findUnique({
      where: {
        fullName: `${owner}/${repo}`,
      },
    });

    if (repository) {
      // Return existing repository
      return NextResponse.json(
        {
          success: true,
          data: {
            id: repository.id,
            fullName: repository.fullName,
            indexingStatus: repository.indexingStatus,
          },
        },
        { status: 200 }
      );
    }

    // Create new repository record
    repository = await prisma.repository.create({
      data: {
        provider: 'github',
        owner,
        name: repo,
        fullName: `${owner}/${repo}`,
        htmlUrl: `https://github.com/${owner}/${repo}`,
        defaultBranch: 'main',
        visibility: 'public',
        indexingStatus: IndexingStatus.PENDING,
      },
    });

    // TODO: Queue indexing job
    // In production, this would dispatch to a background job queue (e.g., Bull, Celery, Temporal)
    // For now, we'll mark it as pending and the UI will poll for status

    return NextResponse.json(
      {
        success: true,
        data: {
          id: repository.id,
          fullName: repository.fullName,
          indexingStatus: IndexingStatus.PENDING,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[repositories/analyze] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
