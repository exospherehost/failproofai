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

पॉलिसी प्रबंधित करने का सबसे आसान तरीका जो आपके AI एजेंटों को विश्वसनीय, कार्य-केंद्रित और स्वायत्त रूप से चलाने में मदद करता है - **Claude Code** और **Agents SDK** के लिए।

<p align="center">
  <img src="failproofai-hq.gif" alt="Failproof AI in action" width="800" />
</p>

- **30 अंतर्निहित पॉलिसी** - सामान्य एजेंट विफलता मोड को तुरंत पकड़ें। विनाशकारी कमांड ब्लॉक करें, गोपनीय जानकारी के रिसाव को रोकें, एजेंटों को प्रोजेक्ट सीमा के भीतर रखें, लूप का पता लगाएं और बहुत कुछ।
- **कस्टम पॉलिसी** - JavaScript में अपने स्वयं की विश्वसनीयता नियम लिखें। `allow`/`deny`/`instruct` API का उपयोग करके परंपराओं को लागू करें, विचलन को रोकें, संचालन को नियंत्रित करें, या बाहरी सिस्टम के साथ एकीकृत करें।
- **आसान कॉन्फ़िगरेशन** - कोड लिखे बिना किसी भी पॉलिसी को ट्यून करें। अनुमति सूचियां, सुरक्षित शाखाएं, प्रति-प्रोजेक्ट या वैश्विक रूप से थ्रेसहोल्ड सेट करें। तीन-स्कोप कॉन्फ़िग स्वचालित रूप से मर्ज हो जाता है।
- **एजेंट मॉनिटर** - देखें कि आपके एजेंटों ने आपके दूर रहने के दौरान क्या किया। सत्र ब्राउज़ करें, प्रत्येक टूल कॉल का निरीक्षण करें, और बिल्कुल देखें कि नीतियां कहां चलाई गईं।

सब कुछ स्थानीय रूप से चलता है - कोई डेटा आपकी मशीन से बाहर नहीं जाता।

---

## आवश्यकताएं

- Node.js >= 20.9.0
- Bun >= 1.3.0 (वैकल्पिक - केवल विकास/स्रोत से बिल्डिंग के लिए आवश्यक)

---

## स्थापना

```bash
npm install -g failproofai
# या
bun add -g failproofai
```

---

## त्वरित शुरुआत

### 1. पॉलिसी को विश्व स्तर पर सक्षम करें

```bash
failproofai policies --install
```

`~/.claude/settings.json` में हुक प्रविष्टियां लिखता है। Claude Code अब प्रत्येक टूल कॉल से पहले और बाद में failproofai को आह्वान करेगा।

### 2. डैशबोर्ड लॉन्च करें

```bash
failproofai
```

`http://localhost:8020` खोलता है - सत्र ब्राउज़ करें, लॉग का निरीक्षण करें, पॉलिसी प्रबंधित करें।

### 3. जाँचें कि क्या सक्रिय है

```bash
failproofai policies
```

---

## पॉलिसी स्थापना

### स्कोप

| स्कोप | आदेश | जहां यह लिखता है |
|-------|---------|-----------------|
| वैश्विक (डिफ़ॉल्ट) | `failproofai policies --install` | `~/.claude/settings.json` |
| प्रोजेक्ट | `failproofai policies --install --scope project` | `.claude/settings.json` |
| स्थानीय | `failproofai policies --install --scope local` | `.claude/settings.local.json` |

### विशिष्ट पॉलिसी स्थापित करें

```bash
failproofai policies --install block-sudo block-rm-rf sanitize-api-keys
```

### पॉलिसी हटाएं

```bash
failproofai policies --uninstall
# या किसी विशिष्ट स्कोप के लिए:
failproofai policies --uninstall --scope project
```

---

## कॉन्फ़िगरेशन

