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

AI aracılarınızı güvenilir, odaklanmış ve otonom olarak çalıştıran politikaları yönetmenin en kolay yolu - **Claude Code**, **OpenAI Codex**, **GitHub Copilot CLI** _(beta)_ ve **Agents SDK** için.

<p align="center">
  <img src="failproofai-hq.gif" alt="Failproof AI çalışırken" width="800" />
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
  <a href="https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/use-hooks" title="GitHub Copilot CLI">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="assets/logos/copilot-dark.svg" />
      <img src="assets/logos/copilot-light.svg" alt="GitHub Copilot" width="64" height="64" />
    </picture>
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <strong>+ yakında daha fazlası</strong>
</p>

> Bir, iki veya üçünün tümüne kancalar yükleyin: `failproofai policies --install --cli copilot` (veya `--cli claude codex copilot`). Yüklü CLI'ları otomatik olarak algılamak ve sorulmak için `--cli` kullanmayın. **GitHub Copilot CLI desteği beta aşamasındadır.**

- **39 Yerleşik Politika** - Kutudan çıkar çıkmaz yaygın ajan başarısızlık modlarını yakala. Yıkıcı komutları engelle, gizli kaçışını önle, ajanları proje sınırları içinde tut, döngüleri tespit et ve daha fazlasını yap.
- **Özel Politikalar** - JavaScript'te kendi güvenilirlik kurallarını yaz. Kuralları uygula, sürüklemeyi önle, işlemleri kapat veya harici sistemlerle entegre olmak için `allow`/`deny`/`instruct` API'sini kullan.
- **Kolay Yapılandırma** - Kod yazmadan herhangi bir politikayı ayarla. İzin listeleri, korumalı dallar, eşik değerlerini proje başına veya genel olarak ayarla. Üç kapsamlı yapılandırma otomatik olarak birleşir.
- **Ajan İzleme** - Ajanlarının seni yokken ne yaptığını gör. Oturumları gözat, her araç çağrısını incele ve politikaların tam olarak nerede çalıştığını gözden geçir.

Her şey yerel olarak çalışır - verileriniz makinenizi terk etmez.

---

## Gereksinimler

- Node.js >= 20.9.0
- Bun >= 1.3.0 (isteğe bağlı - yalnızca geliştirme / kaynaktan derleme için gerekli)

---

## Yükle

```bash
npm install -g failproofai
# veya
bun add -g failproofai
```

---

## Hızlı başlangıç

### 1. Politikaları genel olarak etkinleştir

```bash
failproofai policies --install
```

`~/.claude/settings.json` içine kanca girdileri yazar. Claude Code artık her araç çağrısından önce ve sonra failproofai'yi çağıracak.

### 2. Paneli başlat

```bash
failproofai
```

`http://localhost:8020` açar - oturumları gözat, günlükleri incele, politikaları yönet.

### 3. Nelerin etkin olduğunu kontrol et

```bash
failproofai policies
```

---

## Politika kurulumu

### Kapsamlar

| Kapsam | Komut | Nereye yazar |
|-------|-------|-------------|
| Genel (varsayılan) | `failproofai policies --install` | `~/.claude/settings.json` |
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

