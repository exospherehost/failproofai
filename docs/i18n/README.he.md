> **⚠️** هذه ترجمة آلية. للاطلاع على أحدث إصدار، راجع [English README](../../README.md).

[🇺🇸 English](../../README.md) | [🇨🇳 简体中文](README.zh.md) | [🇯🇵 日本語](README.ja.md) | [🇰🇷 한국어](README.ko.md) | [🇪🇸 Español](README.es.md) | [🇧🇷 Português](README.pt-br.md) | [🇩🇪 Deutsch](README.de.md) | [🇫🇷 Français](README.fr.md) | [🇷🇺 Русский](README.ru.md) | [🇮🇳 हिन्दी](README.hi.md) | [🇹🇷 Türkçe](README.tr.md) | [🇻🇳 Tiếng Việt](README.vi.md) | [🇮🇹 Italiano](README.it.md) | [🇸🇦 العربية](README.ar.md) | **🇮🇱 עברית**

---
<div dir="rtl">


```
    ______      _ __                       ____   ___    ____
   / ____/___ _(_) /___  _________  ____  / __/  /   |  /  _/
  / /_  / __ `/ / / __ \/ ___/ __ \/ __ \/ /_   / /| |  / /
 / __/ / /_/ / / / /_/ / /  / /_/ / /_/ / __/  / ___ |_/ /
/_/    \__,_/_/_/ .___/_/   \____/\____/_/    /_/  |_/___/
               /_/
```

# Failproof AI

[![Docs](https://img.shields.io/badge/docs-befailproof.ai-002CA7?style=flat-square)](https://befailproof.ai)
[![npm](https://img.shields.io/npm/v/failproofai?style=flat-square&color=CB3837)](https://www.npmjs.com/package/failproofai)
[![License](https://img.shields.io/badge/license-MIT%20%2B%20Commons%20Clause-blue?style=flat-square)](LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/exospherehost/failproofai/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/exospherehost/failproofai/actions)
[![Slack](https://img.shields.io/badge/Slack-join%20us-4A154B?style=flat-square&logo=slack)](https://join.slack.com/t/failproofai/shared_invite/zt-3v63b7k5e-O3NBHmj8X6n9gZSGDx6ggQ)

**Translations**: [简体中文](docs/i18n/README.zh.md) | [日本語](docs/i18n/README.ja.md) | [한국어](docs/i18n/README.ko.md) | [Español](docs/i18n/README.es.md) | [Português](docs/i18n/README.pt-br.md) | [Deutsch](docs/i18n/README.de.md) | [Français](docs/i18n/README.fr.md) | [Русский](docs/i18n/README.ru.md) | [हिन्दी](docs/i18n/README.hi.md) | [Türkçe](docs/i18n/README.tr.md) | [Tiếng Việt](docs/i18n/README.vi.md) | [Italiano](docs/i18n/README.it.md) | [العربية](docs/i18n/README.ar.md) | [עברית](docs/i18n/README.he.md)

הדרך הקלה ביותר לנהל מדיניות המעמידות את הסוכנים שלך אמינים, ממוקדים ופועלים בצורה אוטונומית - עבור **Claude Code**, **OpenAI Codex** ו-**Agents SDK**.

<p align="center">
  <img src="failproofai-hq.gif" alt="Failproof AI בפעולה" width="800" />
</p>

## סוכני CLI נתמכים

<p align="center">
  <a href="https://claude.com/claude-code" title="Claude Code">
    <img src="assets/logos/claude.svg" alt="Claude Code" width="64" height="64" />
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://developers.openai.com/codex" title="OpenAI Codex">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="assets/logos/openai-dark.svg" />
      <img src="assets/logos/openai-light.svg" alt="OpenAI Codex" width="64" height="64" />
    </picture>
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <strong>+ עוד בקרוב</strong>
</p>

> התקן ווים לאחד או לשניהם: `failproofai policies --install --cli codex` (או `--cli claude codex`). השמט `--cli` לזיהוי אוטומטי של CLIs מותקנים ובקשה.

- **39 מדיניות מובנות** - תופסות חרדות נכשל נפוצות מיד. חסום פקודות הרסניות, מנע דליפת סודות, שמור על סוכנים בתוך גבולות הפרויקט, זהה לולאות ועוד.
- **מדיניות מותאמת אישית** - כתוב את הכללים שלך לאמינות ב-JavaScript. השתמש ב-API של `allow`/`deny`/`instruct` כדי להטיל אמנה, למנוע סטיה, לשער פעולות או להשתלב במערכות חיצוניות.
- **קונפיגורציה קלה** - כוונן כל מדיניות ללא כתיבת קוד. הגדר רשימות מותרות, ענפים מוגנים, סיפים לפי פרויקט או בעולם. שלוש-scope config מיזוג באופן אוטומטי.
- **Agent Monitor** - ראה מה עשו הסוכנים שלך בזמן שהיית רחוק. עיין בהפעלות, בדוק כל קריאת כלי, ובדוק בדיוק איפה המדיניות עשתה שימוש.

הכל רץ באופן מקומי - שום נתונים לא עוזבים את המכונה שלך.

---

## דרישות

- Node.js >= 20.9.0
- Bun >= 1.3.0 (אופציונלי - נדרש רק לפיתוח / בנייה מהמקור)

---

## התקנה

```bash
npm install -g failproofai
# או
bun add -g failproofai
```

---

## התחלה מהירה

### 1. הפעל מדיניות בעולם

```bash
failproofai policies --install
```

כותב רשומות ווים ל-`~/.claude/settings.json`. Claude Code יעיר כעת failproofai לפני ואחרי כל קריאת כלי.

### 2. השק את לוח הבקרה

```bash
failproofai
```

פותח `http://localhost:8020` - עיין בהפעלות, בדוק יומנים, נהל מדיניות.

