import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('admin control centre integration contracts', () => {
  it('keeps admin routes protected while isolating ICC details to ICC_ADMIN', () => {
    const app = read('src/App.tsx');
    const auth = read('server/middleware/auth.ts');
    const adminRoutes = read('server/routes/admin.ts');
    expect(app).toContain("allowedRoles={['ADMIN', 'ICC_ADMIN']}");
    expect(app).toContain("allowedRoles={['ICC_ADMIN']}");
    expect(auth).toContain("'ICC_ADMIN'");
    expect(adminRoutes).toContain("authorize(['ICC_ADMIN'])");
    expect(adminRoutes).toContain('pendingIccCaseCount');
    expect(adminRoutes).toContain('Confidential ICC case requires authorized review.');
  });

  it('adds persisted admin modules without duplicating existing workshop registration records', () => {
    const schema = read('prisma/schema.prisma');
    const adminRoutes = read('server/routes/admin.ts');
    expect(schema).toContain('model JobOpportunity');
    expect(schema).toContain('model SafetySupportContact');
    expect(schema).toContain('attendanceMarkedAt');
    expect(schema).toContain('certificateIssuedAt');
    expect(schema).not.toContain('model WorkshopParticipant');
    expect(adminRoutes).toContain("router.get('/workshop-registrations'");
    expect(adminRoutes).toContain("router.delete('/workshops/:workshopId'");
    expect(adminRoutes).toContain("router.patch('/workshops/:workshopId/registrations/:registrationId/certificate'");
    expect(adminRoutes).toContain("router.get('/opportunities'");
    expect(adminRoutes).toContain("router.get('/safety-directory'");
    expect(adminRoutes).toContain("router.get('/reports'");
  });

  it('wires productive admin routes while keeping the role nav focused', () => {
    const app = read('src/App.tsx');
    const layout = read('src/components/common/Layouts.tsx');
    const dashboard = read('src/pages/admin/Dashboard.tsx');
    const registrations = read('src/pages/admin/WorkshopRegistrations.tsx');
    expect(layout).toContain('/admin/dashboard');
    expect(layout).toContain('/admin/students');
    expect(layout).toContain('/admin/workshops');
    expect(layout).toContain('/admin/schemes');
    expect(layout).not.toContain('/admin/alumni');
    expect(app).toContain('path="/admin/alumni"');
    expect(app).toContain('path="/admin/opportunities"');
    expect(app).toContain('path="/admin/workshop-registrations"');
    expect(app).toContain('path="/admin/safety-directory"');
    expect(app).toContain('path="/admin/reports"');
    expect(dashboard).toContain("api.get('/admin/dashboard')");
    expect(dashboard).toContain('Recent Registrations');
    expect(dashboard).toContain('Pending Admin Actions');
    expect(dashboard).toContain('Department Participation');
    expect(registrations).toContain("'/admin/workshop-registrations'");
    expect(registrations).toContain('Issue');
    expect(registrations).toContain('Revoke');
  });
});
