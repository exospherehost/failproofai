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

AI ajanlarınızı güvenilir, odaklanmış ve otonom olarak çalıştıran politikaları yönetmenin en kolay yolu - **Claude Code** ve **Agents SDK** için.

<p align="center">
  <img src="failproofai-hq.gif" alt="Failproof AI in action" width="800" />
</p>

- **39 Yerleşik Politika** - Yaygın ajan başarısızlık modlarını hemen yakalayın. Yıkıcı komutları engelleyin, gizli bilgi sızıntısını önleyin, ajanları proje sınırları içinde tutun, döngüleri tespit edin ve daha fazlası.
- **Özel Politikalar** - JavaScript'te kendi güvenilirlik kurallarınızı yazın. `allow`/`deny`/`instruct` API'sını kullanarak kuralları zorlaştırın, sapmaları önleyin, işlemleri kontrol edin veya harici sistemlerle entegre olun.
- **Kolay Yapılandırma** - Herhangi bir politikayı kod yazmadan ayarlayın. İzin listelerini, korumalı şubeleri, eşikleri proje başına veya genel olarak ayarlayın. Üç kapsamlı yapılandırma otomatik olarak birleşir.
- **Ajan İzleyicisi** - Ajanlarınız işiniz bittiğinde neler yaptığını görün. Oturumları göz atın, her araç çağrısını inceleyin ve politikaların tam olarak nerede harekete geçtiğini gözden geçirin.

Her şey yerel olarak çalışır - verileriniz makinenizden ayrılmaz.

---

## Gereksinimler

- Node.js >= 20.9.0
- Bun >= 1.3.0 (isteğe bağlı - yalnızca geliştirme / kaynaktan derleme için gerekli)

---

## Yükleme

```bash
npm install -g failproofai
# veya
bun add -g failproofai
```

---

## Hızlı başlangıç

### 1. Politikaları genel olarak etkinleştirin

```bash
failproofai policies --install
```

`~/.claude/settings.json` dosyasına kanca girişleri yazar. Claude Code artık her araç çağrısından önce ve sonra failproofai'yi çağıracaktır.

### 2. Panoyu başlatın

```bash
failproofai
```

`http://localhost:8020` sayfasını açar - oturumları göz atın, günlükleri inceleyin, politikaları yönetin.

### 3. Hangi politikaların aktif olduğunu kontrol edin

```bash
failproofai policies
```

---

## Politika yüklemesi

### Kapsamlar

| Kapsam | Komut | Yazıldığı Yer |
|--------|-------|---------------|
| Genel (varsayılan) | `failproofai policies --install` | `~/.claude/settings.json` |
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

Politika yapılandırması `~/.failproofai/policies-config.json` (genel) veya projenizde `.failproofai/policies-config.json` (proje başına) dosyasında bulunur.

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
      "hint": "Bunun yerine yeni bir şube oluşturmayı deneyin."
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

**Üç yapılandırma kapsamı** otomatik olarak birleştirilir (proje → yerel → genel). Tam birleştirme kuralları için [docs/configuration.mdx](docs/configuration.mdx) sayfasına bakın.

---

## Yerleşik politikalar

