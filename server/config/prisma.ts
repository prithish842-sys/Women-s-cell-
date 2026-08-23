import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export async function connectDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required. Copy .env.example to .env and configure PostgreSQL.');
  }
  await prisma.$queryRaw`SELECT 1`;
  console.log('PostgreSQL connection established through Prisma.');
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}
