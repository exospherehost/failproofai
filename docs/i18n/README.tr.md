> **⚠️** This is an auto-generated translation. For the latest version, see the [English README](../../README.md). Community corrections welcome!

[🇺🇸 English](../../README.md) | [🇨🇳 简体中文](README.zh.md) | [🇯🇵 日本語](README.ja.md) | [🇰🇷 한국어](README.ko.md) | [🇪🇸 Español](README.es.md) | [🇧🇷 Português](README.pt-br.md) | [🇩🇪 Deutsch](README.de.md) | [🇫🇷 Français](README.fr.md) | [🇷🇺 Русский](README.ru.md) | [🇮🇳 हिन्दी](README.hi.md) | **🇹🇷 Türkçe** | [🇻🇳 Tiếng Việt](README.vi.md) | [🇮🇹 Italiano](README.it.md) | [🇸🇦 العربية](README.ar.md) | [🇮🇱 עברית](README.he.md)

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

**Çeviriler**: [简体中文](docs/i18n/README.zh.md) | [日本語](docs/i18n/README.ja.md) | [한국어](docs/i18n/README.ko.md) | [Español](docs/i18n/README.es.md) | [Português](docs/i18n/README.pt-br.md) | [Deutsch](docs/i18n/README.de.md) | [Français](docs/i18n/README.fr.md) | [Русский](docs/i18n/README.ru.md) | [हिन्दी](docs/i18n/README.hi.md) | [Türkçe](docs/i18n/README.tr.md) | [Tiếng Việt](docs/i18n/README.vi.md) | [Italiano](docs/i18n/README.it.md) | [العربية](docs/i18n/README.ar.md) | [עברית](docs/i18n/README.he.md)

AI ajantslarınızı güvenilir, odaklanmış ve özerk bir şekilde çalıştırmak için politikaları yönetmenin en kolay yolu - **Claude Code**, **OpenAI Codex** & **Agents SDK** için.

<p align="center">
  <img src="failproofai-hq.gif" alt="Failproof AI işlemde" width="800" />
</p>

## Desteklenen ajan CLI'ları

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
  <strong>+ daha fazlası yakında</strong>
</p>

> Hooku bir veya her ikisine de yükleyin: `failproofai policies --install --cli codex` (veya `--cli claude codex`). Kurulu CLI'ları otomatik algılamak ve sorulmak için `--cli` atla.

- **39 Yerleşik Politika** - Yaygın ajan hata modlarını anında yakalayın. Yıkıcı komutları engelle, gizli sızıntılarını önle, ajanları proje sınırları içinde tut, döngüleri algıla ve daha fazlası.
- **Özel Politikalar** - JavaScript'te kendi güvenilirlik kurallarınızı yazın. İçerik standartlarını zorlamak, sapmayı önlemek, işlemleri geçitmek veya dış sistemlerle entegrasyonu sağlamak için `allow`/`deny`/`instruct` API'sini kullanın.
- **Kolay Yapılandırma** - Herhangi bir politikayı kod yazmadan ayarlayın. İzin listelerini, korunan dalları, eşikleri proje başına veya global olarak belirleyin. Üç kapsam yapılandırması otomatik olarak birleşir.
- **Ajan İzleyici** - Ajanlarınız yokken ne yaptığını görün. Oturumları tarayın, her araç çağrısını inceleyin ve politikaların nerede ateşlendiğini tam olarak gözden geçirin.

Her şey yerel olarak çalışır - hiçbir veri makinenizi terk etmez.

---

## Gereksinimler

- Node.js >= 20.9.0
- Bun >= 1.3.0 (isteğe bağlı - yalnızca geliştirme / kaynaktan derleme için gereklidir)

---

## Kurulum

```bash
npm install -g failproofai
# veya
bun add -g failproofai
```

---

## Hızlı başlangıç

### 1. Politikaları global olarak etkinleştir

```bash
failproofai policies --install
```

`~/.claude/settings.json` dosyasına kanca girdileri yazar. Claude Code artık her araç çağrısından önce ve sonra failproofai'yi çağıracaktır.

### 2. Panoyu başlat

```bash
failproofai
```

`http://localhost:8020` açılır - oturumları tarayın, günlükleri inceleyin, politikaları yönetin.

### 3. Aktivin ne olduğunu kontrol et

```bash
failproofai policies
```

---

## Politika kurulumu

### Kapsamlar

| Kapsam | Komut | Nereye Yazar |
|-------|---------|-----------------|
| Global (varsayılan) | `failproofai policies --install` | `~/.claude/settings.json` |
| Proje | `failproofai policies --install --scope project` | `.claude/settings.json` |
| Yerel | `failproofai policies --install --scope local` | `.claude/settings.local.json` |

