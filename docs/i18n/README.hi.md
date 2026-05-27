> **⚠️** This is an auto-generated translation. For the latest version, see the [English README](../../README.md). Community corrections welcome!

[🇺🇸 English](../../README.md) | [🇨🇳 简体中文](README.zh.md) | [🇯🇵 日本語](README.ja.md) | [🇰🇷 한국어](README.ko.md) | [🇪🇸 Español](README.es.md) | [🇧🇷 Português](README.pt-br.md) | [🇩🇪 Deutsch](README.de.md) | [🇫🇷 Français](README.fr.md) | [🇷🇺 Русский](README.ru.md) | **🇮🇳 हिन्दी** | [🇹🇷 Türkçe](README.tr.md) | [🇻🇳 Tiếng Việt](README.vi.md) | [🇮🇹 Italiano](README.it.md) | [🇸🇦 العربية](README.ar.md) | [🇮🇱 עברית](README.he.md)

---

<div align="center">

<img src="https://d2wq11aau0arks.cloudfront.net/failproof/fa_updated_full.svg" alt="failproof ai" width="220" />

[![npm](https://img.shields.io/npm/v/failproofai?style=flat-square&color=CB3837)](https://www.npmjs.com/package/failproofai)
[![CI](https://img.shields.io/github/actions/workflow/status/failproofai/failproofai/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/failproofai/failproofai/actions)
[![Slack](https://img.shields.io/badge/Slack-join%20us-4A154B?style=flat-square&logo=slack)](https://join.slack.com/t/failproofai/shared_invite/zt-3v63b7k5e-O3NBHmj8X6n9gZSGDx6ggQ)
[![Docs](https://img.shields.io/badge/docs-befailproof.ai-002CA7?style=flat-square)](https://docs.befailproof.ai)
[![License](https://img.shields.io/badge/license-MIT%20%2B%20Commons%20Clause-blue?style=flat-square)](./LICENSE)

**अनुवाद:** [简体中文](./docs/i18n/README.zh.md) · [日本語](./docs/i18n/README.ja.md) · [한국어](./docs/i18n/README.ko.md) · [Español](./docs/i18n/README.es.md) · [Português](./docs/i18n/README.pt-br.md) · [Deutsch](./docs/i18n/README.de.md) · [Français](./docs/i18n/README.fr.md) · [Русский](./docs/i18n/README.ru.md) · [हिन्दी](./docs/i18n/README.hi.md) · [Türkçe](./docs/i18n/README.tr.md) · [Tiếng Việt](./docs/i18n/README.vi.md) · [Italiano](./docs/i18n/README.it.md) · [العربية](./docs/i18n/README.ar.md) · [עברית](./docs/i18n/README.he.md)

**कोडिंग एजेंट्स के लिए रनटाइम विफलता समाधान।**
Claude Code और Codex में हुक करता है। लूप, खतरनाक कार्य और गुप्त जानकारी के रिसाव को पकड़ता है
इससे पहले कि वे समस्या बन जाएं। शून्य विलंबता। स्थानीय रूप से चलता है।

</div>

<p align="center">
  <img src="readme-arch-hq.gif" alt="Failproof AI in action" width="800" />
</p>

---

## समर्थित एजेंट सीएलआई

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
  <a href="https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/use-hooks" title="GitHub Copilot CLI">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="assets/logos/copilot-dark.svg" />
      <img src="assets/logos/copilot-light.svg" alt="GitHub Copilot" width="64" height="64" />
    </picture>
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://cursor.com/docs/hooks" title="Cursor Agent CLI">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="assets/logos/cursor-dark.svg" />
      <img src="assets/logos/cursor-light.svg" alt="Cursor Agent" width="64" height="64" />
    </picture>
  </a>
</p>
<p align="center">
  <a href="https://opencode.ai/docs/plugins/" title="OpenCode">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="assets/logos/opencode-dark.svg" />
      <img src="assets/logos/opencode-light.svg" alt="OpenCode" width="64" height="64" />
    </picture>
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://pi.dev" title="Pi (pi-coding-agent)">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="assets/logos/pi-dark.svg" />
      <img src="assets/logos/pi-light.svg" alt="Pi" width="64" height="64" />
    </picture>
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://geminicli.com/" title="Gemini CLI">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="assets/logos/gemini-dark.svg" />
      <img src="assets/logos/gemini-light.svg" alt="Gemini CLI" width="64" height="64" />
    </picture>
  </a>
</p>

> एक या किसी भी संयोजन के लिए हुक इंस्टॉल करें: `failproofai policies --install --cli opencode pi gemini` (या `--cli claude codex copilot cursor opencode pi gemini`)। स्वचालित रूप से स्थापित सीएलआई का पता लगाने के लिए `--cli` को छोड़ दें और प्रकट करें।

---

## इंस्टॉल करें

```sh
npm install -g failproofai
failproofai policies --install   # या बस `failproofai` चलाएं और पहली बार प्रकट किए गए प्रस्ताव को स्वीकार करें
failproofai
```

30 अंतर्निर्मित नीतियां तुरंत सक्रिय हो जाती हैं। `localhost:8020` पर डैशबोर्ड। `FAILPROOFAI_NO_FIRST_RUN=1` से पहली बार प्रकट किए गए प्रस्ताव को अक्षम करें।

---

## यह क्या रोकता है

| नीति | यह क्या अवरुद्ध करता है |
|---|---|
| `block-push-master` | `main` / `master` को सीधे पुश |
| `block-force-push` | `git push --force` |
| `block-work-on-main` | `main` / `master` पर कमिट, मर्ज, रीबेस |
| `block-rm-rf` | पुनरावर्ती फ़ाइल विलोपन |
| `sanitize-api-keys` | एपीआई कुंजियां एजेंट संदर्भ में रिसना |

→ [सभी 30 अंतर्निर्मित नीतियां](https://docs.befailproof.ai/built-in-policies)

---

## अपनी नीतियां

`.failproofai/policies/` में एक फ़ाइल ड्रॉप करें — यह स्वचालित रूप से लोड होती है, कोई ध्वज की आवश्यकता नहीं।
इसे कमिट करें और पूरी टीम को अगले पुल पर मिल जाता है।

```js
import { customPolicies, deny, allow } from "failproofai";

customPolicies.add({
  name: "no-production-writes",
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (ctx.toolInput?.file_path?.includes("production"))
      return deny("Writes to production paths are blocked.");
    return allow();
  },
});
```

हर नीति के लिए तीन निर्णय उपलब्ध हैं:

| निर्णय | प्रभाव |
|---|---|
| `allow()` | ऑपरेशन की अनुमति दें |
| `deny(message)` | इसे अवरुद्ध करें — संदेश एजेंट को वापस जाता है |
| `instruct(message)` | इसे सामने आने दें, लेकिन एजेंट के अगले प्रॉम्प्ट में संदर्भ जोड़ें |

→ [कस्टम नीतियां गाइड](https://docs.befailproof.ai/custom-policies)

---

## सत्र दृश्यता

आपके एजेंट द्वारा किया जाने वाला प्रत्येक टूल कॉल स्थानीय रूप से लॉग किया जाता है। डैशबोर्ड दिखाता है कि क्या चलता था,
क्या अवरुद्ध किया गया था, और नीति ने एजेंट को क्या बताया — इसलिए आप अनुमान नहीं लगा रहे हैं
जब कुछ गलत हो जाता है। → [डैशबोर्ड गाइड](https://docs.befailproof.ai/dashboard)

---

## दस्तावेज़

| | |
|---|---|
| [शुरुआत करना](https://docs.befailproof.ai/getting-started) | स्थापना और पहले कदम |
| [अंतर्निर्मित नीतियां](https://docs.befailproof.ai/built-in-policies) | सभी 30 नीतियां पैरामीटर के साथ |
| [कस्टम नीतियां](https://docs.befailproof.ai/custom-policies) | अपना लिखें |
| [कॉन्फ़िगरेशन](https://docs.befailproof.ai/configuration) | कॉन्फ़िग स्कोप और विलय नियम |
| [डैशबोर्ड](https://docs.befailproof.ai/dashboard) | सत्र मॉनिटर और नीति गतिविधि |
| [आर्किटेक्चर](https://docs.befailproof.ai/architecture) | हुक सिस्टम कैसे काम करता है |

---

## लाइसेंस

[Commons Clause](https://commonsclause.com/) के साथ एमआईटी — आंतरिक और व्यक्तिगत उपयोग के लिए स्वतंत्र; failproofai के वाणिज्यिक पुनर्विक्रय के लिए एक अलग समझौते की आवश्यकता है। पूर्ण पाठ के लिए [LICENSE](./LICENSE) देखें।

---

## योगदान

[CONTRIBUTING.md](./CONTRIBUTING.md) देखें। नई नीतियां, सीमांत मामले और अनुवाद सभी स्वागत हैं।

---

[Nivedit Jain](https://github.com/NiveditJain) और [Nikita Agarwal](https://github.com/nk-ag) द्वारा निर्मित।
[befailproof.ai](https://befailproof.ai)