### 3. בדוק מה פעיל

```bash
failproofai policies
```

---

## התקנת מדיניות

### Scopes

| Scope | פקודה | איפה זה כותב |
|-------|---------|-----------------|
| עולמי (ברירת מחדל) | `failproofai policies --install` | `~/.claude/settings.json` |
| פרויקט | `failproofai policies --install --scope project` | `.claude/settings.json` |
| מקומי | `failproofai policies --install --scope local` | `.claude/settings.local.json` |

### התקן מדיניות ספציפיות

```bash
failproofai policies --install block-sudo block-rm-rf sanitize-api-keys
```

### הסר מדיניות

```bash
failproofai policies --uninstall
# או עבור scope ספציפי:
failproofai policies --uninstall --scope project
```

---

## קונפיגורציה

קונפיגורציה של מדיניות חיה ב-`~/.failproofai/policies-config.json` (עולמי) או `.failproofai/policies-config.json` בפרויקט שלך (לכל פרויקט).

```json
{
  "enabledPolicies": [
    "block-sudo",
    "block-rm-rf",
    "sanitize-api-keys",
    "block-push-master",
    "block-env-files",
    "block-read-outside-cwd"
  ],
  "policyParams": {
    "block-sudo": {
      "allowPatterns": ["sudo systemctl status", "sudo journalctl"],
      "hint": "השתמש ב-apt-get ישירות ללא sudo."
    },
    "block-push-master": {
      "protectedBranches": ["main", "release", "prod"],
      "hint": "נסה ליצור ענף טרי במקום."
    },
    "sanitize-api-keys": {
      "additionalPatterns": [
        { "regex": "myco_[A-Za-z0-9]{32}", "label": "MyCo API key" }
      ]
    },
    "warn-large-file-write": {
      "thresholdKb": 512
    }
  }
}
```

**שלוש scopes תצורה** ממוזגים באופן אוטומטי (פרויקט → מקומי → עולמי). ראה [docs/configuration.mdx](docs/configuration.mdx) לקבלת כללי מיזוג מלאים.

---

## מדיניות מובנות

