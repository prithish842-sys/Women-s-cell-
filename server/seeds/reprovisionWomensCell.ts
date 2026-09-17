import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '../config/prisma.js';
import {
  normalizeWomensCellName,
  womensCellMembers,
} from '../data/womensCellMembers.js';

type CreateProfile =
  | {
      kind: 'STUDENT';
      identifier: string;
      registerNumber: string;
      department: string;
      course: string;
      joiningAcademicYear: string;
      joiningYear: number;
      expectedPassingYear: number;
      expectedCompletionDate: string;
      courseDurationYears: number;
      currentStudyYear: number;
      academicStatus: 'ACTIVE' | 'FINAL_YEAR' | 'PASSING_OUT_SOON' | 'PASSED_OUT';
      isSingaPenMember: boolean;
      clubRole?: string;
      profileImage?: string;
    }
  | {
      kind: 'FACULTY';
      identifier: string;
      staffId: string;
      department: string;
      designation: string;
    };

type MemberSpec = {
  name: string;
  email: string;
  expectedRole: 'STUDENT' | 'FACULTY';
  createIfMissing: CreateProfile;
};

const credentialFile = process.env.WEC_CREDENTIAL_FILE
  ? path.resolve(process.env.WEC_CREDENTIAL_FILE)
  : path.join(process.cwd(), '.secure', 'womens-cell-login-credentials.json');

const sourceImageDir = path.join(
  process.cwd(),
  'src',
  'assets',
  'images',
  'members',
  'womens cell incharge',
);
const uploadImageDir = path.join(process.cwd(), 'uploads', 'members', 'womens-cell');

const extraLoginHolders: MemberSpec[] = [
  {
    name: 'Anamika.S',
    email: 'anamikasbscit2024@sankara.ac.in',
    expectedRole: 'STUDENT',
    createIfMissing: {
      kind: 'STUDENT',
      identifier: 'WEC-STU-S-ANAMIKA',
      registerNumber: 'WEC-STU-006',
      department: 'Bachelor of Computer Science (IT)',
      course: 'B.Sc IT',
      joiningAcademicYear: '2024-2025',
      joiningYear: 2024,
      expectedPassingYear: 2027,
      expectedCompletionDate: '2027-04-30',
      courseDurationYears: 3,
      currentStudyYear: 3,
      academicStatus: 'FINAL_YEAR',
      isSingaPenMember: true,
      clubRole: 'Member',
      profileImage: '/uploads/members/womens-cell/anamika.jpeg',
    },
  },
];

async function readCredentialPasswords(): Promise<Map<string, string>> {
  let raw: string;
  try {
    raw = (await fs.readFile(credentialFile, 'utf8')).replace(/^\uFEFF/, '').trim();
  } catch {
    return new Map();
  }
  const parsed = JSON.parse(raw) as Array<{ email: string; password: string }>;
  if (!Array.isArray(parsed)) return new Map();
  const map = new Map<string, string>();
  for (const entry of parsed) {
    if (entry && typeof entry.email === 'string' && typeof entry.password === 'string') {
      map.set(entry.email.trim().toLowerCase(), entry.password);
    }
  }
  return map;
}

async function ensureImage(memberImageFile: string) {
  try {
    await fs.mkdir(uploadImageDir, { recursive: true });
    await fs.copyFile(path.join(sourceImageDir, memberImageFile), path.join(uploadImageDir, memberImageFile));
  } catch {
    // Image copy is best-effort; a missing source image must not fail the seed.
  }
}

export async function restoreAdminCredentials(): Promise<boolean> {
  const adminIdentifier = 'AdminSansac2k26';
  const adminPassword = process.env.ADMIN_SANSAC_PASSWORD || 'Singa-Pen-Sansac2k26';

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } });
  if (!admin) {
    console.log('⏭ Skipping admin credential restore: no ADMIN user found.');
    return false;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.user.update({
    where: { id: admin.id },
    data: { identifier: adminIdentifier, passwordHash, role: 'ADMIN', isActive: true },
  });

  console.log(`✔ Admin account configured to log in with identifier \`${adminIdentifier}\`.`);
  return true;
}

