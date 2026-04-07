#!/usr/bin/env node
'use strict';
const { spawnSync } = require('child_process');
const path = require('path');
const isWin = process.platform === 'win32';

// Use the npm-generated bin wrapper so the bun shebang is handled correctly
// on all platforms (including the .cmd wrapper on Windows).
const binary = path.join(
  __dirname, '..', 'node_modules', '.bin',
  isWin ? 'failproofai.cmd' : 'failproofai'
);

const result = spawnSync(binary, process.argv.slice(2), {
  stdio: 'inherit',
  shell: isWin,
});
process.exit(result.status ?? 1);
