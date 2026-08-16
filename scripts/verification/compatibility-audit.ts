import fs from 'fs';
import path from 'path';

const root = process.cwd();
const srcDir = path.join(root, 'src');
const routesDir = path.join(root, 'server', 'routes');

const routePrefixes: Record<string, string> = {
  'auth.ts': '/auth',
  'public.ts': '/public',
  'student.ts': '/students',
  'faculty.ts': '/faculty',
  'admin.ts': '/admin',
  'icc.ts': '/icc',
};

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function normalizePath(value: string) {
  return value
    .replace(/\?.*$/, '')
    .replace(/\/\$\{[^}]+\}/g, '/:param')
    .replace(/\/:[^/]+/g, '/:param');
}

function routeMatches(routePath: string, callPath: string) {
  const routeParts = normalizePath(routePath).split('/').filter(Boolean);
  const callParts = normalizePath(callPath).split('/').filter(Boolean);
  if (routeParts.length !== callParts.length) return false;
  return routeParts.every((part, index) => part === ':param' || part === callParts[index]);
}

const frontendCalls = walk(srcDir)
  .filter(file => /\.(ts|tsx)$/.test(file))
  .flatMap((file) => {
    const text = fs.readFileSync(file, 'utf8');
    const matches = [...text.matchAll(/api\.(get|post|put|patch|delete)\(\s*(?:`([^`$]*)`|'([^']*)'|"([^"]*)")/g)];
    return matches
      .map(match => ({
        file: path.relative(root, file),
        method: match[1].toUpperCase(),
        path: match[2] || match[3] || match[4],
      }))
      .filter(call => call.path.startsWith('/'));
  });

const backendRoutes = walk(routesDir)
  .filter(file => file.endsWith('.ts'))
  .flatMap((file) => {
    const text = fs.readFileSync(file, 'utf8');
    const prefix = routePrefixes[path.basename(file)] || '';
    const matches = [...text.matchAll(/router\.(get|post|put|patch|delete)\(\s*['"]([^'"]+)/g)];
    return matches.map(match => ({
      file: path.relative(root, file),
      method: match[1].toUpperCase(),
      path: `${prefix}${match[2]}`,
      protected: /auth|authorize\(/.test(text.slice(match.index || 0, Math.min(text.length, (match.index || 0) + 260))),
    }));
  });

const unmatched = frontendCalls.filter(call => !backendRoutes.some(route => route.method === call.method && routeMatches(route.path, call.path)));
const duplicateFrontendCalls = new Map<string, string[]>();
for (const call of frontendCalls) {
  const key = `${call.method} ${normalizePath(call.path)}`;
  duplicateFrontendCalls.set(key, [...(duplicateFrontendCalls.get(key) || []), call.file]);
}

const duplicateBackendRoutes = new Map<string, string[]>();
for (const route of backendRoutes) {
  const key = `${route.method} ${normalizePath(route.path)}`;
  duplicateBackendRoutes.set(key, [...(duplicateBackendRoutes.get(key) || []), route.file]);
}

const duplicateFrontend = [...duplicateFrontendCalls.entries()].filter(([, files]) => new Set(files).size > 1);
const duplicateBackend = [...duplicateBackendRoutes.entries()].filter(([, files]) => files.length > 1);
const unusedBackendGetRoutes = backendRoutes.filter(route =>
  route.method === 'GET' &&
  !frontendCalls.some(call => call.method === route.method && routeMatches(route.path, call.path)) &&
  !route.path.includes('/:param')
);

console.log(`Frontend API calls inspected: ${frontendCalls.length}`);
console.log(`Backend route handlers inspected: ${backendRoutes.length}`);
console.log(`Confirmed frontend/backend method+path matches: ${frontendCalls.length - unmatched.length}`);

if (duplicateFrontend.length > 0) {
  console.log('Duplicate frontend service call surfaces:');
  for (const [key, files] of duplicateFrontend) console.log(`- ${key} -> ${[...new Set(files)].join(', ')}`);
}

if (duplicateBackend.length > 0) {
  console.log('Duplicate backend route handlers:');
  for (const [key, files] of duplicateBackend) console.log(`- ${key} -> ${files.join(', ')}`);
}

if (unusedBackendGetRoutes.length > 0) {
  console.log('Backend GET routes with no direct frontend api.get baseline call:');
  for (const route of unusedBackendGetRoutes) console.log(`- ${route.method} ${route.path} (${route.file})`);
}

if (unmatched.length > 0) {
  console.error('Unmatched frontend API calls:');
  for (const call of unmatched) console.error(`- ${call.method} ${call.path} (${call.file})`);
  process.exit(1);
}

console.log('No unmatched frontend API method/path calls found.');
