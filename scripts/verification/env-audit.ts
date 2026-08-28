import fs from 'fs';
import path from 'path';

const root = process.cwd();
const envFiles = ['.env', '.env.example', '.env.production.example'].filter(file => fs.existsSync(path.join(root, file)));
const sourceRoots = ['server.ts', 'vite.config.ts', 'server', 'src', 'prisma'];

function walk(target: string): string[] {
  const full = path.join(root, target);
  if (!fs.existsSync(full)) return [];
  const stat = fs.statSync(full);
  if (stat.isFile()) return [full];
  return fs.readdirSync(full, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(full, entry.name);
    return entry.isDirectory() ? walk(path.relative(root, entryPath)) : [entryPath];
  });
}

function readEnvNames(file: string) {
  return fs.readFileSync(path.join(root, file), 'utf8')
    .split(/\r?\n/)
    .map(line => line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/)?.[1])
    .filter(Boolean) as string[];
}

const envNames = new Map(envFiles.map(file => [file, new Set(readEnvNames(file))]));
const sourceText = sourceRoots.flatMap(walk)
  .filter(file => /\.(ts|tsx|prisma)$/.test(file))
  .map(file => fs.readFileSync(file, 'utf8'))
  .join('\n');

const referenced = new Set<string>();
for (const match of sourceText.matchAll(/(?:process\.env\.|import\.meta\.env\.|env\(")([A-Za-z_][A-Za-z0-9_]*)/g)) {
  referenced.add(match[1]);
}

const envExample = envNames.get('.env.example') || new Set<string>();
const envLocal = envNames.get('.env') || new Set<string>();
const setupOnlyEnv = new Set(['SEED_DEFAULT_PASSWORD', 'WEC_MEMBER_DEFAULT_PASSWORD']);
const builtInEnv = new Set(['NODE_ENV', 'DISABLE_HMR', 'PROD', 'VERCEL']);
const optionalProviderEnv = new Set([
  'AI_API_KEY',
  'DATABASE_URL_DATABASE_URL',
  'DATABASE_URL_POSTGRES_PRISMA_URL',
  'DATABASE_URL_POSTGRES_URL',
  'DATABASE_URL_UNPOOLED',
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL',
  'POSTGRES_URL_NON_POOLING',
]);
const missingFromExample = [...referenced].filter(name => !envExample.has(name) && !builtInEnv.has(name) && !optionalProviderEnv.has(name));
const missingFromLocal = [...referenced].filter(name => !envLocal.has(name) && !builtInEnv.has(name) && !setupOnlyEnv.has(name) && !optionalProviderEnv.has(name));
const frontendUnsafe = [...referenced].filter(name => !builtInEnv.has(name) && !name.startsWith('VITE_') && sourceText.includes(`import.meta.env.${name}`));

console.log(`Environment files inspected: ${envFiles.join(', ') || 'none'}`);
console.log(`Referenced environment variable names: ${[...referenced].sort().join(', ')}`);
console.log(`.env variable names: ${[...envLocal].sort().join(', ')}`);
console.log(`.env.example variable names: ${[...envExample].sort().join(', ')}`);

if (missingFromExample.length > 0) console.error(`Missing from .env.example: ${missingFromExample.sort().join(', ')}`);
if (missingFromLocal.length > 0) console.error(`Missing from .env: ${missingFromLocal.sort().join(', ')}`);
if (frontendUnsafe.length > 0) console.error(`Non-VITE frontend env references: ${frontendUnsafe.sort().join(', ')}`);

if (missingFromExample.length || missingFromLocal.length || frontendUnsafe.length) {
  process.exit(1);
}

console.log('Environment variable name audit passed.');
