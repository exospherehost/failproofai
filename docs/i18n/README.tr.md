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

AI aracılarınızı güvenilir, odaklanmış ve özerk olarak çalıştırmanızı sağlayan politikaları yönetmenin en kolay yolu - **Claude Code** ve **Agents SDK** için.

- **30 Hazır Politika** - Hemen kullanıma hazır yaygın ajan başarısızlık durumlarını yakalayın. Zararlı komutları engelleyin, gizli sızıntılarını önleyin, ajanları proje sınırları içinde tutun, döngüleri algılayın ve daha fazlası.
- **Özel Politikalar** - JavaScript'te kendi güvenilirlik kurallarınızı yazın. Kuralları uygulamak, değişimi önlemek, işlemleri kontrol etmek veya harici sistemlerle entegre olmak için `allow`/`deny`/`instruct` API'sini kullanın.
- **Kolay Yapılandırma** - Herhangi bir politikayı kod yazmadan ayarlayın. İzin listeleri, korunan dallar, eşikler projeye veya global olarak ayarlayın. Üç kapsam yapılandırması otomatik olarak birleşir.
- **Ajan İzleyici** - Aracılarınız yokken ne yaptığını görün. Oturumları tarayın, her araç çağrısını inceleyin ve politikaların tam olarak nerede etkinleştiğini gözden geçirin.

Her şey yerel olarak çalışır - hiçbir veri makinenizden çıkmaz.

---

## Gereksinimler

- Node.js >= 20.9.0
- Bun >= 1.3.0 (isteğe bağlı - yalnızca geliştirme / kaynak koddan derleme için gerekli)

---

## Yükle

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

`~/.claude/settings.json` dosyasına kancaya girişler yazar. Claude Code artık her araç çağrısından önce ve sonra failproofai'ı çağıracaktır.

### 2. Panoyu başlat

```bash
failproofai
```

`http://localhost:8020` açılır - oturumları tarayın, günlükleri inceleyin, politikaları yönetin.

### 3. Aktif olanları kontrol et

```bash
failproofai policies
```

---

## Politika kurulumu

### Kapsamlar

| Kapsam | Komut | Nereye yazar |
|--------|-------|--------------|
| Global (varsayılan) | `failproofai policies --install` | `~/.claude/settings.json` |
| Proje | `failproofai policies --install --scope project` | `.claude/settings.json` |
| Yerel | `failproofai policies --install --scope local` | `.claude/settings.local.json` |

### Belirli politikaları kur

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

