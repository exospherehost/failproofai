import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { getLanguageByCode } from "./config";
import { translateContent } from "./translator";
import {
  readCache,
  writeCache,
  isCached,
  setCacheEntry,
} from "./cache";
import type { TranslationResult, TranslationCache } from "./types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = join(__dirname, "..", "..", "docs");

/**
 * Rewrite internal doc links to include the language prefix.
 * e.g. href="/built-in-policies" -> href="/es/built-in-policies"
 *      [Getting started](/getting-started) -> [Getting started](/es/getting-started)
 */
export function rewriteInternalLinks(
  content: string,
  lang: string,
): string {
  // Rewrite MDX component href attributes pointing to internal paths
  let result = content.replace(
    /href="(\/[^"]*?)"/g,
    (_match, path: string) => {
      // Skip external URLs and anchors
      if (path.startsWith("/http") || path === "/") return `href="${path}"`;
      return `href="/${lang}${path}"`;
    },
  );

  // Rewrite Markdown links with internal paths
  result = result.replace(
    /\]\((\/[^)]*?)\)/g,
    (_match, path: string) => {
      if (path.startsWith("/http") || path === "/") return `](${path})`;
      return `](/${lang}${path})`;
    },
  );

  return result;
}

/**
 * Translate a single MDX doc page for a given language.
 */
export async function translateMdxPage(
  sourcePath: string,
  lang: string,
  options: { force?: boolean; dryRun?: boolean; model?: string; cache?: TranslationCache } = {},
): Promise<TranslationResult> {
  const relPath = relative(DOCS_DIR, sourcePath);
  const outputPath = join(DOCS_DIR, lang, relPath);
  const sourceContent = readFileSync(sourcePath, "utf-8");

  const langConfig = getLanguageByCode(lang);
  if (!langConfig) throw new Error(`Unknown language: ${lang}`);

  // Check cache — use provided cache object or read from disk
  if (!options.force && !options.dryRun) {
    const cache = options.cache ?? readCache();
    if (isCached(cache, relPath, lang, sourceContent)) {
      return {
        lang,
        sourcePath,
        outputPath,
        inputTokens: 0,
        outputTokens: 0,
        cached: true,
      };
    }
  }

  if (options.dryRun) {
    return {
      lang,
      sourcePath,
      outputPath,
      inputTokens: 0,
      outputTokens: 0,
      cached: false,
    };
  }

  // Translate
  const { translated, inputTokens, outputTokens } = await translateContent(
    sourceContent,
    lang,
    langConfig.name,
    options.model,
  );

  // Rewrite internal links
  const withLinks = rewriteInternalLinks(translated, lang);

  // Write output
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, withLinks);

  // Update cache — skip if caller manages the cache (batch write)
  if (!options.cache) {
    const cache = readCache();
    setCacheEntry(cache, relPath, lang, sourceContent, inputTokens, outputTokens);
    writeCache(cache);
  }

  return {
    lang,
    sourcePath,
    outputPath,
    inputTokens,
    outputTokens,
    cached: false,
  };
}

/**
 * Get all MDX page paths from the docs directory (English only, no language subdirs).
 */
export function getEnglishMdxPages(): string[] {
  const results: string[] = [];

  function walk(dir: string, prefix: string = "") {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const rel = prefix ? `${prefix}/${entry}` : entry;
      if (statSync(full).isDirectory()) {
        // Skip language directories at the top level
        if (!prefix && isLanguageDir(entry)) continue;
        // Skip non-doc directories like logo, i18n
        if (!prefix && (entry === "logo" || entry === "i18n")) continue;
        walk(full, rel);
      } else if (entry.endsWith(".mdx")) {
        results.push(full);
      }
    }
  }

  walk(DOCS_DIR);
  return results.sort();
}

function isLanguageDir(name: string): boolean {
  const langCodes = [
    "zh", "ja", "ko", "es", "pt-br", "de", "fr",
    "ru", "hi", "tr", "vi", "it", "ar", "he",
  ];
  return langCodes.includes(name);
}
