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

AI ajanlarınızı güvenilir, görev odaklı ve otonom şekilde çalışmasını sağlayan politikaları yönetmenin en kolay yolu - **Claude Code** ve **Agents SDK** için.

- **30 Yerleşik Politika** - Yaygın ajan başarısızlık modlarını hemen tespit edin. Yıkıcı komutları engelleyin, gizli bilgilerin sızmasını önleyin, ajanları proje sınırları içinde tutun, döngüleri tespit edin ve daha fazlası.
- **Özel Politikalar** - JavaScript'te kendi güvenilirlik kurallarınızı yazın. Kuralları zorunlu kılmak, sürüklenmeyi önlemek, işlemleri kontrol etmek veya harici sistemlerle entegre olmak için `allow`/`deny`/`instruct` API'sini kullanın.
- **Kolay Yapılandırma** - Herhangi bir politikayı kod yazmadan ayarlayın. İzin listelerini, korumalı dalları, eşikleri proje başına veya küresel olarak ayarlayın. Üç kapsamlı konfigürasyon otomatik olarak birleştirilir.
- **Ajan İzleyici** - Ajanlarınız uzakta iken ne yaptığını görün. Oturumları göz atın, her araç çağrısını inceleyin ve politikaların tam olarak nerede etkinleştirildiğini gözden geçirin.

Her şey yerel olarak çalışır - hiçbir veri makinenizi terk etmez.

---

## Gereksinimler

- Node.js >= 20.9.0
- Bun >= 1.3.0 (isteğe bağlı - yalnızca geliştirme / kaynaktan oluşturma için gerekli)

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

`~/.claude/settings.json` dosyasına hook girişleri yazar. Claude Code artık her araç çağrısından önce ve sonra failproofai'ı çağıracaktır.

### 2. Pano başlatın

```bash
failproofai
```

`http://localhost:8020` açılır - oturumları göz atın, günlükleri inceleyin, politikaları yönetin.

### 3. Etkin olanları kontrol edin

```bash
failproofai policies
```

---

## Politika kurulumu

### Kapsamlar

| Kapsam | Komut | Nereye yazar |
|--------|-------|-------------|
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

Politika yapılandırması `~/.failproofai/policies-config.json` dosyasında (küresel) veya projenizin `.failproofai/policies-config.json` dosyasında (proje başına) bulunur.

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
      "hint": "sudo olmadan doğrudan apt-get kullanın."
    },
    "block-push-master": {
      "protectedBranches": ["main", "release", "prod"],
      "hint": "Bunun yerine yeni bir dal oluşturmayı deneyin."
    },
    "sanitize-api-keys": {
      "additionalPatterns": [
        { "regex": "myco_[A-Za-z0-9]{32}", "label": "MyCo API anahtarı" }
      ]
    },
    "warn-large-file-write": {
      "thresholdKb": 512
    }
  }
}
```

**Üç konfigürasyon kapsamı** otomatik olarak birleştirilir (proje → yerel → küresel). Tam birleştirme kuralları için bkz. [docs/configuration.mdx](docs/configuration.mdx).

---

## Yerleşik politikalar

| Politika | Açıklama | Yapılandırılabilir |
|----------|----------|:---:|
| `block-sudo` | Ajanları ayrıcalıklı sistem komutlarını çalıştırmaktan engelle | `allowPatterns` |
| `block-rm-rf` | Kazara özyinelemeli dosya silmeyi engelle | `allowPaths` |
| `block-curl-pipe-sh` | Ajanları güvenilmeyen betikleri kabuğa yöneltmekten engelle | |
| `block-failproofai-commands` | Kendi kaldırılmasını engelle | |
| `sanitize-jwt` | JWT belirteçlerinin ajan bağlamına sızmasını durdur | |
| `sanitize-api-keys` | API anahtarlarının ajan bağlamına sızmasını durdur | `additionalPatterns` |
| `sanitize-connection-strings` | Veritabanı kimlik bilgilerinin ajan bağlamına sızmasını durdur | |
| `sanitize-private-key-content` | Çıktıdan PEM özel anahtar bloklarını gizle | |
| `sanitize-bearer-tokens` | Authorization Bearer belirteçlerini çıktıdan gizle | |
| `block-env-files` | Ajanları .env dosyalarını okumaktan engelle | |
| `protect-env-vars` | Ajanları ortam değişkenlerini yazdırmaktan engelle | |
| `block-read-outside-cwd` | Ajanları proje sınırları içinde tut | `allowPaths` |
| `block-secrets-write` | Özel anahtar ve sertifika dosyalarına yazmaları engelle | `additionalPatterns` |
| `block-push-master` | main/master'a kazara yapılan gönderişleri engelle | `protectedBranches` |
| `block-work-on-main` | Ajanları korumalı dallardan uzak tut | `protectedBranches` |
| `block-force-push` | `git push --force` komutunu engelle | |
| `warn-git-amend` | Ajanları commit'leri düzenlemeden önce uyar | |
| `warn-git-stash-drop` | Ajanları stash'leri bırakmadan önce uyar | |
| `warn-all-files-staged` | Kazara `git add -A` komutunu yakala | |
| `warn-destructive-sql` | DROP/DELETE SQL'i yürütülmeden önce yakala | |
| `warn-schema-alteration` | ALTER TABLE'ı yürütülmeden önce yakala | |
| `warn-large-file-write` | Beklenmedik şekilde büyük dosya yazmaları yakala | `thresholdKb` |
| `warn-package-publish` | Kazara `npm publish` komutunu yakala | |
| `warn-background-process` | Istenmeyen arka plan işlemi başlatmalarını yakala | |
| `warn-global-package-install` | Istenmeyen küresel paket yüklemelerini yakala | |
| …ve daha fazlası | | |

Tam politika ayrıntıları ve parametre referansı: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## Özel politikalar

Ajanlarınızı güvenilir ve görev odaklı tutmak için kendi politikalarınızı yazın:

```js
import { customPolicies, allow, deny, instruct } from "failproofai";

