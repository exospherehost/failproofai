#!/usr/bin/env bun
import { parseArgs } from "node:util";
import { existsSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { LANGUAGES, getLanguagesByTier, getLanguageByCode } from "./config";
import { getEnglishMdxPages, translateMdxPage } from "./mdx-translator";
import { translateReadme } from "./readme-translator";
import { updateDocsJson, readDocsConfig } from "./mintlify-nav";
import type { TranslationResult } from "./types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = join(__dirname, "..", "..", "docs");

const { values: args } = parseArgs({
  options: {
    languages: { type: "string", short: "l" },
    tier: { type: "string", short: "t" },
    pages: { type: "string", short: "p" },
    "readme-only": { type: "boolean", default: false },
    "docs-only": { type: "boolean", default: false },
    "dry-run": { type: "boolean", default: false },
    force: { type: "boolean", short: "f", default: false },
    "update-nav": { type: "boolean", default: false },
    validate: { type: "boolean", default: false },
    model: { type: "string", short: "m" },
    help: { type: "boolean", short: "h", default: false },
  },
  strict: true,
});

if (args.help) {
  console.log(`
Usage: bun scripts/translate-docs/cli.ts [options]

Options:
  -l, --languages <codes>  Comma-separated language codes (e.g. zh,ja,es)
  -t, --tier <n>           Translate all languages up to tier n (1, 2, or 3)
  -p, --pages <files>      Comma-separated page names to translate
      --readme-only        Only translate the README
      --docs-only          Only translate Mintlify docs
      --dry-run            Show what would be translated without calling the API
  -f, --force              Ignore cache, re-translate everything
      --update-nav         Regenerate docs.json navigation after translation
      --validate           Check all nav references resolve to files
  -m, --model <model>      Claude model to use (default: claude-sonnet-4-20250514)
  -h, --help               Show this help

Environment:
  ANTHROPIC_API_KEY        Required for translation (not needed for --dry-run or --validate)

Examples:
  bun scripts/translate-docs/cli.ts --tier 1              # Translate Tier 1 languages
  bun scripts/translate-docs/cli.ts -l zh,ja --docs-only  # Translate Chinese + Japanese docs only
  bun scripts/translate-docs/cli.ts --dry-run --tier 3    # Preview all translations
  bun scripts/translate-docs/cli.ts --validate            # Check nav references
  bun scripts/translate-docs/cli.ts --update-nav          # Regenerate docs.json
`);
  process.exit(0);
}

function resolveLanguages(): string[] {
  if (args.languages) {
    const codes = args.languages.split(",").map((c) => c.trim());
    for (const code of codes) {
      if (!getLanguageByCode(code)) {
        console.error(`Unknown language code: ${code}`);
        console.error(`Available: ${LANGUAGES.map((l) => l.code).join(", ")}`);
        process.exit(1);
      }
    }
    return codes;
  }
  const tier = args.tier ? parseInt(args.tier, 10) : 1;
  if (tier < 1 || tier > 3) {
    console.error("Tier must be 1, 2, or 3");
    process.exit(1);
  }
  return getLanguagesByTier(tier).map((l) => l.code);
}

async function validateNavReferences(): Promise<boolean> {
  const config = readDocsConfig();
  const nav = config.navigation as Record<string, unknown>;
  let valid = true;
  let total = 0;
  let missing = 0;

  const languages = (nav.languages || []) as Array<{
    language: string;
    tabs: Array<{ groups: Array<{ pages: string[] }> }>;
  }>;

  if (languages.length === 0) {
    // Flat tabs structure (not yet migrated to languages)
    const tabs = (nav.tabs || []) as Array<{
      groups: Array<{ pages: string[] }>;
    }>;
    for (const tab of tabs) {
      for (const group of tab.groups) {
        for (const page of group.pages) {
          total++;
          const filePath = join(DOCS_DIR, `${page}.mdx`);
          if (!existsSync(filePath)) {
            console.error(`  MISSING: ${page} -> ${filePath}`);
            missing++;
            valid = false;
          }
        }
      }
    }
  } else {
    for (const langEntry of languages) {
      for (const tab of langEntry.tabs) {
        for (const group of tab.groups) {
          for (const page of group.pages) {
            total++;
            const filePath = join(DOCS_DIR, `${page}.mdx`);
            if (!existsSync(filePath)) {
              console.error(`  MISSING [${langEntry.language}]: ${page} -> ${filePath}`);
              missing++;
              valid = false;
            }
          }
        }
      }
    }
  }

  if (valid) {
    console.log(`All ${total} page references are valid.`);
  } else {
    console.error(`\n${missing} of ${total} page references are missing.`);
  }

  return valid;
}

async function main() {
  // Validate mode
  if (args.validate) {
    const valid = await validateNavReferences();
    process.exit(valid ? 0 : 1);
  }

  // Update nav mode
  if (args["update-nav"]) {
    const langCodes = resolveLanguages();
    console.log(`Updating docs.json with languages: ${langCodes.join(", ")}`);
    updateDocsJson(langCodes);
    console.log("docs.json updated.");
    return;
  }

  const langCodes = resolveLanguages();
  const isDryRun = args["dry-run"];
  const isForce = args.force;
  const model = args.model;

  console.log(
    `${isDryRun ? "[DRY RUN] " : ""}Translating into: ${langCodes.join(", ")}`,
  );

  const results: TranslationResult[] = [];
  const errors: Array<{ lang: string; source: string; error: string }> = [];

  // Translate docs
  if (!args["readme-only"]) {
    const pages = getEnglishMdxPages();
    const filteredPages = args.pages
      ? pages.filter((p) => {
          const rel = relative(DOCS_DIR, p).replace(".mdx", "");
          return args.pages!.split(",").some((f) => rel.includes(f.trim()));
        })
      : pages;

    console.log(`\nTranslating ${filteredPages.length} MDX pages...`);

    for (const lang of langCodes) {
      const langConfig = getLanguageByCode(lang)!;
      console.log(`\n  ${langConfig.nativeName} (${lang}):`);

      for (const page of filteredPages) {
        const relPath = relative(DOCS_DIR, page);
        try {
          const result = await translateMdxPage(page, lang, {
            force: isForce,
            dryRun: isDryRun,
            model,
          });
          results.push(result);
          const status = result.cached
            ? "cached"
            : isDryRun
              ? "would translate"
              : `translated (${result.inputTokens}+${result.outputTokens} tokens)`;
          console.log(`    ${relPath} -> ${status}`);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push({ lang, source: relPath, error: msg });
          console.error(`    ${relPath} -> ERROR: ${msg}`);
        }
      }
    }
  }

  // Translate README
  if (!args["docs-only"]) {
    console.log(`\nTranslating README...`);

    for (const lang of langCodes) {
      const langConfig = getLanguageByCode(lang)!;
      try {
        const result = await translateReadme(lang, {
          force: isForce,
          dryRun: isDryRun,
          model,
        });
        results.push(result);
        const status = result.cached
          ? "cached"
          : isDryRun
            ? "would translate"
            : `translated (${result.inputTokens}+${result.outputTokens} tokens)`;
        console.log(`  README.${lang}.md -> ${langConfig.nativeName}: ${status}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push({ lang, source: "README.md", error: msg });
        console.error(`  README.${lang}.md -> ERROR: ${msg}`);
      }
    }
  }

  // Summary
  const translated = results.filter((r) => !r.cached && !isDryRun);
  const cached = results.filter((r) => r.cached);
  const totalInput = translated.reduce((s, r) => s + r.inputTokens, 0);
  const totalOutput = translated.reduce((s, r) => s + r.outputTokens, 0);

  console.log(`\n--- Summary ---`);
  console.log(`Translated: ${translated.length}`);
  console.log(`Cached (skipped): ${cached.length}`);
  if (errors.length > 0) {
    console.log(`Errors: ${errors.length}`);
  }
  if (totalInput > 0) {
    console.log(`Total tokens: ${totalInput} input + ${totalOutput} output`);
  }

  if (errors.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