Politika yapılandırması `~/.failproofai/policies-config.json` (genel) veya proje içi `.failproofai/policies-config.json` adresinde bulunur.

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
      "hint": "sudo olmadan apt-get'i doğrudan kullan."
    },
    "block-push-master": {
      "protectedBranches": ["main", "release", "prod"],
      "hint": "Bunun yerine yeni bir dal oluşturmayı dene."
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

**Üç yapılandırma kapsamı** otomatik olarak birleştirilir (proje → yerel → genel). Tam birleştirme kuralları için [docs/configuration.mdx](docs/configuration.mdx) bkz.

---

## Yerleşik politikalar

| Politika | Açıklama | Yapılandırılabilir |
|---------|---------|:---:|
| `block-sudo` | Ajanları ayrıcalıklı sistem komutlarını çalıştırmaktan engelle | `allowPatterns` |
| `block-rm-rf` | Yanlışlıkla yapılan özyinelemeli dosya silmeyi engelle | `allowPaths` |
| `block-curl-pipe-sh` | Ajanları güvenilmeyen betikleri kabuğa yönlendirmekten engelle | |
| `block-failproofai-commands` | Kendi kaldırılmasını engelle | |
| `sanitize-jwt` | JWT belirteçlerinin ajan bağlamına sızmasını durdur | |
| `sanitize-api-keys` | API anahtarlarının ajan bağlamına sızmasını durdur | `additionalPatterns` |
| `sanitize-connection-strings` | Veritabanı kimlik bilgilerinin ajan bağlamına sızmasını durdur | |
| `sanitize-private-key-content` | Çıktıdan PEM özel anahtar bloklarını gizle | |
| `sanitize-bearer-tokens` | Çıktıdan Authorization Bearer belirteçlerini gizle | |
| `block-env-files` | Ajanları .env dosyalarını okumaktan engelle | |
| `protect-env-vars` | Ajanları ortam değişkenlerini yazdırmaktan engelle | |
| `block-read-outside-cwd` | Ajanları proje sınırları içinde tut | `allowPaths` |
| `block-secrets-write` | Özel anahtar ve sertifika dosyalarına yazılışları engelle | `additionalPatterns` |
| `block-push-master` | Ana/master dalına yanlışlıkla yapılan gönderimleri engelle | `protectedBranches` |
| `block-work-on-main` | Ajanları korumalı dallardan uzak tut | `protectedBranches` |
| `block-force-push` | `git push --force` komutunu engelle | |
| `warn-git-amend` | Ajanları taahhütleri değiştirmeden önce uyar | |
| `warn-git-stash-drop` | Ajanları stash'i bırakmadan önce uyar | |
| `warn-all-files-staged` | Yanlışlıkla yapılan `git add -A` komutunu yakala | |
| `warn-destructive-sql` | DROP/DELETE SQL komutlarını yürütülmeden önce yakala | |
| `warn-schema-alteration` | ALTER TABLE komutlarını yürütülmeden önce yakala | |
| `warn-large-file-write` | Beklenmedik şekilde büyük dosya yazışlarını yakala | `thresholdKb` |
| `warn-package-publish` | Yanlışlıkla yapılan `npm publish` komutunu yakala | |
| `warn-background-process` | Amaçlanan olmayan arka plan işlem başlatmalarını yakala | |
| `warn-global-package-install` | Amaçlanan olmayan genel paket kurulumlarını yakala | |
| …ve daha fazlası | | |

Tam politika detayları ve parametre referansı: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## Özel politikalar

Ajanları güvenilir ve odaklanmış tutmak için kendi politikalarını yaz:

```js
import { customPolicies, allow, deny, instruct } from "failproofai";

customPolicies.add({
  name: "no-production-writes",
  description: "'production' içeren yollara yazışları engelle",
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (!["Write", "Edit"].includes(ctx.toolName ?? "")) return allow();
    const path = ctx.toolInput?.file_path ?? "";
    if (path.includes("production")) return deny("Production yollarına yazışlar engellendi");
    return allow();
  },
});
```

Yükle:

```bash
failproofai policies --install --custom ./my-policies.js
```

### Karar yardımcıları

| Fonksiyon | Etki |
|-----------|------|
| `allow()` | İşleme izin ver |
| `allow(message)` | İşleme izin ver ve Claude'a bilgilendirici bağlam gönder |
| `deny(message)` | İşlemi engelle; ileti Claude'a gösterilir |
| `instruct(message)` | Claude'un istemi için bağlam ekle; engelleme yapma |

### Bağlam nesnesi (`ctx`)

| Alan | Tür | Açıklama |
|------|-----|---------|
| `eventType` | `string` | `"PreToolUse"`, `"PostToolUse"`, `"Notification"`, `"Stop"` |
| `toolName` | `string` | Çağrılan araç (`"Bash"`, `"Write"`, `"Read"`, …) |
| `toolInput` | `object` | Aracın giriş parametreleri |
| `payload` | `object` | Tam ham olay verisi |
| `session.cwd` | `string` | Claude Code oturumunun çalışma dizini |
| `session.sessionId` | `string` | Oturum tanımlayıcısı |
| `session.transcriptPath` | `string` | Oturum transkripti dosyasının yolu |

Özel kancalar geçişli yerel içeri aktarmaları, async/await'i ve `process.env` erişimini destekler. Hatalar açık başarısız olur (günlüğe `~/.failproofai/hook.log` dosyasına kaydedilir, yerleşik politikalar devam eder). Tam rehber için [docs/custom-hooks.mdx](docs/custom-hooks.mdx) bkz.

### Kural tabanlı politikalar

`.failproofai/policies/` dizinine `*policies.{js,mjs,ts}` dosyaları bırak ve otomatik olarak yüklenir — bayrak veya yapılandırma değişikliği gerekmez. Dizini git'e kaydet ve her ekip üyesi otomatik olarak aynı kalite standartlarını alır.

```text
# Proje seviyesi — git'e kaydedildi, ekiple paylaşıldı
.failproofai/policies/security-policies.mjs
.failproofai/policies/workflow-policies.mjs

# Kullanıcı seviyesi — kişisel, tüm projelere uygulandı
~/.failproofai/policies/my-policies.mjs
```

Her iki seviye de yüklenir (birleştirme). Dosyalar her dizinde alfabetik olarak yüklenir. Sırayı kontrol etmek için `01-`, `02-`, vb. ile başla. Ekibiniz yeni başarısızlık modları keşfettikçe, bir politika ekle ve gönder — herkes sonraki çekişinde güncelleştirir. Hazır kullanılır örnekler için [examples/convention-policies/](examples/convention-policies/) bkz.

---

## Telemetri

Failproof AI, özellik kullanımını anlamak için PostHog aracılığıyla anonim kullanım telemetrisi toplar. Oturum içeriği, dosya adları, araç girdileri veya kişisel bilgiler asla gönderilmez.

Devre dışı bırak:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## Belgelendirme

| Rehber | Açıklama |
|--------|----------|
| [Başlangıç](docs/getting-started.mdx) | Kurulum ve ilk adımlar |
| [Yerleşik Politikalar](docs/built-in-policies.mdx) | 39 yerleşik politika ve parametreler |
| [Özel Politikalar](docs/custom-policies.mdx) | Kendi politikalarını yaz |
| [Yapılandırma](docs/configuration.mdx) | Yapılandırma dosyası biçimi ve kapsam birleştirmesi |
| [Pano](docs/dashboard.mdx) | Oturumları izle ve politika etkinliğini gözden geçir |
| [Mimari](docs/architecture.mdx) | Kanca sistemi nasıl çalışır |
| [Test Etme](docs/testing.mdx) | Testleri çalıştır ve yenilerini yaz |

### Belgeleri yerel olarak çalıştır

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

Mintlify belgelendirme sitesini `http://localhost:3000` adresinde açar. Belgelendirme dizinini bağlarsan, kapsayıcı değişiklikleri izler:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## failproofai katkıda bulunanları için not

Bu repoyu `.claude/settings.json`, standart `npx -y failproofai` komutu yerine `bun ./bin/failproofai.mjs --hook <EventType>` kullanır. Bunun nedeni, failproofai projesi içinde `npx -y failproofai` çalıştırmanın kendi kendine referans çatışması oluşturmasıdır.

Tüm diğer repolar için, önerilen yaklaşım `npx -y failproofai` olup:

```bash
failproofai policies --install --scope project
```

ile kurulur.

## Katkıda Bulunma

[CONTRIBUTING.md](CONTRIBUTING.md) bkz.

---

## Lisans

[LICENSE](LICENSE) bkz.

---

**ExosphereHost: Ajanlarınızın Güvenilirlik Araştırması Laboratuvarı** tarafından oluşturulmuş ve bakımlanmaktadır. Kurumsal ve başlangıç şirketlerinin AI ajanlarının güvenilirliğini kendi ajanları, yazılımı ve uzmanlığı aracılığıyla geliştirmemize yardımcı oluyoruz. [exosphere.host](https://exosphere.host) adresinden daha fazla bilgi edinin.