Politika yapılandırması `~/.failproofai/policies-config.json` (global) veya projenizdeki `.failproofai/policies-config.json` (proje başına) içinde bulunur.

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
      "hint": "Sudo olmadan apt-get'i doğrudan kullanın."
    },
    "block-push-master": {
      "protectedBranches": ["main", "release", "prod"],
      "hint": "Bunun yerine yeni bir dal oluşturmayı deneyin."
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

## Hazır politikalar

| Politika | Açıklama | Yapılandırılabilir |
|----------|----------|:---:|
| `block-sudo` | Ajanları ayrıcalıklı sistem komutlarını çalıştırmaktan önle | `allowPatterns` |
| `block-rm-rf` | Tesadüfi özyinelemeli dosya silmeyi önle | `allowPaths` |
| `block-curl-pipe-sh` | Ajanları güvenilmez betikleri shell'e yönlendirmekten önle | |
| `block-failproofai-commands` | Kendi kendine kaldırılmayı önle | |
| `sanitize-jwt` | JWT jetonlarının ajan bağlamına sızmasını durdur | |
| `sanitize-api-keys` | API anahtarlarının ajan bağlamına sızmasını durdur | `additionalPatterns` |
| `sanitize-connection-strings` | Veritabanı kimlik bilgilerinin ajan bağlamına sızmasını durdur | |
| `sanitize-private-key-content` | PEM özel anahtar bloklarını çıktıdan gizle | |
| `sanitize-bearer-tokens` | Çıktıdan Authorization Bearer jetonlarını gizle | |
| `block-env-files` | Ajanları .env dosyalarını okumaktan tutun | |
| `protect-env-vars` | Ajanları ortam değişkenlerini yazdırmaktan önle | |
| `block-read-outside-cwd` | Ajanları proje sınırları içinde tutun | `allowPaths` |
| `block-secrets-write` | Özel anahtar ve sertifika dosyalarına yazıları önle | `additionalPatterns` |
| `block-push-master` | Main/master'a tesadüfi itmeleri önle | `protectedBranches` |
| `block-work-on-main` | Ajanları korunan dallardan uzak tutun | `protectedBranches` |
| `block-force-push` | `git push --force`'u önle | |
| `warn-git-amend` | Ajanları commit değiştirmeden önce uyar | |
| `warn-git-stash-drop` | Ajanları stash bırakmadan önce uyar | |
| `warn-all-files-staged` | Tesadüfi `git add -A`'yı yakala | |
| `warn-destructive-sql` | DROP/DELETE SQL'ini yürütmeden önce yakala | |
| `warn-schema-alteration` | ALTER TABLE'ı yürütmeden önce yakala | |
| `warn-large-file-write` | Beklenmedik boyutta dosya yazılarını yakala | `thresholdKb` |
| `warn-package-publish` | Tesadüfi `npm publish`'i yakala | |
| `warn-background-process` | Istenmeyen arka plan işlem başlatmalarını yakala | |
| `warn-global-package-install` | Istenmeyen global paket kurulumlarını yakala | |
| …ve daha fazlası | | |

Tam politika ayrıntıları ve parametre referansı: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

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

Bunu kurarak yükleyin:

```bash
failproofai policies --install --custom ./my-policies.js
```

### Karar yardımcıları

| İşlev | Etki |
|-------|------|
| `allow()` | İşleme izin ver |
| `allow(message)` | İzin ver ve Claude'a bilgisel bağlam gönder |
| `deny(message)` | İşlemi engelle; ileti Claude'a gösterilir |
| `instruct(message)` | Claude'un istemine bağlam ekle; engelleme |

### Bağlam nesnesi (`ctx`)

| Alan | Tür | Açıklama |
|------|-----|----------|
| `eventType` | `string` | `"PreToolUse"`, `"PostToolUse"`, `"Notification"`, `"Stop"` |
| `toolName` | `string` | Çağrılan araç (`"Bash"`, `"Write"`, `"Read"`, …) |
| `toolInput` | `object` | Aracın giriş parametreleri |
| `payload` | `object` | Tam ham etkinlik yükü |
| `session.cwd` | `string` | Claude Code oturumunun çalışma dizini |
| `session.sessionId` | `string` | Oturum tanımlayıcısı |
| `session.transcriptPath` | `string` | Oturum transkrip dosyasının yolu |

Özel kancalar geçişli yerel içe aktarmaları, async/await ve `process.env` erişimini destekler. Hatalar başarısız-açık şekilde işlenir (günlükleri `~/.failproofai/hook.log`'a kaydedilir, hazır politikalar devam eder). Tam rehber için [docs/custom-hooks.mdx](docs/custom-hooks.mdx) bölümüne bakın.

### Kurala dayalı politikalar

`*policies.{js,mjs,ts}` dosyalarını `.failproofai/policies/` içine bırakın ve otomatik olarak yüklenir — `--custom` bayrağına veya yapılandırma değişikliklerine ihtiyaç yok. Git kancaları gibi çalışır: dosya bırak, işte oldu.

```text
# Proje seviyesi — git'e işlenir, takımla paylaşılır
.failproofai/policies/security-policies.mjs
.failproofai/policies/workflow-policies.mjs

# Kullanıcı seviyesi — kişisel, tüm projeler için geçerli
~/.failproofai/policies/my-policies.mjs
```

Her iki seviye de yüklenir (birleşim). Dosyalar her dizin içinde alfabetik olarak yüklenir. Sırayı kontrol etmek için `01-`, `02-` vb. ile ön ek yapın. Kullanıma hazır örnekler için [examples/convention-policies/](examples/convention-policies/) bölümüne bakın.

---

## Telemetri

Failproof AI, özellik kullanımını anlamak için PostHog aracılığıyla anonim kullanım telemetrisi toplar. Oturum içeriği, dosya adları, araç girişleri veya kişisel bilgiler asla gönderilmez.

Devre dışı bırak:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## Belgeler

| Rehber | Açıklama |
|--------|----------|
| [Başlarken](docs/getting-started.mdx) | Kurulum ve ilk adımlar |
| [Hazır Politikalar](docs/built-in-policies.mdx) | Tüm 30 hazır politika ve parametreleri |
| [Özel Politikalar](docs/custom-policies.mdx) | Kendi politikalarını yaz |
| [Yapılandırma](docs/configuration.mdx) | Yapılandırma dosya biçimi ve kapsam birleştirme |
| [Panel](docs/dashboard.mdx) | Oturumları izle ve politika aktivitesini gözden geçir |
| [Mimari](docs/architecture.mdx) | Kanva sisteminin nasıl çalıştığı |
| [Test Etme](docs/testing.mdx) | Testleri çalıştırma ve yenilerini yazma |

### Belgeleri yerel olarak çalıştır

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

Mintlify belgeler sitesini `http://localhost:3000` adresinde açar. Belgeler dizinini bağlarsanız konteyner değişiklikleri izler:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## failproofai katılımcıları için not

Bu deponun `.claude/settings.json` dosyası standart `npx -y failproofai` komutunun yerine `bun ./bin/failproofai.mjs --hook <EventType>` kullanır. Bunun nedeni failproofai projesi içinde `npx -y failproofai`'ı çalıştırmanın kendi kendine referanslı bir çatışma oluşturmasıdır.

Diğer tüm depolar için önerilen yaklaşım `npx -y failproofai`'dır ve şu şekilde kurulur:

```bash
failproofai policies --install --scope project
```

## Katkıda bulun

Bkz. [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Lisans

Bkz. [LICENSE](LICENSE).

---

**ExosphereHost: Agents için Güvenilirlik Araştırma Laboratuvarı** tarafından inşa edilmiş ve yönetilmektedir. İşletmelerin ve startupların AI ajanlarının güvenilirliğini kendi ajanları, yazılımı ve uzmanlığı aracılığıyla geliştirmelerine yardımcı oluyoruz. [exosphere.host](https://exosphere.host) adresinde daha fazla bilgi edinin.
```
