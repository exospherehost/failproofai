/**
 * Shared utilities for hooks-advanced/index.js
 * This file is a transitive import — the loader rewrites it automatically.
 */

/** Return true if the command touches a path outside the project root. */
export function isOutsideProject(cmd, cwd) {
  if (!cwd) return false;
  // Very rough check: absolute paths that don't start with cwd
  const absPathRe = /(?:^|\s)(\/[^\s]+)/g;
  let match;
  while ((match = absPathRe.exec(cmd)) !== null) {
    if (!match[1].startsWith(cwd)) return true;
  }
  return false;
}

/** Extract the first git branch name from a push command, e.g. "git push origin feat/foo" → "feat/foo" */
export function extractPushBranch(cmd) {
  const m = cmd.match(/git\s+push\s+\S+\s+(\S+)/);
  return m ? m[1] : null;
}

/** Return the list of staged secret file patterns to check. */
export const SECRET_FILENAME_PATTERNS = [
  /\.pem$/i,
  /\.key$/i,
  /id_rsa/i,
  /credentials\.json$/i,
  /\.p12$/i,
];

export function looksLikeSecretFile(path) {
  return SECRET_FILENAME_PATTERNS.some((re) => re.test(path));
}
