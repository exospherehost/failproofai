> **⚠️** This is an auto-generated translation. For the latest version, see the [English README](../../README.md). Community corrections welcome!

[🇺🇸 English](../../README.md) | [🇨🇳 简体中文](README.zh.md) | [🇯🇵 日本語](README.ja.md) | [🇰🇷 한국어](README.ko.md) | [🇪🇸 Español](README.es.md) | [🇧🇷 Português](README.pt-br.md) | [🇩🇪 Deutsch](README.de.md) | [🇫🇷 Français](README.fr.md) | [🇷🇺 Русский](README.ru.md) | [🇮🇳 हिन्दी](README.hi.md) | **🇹🇷 Türkçe** | [🇻🇳 Tiếng Việt](README.vi.md) | [🇮🇹 Italiano](README.it.md) | [🇸🇦 العربية](README.ar.md) | [🇮🇱 עברית](README.he.md)

---

<div align="center">

<img src="https://d2wq11aau0arks.cloudfront.net/failproof/logo-wordmark.png" alt="failproof ai" width="220" />

[![npm](https://img.shields.io/npm/v/failproofai?style=flat-square&color=CB3837)](https://www.npmjs.com/package/failproofai)
[![CI](https://img.shields.io/github/actions/workflow/status/exospherehost/failproofai/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/exospherehost/failproofai/actions)
[![Slack](https://img.shields.io/badge/Slack-join%20us-4A154B?style=flat-square&logo=slack)](https://join.slack.com/t/failproofai/shared_invite/zt-3v63b7k5e-O3NBHmj8X6n9gZSGDx6ggQ)
[![Docs](https://img.shields.io/badge/docs-befailproof.ai-002CA7?style=flat-square)](https://docs.befailproof.ai)
[![License](https://img.shields.io/badge/license-MIT%20%2B%20Commons%20Clause-blue?style=flat-square)](./LICENSE)

**Çeviriler:** [简体中文](./docs/i18n/README.zh.md) · [日本語](./docs/i18n/README.ja.md) · [한국어](./docs/i18n/README.ko.md) · [Español](./docs/i18n/README.es.md) · [Português](./docs/i18n/README.pt-br.md) · [Deutsch](./docs/i18n/README.de.md) · [Français](./docs/i18n/README.fr.md) · [Русский](./docs/i18n/README.ru.md) · [हिन्दी](./docs/i18n/README.hi.md) · [Türkçe](./docs/i18n/README.tr.md) · [Tiếng Việt](./docs/i18n/README.vi.md) · [Italiano](./docs/i18n/README.it.md) · [العربية](./docs/i18n/README.ar.md) · [עברית](./docs/i18n/README.he.md)

**Kodlama ajanları için çalışma zamanı hata çözümü.**
Claude Code ve Codex ile entegre olur. Sonsuz döngüleri, tehlikeli işlemleri ve gizli anahtarların sızmasını
bunlar olay haline gelmeden önce yakalar. Sıfır gecikme. Yerel olarak çalışır.

</div>

<p align="center">
  <img src="readme-arch-hq.gif" alt="Failproof AI işlemde" width="800" />
</p>

---

## Desteklenen ajan CLİ'leri

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

> Biri veya herhangi bir kombinasyonu için kanca yükleyin: `failproofai policies --install --cli opencode pi gemini` (veya `--cli claude codex copilot cursor opencode pi gemini`). Yüklü CLİ'leri otomatik olarak algılamak ve sorgulamak için `--cli` atlatın.

---

## Kur

```sh
npm install -g failproofai
failproofai policies --install
failproofai
```

30 yerleşik politika hemen etkinleştirilir. Pano `localhost:8020` adresinde bulunur.

---

## Ne durdurur

| Politika | Neleri engeller |
|---|---|
| `block-push-master` | `main` / `master` dizinine doğrudan itme |
| `block-force-push` | `git push --force` |
| `block-work-on-main` | `main` / `master` üzerinde commit, merge, rebase |
| `block-rm-rf` | Özyinelemeli dosya silme |
| `sanitize-api-keys` | API anahtarlarının ajan bağlamına sızması |

→ [Tüm 30 yerleşik politika](https://docs.befailproof.ai/built-in-policies)

---

## Kendi politikalarınız

`.failproofai/policies/` içine dosya bırakın — otomatik olarak yüklenir, bayrak gerekmez.
Commit yapın ve tüm takım bunu sonraki pull'da alır.

```js
import { customPolicies, deny, allow } from "failproofai";

customPolicies.add({
  name: "no-production-writes",
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (ctx.toolInput?.file_path?.includes("production"))
      return deny("Production yollarına yazma işlemleri engellenir.");
    return allow();
  },
});
```

Her politika için mevcut üç karar:

| Karar | Etki |
|---|---|
| `allow()` | İşleme izin ver |
| `deny(message)` | Engelle — mesaj agana geri gider |
| `instruct(message)` | Bunu geçir, ancak ajanın sonraki sorgusuyla bağlam ekle |

→ [Özel politikalar kılavuzu](https://docs.befailproof.ai/custom-policies)

---

## Oturum görünürlüğü

Ajanınızın yaptığı her araç çağrısı yerel olarak kaydedilir. Pano, ne çalıştığını,
neyin engellendiğini ve politikanın agana ne söylediğini gösterir — böylece
bir şey yanlış gittiğinde tahmin yapmaz. → [Pano kılavuzu](https://docs.befailproof.ai/dashboard)

---

## Belgeler

| | |
|---|---|
| [Başlangıç](https://docs.befailproof.ai/getting-started) | Yükleme ve ilk adımlar |
| [Yerleşik Politikalar](https://docs.befailproof.ai/built-in-policies) | Tüm 30 politika parametrelerle |
| [Özel Politikalar](https://docs.befailproof.ai/custom-policies) | Kendi politikalarınızı yazın |
| [Yapılandırma](https://docs.befailproof.ai/configuration) | Yapılandırma kapsamları ve birleştirme kuralları |
| [Pano](https://docs.befailproof.ai/dashboard) | Oturum monitörü ve politika etkinliği |
| [Mimari](https://docs.befailproof.ai/architecture) | Kanca sistemi nasıl çalışır |

---

## Lisans

MIT ve [Commons Clause](https://commonsclause.com/) — dahili ve kişisel kullanım için ücretsiz; failproofai'nin ticari olarak yeniden satılması ayrı bir anlaşma gerektirir. Tam metin için [LICENSE](./LICENSE) dosyasına bakın.

---

## Katkıda bulunma

Bkz. [CONTRIBUTING.md](./CONTRIBUTING.md). Yeni politikalar, kenar durumları ve çeviriler hoş karşılanır.

---

[Nivedit Jain](https://github.com/NiveditJain) ve [Nikita Agarwal](https://github.com/nk-ag) tarafından yapılmıştır.
[befailproof.ai](https://befailproof.ai)
