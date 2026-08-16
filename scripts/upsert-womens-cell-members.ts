import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '../server/config/prisma.js';
import { normalizeWomensCellName, womensCellMembers } from '../server/data/womensCellMembers.js';

const sourceDir = path.join(process.cwd(), 'src', 'assets', 'images', 'members', 'womens cell incharge');
const uploadDir = path.join(process.cwd(), 'uploads', 'members', 'womens-cell');
const memberDefaultPassword = process.env.WEC_MEMBER_DEFAULT_PASSWORD;
if (
  !memberDefaultPassword ||
  memberDefaultPassword === 'CHANGE_ME_FOR_LOCAL_MEMBER_SETUP' ||
  !/^(?=.*[a-zA-Z])(?=.*\d).{8,}$/.test(memberDefaultPassword)
) {
  throw new Error('WEC_MEMBER_DEFAULT_PASSWORD must be set to a strong local setup password before creating Women Empowerment Cell member accounts.');
}
const passwordHash = await bcrypt.hash(memberDefaultPassword, 10);

const existingUsers = await prisma.user.findMany({
  include: {
    studentProfile: true,
    facultyProfile: true,
  },
});

const usersByNormalizedName = new Map(
  existingUsers.map(user => [normalizeWomensCellName(user.name), user]),
);

await fs.mkdir(uploadDir, { recursive: true });

const report: Array<{ name: string; action: string; image: string }> = [];

for (const member of womensCellMembers) {
  await fs.copyFile(
    path.join(sourceDir, member.imageFile),
    path.join(uploadDir, member.imageFile),
  );

  const normalizedName = normalizeWomensCellName(member.name);
  const existingUser = usersByNormalizedName.get(normalizedName);

  if (member.type === 'STUDENT') {
    const user = existingUser && existingUser.role === 'STUDENT'
      ? await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: member.name,
          email: member.email,
          identifier: member.identifier,
          isActive: true,
        },
      })
      : await prisma.user.create({
        data: {
          name: member.name,
          email: member.email,
          identifier: member.identifier,
          passwordHash,
          role: 'STUDENT',
          isActive: true,
        },
      });

    await prisma.studentProfile.upsert({
      where: { userId: user.id },
      update: {
        registerNumber: member.registerNumber!,
        profileImage: member.profileImage,
        department: member.department,
        course: member.course!,
        bio: `${member.name} serves the Women Empowerment Cell${member.role ? ` as ${member.role}` : ''}.`,
        joiningAcademicYear: `${member.joiningYear}-${member.joiningYear! + 1}`,
        joiningYear: member.joiningYear!,
        expectedPassingYear: member.expectedPassingYear!,
        expectedCompletionDate: new Date(`${member.expectedCompletionDate}T00:00:00.000Z`),
        courseDurationYears: member.courseDurationYears!,
        currentStudyYear: member.currentStudyYear || null,
        academicStatus: member.currentStudyYear === member.courseDurationYears ? 'FINAL_YEAR' : 'ACTIVE',
        isSingaPenMember: true,
        clubRole: member.role || null,
        clubJoinedAt: new Date('2026-07-01T00:00:00.000Z'),
      },
      create: {
        userId: user.id,
        registerNumber: member.registerNumber!,
        profileImage: member.profileImage,
        department: member.department,
        course: member.course!,
        bio: `${member.name} serves the Women Empowerment Cell${member.role ? ` as ${member.role}` : ''}.`,
        joiningAcademicYear: `${member.joiningYear}-${member.joiningYear! + 1}`,
        joiningYear: member.joiningYear!,
        expectedPassingYear: member.expectedPassingYear!,
        expectedCompletionDate: new Date(`${member.expectedCompletionDate}T00:00:00.000Z`),
        courseDurationYears: member.courseDurationYears!,
        currentStudyYear: member.currentStudyYear || null,
        academicStatus: member.currentStudyYear === member.courseDurationYears ? 'FINAL_YEAR' : 'ACTIVE',
        isSingaPenMember: true,
        clubRole: member.role || null,
        clubJoinedAt: new Date('2026-07-01T00:00:00.000Z'),
      },
    });

    report.push({
      name: member.name,
      action: existingUser ? 'updated student' : 'created student',
      image: member.imageFile,
    });
  } else {
    const user = existingUser && existingUser.role === 'FACULTY'
      ? await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: member.name,
          email: member.email,
          identifier: member.identifier,
          isActive: true,
        },
      })
      : await prisma.user.create({
        data: {
          name: member.name,
          email: member.email,
          identifier: member.identifier,
          passwordHash,
          role: 'FACULTY',
          isActive: true,
        },
      });

    await prisma.facultyProfile.upsert({
      where: { userId: user.id },
      update: {
        staffId: member.staffId!,
        department: member.department,
        designation: member.designation!,
      },
      create: {
        userId: user.id,
        staffId: member.staffId!,
        department: member.department,
        designation: member.designation!,
      },
    });

    report.push({
      name: member.name,
      action: existingUser ? 'updated faculty' : 'created faculty',
      image: member.imageFile,
    });
  }
}

const allUsers = await prisma.user.findMany({
  select: { name: true },
});
const counts = new Map<string, number>();
for (const user of allUsers) {
  const key = normalizeWomensCellName(user.name);
  counts.set(key, (counts.get(key) || 0) + 1);
}

const duplicateNames = womensCellMembers
  .map(member => member.name)
  .filter(name => (counts.get(normalizeWomensCellName(name)) || 0) > 1);

console.log(JSON.stringify({
  report,
  duplicateNames,
}, null, 2));

await prisma.$disconnect();
