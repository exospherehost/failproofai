> **⚠️** This is an auto-generated translation. For the latest version, see the [English README](../../README.md). Community corrections welcome!

[🇺🇸 English](../../README.md) | [🇨🇳 简体中文](README.zh.md) | [🇯🇵 日本語](README.ja.md) | [🇰🇷 한국어](README.ko.md) | [🇪🇸 Español](README.es.md) | [🇧🇷 Português](README.pt-br.md) | [🇩🇪 Deutsch](README.de.md) | [🇫🇷 Français](README.fr.md) | [🇷🇺 Русский](README.ru.md) | **🇮🇳 हिन्दी** | [🇹🇷 Türkçe](README.tr.md) | [🇻🇳 Tiếng Việt](README.vi.md) | [🇮🇹 Italiano](README.it.md) | [🇸🇦 العربية](README.ar.md) | [🇮🇱 עברית](README.he.md)

---

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

**अनुवाद**: [简体中文](docs/i18n/README.zh.md) | [日本語](docs/i18n/README.ja.md) | [한국어](docs/i18n/README.ko.md) | [Español](docs/i18n/README.es.md) | [Português](docs/i18n/README.pt-br.md) | [Deutsch](docs/i18n/README.de.md) | [Français](docs/i18n/README.fr.md) | [Русский](docs/i18n/README.ru.md) | [हिन्दी](docs/i18n/README.hi.md) | [Türkçe](docs/i18n/README.tr.md) | [Tiếng Việt](docs/i18n/README.vi.md) | [Italiano](docs/i18n/README.it.md) | [العربية](docs/i18n/README.ar.md) | [עברית](docs/i18n/README.he.md)

**Claude Code** और **Agents SDK** के लिए नीतियाँ प्रबंधित करने का सबसे आसान तरीका — जो आपके AI एजेंट्स को विश्वसनीय, लक्ष्य-केंद्रित और स्वायत्त रूप से चलाए रखे।

- **30 बिल्ट-इन नीतियाँ** — एजेंट की सामान्य विफलताओं को तुरंत पकड़ें। हानिकारक कमांड ब्लॉक करें, गोपनीय जानकारी को लीक होने से रोकें, एजेंट्स को प्रोजेक्ट की सीमाओं में रखें, लूप्स पहचानें, और बहुत कुछ।
- **कस्टम नीतियाँ** — JavaScript में अपने खुद के विश्वसनीयता नियम लिखें। `allow`/`deny`/`instruct` API का उपयोग करके परंपराओं को लागू करें, भटकाव रोकें, ऑपरेशन नियंत्रित करें, या बाहरी सिस्टम से एकीकृत करें।
- **आसान कॉन्फ़िगरेशन** — बिना कोड लिखे किसी भी नीति को अनुकूलित करें। प्रति-प्रोजेक्ट या वैश्विक स्तर पर allowlist, सुरक्षित ब्रांच और थ्रेशोल्ड सेट करें। तीन-स्कोप कॉन्फ़िग स्वचालित रूप से मर्ज होता है।
- **Agent Monitor** — जब आप दूर थे तब एजेंट्स ने क्या किया, देखें। सेशन ब्राउज़ करें, हर टूल कॉल की जाँच करें, और देखें कि नीतियाँ कहाँ सक्रिय हुईं।

सब कुछ लोकल रूप से चलता है — आपका कोई भी डेटा आपकी मशीन से बाहर नहीं जाता।

---

## आवश्यकताएँ

- Node.js >= 20.9.0
- Bun >= 1.3.0 (वैकल्पिक — केवल डेवलपमेंट / सोर्स से बिल्ड करने के लिए आवश्यक)

---

## इंस्टॉल करें

```bash
npm install -g failproofai
# or
bun add -g failproofai
```

---

## त्वरित शुरुआत

### 1. नीतियाँ वैश्विक रूप से सक्षम करें

```bash
failproofai policies --install
```

`~/.claude/settings.json` में हुक एंट्री लिखता है। Claude Code अब हर टूल कॉल से पहले और बाद में failproofai को इनवोक करेगा।

### 2. डैशबोर्ड लॉन्च करें

```bash
failproofai
```

`http://localhost:8020` खोलता है — सेशन ब्राउज़ करें, लॉग देखें, नीतियाँ प्रबंधित करें।

### 3. सक्रिय नीतियाँ जाँचें

```bash
failproofai policies
```

---

## नीति इंस्टॉलेशन

### स्कोप