| מדיניות | תיאור | ניתן לתצורה |
|--------|-------------|:---:|
| `block-sudo` | מנע מסוכנים מהפעלת פקודות מערכת מוגנות | `allowPatterns` |
| `block-rm-rf` | מנע מחיקת קבצים רקורסיבית בטעות | `allowPaths` |
| `block-curl-pipe-sh` | מנע מסוכנים מהעברת סקריפטים לא מהימנים לקליפה | |
| `block-failproofai-commands` | מנע התקנה עצמית | |
| `sanitize-jwt` | עצור דליפת אסימוני JWT להקשר סוכן | |
| `sanitize-api-keys` | עצור דליפת מפתחות API להקשר סוכן | `additionalPatterns` |
| `sanitize-connection-strings` | עצור דליפת אישורי מסד נתונים להקשר סוכן | |
| `sanitize-private-key-content` | תגבר בלוקים של מפתח פרטי PEM מהפלט | |
| `sanitize-bearer-tokens` | תגבר אסימוני Authorization Bearer מהפלט | |
| `block-env-files` | שמור על סוכנים מקריאת קבצי .env | |
| `protect-env-vars` | מנע מסוכנים מהדפסת משתנים סביבה | |
| `block-read-outside-cwd` | שמור על סוכנים בתוך גבולות הפרויקט | `allowPaths` |
| `block-secrets-write` | מנע כתיבה לקבצי מפתח פרטי ותעודה | `additionalPatterns` |
| `block-push-master` | מנע דחיפה בטעות ל-main/master | `protectedBranches` |
| `block-work-on-main` | שמור על סוכנים מהענפים המוגנים | `protectedBranches` |
| `block-force-push` | מנע `git push --force` | |
| `warn-git-amend` | הזכר לסוכנים לפני שינוי commits | |
| `warn-git-stash-drop` | הזכר לסוכנים לפני הטלת stashes | |
| `warn-all-files-staged` | תפוס `git add -A` בטעות | |
| `warn-destructive-sql` | תפוס DROP/DELETE SQL לפני ביצוע | |
| `warn-schema-alteration` | תפוס ALTER TABLE לפני ביצוע | |
| `warn-large-file-write` | תפוס כתיבות קבצים גדולות בצורה בלתי צפויה | `thresholdKb` |
| `warn-package-publish` | תפוס `npm publish` בטעות | |
| `warn-background-process` | תפוס השקות תהליך ברקע לא מכוונות | |
| `warn-global-package-install` | תפוס התקנות חבילה עולמיות לא מכוונות | |
| …ועוד | | |

פרטי מדיניות מלא ויחוס פרמטר: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## מדיניות מותאמת אישית

כתוב את המדיניות שלך כדי לשמור על סוכנים אמינים וממוקדים:

```js
import { customPolicies, allow, deny, instruct } from "failproofai";

customPolicies.add({
  name: "no-production-writes",
  description: "חסום כתיבה לנתיבים המכילים 'production'",
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (!["Write", "Edit"].includes(ctx.toolName ?? "")) return allow();
    const path = ctx.toolInput?.file_path ?? "";
    if (path.includes("production")) return deny("כתיבה לנתיבי production חסומה");
    return allow();
  },
});
```

התקן עם:

```bash
failproofai policies --install --custom ./my-policies.js
```

### עוזרי החלטה

| פונקציה | השפעה |
|----------|--------|
| `allow()` | אפשר את הפעולה |
| `allow(message)` | אפשר ושלח הקשר מידע ל-Claude |
| `deny(message)` | חסום את הפעולה; הודעה מוצגת ל-Claude |
| `instruct(message)` | הוסף הקשר להנחיית Claude; לא חוסם |

### אובייקט הקשר (`ctx`)

| שדה | סוג | תיאור |
|-------|------|-------------|
| `eventType` | `string` | `"PreToolUse"`, `"PostToolUse"`, `"Notification"`, `"Stop"` |
| `toolName` | `string` | כלי להיקרא (`"Bash"`, `"Write"`, `"Read"`, …) |
| `toolInput` | `object` | פרמטרי קלט של הכלי |
| `payload` | `object` | מטען אירוע גולמי מלא |
| `session.cwd` | `string` | ספריית עבודה של הפעלת Claude Code |
| `session.sessionId` | `string` | מזהה הפעלה |
| `session.transcriptPath` | `string` | נתיב לקובץ תמלול ההפעלה |

