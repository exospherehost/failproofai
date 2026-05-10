// @vitest-environment node
import { describe, it, expect } from "vitest";
import { coloredBanner, monoBanner, BANNER_COLS, BANNER_ROWS } from "@/scripts/banner.generated";

describe("banner.generated", () => {
  it("exports the configured grid dimensions", () => {
    expect(BANNER_COLS).toBeGreaterThan(0);
    expect(BANNER_ROWS).toBeGreaterThan(0);
  });

  it("colored and mono banners both have BANNER_ROWS lines", () => {
    expect(coloredBanner).toHaveLength(BANNER_ROWS);
    expect(monoBanner).toHaveLength(BANNER_ROWS);
  });

  it("mono banner uses only block chars + spaces (no ANSI escapes)", () => {
    for (const line of monoBanner) {
      expect(line).not.toMatch(/\x1b/);
      expect(line).toMatch(/^[ ▀▄█]*$/);
    }
  });

  it("mono banner includes pixel content (not all whitespace)", () => {
    const totalPixels = monoBanner.reduce(
      (n, line) => n + (line.match(/[▀▄█]/gu)?.length ?? 0),
      0,
    );
    expect(totalPixels).toBeGreaterThan(20);
  });

  it("colored banner contains 24-bit ANSI escapes", () => {
    const joined = coloredBanner.join("");
    expect(joined).toMatch(/\x1b\[38;2;\d+;\d+;\d+m/);
    expect(joined).toMatch(/\x1b\[0m/);
  });

  it("colored banner cell count per line matches BANNER_COLS", () => {
    const ansiRe = /\x1b\[[0-9;]*m/g;
    for (const line of coloredBanner) {
      const visible = line.replace(ansiRe, "");
      expect([...visible].length).toBe(BANNER_COLS);
    }
  });
});
