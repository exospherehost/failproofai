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

AI ajanlarınızı güvenilir, odaklı ve otonom biçimde çalışır hâlde tutan politikaları yönetmenin en kolay yolu - **Claude Code** ve **Agents SDK** için.

- **30 Yerleşik Politika** - Yaygın ajan arıza modlarını kutudan çıkar çıkmaz yakalayın. Yıkıcı komutları engelleyin, gizli bilgi sızıntısını önleyin, ajanları proje sınırları içinde tutun, döngüleri tespit edin ve daha fazlasını yapın.
- **Özel Politikalar** - Kendi güvenilirlik kurallarınızı JavaScript ile yazın. Kurallara uymayı zorlamak, kaymaları önlemek, işlemleri kapılamak veya harici sistemlerle entegre olmak için `allow`/`deny`/`instruct` API'sini kullanın.
- **Kolay Yapılandırma** - Kod yazmadan her politikayı ayarlayın. İzin listelerini, korunan dalları ve eşikleri proje bazında ya da küresel olarak belirleyin. Üç kapsamlı yapılandırma otomatik olarak birleştirilir.
- **Ajan İzleme** - Siz yokken ajanlarınızın neler yaptığını görün. Oturumları inceleyin, her araç çağrısını gözden geçirin ve politikaların tam olarak nerede devreye girdiğini görün.

Her şey yerel olarak çalışır - hiçbir veri makinenizden çıkmaz.

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

### 1. Politikaları küresel olarak etkinleştirin

```bash
failproofai policies --install
```

`~/.claude/settings.json` dosyasına hook girişleri yazar. Claude Code artık her araç çağrısından önce ve sonra failproofai'yi çağıracaktır.

### 2. Panoyu başlatın

```bash
failproofai
```

`http://localhost:8020` adresini açar - oturumları inceleyin, günlükleri gözden geçirin, politikaları yönetin.

### 3. Aktif olanları kontrol edin

```bash
failproofai policies
```

---

## Politika kurulumu

### Kapsamlar

| Kapsam | Komut | Nereye yazar |
|--------|-------|--------------|
| Küresel (varsayılan) | `failproofai policies --install` | `~/.claude/settings.json` |
| Proje | `failproofai policies --install --scope project` | `.claude/settings.json` |
| Yerel | `failproofai policies --install --scope local` | `.claude/settings.local.json` |

### Belirli politikaları yükleyin

```bash
failproofai policies --install block-sudo block-rm-rf sanitize-api-keys
```

### Politikaları kaldırın

```bash
failproofai policies --uninstall
# veya belirli bir kapsam için:
failproofai policies --uninstall --scope project
```

---

## Yapılandırma

Politika yapılandırması `~/.failproofai/policies-config.json` (küresel) veya projenizde `.failproofai/policies-config.json` (proje bazında) dosyasında bulunur.

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

**Üç yapılandırma kapsamı** otomatik olarak birleştirilir (proje → yerel → küresel). Tam birleştirme kuralları için bkz. [docs/configuration.mdx](docs/configuration.mdx).

---

## Yerleşik politikalar

| Politika | Açıklama | Yapılandırılabilir |
|----------|----------|--------------------|
| `block-sudo` | Ajanların yetkili sistem komutları çalıştırmasını engeller | `allowPatterns` |
| `block-rm-rf` | Yanlışlıkla yinelemeli dosya silmeyi önler | `allowPaths` |
| `block-curl-pipe-sh` | Ajanların güvenilmeyen betikleri shell'e aktarmasını engeller | |
| `block-failproofai-commands` | Kendi kendini kaldırmayı engeller | |
| `sanitize-jwt` | JWT tokenlarının ajan bağlamına sızmasını durdurur | |
| `sanitize-api-keys` | API anahtarlarının ajan bağlamına sızmasını durdurur | `additionalPatterns` |
| `sanitize-connection-strings` | Veritabanı kimlik bilgilerinin ajan bağlamına sızmasını durdurur | |
| `sanitize-private-key-content` | PEM özel anahtar bloklarını çıktıdan sansürler | |
| `sanitize-bearer-tokens` | Authorization Bearer tokenlarını çıktıdan sansürler | |
| `block-env-files` | Ajanların .env dosyalarını okumasını engeller | |
| `protect-env-vars` | Ajanların ortam değişkenlerini yazdırmasını önler | |
| `block-read-outside-cwd` | Ajanları proje sınırları içinde tutar | `allowPaths` |
| `block-secrets-write` | Özel anahtar ve sertifika dosyalarına yazmayı engeller | `additionalPatterns` |
| `block-push-master` | Ana/master dalına yanlışlıkla push yapılmasını önler | `protectedBranches` |
| `block-work-on-main` | Ajanları korunan dallardan uzak tutar | `protectedBranches` |
| `block-force-push` | `git push --force` komutunu engeller | |
| `warn-git-amend` | Commit değişikliği yapılmadan önce ajanları uyarır | |
| `warn-git-stash-drop` | Stash silinmeden önce ajanları uyarır | |
| `warn-all-files-staged` | Yanlışlıkla `git add -A` yapılmasını yakalar | |
| `warn-destructive-sql` | Çalıştırılmadan önce DROP/DELETE SQL komutlarını yakalar | |
| `warn-schema-alteration` | Çalıştırılmadan önce ALTER TABLE komutlarını yakalar | |
| `warn-large-file-write` | Beklenmedik büyük dosya yazmalarını yakalar | `thresholdKb` |
| `warn-package-publish` | Yanlışlıkla `npm publish` yapılmasını yakalar | |
| `warn-background-process` | Kasıtsız arka plan süreç başlatmalarını yakalar | |
| `warn-global-package-install` | Kasıtsız küresel paket kurulumlarını yakalar | |
| …ve daha fazlası | | |

