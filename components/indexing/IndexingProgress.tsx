'use client';

import React, { useEffect, useState } from 'react';
import { StageIndicator } from './StageIndicator';
import { ProgressBar } from './ProgressBar';
import { StatusMessage } from './StatusMessage';
import { EstimatedTime } from './EstimatedTime';

export type IndexingStage = 'DISCOVER' | 'COLLECT' | 'CONNECT' | 'INTERPRET' | 'READY';

export interface IndexingStatus {
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  stage: IndexingStage;
  message: string;
  startedAt?: string;
  estimatedCompletionTime?: number;
  error?: string;
}

interface IndexingProgressProps {
  repositoryId: string;
  repositoryName: string;
  onComplete?: () => void;
  onError?: (error: string) => void;
  autoRedirect?: boolean;
  redirectUrl?: string;
}

const POLL_INTERVAL = 5000; // 5 seconds

const STAGE_DESCRIPTIONS: Record<IndexingStage, string> = {
  DISCOVER: 'Finding repository metadata…',
  COLLECT: 'Gathering commits, PRs, issues…',
  CONNECT: 'Building relationships…',
  INTERPRET: 'Generating historical context…',
  READY: 'Archaeology ready!',
};

export function IndexingProgress({
  repositoryId,
  repositoryName,
  onComplete,
  onError,
  autoRedirect = true,
  redirectUrl,
}: IndexingProgressProps) {
  const [indexingStatus, setIndexingStatus] = useState<IndexingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [completedStages, setCompletedStages] = useState<Set<IndexingStage>>(new Set());

  // Fetch initial status and start indexing if needed
  useEffect(() => {
    const startIndexing = async () => {
      try {
        setIsLoading(true);

        // First, try to get current status
        const statusResponse = await fetch(
          `/api/repositories/${repositoryId}/status`
        );

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          setIndexingStatus(statusData.data);

          // If already complete, redirect immediately
          if (statusData.data.status === 'completed' && autoRedirect && redirectUrl) {
            setTimeout(() => window.location.href = redirectUrl, 1500);
          }
        } else if (statusResponse.status === 404) {
          // Start new indexing if no status exists
          const startResponse = await fetch(
            `/api/repositories/${repositoryId}/start-indexing`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                repositoryId,
                indexingDepth: 'STANDARD',
              }),
            }
          );

          if (startResponse.ok) {
            const startData = await startResponse.json();
            setIndexingStatus(startData.data);
          } else {
            throw new Error('Failed to start indexing');
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize indexing';
        setError(errorMessage);
        onError?.(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    startIndexing();
  }, [repositoryId, autoRedirect, redirectUrl, onError]);

  // Poll for status updates
  useEffect(() => {
    if (!indexingStatus || indexingStatus.status === 'completed' || indexingStatus.status === 'failed') {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/repositories/${repositoryId}/status`);

        if (response.ok) {
          const data = await response.json();
          const newStatus = data.data as IndexingStatus;

          // Track completed stages
          if (newStatus.stage && completedStages.has(indexingStatus.stage)) {
            setCompletedStages(new Set(completedStages));
          }

          setIndexingStatus(newStatus);

          // Handle completion
          if (newStatus.status === 'completed') {
            onComplete?.();
            if (autoRedirect && redirectUrl) {
              setTimeout(() => window.location.href = redirectUrl, 1500);
            }
          }

          // Handle failure
          if (newStatus.status === 'failed') {
            const errorMsg = newStatus.error || 'Indexing failed';
            setError(errorMsg);
            onError?.(errorMsg);
          }
        }
      } catch (err) {
        console.error('Error polling indexing status:', err);
      }
    }, POLL_INTERVAL);

    return () => clearInterval(pollInterval);
  }, [indexingStatus, repositoryId, autoRedirect, redirectUrl, onComplete, onError, completedStages]);

  // Handle stage transitions
  useEffect(() => {
    if (indexingStatus?.stage && !completedStages.has(indexingStatus.stage)) {
      const newCompleted = new Set(completedStages);
      if (indexingStatus.status === 'in_progress' || indexingStatus.status === 'completed') {
        // Mark previous stages as completed (approximate logic)
        const stageOrder: IndexingStage[] = ['DISCOVER', 'COLLECT', 'CONNECT', 'INTERPRET', 'READY'];
        const currentIndex = stageOrder.indexOf(indexingStatus.stage);
        stageOrder.slice(0, currentIndex).forEach(stage => newCompleted.add(stage));
      }
      setCompletedStages(newCompleted);
    }
  }, [indexingStatus?.stage, completedStages]);

  const handleCancel = async () => {
    try {
      setIsCancelling(true);
      const response = await fetch(`/api/repositories/${repositoryId}/cancel-indexing`, {
        method: 'POST',
      });

      if (response.ok) {
        setIndexingStatus(prev => prev ? { ...prev, status: 'cancelled' } : null);
      }
    } catch (err) {
      console.error('Error cancelling indexing:', err);
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-col-center min-h-screen w-full space-y-8 py-12 px-4">
        <div className="w-full max-w-2xl space-y-8">
          {/* Header Skeleton */}
          <div className="space-y-4 text-center">
            <div className="h-10 w-48 mx-auto bg-muted animate-pulse rounded-lg" />
            <div className="h-5 w-64 mx-auto bg-muted animate-pulse rounded-lg" />
          </div>

          {/* Progress Skeleton */}
          <div className="space-y-4">
            <div className="h-2 w-full bg-muted animate-pulse rounded-full" />
            <div className="flex justify-between">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 w-16 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          </div>

          {/* Status Skeleton */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-muted animate-pulse rounded-lg" />
            <div className="h-4 w-3/4 bg-muted animate-pulse rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !indexingStatus) {
    return (
      <div className="flex-col-center min-h-screen w-full space-y-6 py-12 px-4">
        <div className="w-full max-w-2xl space-y-6 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-destructive/20">
            <svg className="h-6 w-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Failed to Initialize Indexing</h1>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary px-6 py-2"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!indexingStatus) {
    return null;
  }

  const isComplete = indexingStatus.status === 'completed';
  const isFailed = indexingStatus.status === 'failed';
  const isCancelled = indexingStatus.status === 'cancelled';

  return (
    <div className="flex-col-center min-h-screen w-full space-y-8 py-12 px-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-bold text-foreground animate-fade-in">
            Preparing Archaeology
          </h1>
          <p className="text-lg text-muted-foreground animate-fade-in" style={{ animationDelay: '0.1s' }}>
            {repositoryName}
          </p>
        </div>

        {/* Progress Bar */}
        <ProgressBar
          progress={indexingStatus.progress}
          isComplete={isComplete}
          isFailed={isFailed}
          isCancelled={isCancelled}
        />

        {/* Stage Indicator */}
        <StageIndicator
          currentStage={indexingStatus.stage}
          completedStages={completedStages}
          stageDescriptions={STAGE_DESCRIPTIONS}
        />

        {/* Status Message */}
        <StatusMessage
          message={indexingStatus.message}
          stage={indexingStatus.stage}
          status={indexingStatus.status}
          error={indexingStatus.error}
        />

        {/* Estimated Time */}
        {!isComplete && !isFailed && !isCancelled && indexingStatus.startedAt && (
          <EstimatedTime
            startedAt={indexingStatus.startedAt}
            estimatedCompletionTime={indexingStatus.estimatedCompletionTime}
            progress={indexingStatus.progress}
          />
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center pt-4">
          {!isComplete && !isFailed && !isCancelled && (
            <button
              onClick={handleCancel}
              disabled={isCancelling}
              className="btn-ghost px-6 py-2 text-destructive hover:bg-destructive/10"
            >
              {isCancelling ? 'Cancelling…' : 'Cancel'}
            </button>
          )}

          {isComplete && redirectUrl && (
            <button
              onClick={() => window.location.href = redirectUrl}
              className="btn-primary px-8 py-2"
            >
              View Repository
            </button>
          )}

          {isFailed && (
            <button
              onClick={() => window.location.reload()}
              className="btn-primary px-8 py-2"
            >
              Retry
            </button>
          )}
        </div>

        {/* Status Badge */}
        {(isComplete || isFailed || isCancelled) && (
          <div className="text-center pt-4">
            {isComplete && (
              <div className="inline-flex items-center gap-2 badge-success">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Indexing Complete
              </div>
            )}
            {isFailed && (
              <div className="inline-flex items-center gap-2 badge-error">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Indexing Failed
              </div>
            )}
            {isCancelled && (
              <div className="inline-flex items-center gap-2 badge-warning">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Indexing Cancelled
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
