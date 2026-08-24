import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import path from 'path';

import { prisma } from '../server/config/prisma.js';

type CredentialEntry = {
  email: string;
  password: string;
};

const credentialFile = process.env.WEC_CREDENTIAL_FILE
  ? path.resolve(process.env.WEC_CREDENTIAL_FILE)
  : path.join(process.cwd(), '.secure', 'womens-cell-login-credentials.json');

const expectedAccounts = [
  ['rojapbcompa2024@sankara.ac.in', 'STUDENT'],
  ['anusiyabsccs2025@sankara.ac.in', 'STUDENT'],
  ['reshmir@sankara.ac.in', 'FACULTY'],
  ['tharanipbcomca2024@sankara.ac.in', 'STUDENT'],
  ['indumathia@sankara.ac.in', 'FACULTY'],
  ['revathim@sankara.ac.in', 'FACULTY'],
  ['vinithas@sankara.ac.in', 'FACULTY'],
  ['sathyapriyas@sankara.ac.in', 'FACULTY'],
  ['anamikasbscit2024@sankara.ac.in', 'STUDENT'],
  ['jayagowrigs@sankara.ac.in', 'FACULTY'],
  ['archanas@sankara.ac.in', 'FACULTY'],
  ['durganandhininandhini524@gmail.com', 'STUDENT'],
] as const;

async function main() {
  const raw = (await fs.readFile(credentialFile, 'utf8')).replace(/^\uFEFF/, '').trim();
  const parsed = JSON.parse(raw) as CredentialEntry[];

  const credentials = new Map(
    parsed.map(entry => [entry.email.trim().toLowerCase(), entry.password]),
  );

  const report = [];
  let failed = false;

  for (const [email, expectedRole] of expectedAccounts) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        studentProfile: true,
        facultyProfile: true,
      },
    });

    const password = credentials.get(email);
    const passwordMatches =
      Boolean(user && password) && (await bcrypt.compare(password!, user!.passwordHash));

    const profilePresent =
      user?.role === 'STUDENT'
        ? Boolean(user.studentProfile)
        : user?.role === 'FACULTY'
          ? Boolean(user.facultyProfile)
          : false;

    const ok =
      Boolean(user) &&
      user?.role === expectedRole &&
      user.isActive &&
      profilePresent &&
      passwordMatches;

    if (!ok) failed = true;

    report.push({
      email,
      expectedRole,
      accountFound: Boolean(user),
      actualRole: user?.role || null,
      active: user?.isActive ?? false,
      profilePresent,
      temporaryPasswordVerified: passwordMatches,
      ok,
    });
  }

  console.log(JSON.stringify({ success: !failed, accounts: report }, null, 2));

  if (failed) process.exitCode = 1;
}

main()
  .catch(error => {
    console.error(
      JSON.stringify(
        {
          success: false,
          message: error instanceof Error ? error.message : 'Verification failed.',
        },
        null,
        2,
      ),
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