### Belirli politikaları yükle

```bash
failproofai policies --install block-sudo block-rm-rf sanitize-api-keys
```

### Politikaları kaldır

```bash
failproofai policies --uninstall
# veya belirli bir kapsam için:
failproofai policies --uninstall --scope project
```

---

## Yapılandırma

Politika yapılandırması `~/.failproofai/policies-config.json` (global) dosyasında veya projenizin `.failproofai/policies-config.json` dosyasında (proje başına) yer alır.

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
      "hint": "sudo olmadan apt-get'i doğrudan kullanın."
    },
    "block-push-master": {
      "protectedBranches": ["main", "release", "prod"],
      "hint": "Bunun yerine yeni bir dal oluşturmaya çalışın."
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

**Üç yapılandırma kapsamı** otomatik olarak birleştirilir (proje → yerel → global). Tam birleştirme kuralları için [docs/configuration.mdx](docs/configuration.mdx) bölümüne bakın.

---

## Yerleşik politikalar

| Politika | Açıklama | Yapılandırılabilir |
|--------|-------------|:---:|
| `block-sudo` | Ajanları ayrıcalıklı sistem komutlarını çalıştırmaktan engelle | `allowPatterns` |
| `block-rm-rf` | Yanlışlıkla yapılan özyinelemeli dosya silmeyi engelle | `allowPaths` |
| `block-curl-pipe-sh` | Ajanları güvenilmeyen betikleri shell'e yöneltmekten engelle | |
| `block-failproofai-commands` | Kendi kendini kaldırmayı engelle | |
| `sanitize-jwt` | JWT token'larının ajan bağlamına sızmasını durdur | |
| `sanitize-api-keys` | API anahtarlarının ajan bağlamına sızmasını durdur | `additionalPatterns` |
| `sanitize-connection-strings` | Veritabanı kimlik bilgilerinin ajan bağlamına sızmasını durdur | |
| `sanitize-private-key-content` | Çıktıdan PEM özel anahtar bloklarını kapat | |
| `sanitize-bearer-tokens` | Çıktıdan Authorization Bearer token'larını kapat | |
| `block-env-files` | Ajanları .env dosyalarını okumaktan tutup | |
| `protect-env-vars` | Ajanları ortam değişkenlerini yazdırmaktan engelle | |
| `block-read-outside-cwd` | Ajanları proje sınırları içinde tut | `allowPaths` |
| `block-secrets-write` | Özel anahtar ve sertifika dosyalarına yazmaları engelle | `additionalPatterns` |
| `block-push-master` | Yanlışlıkla ana/master'a basılmayı engelle | `protectedBranches` |
| `block-work-on-main` | Ajanları korunan dallardan uzak tut | `protectedBranches` |
| `block-force-push` | `git push --force` komutunu engelle | |
| `warn-git-amend` | Commit'leri değiştirmeden önce ajanları hatırla | |
| `warn-git-stash-drop` | Stash'leri bırakmadan önce ajanları hatırla | |
| `warn-all-files-staged` | Yanlışlıkla yapılan `git add -A` komutunu yakala | |
| `warn-destructive-sql` | Yürütülmeden önce DROP/DELETE SQL'ini yakala | |
| `warn-schema-alteration` | Yürütülmeden önce ALTER TABLE'ı yakala | |
| `warn-large-file-write` | Beklenmedik derecede büyük dosya yazma işlemlerini yakala | `thresholdKb` |
| `warn-package-publish` | Yanlışlıkla yapılan `npm publish` komutunu yakala | |
| `warn-background-process` | Amaçsız arka plan süreci başlatmalarını yakala | |
| `warn-global-package-install` | Amaçsız global paket kurulumlarını yakala | |
| …ve daha fazlası | | |

Tam politika detayları ve parametre referansı: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## Özel politikalar

Ajanları güvenilir ve odaklanmış tutmak için kendi politikalarınızı yazın:

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

Şu komutu kullanarak yükleyin:

```bash
failproofai policies --install --custom ./my-policies.js
```

### Karar yardımcıları

| Fonksiyon | Etki |
|----------|--------|
| `allow()` | İşleme izin ver |
| `allow(message)` | İşleme izin ver ve Claude'a bilgi bağlamı gönder |
| `deny(message)` | İşlemi engelle; mesaj Claude'a gösterilir |
| `instruct(message)` | Claude'un hızlı sömürgüsüne bağlam ekle; engellemez |

### Bağlam nesnesi (`ctx`)

| Alan | Tür | Açıklama |
|------|------|-------------|
| `eventType` | `string` | `"PreToolUse"`, `"PostToolUse"`, `"Notification"`, `"Stop"` |
| `toolName` | `string` | Çağrılan araç (`"Bash"`, `"Write"`, `"Read"`, …) |
| `toolInput` | `object` | Aracın giriş parametreleri |
| `payload` | `object` | Tam ham olay yükü |
| `session.cwd` | `string` | Claude Code oturumunun çalışma dizini |
| `session.sessionId` | `string` | Oturum tanımlayıcısı |
| `session.transcriptPath` | `string` | Oturum transkript dosyasının yolu |

Özel kancalar geçişli yerel içe aktarmaları, async/await'i ve `process.env` erişimini destekler. Hatalar açık başarısız duruma geçer (günlüğe `~/.failproofai/hook.log` dosyasına kaydedilir, yerleşik politikalar devam eder). Tam rehber için [docs/custom-hooks.mdx](docs/custom-hooks.mdx) bölümüne bakın.

### Kural tabanlı politikalar

`*policies.{js,mjs,ts}` dosyalarını `.failproofai/policies/` dizinine bırakın ve bunlar otomatik olarak yüklenir — bayrak veya yapılandırma değişikliğine gerek yoktur. Dizini git'e commit edin ve her ekip üyesi aynı kalite standartlarını otomatik olarak alır.

```text
# Proje seviyesi — git'e commit edilir, takım ile paylaşılır
.failproofai/policies/security-policies.mjs
.failproofai/policies/workflow-policies.mjs

# Kullanıcı seviyesi — kişisel, tüm projeler için geçerlidir
~/.failproofai/policies/my-policies.mjs
```

Her iki seviye de yüklenir (birleşim). Dosyalar her dizin içinde alfabetik olarak yüklenir. Sırayı kontrol etmek için `01-`, `02-` vb. ile ön ek ekleyin. Takımınız yeni hata modlarını keşfettikçe, bir politika ekleyin ve gönderin — herkes sonraki pull'larında güncellemeleri alır. Kullanıma hazır örnekler için [examples/convention-policies/](examples/convention-policies/) bölümüne bakın.

---

## Telemetri

Failproof AI, PostHog aracılığıyla özellik kullanımını anlamak için anonim kullanım telemetrisi toplar. Hiçbir oturum içeriği, dosya adı, araç girişi veya kişisel bilgi asla gönderilmez.

Devre dışı bırak:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## Dokümantasyon

| Rehber | Açıklama |
|-------|-------------|
| [Başlarken](docs/getting-started.mdx) | Kurulum ve ilk adımlar |
| [Yerleşik Politikalar](docs/built-in-policies.mdx) | Parametreli tüm 39 yerleşik politika |
| [Özel Politikalar](docs/custom-policies.mdx) | Kendi politikalarınızı yazın |
| [Yapılandırma](docs/configuration.mdx) | Yapılandırma dosyası formatı ve kapsam birleştirme |
| [Pano](docs/dashboard.mdx) | Oturumları izle ve politika aktivitesini gözden geçir |
| [Mimari](docs/architecture.mdx) | Kanca sistemi nasıl çalışır |
| [Test Etme](docs/testing.mdx) | Testleri çalıştır ve yeni olanlar yaz |

### Docs'u yerel olarak çalıştır

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

Mintlify docs sitesini `http://localhost:3000` adresinde açar. Docs dizinini monte ederseniz kapsayıcı değişiklikleri izler:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## failproofai katılımcıları için not

Bu repo'nun `.claude/settings.json` dosyası, standart `npx -y failproofai` komutu yerine `bun ./bin/failproofai.mjs --hook <EventType>` komutunu kullanır. Bunun sebebi, failproofai projesi içinde `npx -y failproofai` komutu çalıştırmanın kendine referans veren bir çatışma yaratmasıdır.

Diğer tüm repo'lar için önerilen yaklaşım `npx -y failproofai` olup, şu şekilde yüklenir:

```bash
failproofai policies --install --scope project
```

## Katkıda Bulunma

[CONTRIBUTING.md](CONTRIBUTING.md) bölümüne bakın.

---

## Lisans

[LICENSE](LICENSE) bölümüne bakın.

---

**ExosphereHost: Ajanlarınız İçin Güvenilirlik Araştırma Laboratuvarı** tarafından yapılmış ve bakımı yapılmaktadır. Kurumsal ve startup'ların kendi ajanları, yazılımları ve uzmanlığı aracılığıyla AI ajanlarının güvenilirliğini geliştirmelerine yardımcı oluyoruz. [exosphere.host](https://exosphere.host) adresinde daha fazla bilgi edinin.
```
