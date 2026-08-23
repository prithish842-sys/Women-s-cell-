import { afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { detectWellnessLanguage, generateWellnessReply, isImmediateSafetyRisk } from '../services/aiWellness.js';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('safety and wellbeing integration contracts', () => {
  it('exposes public safety routes without requiring authentication', () => {
    const app = read('server.ts');
    const safetyRoutes = read('server/routes/safety.ts');

    expect(app).toContain("app.use('/api/v1/safety', safetyRouter)");
    expect(safetyRoutes).toContain("router.get('/guides'");
    expect(safetyRoutes).toContain("router.get('/resources'");
    expect(safetyRoutes).toContain("router.post('/anonymous-concerns'");
    expect(safetyRoutes).not.toContain("router.get('/guides', auth");
    expect(safetyRoutes).not.toContain("router.post('/anonymous-concerns', auth");
  });

  it('keeps anonymous concern attachments private and validates file signatures', () => {
    const upload = read('server/middleware/upload.ts');
    const safetyRoutes = read('server/routes/safety.ts');
    const app = read('server.ts');

    expect(upload).toContain("'private/anonymous-concerns'");
    expect(upload).toContain('uploadAnonymousConcernAttachment');
    expect(upload).toContain('validateFileSignature(file)');
    expect(safetyRoutes).not.toContain('submittedById');
    expect(app).not.toContain("private/anonymous-concerns");
  });

  it('stores wellbeing history only behind explicit privacy consent', () => {
    const wellbeingRoutes = read('server/routes/wellbeing.ts');

    expect(wellbeingRoutes).toContain('storeAiChatHistory');
    expect(wellbeingRoutes).toContain('personalizeAiWithCheckIns');
    expect(wellbeingRoutes).toContain('if (settings.storeAiChatHistory)');
    expect(wellbeingRoutes).toContain('settings.personalizeAiWithCheckIns');
    expect(wellbeingRoutes).toContain("router.delete('/me/check-ins/:checkInId'");
  });

  it('keeps AI provider secrets backend-only and out of the service worker cache', () => {
    const aiService = read('server/services/aiWellness.ts');
    const frontend = [
      read('src/pages/student/WellbeingChat.tsx'),
      read('src/pages/student/Wellbeing.tsx'),
      read('src/pages/student/WellbeingSupport.tsx'),
      read('src/pages/public/Safety.tsx'),
      read('public/sw.js'),
    ].join('\n');

    expect(aiService).toContain('AI_PROVIDER_API_KEY');
    expect(aiService).toContain('GEMINI_API_KEY');
    expect(frontend).not.toContain('AI_PROVIDER_API_KEY');
    expect(frontend).not.toContain('GEMINI_API_KEY');
    expect(read('public/sw.js')).toContain("pathname.includes('/wellbeing')");
    expect(read('public/sw.js')).toContain("pathname.includes('/admin')");
    expect(read('public/sw.js')).toContain("pathname.startsWith('/uploads')");
  });

  it('registers public, student, and admin navigation surfaces', () => {
    const routes = read('src/App.tsx');
    const header = read('src/components/common/Header.tsx');
    const layouts = read('src/components/common/Layouts.tsx');

    expect(routes).toContain('path="/safety"');
    expect(routes).toContain('path="/student/wellbeing"');
    expect(routes).toContain('path="/admin/safety/wellbeing"');
    expect(header).toContain("path: '/safety'");
    expect(layouts).toContain("path: '/student/wellbeing'");
    expect(layouts).toContain("path: '/admin/safety/wellbeing'");
  });
});

describe('wellbeing AI guardrails', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('detects English, Tamil, and Tanglish messages', () => {
    expect(detectWellnessLanguage('I feel stressed today', 'AUTO')).toBe('ENGLISH');
    expect(detectWellnessLanguage('நான் இன்று சோர்வாக இருக்கிறேன்', 'AUTO')).toBe('TAMIL');
    expect(detectWellnessLanguage('naan romba stress iruku', 'AUTO')).toBe('TANGLISH');
    expect(detectWellnessLanguage('anything', 'TAMIL')).toBe('TAMIL');
  });

  it('flags immediate safety risk phrases without diagnosing', async () => {
    process.env = { ...originalEnv, AI_PROVIDER_API_KEY: '', GEMINI_API_KEY: '' };

    expect(isImmediateSafetyRisk('I want to kill myself')).toBe(true);
    const reply = await generateWellnessReply({ message: 'I want to kill myself', languagePreference: 'AUTO' });

    expect(reply.safetyRisk).toBe(true);
    expect(reply.providerAvailable).toBe(false);
    expect(reply.content).toContain('immediate safety');
    expect(reply.content.toLowerCase()).not.toContain('diagnosis');
  });

  it('falls back locally when no provider key is configured', async () => {
    process.env = { ...originalEnv, AI_PROVIDER_API_KEY: '', GEMINI_API_KEY: '' };

    const reply = await generateWellnessReply({
      message: 'exam pressure is high',
      languagePreference: 'AUTO',
      context: { stressLevel: 4 },
    });

    expect(reply.providerAvailable).toBe(false);
    expect(reply.language).toBe('ENGLISH');
    expect(reply.content).toContain('Stress level noted: 4/5');
  });
});
