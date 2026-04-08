/**
 * CliError — structured error for the failproofai CLI.
 *
 * Throw this for any error that should be reported to the user as a clean
 * message (no stack trace). The exit code communicates the failure class:
 *
 *   1 — user error   (bad args, unknown policy name, invalid flag)
 *   2 — internal     (file I/O failure, unexpected state)
 */
export class CliError extends Error {
  readonly exitCode: 1 | 2;

  constructor(message: string, exitCode: 1 | 2 = 1) {
    super(message);
    this.name = "CliError";
    this.exitCode = exitCode;
  }
}