customPolicies.add({
  name: "no-production-writes",
  description: "'production' içeren yollara yazmaları engelle",
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (!["Write", "Edit"].includes(ctx.toolName ?? "")) return allow();
    const path = ctx.toolInput?.file_path ?? "";
    if (path.includes("production")) return deny("Production yollarına yazma işlemleri engellendi");
    return allow();
  },
});
```

Şu komutla kurun:

```bash
failproofai policies --install --custom ./my-policies.js
```

### Karar yardımcıları

| İşlev | Etki |
|-------|------|
| `allow()` | İşleme izin ver |
| `allow(message)` | İzin ver ve bilgilendirici bağlam Claude'a gönder *(beta)* |
| `deny(message)` | İşlemi engelle; ileti Claude'a gösterilir |
| `instruct(message)` | Claude'un istemine bağlam ekle; engelleme yapmaz |

### Bağlam nesnesi (`ctx`)

| Alan | Tür | Açıklama |
|------|-----|---------|
| `eventType` | `string` | `"PreToolUse"`, `"PostToolUse"`, `"Notification"`, `"Stop"` |
| `toolName` | `string` | Çağrılan araç (`"Bash"`, `"Write"`, `"Read"`, …) |
| `toolInput` | `object` | Aracın giriş parametreleri |
| `payload` | `object` | Tam ham olay yükü |
| `session.cwd` | `string` | Claude Code oturumunun çalışma dizini |
| `session.sessionId` | `string` | Oturum tanımlayıcısı |
| `session.transcriptPath` | `string` | Oturum transkript dosyasının yolu |

Özel hooklar geçişli yerel içe aktarmaları, async/await'i ve `process.env` erişimini destekler. Hatalar açık başarısızlık modunda yapılır (günlüklenir: `~/.failproofai/hook.log`, yerleşik politikalar devam eder). Tam rehber için bkz. [docs/custom-hooks.mdx](docs/custom-hooks.mdx).

### Kural tabanlı politikalar (v0.0.2-beta.7+)

`*policies.{js,mjs,ts}` dosyalarını `.failproofai/policies/` klasörüne bırakın ve otomatik olarak yüklenir — `--custom` bayrağı veya yapılandırma değişiklikleri gerekmez. Git hook'ları gibi çalışır: bir dosya bırakın, her şey çalışır.

```text
# Proje seviyesi — git'e yürütülen, takım ile paylaşılır
.failproofai/policies/security-policies.mjs
.failproofai/policies/workflow-policies.mjs

# Kullanıcı seviyesi — kişisel, tüm projelere uygulanır
~/.failproofai/policies/my-policies.mjs
```

Her iki seviye de yüklenir (birleşim). Dosyalar her dizin içinde alfabetik olarak yüklenir. Sırayı kontrol etmek için `01-`, `02-`, vb. ile ön ek ekleyin. Hazır kullanılabilir örnekler için bkz. [examples/convention-policies/](examples/convention-policies/).

---

## Telemetri

Failproof AI, özellik kullanımını anlamak için PostHog aracılığıyla anonim kullanım telemetrisi toplar. Oturum içeriği, dosya adları, araç girdileri veya kişisel bilgiler hiçbir zaman gönderilmez.

Devre dışı bırakmak için:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## Belgeler

| Rehber | Açıklama |
|--------|----------|
| [Başlangıç](docs/getting-started.mdx) | Kurulum ve ilk adımlar |
| [Yerleşik Politikalar](docs/built-in-policies.mdx) | 30 yerleşik politikanın tümü parametrelerle birlikte |
| [Özel Politikalar](docs/custom-policies.mdx) | Kendi politikalarınızı yazın |
| [Yapılandırma](docs/configuration.mdx) | Konfigürasyon dosyası biçimi ve kapsam birleştirme |
| [Pano](docs/dashboard.mdx) | Oturumları izleyin ve politika etkinliğini gözden geçirin |
| [Mimari](docs/architecture.mdx) | Hook sistemi nasıl çalışır |
| [Test Etme](docs/testing.mdx) | Testleri çalıştırın ve yenilerini yazın |

### Belgeleri yerel olarak çalıştırın

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

Mintlify belgeler sitesini `http://localhost:3000` adresinde açar. Belgeler dizinini bağlarsanız kapsayıcı değişiklikleri izler:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## failproofai katkıda bulunanları için not

Bu deponun `.claude/settings.json` dosyası standart `npx -y failproofai` komutu yerine `bun ./bin/failproofai.mjs --hook <EventType>` komutunu kullanır. Bunun nedeni, failproofai projesi içinde `npx -y failproofai` çalıştırmanın kendi kendine referans çatışması oluşturmasıdır.

Diğer tüm depolar için önerilen yaklaşım `npx -y failproofai` komutudur ve şu şekilde yüklenir:

```bash
failproofai policies --install --scope project
```

## Katkıda bulunun

Bkz. [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Lisans

Bkz. [LICENSE](LICENSE).

---

**ExosphereHost: Ajanlarınız için Güvenilirlik Araştırması Laboratuvarı** tarafından inşa edilmiş ve sürdürülmektedir. Ajanlarımız, yazılımımız ve uzmanlığımız aracılığıyla kuruluşların ve startupların AI ajanlarının güvenilirliğini artırmasına yardımcı oluyoruz. [exosphere.host](https://exosphere.host) adresinde daha fazla bilgi edinin.
```
