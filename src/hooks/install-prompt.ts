/**
 * Interactive searchable multi-select prompt for choosing hook policies.
 * Uses raw mode stdin with node:readline for keypress handling.
 * No external dependencies.
 *
 * Rendering strategy: track line count, use cursor-up + clear-to-end-of-screen
 * (\x1B[NA\x1B[J) to avoid flickering. Lines are truncated to terminal width to
 * ensure lastLineCount stays accurate when the terminal is narrow.
 *
 * Keybindings: ↑↓ navigate · Space toggle · Ctrl+A all · Ctrl+S save · Esc clear search
 */
import * as readline from "node:readline";
import { BUILTIN_POLICIES } from "./builtin-policies";

interface SelectItem {
  name: string;
  description: string;
  category: string;
  selected: boolean;
  beta: boolean;
}

type DisplayRow =
  | { kind: "header"; category: string; enabledCount: number; totalCount: number }
  | { kind: "item"; item: SelectItem; filteredIndex: number };

export interface PromptOptions {
  includeBeta?: boolean;
}

/**
 * Show interactive searchable policy selector.
 * @param preSelected — policy names to pre-check (e.g. from existing config).
 *                      When omitted, uses each policy's defaultEnabled flag.
 * @param options     — prompt options (e.g. includeBeta)
 */