| Politika | Açıklama | Yapılandırılabilir |
|----------|----------|:---:|
| `block-sudo` | Ajanların ayrıcalıklı sistem komutları çalıştırmasını önleyin | `allowPatterns` |
| `block-rm-rf` | Tesadüfi özyinelemeli dosya silmesini önleyin | `allowPaths` |
| `block-curl-pipe-sh` | Ajanların güvenilmeyen betikleri shell'e yöneltmesini önleyin | |
| `block-failproofai-commands` | Kendi kendine kaldırılmasını önleyin | |
| `sanitize-jwt` | JWT belirteçlerinin ajan bağlamına sızmasını durdurun | |
| `sanitize-api-keys` | API anahtarlarının ajan bağlamına sızmasını durdurun | `additionalPatterns` |
| `sanitize-connection-strings` | Veritabanı kimlik bilgilerinin ajan bağlamına sızmasını durdurun | |
| `sanitize-private-key-content` | PEM özel anahtar bloklarını çıktıdan redakte edin | |
| `sanitize-bearer-tokens` | Authorization Bearer belirteçlerini çıktıdan redakte edin | |
| `block-env-files` | Ajanların .env dosyalarını okumasını önleyin | |
| `protect-env-vars` | Ajanların ortam değişkenlerini yazdırmasını önleyin | |
| `block-read-outside-cwd` | Ajanları proje sınırları içinde tutun | `allowPaths` |
| `block-secrets-write` | Özel anahtar ve sertifika dosyalarına yazma işlemlerini önleyin | `additionalPatterns` |
| `block-push-master` | Ana/master şubesine tesadüfi itişleri önleyin | `protectedBranches` |
| `block-work-on-main` | Ajanları korumalı şubelerden uzak tutun | `protectedBranches` |
| `block-force-push` | `git push --force` komutunu engelleyin | |
| `warn-git-amend` | Ajanları commit'leri değiştirmeden önce uyarın | |
| `warn-git-stash-drop` | Ajanları stash'leri atmadan önce uyarın | |
| `warn-all-files-staged` | Tesadüfi `git add -A` komutunu yakalayın | |
| `warn-destructive-sql` | DROP/DELETE SQL komutlarını yürütülmeden önce yakalayın | |
| `warn-schema-alteration` | ALTER TABLE komutlarını yürütülmeden önce yakalayın | |
| `warn-large-file-write` | Beklenenden büyük dosya yazma işlemlerini yakalayın | `thresholdKb` |
| `warn-package-publish` | Tesadüfi `npm publish` komutunu yakalayın | |
| `warn-background-process` | İstenmeyen arka plan işlemlerini başlatmayı yakalayın | |
| `warn-global-package-install` | İstenmeyen genel paket yüklemelerini yakalayın | |
| …ve daha fazlası | | |

Tam politika detayları ve parametre referansı: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## Özel politikalar

Ajanlarınızı güvenilir ve odaklanmış tutmak için kendi politikalarınızı yazın:

```js
import { customPolicies, allow, deny, instruct } from "failproofai";

customPolicies.add({
  name: "no-production-writes",
  description: "Üretim içeren yollara yazma işlemlerini engelleyin",
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (!["Write", "Edit"].includes(ctx.toolName ?? "")) return allow();
    const path = ctx.toolInput?.file_path ?? "";
    if (path.includes("production")) return deny("Üretim yollarına yazma işlemleri engellenir");
    return allow();
  },
});
```

Şu komutla yükleyin:

```bash
failproofai policies --install --custom ./my-policies.js
```

### Karar yardımcıları

| İşlev | Etki |
|-------|------|
| `allow()` | İşleme izin verin |
| `allow(message)` | İzin verin ve Claude'a bilgilendirici bağlam gönderin |
| `deny(message)` | İşlemi engelleyin; mesaj Claude'a gösterilir |
| `instruct(message)` | Claude'un sorgulamasına bağlam ekleyin; engelleme yapmaz |

### Bağlam nesnesi (`ctx`)

| Alan | Tür | Açıklama |
|------|-----|---------|
| `eventType` | `string` | `"PreToolUse"`, `"PostToolUse"`, `"Notification"`, `"Stop"` |
| `toolName` | `string` | Çağrılan araç (`"Bash"`, `"Write"`, `"Read"`, …) |
| `toolInput` | `object` | Aracın girdi parametreleri |
| `payload` | `object` | Tam ham olay yükü |
| `session.cwd` | `string` | Claude Code oturumunun çalışma dizini |
| `session.sessionId` | `string` | Oturum tanımlayıcısı |
| `session.transcriptPath` | `string` | Oturum transkript dosyasının yolu |