| स्कोप | कमांड | कहाँ लिखता है |
|-------|---------|-----------------|
| वैश्विक (डिफ़ॉल्ट) | `failproofai policies --install` | `~/.claude/settings.json` |
| प्रोजेक्ट | `failproofai policies --install --scope project` | `.claude/settings.json` |
| लोकल | `failproofai policies --install --scope local` | `.claude/settings.local.json` |

### विशिष्ट नीतियाँ इंस्टॉल करें

```bash
failproofai policies --install block-sudo block-rm-rf sanitize-api-keys
```

### नीतियाँ हटाएँ

```bash
failproofai policies --uninstall
# or for a specific scope:
failproofai policies --uninstall --scope project
```

---

## कॉन्फ़िगरेशन

नीति कॉन्फ़िगरेशन `~/.failproofai/policies-config.json` (वैश्विक) या आपके प्रोजेक्ट में `.failproofai/policies-config.json` (प्रति-प्रोजेक्ट) में रहती है।

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
      "allowPatterns": ["sudo systemctl status", "sudo journalctl"]
    },
    "block-push-master": {
      "protectedBranches": ["main", "release", "prod"]
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

**तीन कॉन्फ़िग स्कोप** स्वचालित रूप से मर्ज होते हैं (project → local → global)। पूर्ण मर्ज नियमों के लिए [docs/configuration.mdx](docs/configuration.mdx) देखें।

---

## बिल्ट-इन नीतियाँ

| नीति | विवरण | कॉन्फ़िगर करने योग्य |
|--------|-------------|:---:|
| `block-sudo` | एजेंट्स को विशेषाधिकार प्राप्त सिस्टम कमांड चलाने से रोकें | `allowPatterns` |
| `block-rm-rf` | अनजाने में रिकर्सिव फ़ाइल डिलीशन रोकें | `allowPaths` |
| `block-curl-pipe-sh` | एजेंट्स को अविश्वसनीय स्क्रिप्ट को shell में पाइप करने से रोकें | |
| `block-failproofai-commands` | स्वयं-अनइंस्टॉलेशन रोकें | |
| `sanitize-jwt` | JWT टोकन को एजेंट संदर्भ में लीक होने से रोकें | |
| `sanitize-api-keys` | API keys को एजेंट संदर्भ में लीक होने से रोकें | `additionalPatterns` |
| `sanitize-connection-strings` | डेटाबेस क्रेडेंशियल को एजेंट संदर्भ में लीक होने से रोकें | |
| `sanitize-private-key-content` | आउटपुट से PEM प्राइवेट की ब्लॉक हटाएँ | |
| `sanitize-bearer-tokens` | आउटपुट से Authorization Bearer टोकन हटाएँ | |
| `block-env-files` | एजेंट्स को .env फ़ाइलें पढ़ने से रोकें | |
| `protect-env-vars` | एजेंट्स को एनवायरनमेंट वेरिएबल प्रिंट करने से रोकें | |
| `block-read-outside-cwd` | एजेंट्स को प्रोजेक्ट की सीमाओं के अंदर रखें | `allowPaths` |
| `block-secrets-write` | प्राइवेट की और सर्टिफिकेट फ़ाइलों में लेखन रोकें | `additionalPatterns` |
| `block-push-master` | main/master पर अनजाने में push रोकें | `protectedBranches` |
| `block-work-on-main` | एजेंट्स को सुरक्षित ब्रांच पर काम करने से रोकें | `protectedBranches` |
| `block-force-push` | `git push --force` रोकें | |
| `warn-git-amend` | कमिट amend करने से पहले एजेंट्स को याद दिलाएँ | |
| `warn-git-stash-drop` | stash ड्रॉप करने से पहले एजेंट्स को याद दिलाएँ | |
| `warn-all-files-staged` | अनजाने `git add -A` पकड़ें | |
| `warn-destructive-sql` | निष्पादन से पहले DROP/DELETE SQL पकड़ें | |
| `warn-schema-alteration` | निष्पादन से पहले ALTER TABLE पकड़ें | |
| `warn-large-file-write` | अप्रत्याशित रूप से बड़े फ़ाइल राइट पकड़ें | `thresholdKb` |
| `warn-package-publish` | अनजाने `npm publish` पकड़ें | |
| `warn-background-process` | अनपेक्षित बैकग्राउंड प्रोसेस लॉन्च पकड़ें | |
| `warn-global-package-install` | अनपेक्षित ग्लोबल पैकेज इंस्टॉल पकड़ें | |
| …और अधिक | | |

पूर्ण नीति विवरण और पैरामीटर संदर्भ: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## कस्टम नीतियाँ

एजेंट्स को विश्वसनीय और लक्ष्य-केंद्रित रखने के लिए अपनी खुद की नीतियाँ लिखें:

```js
import { customPolicies, allow, deny, instruct } from "failproofai";

customPolicies.add({
  name: "no-production-writes",
  description: "Block writes to paths containing 'production'",
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (!["Write", "Edit"].includes(ctx.toolName ?? "")) return allow();
    const path = ctx.toolInput?.file_path ?? "";
    if (path.includes("production")) return deny("Writes to production paths are blocked");
    return allow();
  },
});
```

इस तरह इंस्टॉल करें:

```bash
failproofai policies --install --custom ./my-policies.js
```

### निर्णय सहायक फ़ंक्शन

| फ़ंक्शन | प्रभाव |
|----------|--------|
| `allow()` | ऑपरेशन की अनुमति दें |
| `allow(message)` | अनुमति दें और Claude को सूचनात्मक संदर्भ भेजें *(बीटा)* |
| `deny(message)` | ऑपरेशन ब्लॉक करें; संदेश Claude को दिखाया जाता है |
| `instruct(message)` | Claude के प्रॉम्प्ट में संदर्भ जोड़ें; ब्लॉक नहीं करता |

### संदर्भ ऑब्जेक्ट (`ctx`)

| फ़ील्ड | प्रकार | विवरण |
|-------|------|-------------|
| `eventType` | `string` | `"PreToolUse"`, `"PostToolUse"`, `"Notification"`, `"Stop"` |
| `toolName` | `string` | जो टूल कॉल हो रहा है (`"Bash"`, `"Write"`, `"Read"`, …) |
| `toolInput` | `object` | टूल के इनपुट पैरामीटर |
| `payload` | `object` | पूर्ण raw इवेंट payload |
| `session.cwd` | `string` | Claude Code सेशन की वर्किंग डायरेक्टरी |
| `session.sessionId` | `string` | सेशन आइडेंटिफायर |
| `session.transcriptPath` | `string` | सेशन ट्रांसक्रिप्ट फ़ाइल का पथ |

कस्टम हुक्स transitive लोकल इम्पोर्ट, async/await और `process.env` तक पहुँच को सपोर्ट करते हैं। त्रुटियाँ fail-open होती हैं (`~/.failproofai/hook.log` में लॉग होती हैं, बिल्ट-इन नीतियाँ जारी रहती हैं)। पूर्ण गाइड के लिए [docs/custom-hooks.mdx](docs/custom-hooks.mdx) देखें।

---

## टेलीमेट्री

Failproof AI फ़ीचर उपयोग समझने के लिए PostHog के ज़रिए अनाम उपयोग टेलीमेट्री एकत्र करता है। सेशन की सामग्री, फ़ाइल नाम, टूल इनपुट या कोई भी व्यक्तिगत जानकारी कभी नहीं भेजी जाती।

इसे अक्षम करें:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## दस्तावेज़ीकरण

| गाइड | विवरण |
|-------|-------------|
| [Getting Started](docs/getting-started.mdx) | इंस्टॉलेशन और पहले कदम |
| [Built-in Policies](docs/built-in-policies.mdx) | सभी 30 बिल्ट-इन नीतियाँ पैरामीटर सहित |
| [Custom Policies](docs/custom-policies.mdx) | अपनी खुद की नीतियाँ लिखें |
| [Configuration](docs/configuration.mdx) | कॉन्फ़िग फ़ाइल फ़ॉर्मेट और स्कोप मर्जिंग |
| [Dashboard](docs/dashboard.mdx) | सेशन मॉनीटर करें और नीति गतिविधि समीक्षा करें |
| [Architecture](docs/architecture.mdx) | हुक सिस्टम कैसे काम करता है |
| [Testing](docs/testing.mdx) | परीक्षण चलाएँ और नए परीक्षण लिखें |

### डॉक्स लोकल रूप से चलाएँ

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

`http://localhost:3000` पर Mintlify डॉक्स साइट खोलता है। यदि आप docs डायरेक्टरी माउंट करते हैं तो कंटेनर बदलावों को देखता रहता है:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## योगदान

[CONTRIBUTING.md](CONTRIBUTING.md) देखें।

---

## लाइसेंस

[LICENSE](LICENSE) देखें।