पॉलिसी कॉन्फ़िगरेशन `~/.failproofai/policies-config.json` (वैश्विक) में या आपके प्रोजेक्ट में `.failproofai/policies-config.json` (प्रति-प्रोजेक्ट) में रहता है।

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
      "hint": "Use apt-get directly without sudo."
    },
    "block-push-master": {
      "protectedBranches": ["main", "release", "prod"],
      "hint": "Try creating a fresh branch instead."
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

**तीन कॉन्फ़िग स्कोप** स्वचालित रूप से मर्ज हो जाते हैं (प्रोजेक्ट → स्थानीय → वैश्विक)। पूर्ण मर्ज नियमों के लिए [docs/configuration.mdx](docs/configuration.mdx) देखें।

---

## अंतर्निहित पॉलिसी

| पॉलिसी | विवरण | कॉन्फ़िगर योग्य |
|--------|-------------|:---:|
| `block-sudo` | एजेंटों को विशेषाधिकार प्राप्त सिस्टम कमांड चलाने से रोकें | `allowPatterns` |
| `block-rm-rf` | आकस्मिक पुनरावर्ती फ़ाइल विलोपन को रोकें | `allowPaths` |
| `block-curl-pipe-sh` | एजेंटों को अविश्वास्य स्क्रिप्ट को शेल में पाइप करने से रोकें | |
| `block-failproofai-commands` | स्व-अस्थापन को रोकें | |
| `sanitize-jwt` | JWT टोकन को एजेंट संदर्भ में रिसाव होने से रोकें | |
| `sanitize-api-keys` | API कीज़ को एजेंट संदर्भ में रिसाव होने से रोकें | `additionalPatterns` |
| `sanitize-connection-strings` | डेटाबेस क्रेडेंशियल को एजेंट संदर्भ में रिसाव होने से रोकें | |
| `sanitize-private-key-content` | आउटपुट से PEM निजी कुंजी ब्लॉक को संपादित करें | |
| `sanitize-bearer-tokens` | आउटपुट से Authorization Bearer टोकन को संपादित करें | |
| `block-env-files` | एजेंटों को .env फ़ाइलें पढ़ने से रोकें | |
| `protect-env-vars` | एजेंटों को पर्यावरण चर प्रिंट करने से रोकें | |
| `block-read-outside-cwd` | एजेंटों को प्रोजेक्ट सीमा के भीतर रखें | `allowPaths` |
| `block-secrets-write` | निजी कुंजी और प्रमाणपत्र फ़ाइलों में लिखने को रोकें | `additionalPatterns` |
| `block-push-master` | मुख्य/मास्टर में आकस्मिक पुश को रोकें | `protectedBranches` |
| `block-work-on-main` | एजेंटों को सुरक्षित शाखाओं से दूर रखें | `protectedBranches` |
| `block-force-push` | `git push --force` को रोकें | |
| `warn-git-amend` | प्रतिबद्धताओं को संशोधित करने से पहले एजेंटों को याद दिलाएं | |
| `warn-git-stash-drop` | स्टैश ड्रॉप करने से पहले एजेंटों को याद दिलाएं | |
| `warn-all-files-staged` | आकस्मिक `git add -A` को पकड़ें | |
| `warn-destructive-sql` | DROP/DELETE SQL को निष्पादन से पहले पकड़ें | |
| `warn-schema-alteration` | ALTER TABLE को निष्पादन से पहले पकड़ें | |
| `warn-large-file-write` | अप्रत्याशित रूप से बड़ी फ़ाइल लिखने को पकड़ें | `thresholdKb` |
| `warn-package-publish` | आकस्मिक `npm publish` को पकड़ें | |
| `warn-background-process` | अनपेक्षित पृष्ठभूमि प्रक्रिया लॉन्च को पकड़ें | |
| `warn-global-package-install` | अनपेक्षित वैश्विक पैकेज स्थापन को पकड़ें | |
| …और अधिक | | |

पूर्ण पॉलिसी विवरण और पैरामीटर संदर्भ: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## कस्टम पॉलिसी

एजेंटों को विश्वसनीय और कार्य-केंद्रित रखने के लिए अपनी स्वयं की पॉलिसी लिखें:

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

इसे स्थापित करें:

```bash
failproofai policies --install --custom ./my-policies.js
```

### निर्णय सहायक

| फ़ंक्शन | प्रभाव |
|----------|--------|
| `allow()` | संचालन की अनुमति दें |
| `allow(message)` | अनुमति दें और Claude को सूचनात्मक संदर्भ भेजें |
| `deny(message)` | संचालन ब्लॉक करें; संदेश Claude को दिखाया जाता है |
| `instruct(message)` | Claude के संकेत में संदर्भ जोड़ें; ब्लॉक नहीं करता |

### संदर्भ ऑब्जेक्ट (`ctx`)

| फ़ील्ड | प्रकार | विवरण |
|-------|------|-------------|
| `eventType` | `string` | `"PreToolUse"`, `"PostToolUse"`, `"Notification"`, `"Stop"` |
| `toolName` | `string` | बुलाया जा रहा उपकरण (`"Bash"`, `"Write"`, `"Read"`, …) |
| `toolInput` | `object` | उपकरण के इनपुट पैरामीटर |
| `payload` | `object` | पूर्ण कच्ची घटना पेलोड |
| `session.cwd` | `string` | Claude Code सत्र की कार्य निर्देशिका |
| `session.sessionId` | `string` | सत्र पहचानकर्ता |
| `session.transcriptPath` | `string` | सत्र प्रतिलेख फ़ाइल का पथ |

कस्टम हुक सकर्मक स्थानीय आयात, async/await, और `process.env` तक पहुंच का समर्थन करते हैं। त्रुटियां विफलता-खुली हैं (लॉग `~/.failproofai/hook.log` में, अंतर्निहित पॉलिसी जारी रहती हैं)। पूर्ण मार्गदर्शन के लिए [docs/custom-hooks.mdx](docs/custom-hooks.mdx) देखें।

### परंपरा-आधारित पॉलिसी

`*policies.{js,mjs,ts}` फ़ाइलें `.failproofai/policies/` में ड्रॉप करें और वे स्वचालित रूप से लोड हो जाती हैं — कोई झंडे या कॉन्फ़िग परिवर्तन की आवश्यकता नहीं। निर्देशिका को git में प्रतिबद्ध करें और प्रत्येक टीम सदस्य को समान गुणवत्ता मानक स्वचालित रूप से मिल जाते हैं।

```text
# प्रोजेक्ट स्तर — git में प्रतिबद्ध, टीम के साथ साझा किया गया
.failproofai/policies/security-policies.mjs
.failproofai/policies/workflow-policies.mjs

# उपयोगकर्ता स्तर — व्यक्तिगत, सभी प्रोजेक्ट पर लागू होता है
~/.failproofai/policies/my-policies.mjs
```

दोनों स्तर लोड होते हैं (संघ)। फ़ाइलें प्रत्येक निर्देशिका के भीतर वर्णानुक्रमिक रूप से लोड होती हैं। क्रम नियंत्रित करने के लिए `01-`, `02-` आदि के साथ उपसर्ग करें। जब आपकी टीम को नई विफलता के तरीके का पता चले, एक पॉलिसी जोड़ें और पुश करें — सभी को अपनी अगली खींच पर अपडेट मिल जाता है। तैयार-से-उपयोग के उदाहरणों के लिए [examples/convention-policies/](examples/convention-policies/) देखें।

---

## टेलीमेट्री

Failproof AI PostHog के माध्यम से गुमनाम उपयोग टेलीमेट्री एकत्र करता है ताकि सुविधा उपयोग को समझा जा सके। कोई सत्र सामग्री, फ़ाइल नाम, टूल इनपुट, या व्यक्तिगत जानकारी कभी नहीं भेजी जाती है।

इसे अक्षम करें:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## दस्तावेज़

| गाइड | विवरण |
|-------|-------------|
| [शुरुआत करना](docs/getting-started.mdx) | स्थापना और पहले कदम |
| [अंतर्निहित पॉलिसी](docs/built-in-policies.mdx) | सभी 30 अंतर्निहित पॉलिसी पैरामीटर के साथ |
| [कस्टम पॉलिसी](docs/custom-policies.mdx) | अपनी स्वयं की पॉलिसी लिखें |
| [कॉन्फ़िगरेशन](docs/configuration.mdx) | कॉन्फ़िग फ़ाइल प्रारूप और स्कोप मर्जिंग |
| [डैशबोर्ड](docs/dashboard.mdx) | सत्र की निगरानी करें और पॉलिसी गतिविधि की समीक्षा करें |
| [आर्किटेक्चर](docs/architecture.mdx) | हुक सिस्टम कैसे काम करता है |
| [परीक्षण](docs/testing.mdx) | परीक्षण चलाना और नए लिखना |

### दस्तावेज़ स्थानीय रूप से चलाएं

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

Mintlify दस्तावेज़ साइट को `http://localhost:3000` पर खोलता है। यदि आप दस्तावेज़ निर्देशिका को माउंट करते हैं तो कंटेनर परिवर्तनों के लिए देखता है:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## failproofai योगदानकर्ताओं के लिए नोट

इस रिपो का `.claude/settings.json` मानक `npx -y failproofai` कमांड के बजाय `bun ./bin/failproofai.mjs --hook <EventType>` का उपयोग करता है। ऐसा इसलिए है क्योंकि failproofai प्रोजेक्ट के अंदर `npx -y failproofai` चलाने से स्व-संदर्भित संघर्ष उत्पन्न होता है।

अन्य सभी रिपो के लिए, अनुशंसित दृष्टिकोण `npx -y failproofai` है, इसके माध्यम से स्थापित:

```bash
failproofai policies --install --scope project
```

## योगदान

[CONTRIBUTING.md](CONTRIBUTING.md) देखें।

---

## लाइसेंस

[LICENSE](LICENSE) देखें।

---

**ExosphereHost: आपके एजेंटों के लिए विश्वसनीयता अनुसंधान प्रयोगशाला** द्वारा निर्मित और रखरखाव किया गया। हम उद्यम और स्टार्टअप को अपने स्वयं के एजेंटों, सॉफ़्टवेयर और विशेषज्ञता के माध्यम से अपने AI एजेंटों की विश्वसनीयता में सुधार करने में मदद करते हैं। [exosphere.host](https://exosphere.host) पर अधिक जानें।
