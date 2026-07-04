/**
 * lib/db.ts
 * Production singleton Prisma client.
 *
 * Strategy:
 *  - In production: a single PrismaClient is created once per process.
 *    PgBouncer / connection pooling is expected to sit in front; the client
 *    itself keeps a small internal pool controlled by the connection string
 *    `?connection_limit=N&pool_timeout=10`.
 *  - In development: the instance is cached on `globalThis` to survive
 *    Next.js hot module replacement without leaking connections.
 *
 * Usage: import { db } from '@/lib/db'
 */

import { PrismaClient, Prisma } from '@prisma/client';

// ── Log levels ─────────────────────────────────────────────────────────────
const LOG_LEVELS: Prisma.LogLevel[] =
  process.env.NODE_ENV === 'production'
    ? ['error']
    : ['query', 'warn', 'error'];

// ── Client factory ─────────────────────────────────────────────────────────
function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: LOG_LEVELS,
    errorFormat: process.env.NODE_ENV === 'production' ? 'minimal' : 'pretty',
  });

  // Soft shutdown: gracefully disconnect on termination signals
  if (typeof process !== 'undefined') {
    const shutdown = async (signal: string) => {
      console.info(`[db] ${signal} received — disconnecting Prisma client`);
      await client.$disconnect();
      process.exit(0);
    };
    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));
  }

  return client;
}

// ── Global singleton cache ─────────────────────────────────────────────────
type GlobalWithPrisma = typeof globalThis & {
  __prisma?: PrismaClient;
};

const g = globalThis as GlobalWithPrisma;

export const db: PrismaClient = g.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  g.__prisma = db;
}

// Re-export Prisma namespace for use in query helpers
export { Prisma };
