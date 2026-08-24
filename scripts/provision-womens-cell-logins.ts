import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import path from 'path';

import { prisma } from '../server/config/prisma.js';

type ExpectedRole = 'STUDENT' | 'FACULTY';

type StudentCreateProfile = {
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
};

type FacultyCreateProfile = {
  kind: 'FACULTY';
  identifier: string;
  staffId: string;
  department: string;
  designation: string;
};

type CreateProfile = StudentCreateProfile | FacultyCreateProfile;

type AccountSpec = {
  label: string;
  email: string;
  expectedRole: ExpectedRole;
  identifiers?: string[];
  aliases: string[];
  compactAliases?: string[];
  createIfMissing?: CreateProfile;
};

type CredentialEntry = {
  email: string;
  password: string;
};

const credentialFile = process.env.WEC_CREDENTIAL_FILE
  ? path.resolve(process.env.WEC_CREDENTIAL_FILE)
  : path.join(process.cwd(), '.secure', 'womens-cell-login-credentials.json');

const dryRun = process.argv.includes('--dry-run');

const accountSpecs: AccountSpec[] = [
  { label: 'ROJA.P', email: 'rojapbcompa2024@sankara.ac.in', expectedRole: 'STUDENT', identifiers: ['WEC-STU-ROJA-P'], aliases: ['ROJA.P', 'Roja P'] },
  { label: 'Anusiya.A', email: 'anusiyabsccs2025@sankara.ac.in', expectedRole: 'STUDENT', identifiers: ['WEC-STU-ANUSIYA-A'], aliases: ['Anusiya.A', 'Anusiya A'] },
  { label: 'Reshmi R', email: 'reshmir@sankara.ac.in', expectedRole: 'FACULTY', identifiers: ['WEC-FAC-R-RESHMI'], aliases: ['Mrs. R. RESHMI', 'Reshmi R', 'R Reshmi'] },
  {
    label: 'Tharani.P', email: 'tharanipbcomca2024@sankara.ac.in', expectedRole: 'STUDENT', identifiers: ['WEC-STU-S-THARANI-P'], aliases: ['Tharani.P', 'Tharani P'],
    createIfMissing: {
      kind: 'STUDENT', identifier: 'WEC-STU-S-THARANI-P', registerNumber: 'WEC-STU-005', department: 'Dept. of Commerce (CA)', course: 'B.Com (CA)', joiningAcademicYear: '2024-2025', joiningYear: 2024, expectedPassingYear: 2027, expectedCompletionDate: '2027-04-30', courseDurationYears: 3, currentStudyYear: 3, academicStatus: 'FINAL_YEAR', isSingaPenMember: true, clubRole: 'Vice Chairman', profileImage: '/uploads/members/womens-cell/tharani.jpeg'
    }
  },
  { label: 'Dr.A.INDUMATHI', email: 'indumathia@sankara.ac.in', expectedRole: 'FACULTY', identifiers: ['WEC-FAC-INDUMATHI'], aliases: ['Dr.A.INDUMATHI', 'A Indumathi', 'Indumathi A'] },
  { label: 'Revathi.M', email: 'revathim@sankara.ac.in', expectedRole: 'FACULTY', identifiers: ['WEC-FAC-REVATHI-MANI'], aliases: ['Mrs. Revathi Mani', 'Revathi.M', 'Revathi M', 'Revathi Mani'] },
  { label: 'Vinitha S', email: 'vinithas@sankara.ac.in', expectedRole: 'FACULTY', identifiers: ['WEC-FAC-S-VINITHA'], aliases: ['Mrs. S. Vinitha', 'Vinitha S', 'S Vinitha'] },
  {
    label: 'SathyPriya.S', email: 'sathyapriyas@sankara.ac.in', expectedRole: 'FACULTY', identifiers: ['WEC-FAC-SATHYPRIYA-S'], aliases: ['SathyPriya.S', 'Sathyapriya.S', 'Sathyaprita.s'],
    createIfMissing: { kind: 'FACULTY', identifier: 'WEC-FAC-SATHYPRIYA-S', staffId: 'WEC-FAC-007', department: 'Bachelor of Computer Science', designation: 'Faculty' }
  },
  { label: 'Anamika.S', email: 'anamikasbscit2024@sankara.ac.in', expectedRole: 'STUDENT', identifiers: ['WEC-STU-S-ANAMIKA'], aliases: ['Anamika.S', 'S.Anamika', 'S. Anamika', 'Anamika A', 'Anamika'], compactAliases: ['anamika', 'anamikaa', 'sanamika'] },
  { label: 'Dr Jayagowri G S', email: 'jayagowrigs@sankara.ac.in', expectedRole: 'FACULTY', identifiers: ['WEC-FAC-JAYAGOWRI-GS'], aliases: ['Dr Jayagowri G S', 'Jayagowri G S', 'G S Jayagowri'] },
  { label: 'Ms. S. Archana', email: 'archanas@sankara.ac.in', expectedRole: 'FACULTY', identifiers: ['WEC-FAC-S-ARCHANA'], aliases: ['S. Archana', 'Ms. S. Archana', 'Archana S'] },
  { label: 'Durganandhini V', email: 'durganandhininandhini524@gmail.com', expectedRole: 'STUDENT', identifiers: ['WEC-STU-DURGANANDHINI-V'], aliases: ['Durganandhini V', 'Durganandhini v'] },
];

