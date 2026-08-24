import request from 'supertest';
import jwt from 'jsonwebtoken';
import { afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { validateFileSignature } from '../middleware/upload.js';
import { app } from '../../server.js';
import { errorMiddleware, getJwtSecret } from '../middleware/auth.js';
import { Users, StudentProfiles } from '../models/index.js';
import { prisma } from '../config/prisma.js';
import { GovernmentSchemeSchema, JobOpportunitySchema, SkillSchema, WorkshopSchema } from '../schemas/validation.js';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const tempFiles: string[] = [];

function writeFixture(name: string, bytes: Buffer) {
  const filePath = path.join(os.tmpdir(), `${Date.now()}-${name}`);
  fs.writeFileSync(filePath, bytes);
  tempFiles.push(filePath);
  return filePath;
}

afterEach(() => {
  vi.restoreAllMocks();
  for (const filePath of tempFiles.splice(0)) {
    fs.rmSync(filePath, { force: true });
  }
});

const validRegistrationPayload = {
  name: 'Security Tester',
  email: 'security.tester@example.com',
  registerNumber: 'SEC123',
  phone: '+919876543210',
  department: 'Computer Science',
  course: 'B.Sc Computer Science',
  joiningAcademicYear: '2024-2025',
  expectedPassingYear: 2027,
  expectedCompletionDate: '2027-05-31',
  courseDurationYears: 3,
  password: 'StrongPass123',
  confirmPassword: 'StrongPass123',
};

function tokenFor(user: { _id: string; role: 'ADMIN' | 'STUDENT' | 'FACULTY' | 'ICC_ADMIN' }) {
  return jwt.sign({ _id: user._id, role: user.role }, getJwtSecret(), { expiresIn: '1h' });
}

function mockAuthenticatedUser(role: 'ADMIN' | 'STUDENT' | 'FACULTY' | 'ICC_ADMIN', id = `${role.toLowerCase()}-user`) {
  const user = {
    _id: id,
    name: `${role} User`,
    email: `${role.toLowerCase()}@example.com`,
    passwordHash: 'hash',
    role,
    identifier: id,
    isActive: true,
  };
  vi.spyOn(Users, 'findById').mockResolvedValue(user as any);
  return { user, token: tokenFor({ _id: id, role }) };
}

describe('security hardening contracts', () => {
  it('keeps role-protected endpoints behind auth and role checks', () => {
    const adminRoutes = read('server/routes/admin.ts');
    const facultyRoutes = read('server/routes/faculty.ts');
    const iccRoutes = read('server/routes/icc.ts');
    const publicRoutes = read('server/routes/public.ts');

    expect(adminRoutes).toContain("router.get('/dashboard', auth, authorize(['ADMIN', 'ICC_ADMIN'])");
    expect(adminRoutes).toContain("router.get('/students', auth, authorize(['ADMIN'])");
    expect(facultyRoutes).toContain("router.get('/students/search', auth, authorize(['FACULTY', 'ADMIN'])");
    expect(publicRoutes).toContain("router.get('/skills/search', auth, authorize(['FACULTY', 'ADMIN'])");
    expect(iccRoutes).toContain("router.post('/complaints', auth, authorize(['STUDENT'])");
    expect(iccRoutes).toContain("req.user!.role === 'ICC_ADMIN'");
  });

  it('defines ICC attachment authorization and private path containment', () => {
    const server = read('server.ts');
    const iccRoutes = read('server/routes/icc.ts');
    const adminDetail = read('src/pages/admin/IccComplaintDetail.tsx');

    expect(server).not.toContain("app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))");
    expect(server).toContain("app.use(`/uploads/${publicUploadPath}`");
    expect(iccRoutes).toContain("router.get('/complaints/:complaintId/attachment', auth");
    expect(iccRoutes).toContain('complaint.submittedById === req.user!._id');
    expect(iccRoutes).toContain("req.user!.role === 'ICC_ADMIN'");
    expect(iccRoutes).toContain("normalized.split('/').some(part => part === '..')");
    expect(iccRoutes).toContain('PRIVATE_ICC_UPLOAD_ROOT');
    expect(adminDetail).toContain("api.get(`/icc/complaints/${complaintId}/attachment`, { responseType: 'blob' })");
  });

  it('provides a public sanitized skills directory without exposing private student fields', () => {
    const publicRoutes = read('server/routes/public.ts');

    expect(publicRoutes).toContain("router.get('/skills', async (req, res, next) => {");
    expect(publicRoutes).toContain('name: profile.user.name');
    expect(publicRoutes).toContain('department: profile.department');
    expect(publicRoutes).toContain('profileImage: profile.profileImage');
    expect(publicRoutes).not.toContain('registerNumber');
    expect(publicRoutes).not.toContain('phone:');
    expect(publicRoutes).not.toContain('email: profile.user.email');
  });

  it('normalizes failed login wording to prevent account enumeration', () => {
    const authRoutes = read('server/routes/auth.ts');
    expect(authRoutes).toContain("const INVALID_LOGIN_MESSAGE = 'Invalid identifier or password.'");
    expect(authRoutes).not.toContain('Invalid credentials. User not found.');
    expect(authRoutes).not.toContain('Invalid credentials. Password incorrect.');
  });

  it('blocks destructive seed execution before delete operations', () => {
    const seed = read('server/seeds/seed.ts');
    const productionGuard = seed.indexOf("process.env.NODE_ENV === 'production'");
    const allowGuard = seed.indexOf("process.env.ALLOW_DESTRUCTIVE_SEED !== 'true'");
    const firstDelete = seed.indexOf('deleteMany');
    expect(productionGuard).toBeGreaterThanOrEqual(0);
    expect(allowGuard).toBeGreaterThan(productionGuard);
    expect(firstDelete).toBeGreaterThan(allowGuard);
  });

  it('documents localStorage JWT as a Phase 2 HttpOnly-cookie migration item', () => {
    const authContext = read('src/contexts/AuthContext.tsx');
    const api = read('src/utils/api.ts');
    expect(authContext).toContain("localStorage.getItem('token')");
    expect(api).toContain('Authorization = `Bearer ${token}`');
  });
});

describe('upload file signature validation', () => {
  it('accepts valid JPEG, PNG, WEBP, and PDF signatures', async () => {
    const jpg = writeFixture('valid.jpg', Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00]));
    const png = writeFixture('valid.png', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const webp = writeFixture('valid.webp', Buffer.from('RIFFxxxxWEBP', 'ascii'));
    const pdf = writeFixture('valid.pdf', Buffer.from('%PDF-1.7\n', 'ascii'));

    await expect(validateFileSignature({ path: jpg, mimetype: 'image/jpeg' })).resolves.toBe(true);
    await expect(validateFileSignature({ path: png, mimetype: 'image/png' })).resolves.toBe(true);
    await expect(validateFileSignature({ path: webp, mimetype: 'image/webp' })).resolves.toBe(true);
    await expect(validateFileSignature({ path: pdf, mimetype: 'application/pdf' })).resolves.toBe(true);
  });

  it('rejects renamed executable and invalid PDF content', async () => {
    const fakeJpg = writeFixture('fake.jpg', Buffer.from('MZ harmless test fixture', 'ascii'));
    const fakePdf = writeFixture('fake.pdf', Buffer.from('not really a pdf', 'ascii'));

    await expect(validateFileSignature({ path: fakeJpg, mimetype: 'image/jpeg' })).resolves.toBe(false);
    await expect(validateFileSignature({ path: fakePdf, mimetype: 'application/pdf' })).resolves.toBe(false);
  });

  it('keeps configured size limits and extension/MIME filters in place', () => {
    const upload = read('server/middleware/upload.ts');
    expect(upload).toContain('limits: { fileSize:');
    expect(upload).toContain('Invalid file type or extension.');
    expect(upload).toContain("'.jpg'");
    expect(upload).toContain("'.pdf'");
  });
});

describe('production security guardrails', () => {
  it('refuses weak production JWT secrets', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalSecret = process.env.JWT_SECRET;
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'secret';

    expect(() => getJwtSecret()).toThrow(/strong JWT_SECRET/);

    process.env.NODE_ENV = originalNodeEnv;
    process.env.JWT_SECRET = originalSecret;
  });

  it('keeps strict CORS, security headers, and endpoint-specific rate limits configured', () => {
    const server = read('server.ts');
    expect(server).not.toContain('origin: "*"');
    expect(server).toContain('helmet({');
    expect(server).toContain('contentSecurityPolicy');
    expect(server).toContain("frameAncestors: [\"'none'\"]");
    expect(server).toContain("referrerPolicy: { policy: 'no-referrer' }");
    expect(server).toContain("app.use('/api/v1/wellbeing/me/chat', aiLimiter)");
    expect(server).toContain("app.use('/api/v1/icc/complaints', publicFormLimiter)");
    expect(server).toContain("app.use('/api/v1/safety/anonymous-concerns', publicFormLimiter)");
    expect(server).toContain("app.use('/api/v1/admin/search', searchLimiter)");
  });

  it('returns 401 before private routes or files are reachable without authentication', async () => {
    const admin = await request(app).get('/api/v1/admin/dashboard');
    const report = await request(app).get('/api/v1/admin/report-documents/report-1/download');
    const iccAttachment = await request(app).get('/api/v1/icc/complaints/complaint-1/attachment');
    const wellbeing = await request(app).get('/api/v1/wellbeing/me/check-ins');

    expect(admin.status).toBe(401);
    expect(report.status).toBe(401);
    expect(iccAttachment.status).toBe(401);
    expect(wellbeing.status).toBe(401);
  });

  it('returns 401 for malformed or invalid JWTs', async () => {
    const response = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', 'Bearer invalid.jwt.token');

    expect(response.status).toBe(401);
  });

  it('returns 401 for expired JWTs before protected handlers run', async () => {
    const expired = jwt.sign({ _id: 'student-expired', role: 'STUDENT' }, getJwtSecret(), { expiresIn: '-1s' });
    const response = await request(app)
      .get('/api/v1/wellbeing/me/check-ins')
      .set('Authorization', `Bearer ${expired}`);

    expect(response.status).toBe(401);
  });

  it('returns 403 when Student or Faculty tokens call Admin APIs', async () => {
    const student = mockAuthenticatedUser('STUDENT', 'student-1');
    const studentResponse = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${student.token}`);
    expect(studentResponse.status).toBe(403);

    vi.restoreAllMocks();

    const faculty = mockAuthenticatedUser('FACULTY', 'faculty-1');
    const facultyResponse = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${faculty.token}`);
    expect(facultyResponse.status).toBe(403);
  });

  it('conceals another student wellbeing check-in ID as not found', async () => {
    const student = mockAuthenticatedUser('STUDENT', 'student-a');
    vi.spyOn(prisma.studentProfile, 'findUnique').mockResolvedValue({ id: 'profile-a', userId: 'student-a' } as any);
    vi.spyOn(prisma.wellbeingCheckIn, 'findFirst').mockResolvedValue(null);

    const response = await request(app)
      .delete('/api/v1/wellbeing/me/check-ins/checkin-owned-by-student-b')
      .set('Authorization', `Bearer ${student.token}`);

    expect(response.status).toBe(404);
    expect(prisma.wellbeingCheckIn.findFirst).toHaveBeenCalledWith({
      where: { id: 'checkin-owned-by-student-b', studentId: 'profile-a' },
    });
  });

  it('denies unauthorized ICC attachment access for another student', async () => {
    const student = mockAuthenticatedUser('STUDENT', 'student-b');
    vi.spyOn(prisma.iccComplaint, 'findUnique').mockResolvedValue({
      id: 'complaint-1',
      submittedById: 'student-a',
      attachmentUrl: '/private/icc/evidence.pdf',
    } as any);

    const response = await request(app)
      .get('/api/v1/icc/complaints/complaint-1/attachment')
      .set('Authorization', `Bearer ${student.token}`);

    expect(response.status).toBe(403);
  });

  it('uses generic duplicate student-registration responses to reduce enumeration', async () => {
    vi.spyOn(Users, 'findOne').mockResolvedValue({ _id: 'existing-user' } as any);

    const response = await request(app)
      .post('/api/v1/auth/student/register')
      .send(validRegistrationPayload);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Registration could not be completed with the provided details.');
    expect(response.body.message).not.toMatch(/email|register/i);
  });

  it('clamps invalid admin student-directory pagination limits', async () => {
    const admin = mockAuthenticatedUser('ADMIN', 'admin-1');
    vi.spyOn(StudentProfiles, 'find').mockResolvedValue([]);
    vi.spyOn(Users, 'find').mockResolvedValue([]);

    const response = await request(app)
      .get('/api/v1/admin/students?page=NaN&limit=999999')
      .set('Authorization', `Bearer ${admin.token}`);

    expect(response.status).toBe(200);
    expect(response.body.meta.page).toBe(1);
    expect(response.body.meta.limit).toBe(50);
  });

  it('rejects non-web URL schemes in stored clickable link schemas', () => {
    expect(SkillSchema.safeParse({
      skillName: 'Testing',
      category: 'Security',
      skillLevel: 'BEGINNER',
      yearsOfExperience: 1,
      portfolioUrl: 'javascript:alert(1)',
      isPrimary: false,
    }).success).toBe(false);

    expect(GovernmentSchemeSchema.safeParse({
      title: 'Security Education Scheme',
      shortDescription: 'Helpful security learning support.',
      fullDescription: 'A longer description for a legitimate public scheme record.',
      provider: 'Provider',
      category: 'Education',
      eligibility: 'Students',
      benefits: 'Training',
      requiredDocuments: ['ID'],
      applicationProcess: 'Apply on the official portal.',
      officialUrl: 'data:text/html,<script>alert(1)</script>',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      isFeatured: false,
    }).success).toBe(false);

    expect(WorkshopSchema.safeParse({
      title: 'Secure Workshop',
      shortDescription: 'Workshop description.',
      fullDescription: 'Workshop full description with enough detail.',
      category: 'SAFETY',
      startDateTime: '2026-01-01T10:00:00.000Z',
      endDateTime: '2026-01-01T11:00:00.000Z',
      venue: 'Hall',
      organizer: 'Cell',
      registrationUrl: 'vbscript:msgbox(1)',
    }).success).toBe(false);

    expect(JobOpportunitySchema.safeParse({
      title: 'Security Internship',
      organization: 'Example Org',
      opportunityType: 'INTERNSHIP',
      description: 'A legitimate internship description.',
      eligibility: 'Students',
      requiredSkills: ['Security'],
      officialUrl: 'javascript:alert(1)',
      status: 'PUBLISHED',
    }).success).toBe(false);
  });

  it('redacts production 500 error responses while preserving development detail', () => {
    const middlewareSource = read('server/middleware/auth.ts');
    expect(middlewareSource).toContain("status >= 500");
    expect(middlewareSource).toContain("'An unexpected error occurred on the server'");
    expect(middlewareSource).toContain('redactErrorForLog');
  });

  it('keeps private field minimization and backend-only AI provider flow in source', () => {
    const api = read('src/utils/api.ts');
    const ai = read('server/services/aiWellness.ts');
    const publicRoutes = read('server/routes/public.ts');
    const wellbeingRoutes = read('server/routes/wellbeing.ts');

    expect(api).not.toContain('GEMINI_API_KEY');
    expect(api).not.toContain('AI_API_KEY');
    expect(ai).toContain('process.env.AI_API_KEY');
    expect(ai).toContain('generativelanguage.googleapis.com');
    expect(wellbeingRoutes).toContain("router.post('/me/chat', auth, authorize(['STUDENT'])");
    expect(publicRoutes).not.toContain('passwordHash');
  });
});
