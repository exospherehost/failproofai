// @vitest-environment node
import { describe, it, expect } from "vitest";
import { rewriteInternalLinks } from "@/scripts/translate-docs/mdx-translator";

describe("rewriteInternalLinks", () => {
  it("rewrites MDX component href attributes with language prefix", () => {
    const input = `<Card title="Policies" href="/built-in-policies">`;
    const result = rewriteInternalLinks(input, "es");
    expect(result).toBe(`<Card title="Policies" href="/es/built-in-policies">`);
  });

  it("rewrites Markdown links with language prefix", () => {
    const input = `See the [Getting started](/getting-started) guide.`;
    const result = rewriteInternalLinks(input, "ja");
    expect(result).toBe(
      `See the [Getting started](/ja/getting-started) guide.`,
    );
  });

  it("rewrites nested paths", () => {
    const input = `<Card href="/cli/dashboard">Dashboard</Card>`;
    const result = rewriteInternalLinks(input, "zh");
    expect(result).toBe(`<Card href="/zh/cli/dashboard">Dashboard</Card>`);
  });

  it("does not rewrite root-only href", () => {
    const input = `<a href="/">Home</a>`;
    const result = rewriteInternalLinks(input, "es");
    expect(result).toBe(`<a href="/">Home</a>`);
  });

  it("does not rewrite external URLs starting with /http", () => {
    // This edge case shouldn't normally occur in well-formed content,
    // but the function guards against it
    const input = `[link](/http-something)`;
    const result = rewriteInternalLinks(input, "es");
    expect(result).toBe(`[link](/http-something)`);
  });

  it("rewrites multiple links in the same content", () => {
    const input = `
<Card href="/built-in-policies">Policies</Card>
<Card href="/custom-policies">Custom</Card>
See [config](/configuration) and [testing](/testing).
`;
    const result = rewriteInternalLinks(input, "fr");
    expect(result).toContain(`href="/fr/built-in-policies"`);
    expect(result).toContain(`href="/fr/custom-policies"`);
    expect(result).toContain(`(/fr/configuration)`);
    expect(result).toContain(`(/fr/testing)`);
  });

  it("preserves external Markdown links", () => {
    // External links don't start with /
    const input = `[GitHub](https://github.com/example)`;
    const result = rewriteInternalLinks(input, "de");
    expect(result).toBe(`[GitHub](https://github.com/example)`);
  });

  it("preserves anchor-only links", () => {
    const input = `[section](#requirements)`;
    const result = rewriteInternalLinks(input, "ko");
    expect(result).toBe(`[section](#requirements)`);
  });

  it("handles paths with anchors", () => {
    const input = `[link](/getting-started#install)`;
    const result = rewriteInternalLinks(input, "es");
    expect(result).toBe(`[link](/es/getting-started#install)`);
  });
});
