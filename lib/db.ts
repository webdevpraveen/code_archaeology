import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production')
  globalForPrisma.prisma = prisma;

/**
 * Ensure database is connected
 */
export async function ensureDatabaseConnected(): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

/**
 * Close database connection (for cleanup)
 */
export async function closeDatabaseConnection(): Promise<void> {
  await prisma.$disconnect();
}
