'use client';

import { useState } from 'react';
import { ArrowRight, GitBranch, Search } from 'lucide-react';
import { repositoryUrlSchema } from '@/lib/validation';

export default function Home() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate URL
    const result = repositoryUrlSchema.safeParse(url);
    if (!result.success) {
      setError('Please enter a valid GitHub repository URL');
      return;
    }

    setIsLoading(true);

    try {
      // Analyze repository
      const response = await fetch('/api/repositories/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repositoryUrl: result.data,
          indexingDepth: 'STANDARD',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze repository');
      }

      const data = await response.json();

      if (data.success) {
        // Navigate to repository explorer
        window.location.href = `/app/repository/${data.data.id}`;
      } else {
        setError(data.error || 'Failed to analyze repository');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-20">
      {/* Hero Section */}
      <div className="w-full max-w-3xl text-center mb-12 animate-fade-in">
        <div className="mb-6 flex justify-center">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <GitBranch className="w-8 h-8 text-primary" />
          </div>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold mb-4 text-foreground tracking-tight">
          Code Archaeology
        </h1>

        <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
          Historical intelligence for software repositories.
        </p>

        <p className="text-lg text-muted-foreground/80 mb-12">
          GitHub tells developers what changed. Code Archaeology helps developers
          understand the{' '}
          <span className="text-accent font-semibold">story behind those changes</span>.
        </p>
      </div>

      {/* Input Section */}
      <div className="w-full max-w-2xl mb-12">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="url"
              placeholder="Paste a GitHub repository URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="input-base pl-12 text-lg h-14"
              disabled={isLoading}
              required
            />
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-slide-up">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full h-14 text-base font-semibold flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                Begin Archaeology
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-muted-foreground text-sm mt-6">
          Discover commits, PRs, issues, reviews, files and the relationships that shaped the
          codebase.
        </p>
      </div>

      {/* Example Repositories */}
      <div className="w-full max-w-2xl">
        <p className="text-center text-muted-foreground text-sm mb-4">Try with popular repos:</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { owner: 'vercel', repo: 'next.js', name: 'Next.js' },
            { owner: 'facebook', repo: 'react', name: 'React' },
            { owner: 'torvalds', repo: 'linux', name: 'Linux' },
          ].map(({ owner, repo, name }) => (
            <button
              key={repo}
              onClick={() => setUrl(`https://github.com/${owner}/${repo}`)}
              className="card-hover text-sm"
            >
              <div className="font-semibold text-foreground mb-1">{name}</div>
              <div className="text-xs text-muted-foreground">{owner}/{repo}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-20 text-center text-muted-foreground text-sm">
        <p>
          Built for developers who want to understand{' '}
          <span className="text-accent font-semibold">the story behind their code</span>.
        </p>
      </div>
    </main>
  );
}