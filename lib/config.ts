/**
 * Environment configuration with validation
 */

export interface AppConfig {
  github: {
    token?: string;
    apiUrl: string;
  };
  groq: {
    apiKey: string;
    analysisModel: string;
    fastModel: string;
  };
  database: {
    url: string;
  };
  app: {
    url: string;
    env: 'development' | 'production' | 'test';
    isDev: boolean;
  };
}

/**
 * Validate required environment variables
 */
function validateEnv(): AppConfig {
  const missingVars: string[] = [];

  // Check required variables
  if (!process.env.GROQ_API_KEY) missingVars.push('GROQ_API_KEY');
  if (!process.env.DATABASE_URL) missingVars.push('DATABASE_URL');

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      `Please check your .env.local file and ensure all required variables are set.`
    );
  }

  const env = (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test';

  return {
    github: {
      token: process.env.GITHUB_TOKEN,
      apiUrl: 'https://api.github.com',
    },
    groq: {
      apiKey: process.env.GROQ_API_KEY,
      analysisModel: process.env.GROQ_ANALYSIS_MODEL || 'openai/gpt-oss-120b',
      fastModel: process.env.GROQ_FAST_MODEL || 'openai/gpt-oss-20b',
    },
    database: {
      url: process.env.DATABASE_URL,
    },
    app: {
      url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      env,
      isDev: env === 'development',
    },
  };
}

let config: AppConfig | null = null;

/**
 * Get application configuration (singleton)
 */
export function getConfig(): AppConfig {
  if (!config) {
    config = validateEnv();
  }
  return config;
}

/**
 * Reset config (for testing)
 */
export function resetConfig(): void {
  config = null;
}