const normalizeName = (value: string) => value.toLowerCase().replace(/\b(dr|mrs|ms|prof)\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean).sort().join(' ');
const compactName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
const normalizeEmail = (value: string) => value.trim().toLowerCase();
const validatePassword = (password: string) => /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/.test(password);

async function readCredentials() {
  let raw: string;
  try { raw = (await fs.readFile(credentialFile, 'utf8')).replace(/^\uFEFF/, '').trim(); }
  catch { throw new Error(`Credential file not found: ${credentialFile}. Run scripts/create-womens-cell-credential-file.ps1 first.`); }

  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) throw new Error('Credential file must contain a JSON array.');

  const credentials = new Map<string, string>();
  for (const item of parsed) {
    if (!item || typeof item !== 'object') throw new Error('Every credential entry must be an object.');
    const entry = item as Partial<CredentialEntry>;
    if (typeof entry.email !== 'string' || typeof entry.password !== 'string') throw new Error('Every credential entry requires email and password strings.');
    const email = normalizeEmail(entry.email);
    if (credentials.has(email)) throw new Error(`Duplicate credential entry for ${email}.`);
    if (!validatePassword(entry.password)) throw new Error(`Temporary password for ${email} must be at least 8 characters and contain letters and numbers.`);
    credentials.set(email, entry.password);
  }

  const expectedEmails = new Set(accountSpecs.map(spec => spec.email));
  const missing = [...expectedEmails].filter(email => !credentials.has(email));
  const unexpected = [...credentials.keys()].filter(email => !expectedEmails.has(email));
  if (missing.length || unexpected.length) throw new Error([missing.length ? `Missing credentials: ${missing.join(', ')}` : '', unexpected.length ? `Unexpected credentials: ${unexpected.join(', ')}` : ''].filter(Boolean).join(' | '));
  return credentials;
}

