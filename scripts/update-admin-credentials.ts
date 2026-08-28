import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { prisma } from '../server/config/prisma.js';

dotenv.config();

const ADMIN_EMAIL = 'sansac-admin@college.edu';
const ADMIN_PASSWORD = process.env.ADMIN_NEW_PASSWORD;

async function main() {
  if (!ADMIN_PASSWORD) {
    throw new Error('ADMIN_NEW_PASSWORD is required for this one-time credential update.');
  }

  const conflictingNonAdmin = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
    select: { id: true, role: true },
  });

  if (conflictingNonAdmin && conflictingNonAdmin.role !== 'ADMIN') {
    throw new Error('The requested admin email is already assigned to a non-admin account.');
  }

  const existingTargetAdmin = conflictingNonAdmin?.role === 'ADMIN'
    ? await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } })
    : null;

  const canonicalAdmin = existingTargetAdmin || await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    orderBy: { createdAt: 'asc' },
  });

  if (!canonicalAdmin) {
    throw new Error('No existing ADMIN user was found. Refusing to create a new administrator.');
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const updated = await prisma.$transaction(async (tx) => {
    return tx.user.update({
      where: { id: canonicalAdmin.id },
      data: {
        email: ADMIN_EMAIL,
        passwordHash,
        role: 'ADMIN',
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        isActive: true,
        identifier: true,
      },
    });
  });

  const passwordVerified = await bcrypt.compare(ADMIN_PASSWORD, updated.passwordHash);

  console.log(JSON.stringify({
    success: updated.email === ADMIN_EMAIL && updated.role === 'ADMIN' && updated.isActive && passwordVerified,
    email: updated.email,
    role: updated.role,
    active: updated.isActive,
    passwordVerified,
    identifierRetained: Boolean(updated.identifier),
  }, null, 2));
}

main()
  .catch((error) => {
    console.error('Admin credential update failed:', error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => undefined);
  });
