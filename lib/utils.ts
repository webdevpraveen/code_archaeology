/**
 * Utility functions for Code Archaeology
 */

/**
 * Format date to readable string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format date with time
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format relative time (e.g., "2 months ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}mo ago`;
  return `${Math.floor(seconds / 31536000)}y ago`;
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, length: number = 100): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Get short SHA from full commit hash
 */
export function shortSha(sha: string): string {
  return sha.slice(0, 7);
}

/**
 * Parse GitHub repository URL
 */
export function parseRepositoryUrl(url: string): {
  owner: string;
  repo: string;
} | null {
  try {
    const urlObj = new URL(url);
    if (!urlObj.hostname.includes('github.com')) return null;

    const parts = urlObj.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;

    return {
      owner: parts[0],
      repo: parts[1],
    };
  } catch {
    return null;
  }
}

/**
 * Build GitHub URL for various entities
 */
export function buildGitHubUrl(
  owner: string,
  repo: string,
  entityType:
    | 'commit'
    | 'pull'
    | 'issues'
    | 'blob'
    | 'tree' = 'blob',
  ref: string = 'main',
  path: string = ''
): string {
  const base = `https://github.com/${owner}/${repo}`;

  switch (entityType) {
    case 'commit':
      return `${base}/commit/${ref}`;
    case 'pull':
      return `${base}/pull/${ref}`;
    case 'issues':
      return `${base}/issues/${ref}`;
    case 'blob':
      return `${base}/blob/${ref}/${path}`;
    case 'tree':
      return `${base}/tree/${ref}/${path}`;
    default:
      return base;
  }
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return function executedFunction(...args: Parameters<T>) {
    const now = Date.now();
    if (now - lastCall > limit) {
      lastCall = now;
      func(...args);
    }
  };
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as T;
  if (obj instanceof Array) return obj.map((item) => deepClone(item)) as T;
  if (obj instanceof Object) {
    const cloned = {} as T;
    for (const key in obj) {
      cloned[key] = deepClone(obj[key]);
    }
    return cloned;
  }
  return obj;
}

/**
 * Create entity identity
 */
export function createEntityId(
  type: string,
  owner: string,
  repo: string,
  identifier: string
): string {
  return `${type}:${owner}/${repo}#${identifier}`;
}

/**
 * Extract numeric ID from GitHub reference
 */
export function extractNumber(ref: string): number | null {
  const match = ref.match(/#(\d+)/);
  return match ? parseInt(match[1]) : null;
}

/**
 * Sanitize text for display (remove excessive whitespace)
 */
export function sanitizeText(text: string): string {
  return text
    .trim()
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\t/g, '  ');
}

/**
 * Check if URL is from github.com
 */
export function isGitHubUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'github.com' || urlObj.hostname === 'www.github.com';
  } catch {
    return false;
  }
}

/**
 * Extract markdown links from text
 */
export function extractMarkdownLinks(text: string): Array<{ label: string; url: string }> {
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const links = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    links.push({
      label: match[1],
      url: match[2],
    });
  }

  return links;
}

/**
 * Calculate statistics from arrays
 */
export function calculateStats(numbers: number[]): {
  min: number;
  max: number;
  mean: number;
  median: number;
  total: number;
} {
  if (numbers.length === 0) {
    return { min: 0, max: 0, mean: 0, median: 0, total: 0 };
  }

  const sorted = [...numbers].sort((a, b) => a - b);
  const sum = numbers.reduce((a, b) => a + b, 0);
  const mean = sum / numbers.length;
  const median =
    numbers.length % 2 === 0
      ? (sorted[numbers.length / 2 - 1] + sorted[numbers.length / 2]) / 2
      : sorted[Math.floor(numbers.length / 2)];

  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean,
    median,
    total: sum,
  };
}

/**
 * Group array by property
 */
export function groupBy<T>(
  arr: T[],
  keyFn: (item: T) => string | number
): Record<string | number, T[]> {
  return arr.reduce(
    (groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
      return groups;
    },
    {} as Record<string | number, T[]>
  );
}

/**
 * Unique array elements
 */
export function unique<T>(arr: T[], keyFn?: (item: T) => string): T[] {
  if (!keyFn) return [...new Set(arr)];

  const seen = new Set<string>();
  return arr.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Flatten nested array
 */
export function flatten<T>(arr: Array<T | T[]>): T[] {
  return arr.reduce((flat, item) => {
    return flat.concat(Array.isArray(item) ? flatten(item) : item);
  }, [] as T[]);
}

/**
 * Create a range of numbers
 */
export function range(start: number, end: number, step: number = 1): number[] {
  const result = [];
  for (let i = start; i < end; i += step) {
    result.push(i);
  }
  return result;
}

/**
 * Build query string from object
 */
export function buildQueryString(
  params: Record<string, string | number | boolean | undefined>
): string {
  const filtered = Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

  return filtered ? '?' + filtered : '';
}
