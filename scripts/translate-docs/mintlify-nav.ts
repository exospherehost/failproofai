import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { NAV_TRANSLATIONS, LANGUAGES } from "./config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS_JSON_PATH = join(__dirname, "..", "..", "docs", "docs.json");

interface NavGroup {
  group: string;
  pages: string[];
}

interface NavTab {
  tab: string;
  groups: NavGroup[];
}

interface LanguageNav {
  language: string;
  tabs: NavTab[];
}

/**
 * Build a navigation entry for a specific language by transforming the
 * English navigation structure.
 */
export function buildLanguageNav(
  englishTabs: NavTab[],
  lang: string,
): LanguageNav {
  const t = NAV_TRANSLATIONS[lang];
  if (!t) throw new Error(`No nav translations for language: ${lang}`);

  const groupNameMap: Record<string, string> = {
    "Getting Started": t.gettingStarted,
    "Core Concepts": t.coreConcepts,
    CLI: t.cli,
    Tools: t.tools,
    Advanced: t.advanced,
    Examples: t.examples,
  };

  const tabNameMap: Record<string, string> = {
    Docs: t.docs,
    Examples: t.examples,
  };

  const tabs: NavTab[] = englishTabs.map((tab) => ({
    tab: tabNameMap[tab.tab] || tab.tab,
    groups: tab.groups.map((group) => ({
      group: groupNameMap[group.group] || group.group,
      pages: group.pages.map((page) => `${lang}/${page}`),
    })),
  }));

  return { language: lang, tabs };
}

/**
 * Read the current docs.json config.
 */
export function readDocsConfig(): Record<string, unknown> {
  return JSON.parse(readFileSync(DOCS_JSON_PATH, "utf-8"));
}

/**
 * Generate the full languages array for docs.json from the English nav
 * and a list of language codes.
 */
export function generateLanguagesArray(
  englishTabs: NavTab[],
  langCodes: string[],
): LanguageNav[] {
  // English first (default)
  const english: LanguageNav = { language: "en", tabs: englishTabs };
  const others = langCodes.map((code) => buildLanguageNav(englishTabs, code));
  return [english, ...others];
}

/**
 * Update docs.json to use the languages array structure.
 */
export function updateDocsJson(langCodes: string[]): void {
  const config = readDocsConfig();
  const nav = config.navigation as Record<string, unknown>;

  // Extract existing English tabs
  const englishTabs = nav.tabs as NavTab[];
  if (!englishTabs) {
    throw new Error("docs.json navigation.tabs not found — is this already using the languages format?");
  }

  // Build languages array
  const languages = generateLanguagesArray(englishTabs, langCodes);

  // Replace tabs with languages, preserve global
  const newNav: Record<string, unknown> = {
    languages,
  };
  if (nav.global) {
    newNav.global = nav.global;
  }

  config.navigation = newNav;
  writeFileSync(DOCS_JSON_PATH, JSON.stringify(config, null, 2) + "\n");
}