export async function promptPolicySelection(
  preSelected?: string[],
  options: PromptOptions = {},
): Promise<string[]> {
  const { includeBeta = false } = options;

  // If stdin is not a TTY (piped/CI), return defaults
  if (!process.stdin.isTTY) {
    const available = BUILTIN_POLICIES.filter((p) => includeBeta || !p.beta);
    if (preSelected) return preSelected.filter((name) => available.some((p) => p.name === name));
    return available.filter((p) => p.defaultEnabled).map((p) => p.name);
  }

  const preSelectedSet = preSelected ? new Set(preSelected) : null;

  const items: SelectItem[] = BUILTIN_POLICIES
    .filter((p) => includeBeta || !p.beta)
    .map((p) => ({
      name: p.name,
      description: p.description,
      category: p.category,
      selected: preSelectedSet ? preSelectedSet.has(p.name) : p.defaultEnabled,
      beta: !!p.beta,
    }));

  const total = items.length;
  const WINDOW_SIZE = 8;

  let cursor = 0;
  let search = "";
  let lastLineCount = 0;
  let cursorHidden = false;

  function hideCursor(): void {
    if (!cursorHidden) {
      process.stdout.write("\x1B[?25l");
      cursorHidden = true;
    }
  }

  function showCursor(): void {
    if (cursorHidden) {
      process.stdout.write("\x1B[?25h");
      cursorHidden = false;
    }
  }

  // Truncate a line to `width` visual columns, skipping ANSI CSI sequences.
  function truncateLine(line: string, width: number): string {
    let visual = 0;
    let result = "";
    let i = 0;
    while (i < line.length) {
      if (line[i] === "\x1B" && line[i + 1] === "[") {
        let j = i + 2;
        while (j < line.length && !/[A-Za-z]/.test(line[j])) j++;
        j++;
        result += line.slice(i, j);
        i = j;
      } else {
        if (visual >= width) break;
        result += line[i];
        visual++;
        i++;
      }
    }
    return result;
  }

  function getFiltered(): SelectItem[] {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q),
    );
  }

  // Build display rows: category header rows interspersed with item rows.
  // Categories appear in the order they first appear in BUILTIN_POLICIES.
  function buildDisplayRows(filtered: SelectItem[]): DisplayRow[] {
    const categoryOrder: string[] = [];
    for (const p of items) {
      if (!categoryOrder.includes(p.category)) categoryOrder.push(p.category);
    }
    const rows: DisplayRow[] = [];
    let idx = 0;
    for (const cat of categoryOrder) {
      const catFiltered = filtered.filter((i) => i.category === cat);
      if (catFiltered.length === 0) continue;
      const enabledCount = items.filter((i) => i.category === cat && i.selected).length;
      const totalCount = items.filter((i) => i.category === cat).length;
      rows.push({ kind: "header", category: cat, enabledCount, totalCount });
      for (const item of catFiltered) {
        rows.push({ kind: "item", item, filteredIndex: idx++ });
      }
    }
    return rows;
  }

  function render(): void {
    const cols = process.stdout.columns || 120;
    hideCursor();

    const filtered = getFiltered();
    const shown = filtered.length;

    // Clamp cursor to filtered list bounds
    if (shown > 0 && cursor >= shown) cursor = shown - 1;

    const lines: string[] = [];

    // ── Title ────────────────────────────────────────────────────
    lines.push("  Failproof AI \u2014 Policy Manager");
    lines.push("");

    // ── Bordered search box ──────────────────────────────────────
    const innerWidth = Math.max(20, cols - 6);
    const topBorder = "  \u250c" + "\u2500".repeat(innerWidth + 2) + "\u2510";
    const botBorder = "  \u2514" + "\u2500".repeat(innerWidth + 2) + "\u2518";
    const cursorChar = "\x1B[7m \x1B[0m"; // reverse-video block cursor
    const countPart = search
      ? ` \x1B[2m(${shown}/${total})\x1B[0m`
      : ` \x1B[2m(${total} policies)\x1B[0m`;
    const searchContent = `\x1B[1mSearch:\x1B[0m ${search}${cursorChar}${countPart}`;
    lines.push(topBorder);
    lines.push(`  \u2502 ${searchContent}`);
    lines.push(botBorder);
    lines.push("");

    // ── Content area ─────────────────────────────────────────────
    if (shown === 0) {
      lines.push("  \x1B[2mNo policies match \u201c" + search + "\u201d\x1B[0m");
      // Pad to stable height: 1 (scroll-up) + WINDOW_SIZE (rows) + 1 (scroll-down)
      for (let i = 0; i < WINDOW_SIZE + 1; i++) lines.push("");
    } else {
      const displayRows = buildDisplayRows(filtered);

      // Find the display row index that corresponds to the current cursor
      let cursorDisplayRow = 0;
      for (let i = 0; i < displayRows.length; i++) {
        const row = displayRows[i];
        if (row.kind === "item" && row.filteredIndex === cursor) {
          cursorDisplayRow = i;
          break;
        }
      }

      // Viewport: keep cursor row roughly centred
      let windowStart = cursorDisplayRow - Math.floor(WINDOW_SIZE / 2);
      windowStart = Math.max(0, windowStart);
      windowStart = Math.min(windowStart, Math.max(0, displayRows.length - WINDOW_SIZE));
      const windowEnd = Math.min(displayRows.length, windowStart + WINDOW_SIZE);

      // Scroll-up indicator (always reserve this line for stable height)
      const aboveItems = displayRows
        .slice(0, windowStart)
        .filter((r) => r.kind === "item").length;
      if (aboveItems > 0) {
        lines.push(`  \x1B[2m  \u2191 ${aboveItems} more above\x1B[0m`);
      } else {
        lines.push("");
      }

      // Visible display rows
      for (let i = windowStart; i < windowEnd; i++) {
        const row = displayRows[i];
        if (row.kind === "header") {
          // ── CATEGORY NAME (enabled/total) ─────
          const label = ` ${row.category.toUpperCase()} (${row.enabledCount}/${row.totalCount}) `;
          const prefix = "\u2500\u2500 ";
          const prefixLen = 3 + label.length;
          const dashLen = Math.max(2, cols - 2 - prefixLen);
          lines.push(
            `  \x1B[2m${prefix}${label}${"\u2500".repeat(dashLen)}\x1B[0m`,
          );
        } else {
          const item = row.item;
          const isActive = row.filteredIndex === cursor;
          const pointer = isActive ? "\x1B[36m\u276f\x1B[0m" : " ";
          const check = item.selected ? "\x1B[32m[\u2713]\x1B[0m" : "[ ]";
          const namePart = isActive
            ? `\x1B[1;36m${item.name}\x1B[0m`
            : item.name;
          const betaPart = item.beta ? " \x1B[35m[beta]\x1B[0m" : "";
          const pad = " ".repeat(Math.max(1, 28 - item.name.length));
          const desc = `\x1B[2m${item.description}\x1B[0m`;
          lines.push(`  ${pointer} ${check} ${namePart}${betaPart}${pad}${desc}`);
        }
      }

      // Pad window to fixed WINDOW_SIZE rows for stable height
      for (let i = windowEnd - windowStart; i < WINDOW_SIZE; i++) {
        lines.push("");
      }

      // Scroll-down indicator (always reserve this line for stable height)
      const belowItems = displayRows
        .slice(windowEnd)
        .filter((r) => r.kind === "item").length;
      if (belowItems > 0) {
        lines.push(`  \x1B[2m  \u2193 ${belowItems} more below\x1B[0m`);
      } else {
        lines.push("");
      }
    }

    // ── Footer ───────────────────────────────────────────────────
    lines.push("");
    lines.push("  \x1B[2m" + "\u2500".repeat(cols - 2) + "\x1B[0m");
    lines.push(
      "  [\u2191\u2193] Move  [Space] Toggle  [Ctrl+A] All  [Ctrl+S] Save  [Esc] Clear  [^C] Quit",
    );
    lines.push("");
    lines.push(
      "  \x1B[2mTip: --list-hooks for a flat list \u00b7 --install-hooks <name\u2026> to skip prompt\x1B[0m",
    );
    if (!includeBeta) {
      lines.push(
        "  \x1B[2mTip: --install-hooks all --beta to include beta policies\x1B[0m",
      );
    }

    // ── Repaint: cursor-up by previous line count, clear to end, redraw ──
    if (lastLineCount > 0) {
      process.stdout.write(`\x1B[${lastLineCount}A\x1B[J`);
    }
    const output =
      lines.map((l) => (l === "" ? l : truncateLine(l, cols))).join("\n") + "\n";
    process.stdout.write(output);
    lastLineCount = lines.length;
  }

  return new Promise<string[]>((resolve) => {
    render();

    process.stdin.setRawMode(true);
    process.stdin.resume();
    // Use a single data→keypress pipeline with no readline.Interface.
    // readline.createInterface would register its own competing data listener
    // and its close() call would unexpectedly pause stdin, breaking arrow keys.
    readline.emitKeypressEvents(process.stdin);

    function keypressHandler(_str: string | undefined, key: readline.Key): void {
      if (!key) return;

      if (key.ctrl && key.name === "c") {
        cleanup();
        process.exit(0);
      }

      const filtered = getFiltered();

      if (key.name === "up") {
        if (filtered.length > 0) {
          cursor = cursor > 0 ? cursor - 1 : filtered.length - 1;
        }
        render();
      } else if (key.name === "down") {
        if (filtered.length > 0) {
          cursor = cursor < filtered.length - 1 ? cursor + 1 : 0;
        }
        render();
      } else if (key.name === "return" || key.name === "space") {
        const item = filtered[cursor];
        if (item) item.selected = !item.selected;
        render();
      } else if (key.name === "escape") {
        // Clear search filter
        search = "";
        cursor = 0;
        render();
      } else if (key.ctrl && key.name === "a") {
        // Toggle all visible items
        const allSelected = filtered.length > 0 && filtered.every((i) => i.selected);
        for (const item of filtered) item.selected = !allSelected;
        render();
      } else if (key.ctrl && key.name === "s") {
        // Submit
        cleanup();
        const selected = items.filter((i) => i.selected).map((i) => i.name);
        process.stdout.write("\n");
        resolve(selected);
      } else if (key.name === "backspace" || key.name === "delete") {
        if (search.length > 0) {
          search = search.slice(0, -1);
          cursor = 0;
          render();
        }
      } else if (_str && _str.length === 1 && !key.ctrl && !key.meta) {
        // All printable characters (including 'a', 's') go to search
        search += _str;
        cursor = 0;
        render();
      }
    }

    function cleanup(): void {
      showCursor();
      process.stdin.removeListener("keypress", keypressHandler);
      process.stdin.setRawMode(false);
      process.stdin.pause();
    }

    process.stdin.on("keypress", keypressHandler);
  });
}