Özel kancalar geçişli yerel içeri aktarımları, async/await'i ve `process.env` erişimini destekler. Hatalar başarısız durumda açık kalır (log dosyasına `~/.failproofai/hook.log` yazılır, yerleşik politikalar devam eder). Tam rehber için [docs/custom-hooks.mdx](docs/custom-hooks.mdx) sayfasına bakın.

### Kural tabanlı politikalar

`*policies.{js,mjs,ts}` dosyalarını `.failproofai/policies/` dizinine bırakın ve otomatik olarak yüklenir — hiçbir bayrak veya yapılandırma değişikliği gerekmez. Dizini git'e gönderin ve her takım üyesi otomatik olarak aynı kalite standartlarını alır.

```text
# Proje düzeyi — git'e gönderilmiş, takım ile paylaşılan
.failproofai/policies/security-policies.mjs
.failproofai/policies/workflow-policies.mjs

# Kullanıcı düzeyi — kişisel, tüm projelere uygulanır
~/.failproofai/policies/my-policies.mjs
```

Her iki seviye de yüklenir (birleşim). Dosyalar her dizin içinde alfabetik olarak yüklenir. Sırayı kontrol etmek için `01-`, `02-` vb. ile ön ek ekleyin. Takımınız yeni başarısızlık modlarını keşfettikçe, bir politika ekleyin ve gönderin — herkes sonraki çekmede güncellemeyi alır. Kullanıma hazır örnekler için [examples/convention-policies/](examples/convention-policies/) sayfasına bakın.

---

## Telemetri

Failproof AI, özellik kullanımını anlamak için PostHog aracılığıyla anonim kullanım telemetrisi toplar. Oturum içeriği, dosya adları, araç girişleri veya kişisel bilgiler hiçbir zaman gönderilmez.

Devre dışı bırakmak için:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## Belgeler

| Rehber | Açıklama |
|--------|----------|
| [Başlangıç](docs/getting-started.mdx) | Yükleme ve ilk adımlar |
| [Yerleşik Politikalar](docs/built-in-policies.mdx) | 39 yerleşik politika ve parametreleri |
| [Özel Politikalar](docs/custom-policies.mdx) | Kendi politikalarınızı yazın |
| [Yapılandırma](docs/configuration.mdx) | Yapılandırma dosyası biçimi ve kapsam birleştirme |
| [Pano](docs/dashboard.mdx) | Oturumları izleyin ve politika etkinliğini gözden geçirin |
| [Mimari](docs/architecture.mdx) | Kanca sistemi nasıl çalışır |
| [Test Etme](docs/testing.mdx) | Testleri çalıştırma ve yenilerini yazma |

### Belgeleri yerel olarak çalıştırın

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

Mintlify belge sitesini `http://localhost:3000` adresinde açar. Belge dizinini bağlarsanız, kapsayıcı değişiklikleri izler:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## failproofai katkıda bulunanlarına not

Bu deponun `.claude/settings.json` dosyası standart `npx -y failproofai` komutu yerine `bun ./bin/failproofai.mjs --hook <EventType>` komutunu kullanır. Bunun nedeni, failproofai projesi içinde `npx -y failproofai` çalıştırmanın kendi kendini referans alan bir çatışma oluşturmasıdır.

Tüm diğer depolar için önerilen yaklaşım `npx -y failproofai` komutunu şu şekilde yüklemektir:

```bash
failproofai policies --install --scope project
```

## Katkıda Bulunma

[CONTRIBUTING.md](CONTRIBUTING.md) sayfasına bakın.

---

## Lisans

[LICENSE](LICENSE) sayfasına bakın.

---

**ExosphereHost: Ajanlarınız İçin Güvenilirlik Araştırma Laboratuvarı** tarafından yapılmış ve sürdürülmektedir. Biz işletmelere ve startuplara kendi ajanlarımız, yazılımımız ve uzmanlığımız aracılığıyla AI ajanlarının güvenilirliğini geliştirmeye yardımcı oluyoruz. [exosphere.host](https://exosphere.host) adresinde daha fazla bilgi edinin.
```
