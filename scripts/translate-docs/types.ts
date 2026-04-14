export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  tier: 1 | 2 | 3;
  rtl?: boolean;
}

export interface CacheEntry {
  sourceHash: string;
  targetLang: string;
  translatedAt: string;
  inputTokens: number;
  outputTokens: number;
}

export interface TranslationCache {
  sourceHash: string;
  lastUpdated: string;
  translations: Record<string, CacheEntry>;
}

export interface TranslateOptions {
  languages: string[];
  tier?: number;
  pagesFilter?: string[];
  readmeOnly?: boolean;
  docsOnly?: boolean;
  dryRun?: boolean;
  force?: boolean;
  updateNav?: boolean;
  validate?: boolean;
  model?: string;
}

export interface TranslationResult {
  lang: string;
  sourcePath: string;
  outputPath: string;
  inputTokens: number;
  outputTokens: number;
  cached: boolean;
}
