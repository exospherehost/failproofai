#!/usr/bin/env node
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootPkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));
const VERSION = rootPkg.version;
const DRY_RUN = process.argv.includes('--dry-run');

const ALIASES = [
  // Formatting variants — no "ai", or hyphen/underscore separators
  'failproof',
  'failproof-ai',
  'fail-proof-ai',
  'failproof_ai',
  'fail_proof_ai',
  'fail-proofai',
  // Missing one 'o' from "proof" — common single-char slip
  'failprof',
  'failprof-ai',
  'failprofai',
  'fail-prof-ai',
  'failprof_ai',
  // 'a'/'i' transposition — common keyboard slip
  'faliproof',
  'faliproof-ai',
  'faliproofai',
];

for (const name of ALIASES) {
  const tmpDir = join('/tmp', `npm-alias-${name}-${Date.now()}`);
  const binDir = join(tmpDir, 'bin');
  mkdirSync(binDir, { recursive: true });

  const pkg = {
    name,
    version: VERSION,
    description: `Alias for failproofai — installs if you typed '${name}' instead of 'failproofai'`,
    bin: { [name]: './bin/proxy.js' },
    files: ['bin/'],
    dependencies: { failproofai: VERSION },
    publishConfig: { access: 'public' },
    repository: rootPkg.repository,
    homepage: rootPkg.homepage,
    bugs: rootPkg.bugs,
    license: rootPkg.license,
  };

  writeFileSync(join(tmpDir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
  cpSync(join(__dirname, 'alias-proxy.js'), join(binDir, 'proxy.js'));

  if (DRY_RUN) {
    console.log(`[dry-run] Would publish ${name}@${VERSION}`);
    console.log(JSON.stringify(pkg, null, 2));
    console.log('---');
  } else {
    console.log(`Publishing ${name}@${VERSION}...`);
    execSync('npm publish', { cwd: tmpDir, stdio: 'inherit' });
    console.log(`Done: ${name}`);
  }

  rmSync(tmpDir, { recursive: true, force: true });
}
