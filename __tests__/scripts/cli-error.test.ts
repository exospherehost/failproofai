// @vitest-environment node
import { describe, it, expect } from "vitest";
import { CliError } from "../../src/cli-error";

describe("CliError", () => {
  it("is an instance of Error", () => {
    const err = new CliError("something went wrong");
    expect(err).toBeInstanceOf(Error);
  });

  it("has name CliError", () => {
    const err = new CliError("something went wrong");
    expect(err.name).toBe("CliError");
  });

  it("defaults to exit code 1 (user error)", () => {
    const err = new CliError("bad input");
    expect(err.exitCode).toBe(1);
  });

  it("accepts explicit exit code 1", () => {
    const err = new CliError("bad input", 1);
    expect(err.exitCode).toBe(1);
  });

  it("accepts explicit exit code 2 (internal error)", () => {
    const err = new CliError("file write failed", 2);
    expect(err.exitCode).toBe(2);
  });

  it("preserves the message", () => {
    const err = new CliError("Unknown policy name(s): foo");
    expect(err.message).toBe("Unknown policy name(s): foo");
  });

  it("can be caught as CliError with instanceof", () => {
    function thrower() {
      throw new CliError("oops", 1);
    }
    expect(thrower).toThrow(CliError);
    expect(thrower).toThrow("oops");
  });

  it("can be caught as Error with instanceof", () => {
    function thrower() {
      throw new CliError("oops");
    }
    expect(thrower).toThrow(Error);
  });
});
