import dotenv from 'dotenv';
import { runSeed } from '../server/seeds/seed.js';
import { connectDatabase, disconnectDatabase } from '../server/config/prisma.js';

dotenv.config();

connectDatabase()
  .then(runSeed)
  .then(disconnectDatabase)
  .catch(async (error) => {
    console.error('Prisma seed failed:', error);
    await disconnectDatabase().catch(() => undefined);
    process.exit(1);
  });
