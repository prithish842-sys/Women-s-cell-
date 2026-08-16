const API_BASE = process.env.LOAD_TEST_API_BASE || 'http://localhost:5000/api/v1';
const MAX_STAGE = Number(process.env.LOAD_TEST_MAX_STAGE || 2000);
const MAX_P95_MS = Number(process.env.LOAD_TEST_MAX_P95_MS || 60000);
const MAX_ERROR_RATE = Number(process.env.LOAD_TEST_MAX_ERROR_RATE || 0.05);
const stages = [50, 100, 250, 500, 1000, 1500, 2000].filter(stage => stage <= MAX_STAGE);

const runId = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
const accountCount = Math.min(20, Math.max(4, Math.ceil(MAX_STAGE / 100)));

async function jsonRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { response, json };
}

async function createAccount(index) {
  const identifier = `LOAD${runId}${String(index).padStart(2, '0')}`;
  const password = `Load${runId}${index}Test9`;
  const body = {
    name: `Load Test Student ${index + 1}`,
    email: `load.${runId}.${index}@college.edu`,
    registerNumber: identifier,
    phone: '9876543210',
    department: 'Computer Science',
    course: 'B.Sc Computer Science',
    joiningAcademicYear: '2024-2025',
    expectedPassingYear: 2027,
    expectedCompletionDate: '2027-04-30',
    courseDurationYears: 3,
    password,
    confirmPassword: password,
  };
  const { response, json } = await jsonRequest('/auth/student/register', { method: 'POST', body: JSON.stringify(body) });
  if (![201, 400].includes(response.status)) {
    throw new Error(`Could not prepare load account ${index}: ${response.status} ${json?.message || ''}`);
  }
  return { identifier, password };
}

async function prepareAccounts() {
  const accounts = [];
  for (let index = 0; index < accountCount; index += 4) {
    const chunk = await Promise.all(
      Array.from({ length: Math.min(4, accountCount - index) }, (_, offset) => createAccount(index + offset))
    );
    accounts.push(...chunk);
  }
  return accounts;
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  return Math.round(sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)]);
}

async function runStage(stage, accounts, invalid = false) {
  const latencies = [];
  const statuses = new Map();
  const startedAt = Date.now();
  let completed = 0;
  const rampWindowMs = Math.min(10000, Math.max(1000, stage * 10));

  await Promise.all(Array.from({ length: stage }, async (_, index) => {
    await new Promise(resolve => setTimeout(resolve, Math.floor((index / stage) * rampWindowMs)));
    const account = accounts[index % accounts.length];
    const password = invalid ? `${account.password}-invalid` : account.password;
    const start = performance.now();
    let status = 0;
    try {
      const result = await jsonRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: account.identifier, password }),
      });
      status = result.response.status;
    } catch {
      status = 0;
    } finally {
      latencies.push(performance.now() - start);
      statuses.set(status, (statuses.get(status) || 0) + 1);
      completed += 1;
    }
  }));

  latencies.sort((a, b) => a - b);
  const durationMs = Date.now() - startedAt;
  const expected = invalid ? new Set([401]) : new Set([200]);
  const failed = [...statuses.entries()].reduce((sum, [status, count]) => sum + (expected.has(status) ? 0 : count), 0);
  return {
    stage,
    mode: invalid ? 'invalid-password' : 'valid-login',
    durationMs,
    total: completed,
    successful: completed - failed,
    failed,
    errorRate: Number((failed / Math.max(completed, 1)).toFixed(4)),
    rps: Number((completed / (durationMs / 1000)).toFixed(2)),
    p50: percentile(latencies, 50),
    p95: percentile(latencies, 95),
    p99: percentile(latencies, 99),
    statuses: Object.fromEntries([...statuses.entries()].sort((a, b) => Number(a[0]) - Number(b[0]))),
  };
}

async function main() {
  const health = await jsonRequest('/health');
  if (!health.response.ok) throw new Error(`Health check failed: ${health.response.status}`);

  const accounts = await prepareAccounts();
  const results = [];
  for (const stage of stages) {
    for (const invalid of [false, true]) {
      const result = await runStage(stage, accounts, invalid);
      results.push(result);
      console.log(JSON.stringify(result));
      if (result.errorRate > MAX_ERROR_RATE || result.p95 > MAX_P95_MS) {
        console.error(`Stopping escalation after ${stage} ${result.mode}: p95=${result.p95}ms errorRate=${result.errorRate}`);
        console.log(JSON.stringify({ stoppedAt: stage, reason: 'safety-threshold', results }, null, 2));
        return;
      }
    }
  }
  console.log(JSON.stringify({ stoppedAt: null, reason: 'completed', results }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
