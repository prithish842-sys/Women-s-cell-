const backendUrl = process.env.VERIFY_BACKEND_URL || 'http://localhost:5000';
const frontendUrl = process.env.VERIFY_FRONTEND_URL || 'http://localhost:5173';
const apiBase = `${backendUrl}/api/v1`;

type CheckResult = {
  name: string;
  ok: boolean;
  detail: string;
};

const sensitivePatterns = [
  /passwordHash/i,
  /\bpassword\b/i,
  /jwt_secret/i,
  /DATABASE_URL/i,
  /postgresql:\/\/[^"'\s]+/i,
  /C:\\Users\\/i,
  /at\s+.*\.(ts|js):\d+:\d+/i,
  /PrismaClientKnownRequestError/i,
];

function record(results: CheckResult[], name: string, ok: boolean, detail: string) {
  results.push({ name, ok, detail });
}

async function request(pathOrUrl: string) {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${apiBase}${pathOrUrl}`;
  const response = await fetch(url);
  const contentType = response.headers.get('content-type') || '';
  const buffer = await response.arrayBuffer();
  const text = new TextDecoder().decode(buffer);
  let json: any = null;
  if (contentType.includes('application/json')) {
    json = JSON.parse(text);
  }
  return { url, response, contentType, text, json };
}

function assertNoSensitiveData(name: string, text: string, results: CheckResult[]) {
  const hit = sensitivePatterns.find(pattern => pattern.test(text));
  record(results, `${name}: sensitive data scan`, !hit, hit ? `Matched ${hit}` : 'No sensitive tokens or local absolute paths found.');
}

function assertJsonEnvelope(name: string, json: any, results: CheckResult[]) {
  record(results, `${name}: JSON envelope`, typeof json?.success === 'boolean' && 'data' in json, 'Requires boolean success and data field.');
}

function collectUploadUrls(value: unknown, urls = new Set<string>()) {
  if (!value || typeof value !== 'object') return urls;
  if (Array.isArray(value)) {
    value.forEach(item => collectUploadUrls(item, urls));
    return urls;
  }
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (/image|url|certificate|attachment|cover|thumbnail/i.test(key) && typeof nested === 'string' && nested) {
      urls.add(nested);
    } else {
      collectUploadUrls(nested, urls);
    }
  }
  return urls;
}

async function main() {
  const results: CheckResult[] = [];

  try {
    const health = await request('/health');
    record(results, 'Backend port 5000 reachable', health.response.ok, `${health.response.status} ${health.contentType}`);
    assertJsonEnvelope('Health endpoint', health.json, results);
    record(results, 'Health database status', health.json?.data?.database === 'connected', `database=${health.json?.data?.database}`);
    assertNoSensitiveData('Health endpoint', health.text, results);
  } catch (error: any) {
    record(results, 'Backend health endpoint', false, error.message);
  }

  try {
    const frontend = await request(frontendUrl);
    record(results, 'Frontend URL reachable', frontend.response.ok && frontend.text.includes('<div id="root">'), `${frontend.response.status} ${frontend.contentType}`);
  } catch (error: any) {
    record(results, 'Frontend URL reachable', false, error.message);
  }

  const publicEndpoints = [
    { path: '/public/statistics', expectedStatus: 200, shape: (json: any) => typeof json?.data?.totalStudents === 'number' },
    { path: '/public/members', expectedStatus: 200, shape: (json: any) => Array.isArray(json?.data) },
    { path: '/public/schemes', expectedStatus: 200, shape: (json: any) => Array.isArray(json?.data) },
    { path: '/public/workshops', expectedStatus: 404, shape: (json: any) => json?.success === false },
    { path: '/public/gallery', expectedStatus: 200, shape: (json: any) => Array.isArray(json?.data) },
    { path: '/public/achievements', expectedStatus: 200, shape: (json: any) => Array.isArray(json?.data) },
  ];

  for (const { path, expectedStatus, shape } of publicEndpoints) {
    try {
      const result = await request(path);
      record(results, `${path}: status`, result.response.status === expectedStatus, `${result.response.status} ${result.contentType}`);
      if (expectedStatus === 200) assertJsonEnvelope(path, result.json, results);
      record(results, `${path}: shape`, shape(result.json), 'Current public response shape matches baseline.');
      assertNoSensitiveData(path, result.text, results);
    } catch (error: any) {
      record(results, `${path}: request`, false, error.message);
    }
  }

  const protectedEndpoints = ['/auth/me', '/students/me', '/faculty/dashboard', '/admin/dashboard'];
  for (const path of protectedEndpoints) {
    try {
      const result = await request(path);
      record(results, `${path}: unauthenticated rejection`, [401, 403].includes(result.response.status), `status=${result.response.status}`);
      if (result.contentType.includes('application/json')) assertNoSensitiveData(path, result.text, results);
    } catch (error: any) {
      record(results, `${path}: unauthenticated rejection`, false, error.message);
    }
  }

  try {
    const missing = await request('/no-such-route');
    const expectedText404 = missing.response.status === 404 && missing.text.includes('Cannot GET /api/v1/no-such-route');
    const expectedJson404 = missing.response.status === 404 && missing.json?.success === false;
    record(results, 'Invalid API route 404 baseline', expectedText404 || expectedJson404, `${missing.response.status} ${missing.contentType}`);
    assertNoSensitiveData('Invalid API route', missing.text, results);
  } catch (error: any) {
    record(results, 'Invalid API route 404 baseline', false, error.message);
  }

  try {
    const staticFile = await request(`${backendUrl}/uploads/demo_album1_cover.png`);
    record(results, 'Static upload URL reachable', staticFile.response.status === 200 && staticFile.contentType.startsWith('image/'), `${staticFile.response.status} ${staticFile.contentType}`);
  } catch (error: any) {
    record(results, 'Static upload URL reachable', false, error.message);
  }

  try {
    const gallery = await request('/public/gallery');
    const urls = [...collectUploadUrls(gallery.json?.data)];
    const malformed = urls.filter(url => /C:\\|undefined|null|\\/i.test(url) || (!url.startsWith('/uploads/') && !/^https?:\/\//i.test(url)));
    record(results, 'Public upload/static URL shape', malformed.length === 0, malformed.length ? malformed.slice(0, 5).join(', ') : `${urls.length} URL fields checked.`);
  } catch (error: any) {
    record(results, 'Public upload/static URL shape', false, error.message);
  }

  for (const result of results) {
    console.log(`${result.ok ? 'PASS' : 'FAIL'} ${result.name} - ${result.detail}`);
  }

  const failed = results.filter(result => !result.ok);
  if (failed.length > 0) {
    console.error(`Runtime smoke verification failed: ${failed.length} check(s) failed.`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