async function main() {
  if (!dryRun && process.env.WEC_PROVISION_CONFIRM !== 'YES') throw new Error('Refusing to update accounts without WEC_PROVISION_CONFIRM=YES. Run with --dry-run first.');

  const credentials = await readCredentials();
  const databaseInfo = await prisma.$queryRaw<Array<{ database: string; schema: string }>>`SELECT current_database() AS database, current_schema() AS schema`;
  console.log(JSON.stringify({ mode: dryRun ? 'DRY_RUN' : 'APPLY', database: databaseInfo[0]?.database || 'unknown', schema: databaseInfo[0]?.schema || 'unknown', credentialFile }, null, 2));

  const users = await prisma.user.findMany({ include: { studentProfile: true, facultyProfile: true } });
  const claimedUserIds = new Set<string>();
  const existingAccounts: Array<{ spec: AccountSpec; user: (typeof users)[number]; password: string }> = [];
  const missingAccounts: Array<{ spec: AccountSpec; profile: CreateProfile; password: string }> = [];
  const problems: string[] = [];

  for (const spec of accountSpecs) {
    const targetEmail = normalizeEmail(spec.email);
    const normalizedAliases = new Set(spec.aliases.map(normalizeName));
    const compactAliases = new Set((spec.compactAliases || []).map(compactName));
    const identifierSet = new Set((spec.identifiers || []).map(value => value.toLowerCase()));
    const candidates = users.filter(user => normalizeEmail(user.email) === targetEmail || identifierSet.has(user.identifier.toLowerCase()) || normalizedAliases.has(normalizeName(user.name)) || (compactAliases.size && compactAliases.has(compactName(user.name))));
    const uniqueCandidates = [...new Map(candidates.map(user => [user.id, user])).values()];
    const password = credentials.get(targetEmail);
    if (!password) { problems.push(`${spec.label}: credential is missing.`); continue; }

    if (uniqueCandidates.length === 0) {
      if (!spec.createIfMissing) { problems.push(`${spec.label}: no existing account was found.`); continue; }
      const profile = spec.createIfMissing;
      if (users.some(user => normalizeEmail(user.email) === targetEmail)) { problems.push(`${spec.label}: target email is already in use.`); continue; }
      if (users.some(user => user.identifier.toLowerCase() === profile.identifier.toLowerCase())) { problems.push(`${spec.label}: target identifier is already in use.`); continue; }
      if (profile.kind === 'STUDENT' && users.some(user => user.studentProfile?.registerNumber.toLowerCase() === profile.registerNumber.toLowerCase())) { problems.push(`${spec.label}: register number is already in use.`); continue; }
      if (profile.kind === 'FACULTY' && users.some(user => user.facultyProfile?.staffId.toLowerCase() === profile.staffId.toLowerCase())) { problems.push(`${spec.label}: staff ID is already in use.`); continue; }
      missingAccounts.push({ spec, profile, password });
      continue;
    }

    if (uniqueCandidates.length > 1) { problems.push(`${spec.label}: expected one account but found ${uniqueCandidates.length}.`); continue; }
    const user = uniqueCandidates[0];
    if (claimedUserIds.has(user.id)) { problems.push(`${spec.label}: account matched more than one requested member.`); continue; }
    if (user.role !== spec.expectedRole) { problems.push(`${spec.label}: expected role ${spec.expectedRole}, found ${user.role}.`); continue; }
    if (spec.expectedRole === 'STUDENT' && !user.studentProfile) { problems.push(`${spec.label}: existing student account has no StudentProfile.`); continue; }
    if (spec.expectedRole === 'FACULTY' && !user.facultyProfile) { problems.push(`${spec.label}: existing faculty account has no FacultyProfile.`); continue; }
    if (users.some(other => other.id !== user.id && normalizeEmail(other.email) === targetEmail)) { problems.push(`${spec.label}: target email is already used by another account.`); continue; }
    claimedUserIds.add(user.id);
    existingAccounts.push({ spec, user, password });
  }

  if (problems.length) {
    console.error(JSON.stringify({ success: false, message: 'Preflight failed. No accounts were changed.', problems }, null, 2));
    process.exitCode = 1;
    return;
  }

  const preview = [
    ...existingAccounts.map(({ spec, user }) => ({ action: 'UPDATE_EXISTING', name: user.name, role: user.role, previousEmail: user.email, targetEmail: spec.email, identifier: user.identifier, profilePresent: user.role === 'STUDENT' ? Boolean(user.studentProfile) : Boolean(user.facultyProfile) })),
    ...missingAccounts.map(({ spec, profile }) => ({ action: 'CREATE_MISSING', name: spec.label, role: spec.expectedRole, previousEmail: null, targetEmail: spec.email, identifier: profile.identifier, profilePresent: 'WILL_CREATE', profileType: profile.kind })),
  ];
  console.log(JSON.stringify({ success: true, preflight: preview, summary: { existingAccountsToUpdate: existingAccounts.length, missingAccountsToCreate: missingAccounts.length, totalAccounts: preview.length } }, null, 2));
  if (dryRun) { console.log('Dry run completed. No database records were changed.'); return; }

  const preparedExisting = await Promise.all(existingAccounts.map(async item => ({ ...item, passwordHash: await bcrypt.hash(item.password, 10) })));
  const preparedMissing = await Promise.all(missingAccounts.map(async item => ({ ...item, passwordHash: await bcrypt.hash(item.password, 10) })));

  await prisma.$transaction(async tx => {
    for (const item of preparedExisting) {
      await tx.user.update({ where: { id: item.user.id }, data: { email: item.spec.email, passwordHash: item.passwordHash, isActive: true } });
    }
    for (const item of preparedMissing) {
      if (item.profile.kind === 'STUDENT') {
        await tx.user.create({ data: { name: item.spec.label, email: item.spec.email, passwordHash: item.passwordHash, role: 'STUDENT', identifier: item.profile.identifier, isActive: true, studentProfile: { create: { registerNumber: item.profile.registerNumber, profileImage: item.profile.profileImage || null, department: item.profile.department, course: item.profile.course, joiningAcademicYear: item.profile.joiningAcademicYear, joiningYear: item.profile.joiningYear, expectedPassingYear: item.profile.expectedPassingYear, expectedCompletionDate: new Date(`${item.profile.expectedCompletionDate}T00:00:00.000Z`), courseDurationYears: item.profile.courseDurationYears, currentStudyYear: item.profile.currentStudyYear, academicStatus: item.profile.academicStatus, isSingaPenMember: item.profile.isSingaPenMember, clubRole: item.profile.clubRole || null, availableDays: [] } } } });
      } else {
        await tx.user.create({ data: { name: item.spec.label, email: item.spec.email, passwordHash: item.passwordHash, role: 'FACULTY', identifier: item.profile.identifier, isActive: true, facultyProfile: { create: { staffId: item.profile.staffId, department: item.profile.department, designation: item.profile.designation } } } });
      }
    }
  });

  const verification = [];
  for (const spec of accountSpecs) {
    const updated = await prisma.user.findUnique({ where: { email: spec.email }, include: { studentProfile: true, facultyProfile: true } });
    const password = credentials.get(spec.email);
    const passwordMatches = updated && password ? await bcrypt.compare(password, updated.passwordHash) : false;
    const profilePresent = updated?.role === 'STUDENT' ? Boolean(updated.studentProfile) : updated?.role === 'FACULTY' ? Boolean(updated.facultyProfile) : false;
    verification.push({ email: spec.email, expectedRole: spec.expectedRole, role: updated?.role || null, accountFound: Boolean(updated), active: updated?.isActive ?? false, profilePresent, temporaryPasswordVerified: passwordMatches, ok: Boolean(updated) && updated?.role === spec.expectedRole && Boolean(updated?.isActive) && profilePresent && passwordMatches });
  }
  const failedVerification = verification.filter(item => !item.ok);
  console.log(JSON.stringify({ success: failedVerification.length === 0, accounts: verification }, null, 2));
  if (failedVerification.length) process.exitCode = 1;
}

main().catch(error => { console.error(JSON.stringify({ success: false, message: error instanceof Error ? error.message : 'Account provisioning failed.' }, null, 2)); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });

