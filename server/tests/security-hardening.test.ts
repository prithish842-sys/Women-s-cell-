import { afterEach, describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { validateFileSignature } from '../middleware/upload.js';

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
  for (const filePath of tempFiles.splice(0)) {
    fs.rmSync(filePath, { force: true });
  }
});

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
