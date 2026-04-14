// @vitest-environment node
import { describe, it, expect } from "vitest";
import { buildMainReadmeLanguageLinks } from "@/scripts/translate-docs/readme-translator";
import { LANGUAGES } from "@/scripts/translate-docs/config";

describe("buildMainReadmeLanguageLinks", () => {
  it("returns a string starting with **Translations**:", () => {
    const result = buildMainReadmeLanguageLinks();
    expect(result).toMatch(/^\*\*Translations\*\*:/);
  });

  it("includes a link for every language in LANGUAGES", () => {
    const result = buildMainReadmeLanguageLinks();
    for (const lang of LANGUAGES) {
      expect(result).toContain(lang.nativeName);
      expect(result).toContain(`README.${lang.code}.md`);
    }
  });

  it("links point to docs/i18n/ directory", () => {
    const result = buildMainReadmeLanguageLinks();
    for (const lang of LANGUAGES) {
      expect(result).toContain(`docs/i18n/README.${lang.code}.md`);
    }
  });

  it("includes all 14 language links", () => {
    const result = buildMainReadmeLanguageLinks();
    // Count number of markdown links
    const linkCount = (result.match(/\[.*?\]\(.*?\)/g) || []).length;
    expect(linkCount).toBe(14);
  });

  it("uses pipe separators between links", () => {
    const result = buildMainReadmeLanguageLinks();
    expect(result).toContain(" | ");
  });
});
