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

const skipped = [];
const failed = [];

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
    rmSync(tmpDir, { recursive: true, force: true });
    continue;
  }

  console.log(`Publishing ${name}@${VERSION}...`);
  try {
    execSync('npm publish', { cwd: tmpDir, stdio: 'pipe' });
    console.log(`Done: ${name}`);
  } catch (err) {
    const output = (err.stdout?.toString() ?? '') + (err.stderr?.toString() ?? '');
    if (output.includes('E403') && output.includes('too similar')) {
      // npm blocks names that normalize to the same string as an existing package
      // (e.g. "failproof-ai" → "failproofai"). These must be requested via npm
      // support at https://www.npmjs.com/support — skipping without failing the build.
      console.warn(`[SKIP] ${name}: blocked by npm similarity check — request manually via npm support`);
      skipped.push(name);
    } else if (output.includes('E403') && output.includes('cannot publish over')) {
      // Already published at this version — treat as success.
      console.log(`[SKIP] ${name}: already published at ${VERSION}`);
    } else {
      console.error(`[FAIL] ${name}:\n${output}`);
      failed.push(name);
    }
  }

  rmSync(tmpDir, { recursive: true, force: true });
}

if (skipped.length > 0) {
  console.log(`\nSkipped (npm similarity block — request via npm support):\n  ${skipped.join('\n  ')}`);
}

if (failed.length > 0) {
  console.error(`\nFailed with unexpected errors:\n  ${failed.join('\n  ')}`);
  process.exit(1);
}
