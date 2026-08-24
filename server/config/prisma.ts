import { PrismaClient } from '@prisma/client';

const postgresUrlPattern = /^postgres(?:ql)?:\/\//i;
const databaseUrlCandidates = [
  process.env.DATABASE_URL,
  process.env.DATABASE_URL_POSTGRES_PRISMA_URL,
  process.env.DATABASE_URL_POSTGRES_URL,
  process.env.DATABASE_URL_DATABASE_URL,
  process.env.DATABASE_URL_UNPOOLED,
  process.env.POSTGRES_PRISMA_URL,
  process.env.POSTGRES_URL,
  process.env.POSTGRES_URL_NON_POOLING,
].filter((value): value is string => Boolean(value));

const effectiveDatabaseUrl = databaseUrlCandidates.find(value => postgresUrlPattern.test(value));
if (effectiveDatabaseUrl && process.env.DATABASE_URL !== effectiveDatabaseUrl) {
  process.env.DATABASE_URL = effectiveDatabaseUrl;
}

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function connectDatabase() {
  if (!process.env.DATABASE_URL || !postgresUrlPattern.test(process.env.DATABASE_URL)) {
    throw new Error('A PostgreSQL DATABASE_URL is required. Copy .env.example to .env and configure PostgreSQL.');
  }
  await prisma.$queryRaw`SELECT 1`;
  console.log('PostgreSQL connection established through Prisma.');
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}
