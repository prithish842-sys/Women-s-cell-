import fs from 'fs';
import path from 'path';

const root = process.cwd();
const srcDir = path.join(root, 'src');
const routesDir = path.join(root, 'server', 'routes');

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

const frontendCalls = walk(srcDir)
  .filter((file) => /\.(ts|tsx)$/.test(file))
  .flatMap((file) => {
    const text = fs.readFileSync(file, 'utf8');
    const matches = [...text.matchAll(/api\.(get|post|put|patch|delete)\(\s*`?['"]([^'"`$]+)/g)];
    return matches.map((match) => ({
      file: path.relative(root, file),
      method: match[1].toUpperCase(),
      path: match[2],
    }));
  });

const routePrefixes: Record<string, string> = {
  'auth.ts': '/auth',
  'public.ts': '/public',
  'student.ts': '/students',
  'icc.ts': '/icc',
  'faculty.ts': '/faculty',
  'admin.ts': '/admin',
};

const backendRoutes = walk(routesDir)
  .filter((file) => /\.(ts)$/.test(file))
  .flatMap((file) => {
    const text = fs.readFileSync(file, 'utf8');
    const routeFile = path.basename(file);
    const prefix = routePrefixes[routeFile] || '';
    const matches = [...text.matchAll(/router\.(get|post|put|patch|delete)\(\s*['"]([^'"]+)/g)];
    return matches.map((match) => ({
      file: path.relative(root, file),
      method: match[1].toUpperCase(),
      path: `${prefix}${match[2]}`.replace(/\/:([^/]+)/g, '/:param'),
    }));
  });

function normalize(callPath: string) {
  return callPath
    .replace(/\?.*$/, '')
    .replace(/\/\$\{[^}]+\}/g, '/:param')
    .replace(/\/:[^/]+/g, '/:param');
}

function routeMatches(routePath: string, callPath: string) {
  const normalizedRoute = normalize(routePath);
  const normalizedCall = normalize(callPath);
  const routeParts = normalizedRoute.split('/').filter(Boolean);
  const callParts = normalizedCall.split('/').filter(Boolean);
  if (routeParts.length !== callParts.length) return false;
  return routeParts.every((part, index) => part === ':param' || part === callParts[index]);
}

const unmatched = frontendCalls.filter((call) => {
  return !backendRoutes.some((route) => route.method === call.method && routeMatches(route.path, call.path));
});

console.log('Frontend API calls:', frontendCalls.length);
console.log('Backend route handlers:', backendRoutes.length);

if (unmatched.length > 0) {
  console.log('Unmatched frontend calls:');
  for (const call of unmatched) {
    console.log(`${call.method} ${call.path} (${call.file})`);
  }
  process.exitCode = 1;
} else {
  console.log('No unmatched frontend API calls found.');
}
