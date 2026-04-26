#!/usr/bin/env bun
import { homedir } from "node:os";
import { resolve } from "node:path";
import { writeCodexTraceFile } from "../src/codex/trace-parser";

function getArgValue(args, key) {
  const inline = args.find((arg) => arg.startsWith(`${key}=`));
  if (inline) return inline.slice(key.length + 1);
  const idx = args.indexOf(key);
  if (idx >= 0) return args[idx + 1];
  return undefined;
}

function printUsage() {
  console.log(`
Usage:
  node scripts/codex-trace.mjs [--input <path>] [--output <path>]

Defaults:
  --input   ~/.codex/log/codex-tui.log
  --output  ~/.codex/log/codex-tool-trace.jsonl
`.trim());
}

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  printUsage();
  process.exit(0);
}

const defaultInput = resolve(homedir(), ".codex", "log", "codex-tui.log");
const defaultOutput = resolve(homedir(), ".codex", "log", "codex-tool-trace.jsonl");

const inputPath = getArgValue(args, "--input") ?? defaultInput;
const outputPath = getArgValue(args, "--output") ?? defaultOutput;

try {
  const count = writeCodexTraceFile(inputPath, outputPath);
  console.log(`Wrote ${count} trace entr${count === 1 ? "y" : "ies"} to ${outputPath}`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to extract Codex trace: ${message}`);
  process.exit(1);
}