export async function reprovisionWomensCellMembers(): Promise<boolean> {
  const passwords = await readCredentialPasswords();
  if (passwords.size === 0) {
    console.log('⏭ Skipping WEC member reprovision: credential file not found. Run provision:wec-logins separately.');
    return false;
  }

  const specs: MemberSpec[] = [
    ...womensCellMembers.map<MemberSpec>((member) => {
      const base = {
        identifier: member.identifier,
        profileImage: member.profileImage,
      };
      if (member.type === 'STUDENT') {
        const academicStatus: 'ACTIVE' | 'FINAL_YEAR' =
          member.currentStudyYear === member.courseDurationYears ? 'FINAL_YEAR' : 'ACTIVE';
        return {
          name: member.name,
          email: member.email,
          expectedRole: 'STUDENT' as const,
          createIfMissing: {
            kind: 'STUDENT',
            ...base,
            registerNumber: member.registerNumber!,
            department: member.department,
            course: member.course!,
            joiningAcademicYear: `${member.joiningYear}-${(member.joiningYear ?? 0) + 1}`,
            joiningYear: member.joiningYear!,
            expectedPassingYear: member.expectedPassingYear!,
            expectedCompletionDate: member.expectedCompletionDate!,
            courseDurationYears: member.courseDurationYears!,
            currentStudyYear: member.currentStudyYear ?? 1,
            academicStatus,
            isSingaPenMember: true,
            clubRole: member.role || 'Member',
          },
        };
      }
      return {
        name: member.name,
        email: member.email,
        expectedRole: 'FACULTY' as const,
        createIfMissing: {
          kind: 'FACULTY',
          identifier: member.identifier,
          staffId: member.staffId!,
          department: member.department,
          designation: member.designation!,
        },
      };
    }),
    ...extraLoginHolders,
  ];

  const createdOrUpdated = await prisma.$transaction(async (tx) => {
    const created: string[] = [];
    for (const spec of specs) {
      const targetEmail = spec.email.trim().toLowerCase();
      const password = passwords.get(targetEmail);
      const passwordHash = await bcrypt.hash(password || 'WecMemberLocal123', 10);

      const existingUser = await tx.user.findFirst({
        where: {
          OR: [
            { email: targetEmail },
            { identifier: spec.createIfMissing.identifier },
            { name: { equals: spec.createIfMissing.identifier, mode: 'insensitive' } },
          ],
        },
      });

      const existingByNormalizedName = existingUser
        ? null
        : await tx.user.findFirst({
            where: { name: { equals: normalizeWomensCellName(spec.name), mode: 'insensitive' } },
          });
      const matchedUser = existingUser || existingByNormalizedName;

      if (matchedUser) {
        await tx.user.update({
          where: { id: matchedUser.id },
          data: {
            name: spec.name,
            email: targetEmail,
            identifier: spec.createIfMissing.identifier,
            role: spec.expectedRole,
            passwordHash,
            isActive: true,
          },
        });
        const userId = matchedUser.id;
        if (spec.expectedRole === 'STUDENT') {
          const p = spec.createIfMissing as Extract<CreateProfile, { kind: 'STUDENT' }>;
          await tx.studentProfile.upsert({
            where: { userId },
            update: {
              registerNumber: p.registerNumber,
              profileImage: p.profileImage || null,
              department: p.department,
              course: p.course,
              bio: `${spec.name} serves the Women Empowerment Cell${p.clubRole ? ` as ${p.clubRole}` : ''}.`,
              joiningAcademicYear: p.joiningAcademicYear,
              joiningYear: p.joiningYear,
              expectedPassingYear: p.expectedPassingYear,
              expectedCompletionDate: new Date(`${p.expectedCompletionDate}T00:00:00.000Z`),
              courseDurationYears: p.courseDurationYears,
              currentStudyYear: p.currentStudyYear,
              academicStatus: p.academicStatus,
              isSingaPenMember: true,
              clubRole: p.clubRole || null,
            },
            create: {
              userId,
              registerNumber: p.registerNumber,
              profileImage: p.profileImage || null,
              department: p.department,
              course: p.course,
              bio: `${spec.name} serves the Women Empowerment Cell${p.clubRole ? ` as ${p.clubRole}` : ''}.`,
              joiningAcademicYear: p.joiningAcademicYear,
              joiningYear: p.joiningYear,
              expectedPassingYear: p.expectedPassingYear,
              expectedCompletionDate: new Date(`${p.expectedCompletionDate}T00:00:00.000Z`),
              courseDurationYears: p.courseDurationYears,
              currentStudyYear: p.currentStudyYear,
              academicStatus: p.academicStatus,
              isSingaPenMember: true,
              clubRole: p.clubRole || null,
            },
          });
        } else {
          const f = spec.createIfMissing as Extract<CreateProfile, { kind: 'FACULTY' }>;
          await tx.facultyProfile.upsert({
            where: { userId },
            update: { staffId: f.staffId, department: f.department, designation: f.designation },
            create: { userId, staffId: f.staffId, department: f.department, designation: f.designation },
          });
        }
        created.push(spec.name);
      } else {
        if (spec.expectedRole === 'STUDENT') {
          const p = spec.createIfMissing as Extract<CreateProfile, { kind: 'STUDENT' }>;
          const user = await tx.user.create({
            data: {
              name: spec.name,
              email: targetEmail,
              identifier: p.identifier,
              role: 'STUDENT',
              passwordHash,
              isActive: true,
              studentProfile: {
                create: {
                  registerNumber: p.registerNumber,
                  profileImage: p.profileImage || null,
                  department: p.department,
                  course: p.course,
                  bio: `${spec.name} serves the Women Empowerment Cell${p.clubRole ? ` as ${p.clubRole}` : ''}.`,
                  joiningAcademicYear: p.joiningAcademicYear,
                  joiningYear: p.joiningYear,
                  expectedPassingYear: p.expectedPassingYear,
                  expectedCompletionDate: new Date(`${p.expectedCompletionDate}T00:00:00.000Z`),
                  courseDurationYears: p.courseDurationYears,
                  currentStudyYear: p.currentStudyYear,
                  academicStatus: p.academicStatus,
                  isSingaPenMember: true,
                  clubRole: p.clubRole || null,
                },
              },
            },
          });
          created.push(user.name);
        } else {
          const f = spec.createIfMissing as Extract<CreateProfile, { kind: 'FACULTY' }>;
          const user = await tx.user.create({
            data: {
              name: spec.name,
              email: targetEmail,
              identifier: f.identifier,
              role: 'FACULTY',
              passwordHash,
              isActive: true,
              facultyProfile: {
                create: { staffId: f.staffId, department: f.department, designation: f.designation },
              },
            },
          });
          created.push(user.name);
        }
      }
    }
    return created;
  });

  for (const member of womensCellMembers) {
    await ensureImage(member.imageFile);
  }
  await ensureImage('anamika.jpeg');

  console.log(`✔ Reprovisioned ${createdOrUpdated.length} real Women Empowerment Cell member accounts with their real credentials.`);
  return true;
}