וויים מותאמים תומכים בייבואים מקומיים טרנזיטיביים, async/await וגישה ל-`process.env`. טעויות הן fail-open (רשומות ל-`~/.failproofai/hook.log`, מדיניות מובנות ממשיכות). ראה [docs/custom-hooks.mdx](docs/custom-hooks.mdx) לקבלת המדריך המלא.

### מדיניות מבוססות אמנה

הפיל קבצי `*policies.{js,mjs,ts}` ל-`.failproofai/policies/` והם נטענים באופן אוטומטי - אין צורך בדגלים או שינויי קונפיגורציה. Commit את הספרייה ל-git וכל חברי הקבוצה מקבלים את אותם סטנדרטי איכות באופן אוטומטי.

```text
# רמת פרויקט — התחייב ל-git, שותף עם הקבוצה
.failproofai/policies/security-policies.mjs
.failproofai/policies/workflow-policies.mjs

# רמת משתמש — אישי, חל על כל הפרויקטים
~/.failproofai/policies/my-policies.mjs
```

שתי רמות טענות (union). קבצים נטענים בסדר אלפביתי בתוך כל ספרייה. קידום עם `01-`, `02-`, וכו' כדי לשלוט בסדר. כשהקבוצה שלך גוררת מצבי כשל חדשים, הוסף מדיניות ודחוף - כולם מקבלים את העדכון בנקמתם הבאה. ראה [examples/convention-policies/](examples/convention-policies/) לדוגמאות המוכנות לשימוש.

---

## טלמטריה

Failproof AI אוסף טלמטריה שימוש אנונימית דרך PostHog כדי להבין שימוש בתכונות. אף פעם לא נשלח תוכן הפעלה, שמות קבצים, קלטי כלים או מידע אישי.

השבת זאת:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## תיעוד

| מדריך | תיאור |
|-------|-------------|
| [Getting Started](docs/getting-started.mdx) | התקנה וצעדים ראשונים |
| [Built-in Policies](docs/built-in-policies.mdx) | כל 39 מדיניות מובנות עם פרמטרים |
| [Custom Policies](docs/custom-policies.mdx) | כתוב את המדיניות שלך |
| [Configuration](docs/configuration.mdx) | פורמט קובץ קונפיגורציה ומיזוג scope |
| [Dashboard](docs/dashboard.mdx) | עקוב אחרי הפעלות וסקור פעילות מדיניות |
| [Architecture](docs/architecture.mdx) | איך מערכת הווים פועלת |
| [Testing](docs/testing.mdx) | הפעלת בדיקות וכתיבת חדשות |

### הפעל מסמכים באופן מקומי

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

פותח את אתר המסמכים של Mintlify ב-`http://localhost:3000`. המיכל צפה בשינויים אם אתה מעגן את ספריית המסמכים:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## הערה לתורמי failproofai

ה-`.claude/settings.json` של repo זה משתמש ב-`bun ./bin/failproofai.mjs --hook <EventType>` בדלא של הפקודה `npx -y failproofai` הסטנדרטית. זה בגלל שהפעלת `npx -y failproofai` בתוך פרויקט failproofai עצמו יוצרת קונפליקט התייחסות עצמית.

עבור כל שאר repos, הגישה המומלצת היא `npx -y failproofai`, המותקנת דרך:

```bash
failproofai policies --install --scope project
```

## תרומה

ראה [CONTRIBUTING.md](CONTRIBUTING.md).

---

## רישיון

ראה [LICENSE](LICENSE).

---

בנוי ותוחזק על ידי **ExosphereHost: Reliability Research Lab for Your Agents**. אנו עוזרים לכלכלות ולחברות סטרטאפ לשפר את האמינות של סוכני AI שלהם דרך הסוכנים שלנו, תוכנה וכישוריות. למד יותר ב-[exosphere.host](https://exosphere.host).


</div>