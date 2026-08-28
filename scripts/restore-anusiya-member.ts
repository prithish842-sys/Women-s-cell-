import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '../server/config/prisma.js';

const credentialFile = process.env.WEC_CREDENTIAL_FILE
  ? path.resolve(process.env.WEC_CREDENTIAL_FILE)
  : path.join(process.cwd(), '.secure', 'womens-cell-login-credentials.json');

async function main() {
  console.log('Restoring Anusiya.A...');
  let raw: string;
  try {
    raw = (await fs.readFile(credentialFile, 'utf8')).replace(/^\uFEFF/, '').trim();
  } catch {
    throw new Error(`Credential file not found: ${credentialFile}`);
  }

  const parsed = JSON.parse(raw);
  const anusiyaCred = parsed.find((c: any) => c.email.toLowerCase() === 'anusiyabsccs2025@sankara.ac.in');

  if (!anusiyaCred) {
    throw new Error('Anusiya credentials not found in secure file.');
  }

  const passwordHash = await bcrypt.hash(anusiyaCred.password, 10);
  const email = 'anusiyabsccs2025@sankara.ac.in';
  const identifier = 'WEC-STU-ANUSIYA-A';

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { identifier }]
    }
  });

  if (user) {
    console.log('User already exists, updating...');
    await prisma.user.update({
      where: { id: user.id },
      data: {
        email,
        passwordHash,
        isActive: true,
      }
    });

    const profile = await prisma.studentProfile.findUnique({
      where: { userId: user.id }
    });

    if (!profile) {
      await prisma.studentProfile.create({
        data: {
          userId: user.id,
          registerNumber: 'WEC-STU-006', // Arbitrary safe register number
          department: 'Bachelor of Computer Science',
          course: 'B.Sc Computer Science',
          joiningAcademicYear: '2022-2023',
          joiningYear: 2022,
          expectedPassingYear: 2025,
          expectedCompletionDate: new Date('2025-04-30T00:00:00.000Z'),
          courseDurationYears: 3,
          currentStudyYear: 3,
          academicStatus: 'FINAL_YEAR',
          isSingaPenMember: true,
          clubRole: 'Secretary',
          profileImage: '/uploads/members/womens-cell/anusiya.jpeg'
        }
      });
    }
  } else {
    console.log('User does not exist, creating...');
    await prisma.user.create({
      data: {
        name: 'Anusiya.A',
        email,
        passwordHash,
        role: 'STUDENT',
        identifier,
        isActive: true,
        studentProfile: {
          create: {
            registerNumber: 'WEC-STU-006',
            department: 'Bachelor of Computer Science',
            course: 'B.Sc Computer Science',
            joiningAcademicYear: '2022-2023',
            joiningYear: 2022,
            expectedPassingYear: 2025,
            expectedCompletionDate: new Date('2025-04-30T00:00:00.000Z'),
            courseDurationYears: 3,
            currentStudyYear: 3,
            academicStatus: 'FINAL_YEAR',
            isSingaPenMember: true,
            clubRole: 'Secretary',
            profileImage: '/uploads/members/womens-cell/anusiya.jpeg'
          }
        }
      }
    });
  }

  console.log('Anusiya.A restoration complete.');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