Tüm politika ayrıntıları ve parametre referansı: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## Özel politikalar

Ajanları güvenilir ve odaklı tutmak için kendi politikalarınızı yazın:

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

Şununla yükleyin:

```bash
failproofai policies --install --custom ./my-policies.js
```

### Karar yardımcıları

| Fonksiyon | Etki |
|-----------|------|
| `allow()` | İşleme izin verir |
| `allow(message)` | İzin verir ve Claude'a bilgilendirici bağlam gönderir *(beta)* |
| `deny(message)` | İşlemi engeller; mesaj Claude'a gösterilir |
| `instruct(message)` | Claude'un istemine bağlam ekler; engellemez |

### Bağlam nesnesi (`ctx`)

| Alan | Tür | Açıklama |
|------|-----|----------|
| `eventType` | `string` | `"PreToolUse"`, `"PostToolUse"`, `"Notification"`, `"Stop"` |
| `toolName` | `string` | Çağrılan araç (`"Bash"`, `"Write"`, `"Read"`, …) |
| `toolInput` | `object` | Aracın giriş parametreleri |
| `payload` | `object` | Ham olay yükünün tamamı |
| `session.cwd` | `string` | Claude Code oturumunun çalışma dizini |
| `session.sessionId` | `string` | Oturum tanımlayıcısı |
| `session.transcriptPath` | `string` | Oturum deşifre dosyasının yolu |

Özel hooklar, geçişli yerel içe aktarmaları, async/await'i ve `process.env`'e erişimi destekler. Hatalar açık başarısız olur (günlüğe `~/.failproofai/hook.log` dosyasına kaydedilir, yerleşik politikalar çalışmaya devam eder). Tam kılavuz için bkz. [docs/custom-hooks.mdx](docs/custom-hooks.mdx).

---

## Telemetri

Failproof AI, özellik kullanımını anlamak amacıyla PostHog aracılığıyla anonim kullanım telemetrisi toplar. Oturum içeriği, dosya adları, araç girdileri veya kişisel bilgiler hiçbir zaman gönderilmez.

Devre dışı bırakmak için:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## Belgeler

| Kılavuz | Açıklama |
|---------|----------|
| [Başlarken](docs/getting-started.mdx) | Kurulum ve ilk adımlar |
| [Yerleşik Politikalar](docs/built-in-policies.mdx) | Parametrelerle birlikte 30 yerleşik politikanın tamamı |
| [Özel Politikalar](docs/custom-policies.mdx) | Kendi politikalarınızı yazın |
| [Yapılandırma](docs/configuration.mdx) | Yapılandırma dosyası biçimi ve kapsam birleştirme |
| [Pano](docs/dashboard.mdx) | Oturumları izleyin ve politika etkinliğini gözden geçirin |
| [Mimari](docs/architecture.mdx) | Hook sistemi nasıl çalışır |
| [Test](docs/testing.mdx) | Testleri çalıştırma ve yeni testler yazma |

### Belgeleri yerel olarak çalıştırın

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

Mintlify belge sitesini `http://localhost:3000` adresinde açar. Docs dizinini bağlarsanız konteyner değişiklikleri izler:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## Katkıda Bulunma

Bkz. [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Lisans

Bkz. [LICENSE](LICENSE).
