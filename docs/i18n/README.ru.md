> **⚠️** This is an auto-generated translation. For the latest version, see the [English README](../../README.md). Community corrections welcome!

[🇺🇸 English](../../README.md) | [🇨🇳 简体中文](README.zh.md) | [🇯🇵 日本語](README.ja.md) | [🇰🇷 한국어](README.ko.md) | [🇪🇸 Español](README.es.md) | [🇧🇷 Português](README.pt-br.md) | [🇩🇪 Deutsch](README.de.md) | [🇫🇷 Français](README.fr.md) | **🇷🇺 Русский** | [🇮🇳 हिन्दी](README.hi.md) | [🇹🇷 Türkçe](README.tr.md) | [🇻🇳 Tiếng Việt](README.vi.md) | [🇮🇹 Italiano](README.it.md) | [🇸🇦 العربية](README.ar.md) | [🇮🇱 עברית](README.he.md)

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

**Переводы**: [简体中文](docs/i18n/README.zh.md) | [日本語](docs/i18n/README.ja.md) | [한국어](docs/i18n/README.ko.md) | [Español](docs/i18n/README.es.md) | [Português](docs/i18n/README.pt-br.md) | [Deutsch](docs/i18n/README.de.md) | [Français](docs/i18n/README.fr.md) | [Русский](docs/i18n/README.ru.md) | [हिन्दी](docs/i18n/README.hi.md) | [Türkçe](docs/i18n/README.tr.md) | [Tiếng Việt](docs/i18n/README.vi.md) | [Italiano](docs/i18n/README.it.md) | [العربية](docs/i18n/README.ar.md) | [עברית](docs/i18n/README.he.md)

Самый простой способ управлять политиками, которые делают ваших ИИ-агентов надёжными, сосредоточенными на задачах и работающими автономно — для **Claude Code** и **Agents SDK**.

<p align="center">
  <img src="failproofai-hq.gif" alt="Failproof AI в действии" width="800" />
</p>

- **32 встроенные политики** — перехватывайте типовые ошибки агентов прямо из коробки. Блокируйте деструктивные команды, предотвращайте утечки секретов, держите агентов в границах проекта, обнаруживайте циклы и многое другое.
- **Пользовательские политики** — пишите собственные правила надёжности на JavaScript. Используйте API `allow`/`deny`/`instruct` для обеспечения соглашений, предотвращения дрейфа, управления операциями или интеграции с внешними системами.
- **Простая конфигурация** — настраивайте любую политику без написания кода. Устанавливайте разрешённые списки, защищённые ветки, пороги для отдельного проекта или глобально. Три области конфигурации автоматически объединяются.
- **Монитор агентов** — смотрите, что делали ваши агенты, пока вас не было. Просматривайте сессии, проверяйте каждый вызов инструмента и анализируйте точные моменты срабатывания политик.

Всё работает локально — никакие данные не покидают вашу машину.

---

## Требования

- Node.js >= 20.9.0
- Bun >= 1.3.0 (опционально — требуется только для разработки / сборки из исходного кода)

---

## Установка

```bash
npm install -g failproofai
# или
bun add -g failproofai
```

---

## Быстрый старт

### 1. Включите политики глобально

```bash
failproofai policies --install
```

Записывает записи о хуках в `~/.claude/settings.json`. Claude Code будет вызывать failproofai до и после каждого вызова инструмента.

### 2. Запустите панель управления

```bash
failproofai
```

Открывает `http://localhost:8020` — просматривайте сессии, проверяйте логи, управляйте политиками.

### 3. Проверьте, какие политики активны

```bash
failproofai policies
```

---

## Установка политик

### Области

| Область | Команда | Где записывает |
|---------|---------|---|
| Глобальная (по умолчанию) | `failproofai policies --install` | `~/.claude/settings.json` |
| Проект | `failproofai policies --install --scope project` | `.claude/settings.json` |
| Локальная | `failproofai policies --install --scope local` | `.claude/settings.local.json` |

### Установите конкретные политики

```bash
failproofai policies --install block-sudo block-rm-rf sanitize-api-keys
```

### Удалите политики

```bash
failproofai policies --uninstall
# или для конкретной области:
failproofai policies --uninstall --scope project
```

---

## Конфигурация

Конфигурация политик находится в `~/.failproofai/policies-config.json` (глобально) или `.failproofai/policies-config.json` в вашем проекте (для каждого проекта).

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
      "hint": "Используйте apt-get напрямую без sudo."
    },
    "block-push-master": {
      "protectedBranches": ["main", "release", "prod"],
      "hint": "Попробуйте создать свежую ветку."
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

**Три области конфигурации** автоматически объединяются (проект → локальная → глобальная). Полные правила объединения см. в [docs/configuration.mdx](docs/configuration.mdx).

---

## Встроенные политики

| Политика | Описание | Конфигурируемо |
|----------|----------|:---:|
| `block-sudo` | Предотвратить выполнение агентами команд с привилегиями | `allowPatterns` |
| `block-rm-rf` | Предотвратить случайное рекурсивное удаление файлов | `allowPaths` |
| `block-curl-pipe-sh` | Предотвратить передачу ненадёжных скриптов в shell | |
| `block-failproofai-commands` | Предотвратить самоудаление | |
| `sanitize-jwt` | Остановить утечку JWT-токенов в контекст агента | |
| `sanitize-api-keys` | Остановить утечку API-ключей в контекст агента | `additionalPatterns` |
| `sanitize-connection-strings` | Остановить утечку учётных данных БД в контекст агента | |
| `sanitize-private-key-content` | Удалить блоки приватных ключей PEM из вывода | |
| `sanitize-bearer-tokens` | Удалить Bearer-токены авторизации из вывода | |
| `block-env-files` | Не позволяйте агентам читать .env файлы | |
| `protect-env-vars` | Предотвратить вывод переменных окружения агентами | |
| `block-read-outside-cwd` | Держите агентов в границах проекта | `allowPaths` |
| `block-secrets-write` | Предотвратить запись в файлы приватных ключей и сертификатов | `additionalPatterns` |
| `block-push-master` | Предотвратить случайные push на main/master | `protectedBranches` |
| `block-work-on-main` | Не позволяйте агентам работать на защищённых ветках | `protectedBranches` |
| `block-force-push` | Предотвратить `git push --force` | |
| `warn-git-amend` | Напомните агентам перед изменением коммитов | |
| `warn-git-stash-drop` | Напомните агентам перед удалением stash | |
| `warn-all-files-staged` | Перехватите случайный `git add -A` | |
| `warn-destructive-sql` | Перехватите DROP/DELETE SQL перед выполнением | |
| `warn-schema-alteration` | Перехватите ALTER TABLE перед выполнением | |
| `warn-large-file-write` | Перехватите неожиданно большие записи файлов | `thresholdKb` |
| `warn-package-publish` | Перехватите случайный `npm publish` | |
| `warn-background-process` | Перехватите непредусмотренные запуски фоновых процессов | |
| `warn-global-package-install` | Перехватите непредусмотренные глобальные установки пакетов | |
| …и другие | | |

Полные детали политик и справочник параметров: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## Пользовательские политики

Пишите свои политики, чтобы агенты оставались надёжными и сосредоточенными на задачах:

```js
import { customPolicies, allow, deny, instruct } from "failproofai";

customPolicies.add({
  name: "no-production-writes",
  description: "Блокировать запись в пути, содержащие 'production'",
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (!["Write", "Edit"].includes(ctx.toolName ?? "")) return allow();
    const path = ctx.toolInput?.file_path ?? "";
    if (path.includes("production")) return deny("Запись в пути production заблокирована");
    return allow();
  },
});
```

Установите с помощью:

```bash
failproofai policies --install --custom ./my-policies.js
```

### Вспомогательные функции решений

| Функция | Эффект |
|---------|--------|
| `allow()` | Разрешить операцию |
| `allow(message)` | Разрешить и отправить информационный контекст Claude |
| `deny(message)` | Заблокировать операцию; сообщение показано Claude |
| `instruct(message)` | Добавить контекст в подсказку Claude; не блокирует |

### Объект контекста (`ctx`)

| Поле | Тип | Описание |
|------|-----|---------|
| `eventType` | `string` | `"PreToolUse"`, `"PostToolUse"`, `"Notification"`, `"Stop"` |
| `toolName` | `string` | Вызываемый инструмент (`"Bash"`, `"Write"`, `"Read"`, …) |
| `toolInput` | `object` | Входные параметры инструмента |
| `payload` | `object` | Полный сырой payload события |
| `session.cwd` | `string` | Рабочая директория сессии Claude Code |
| `session.sessionId` | `string` | Идентификатор сессии |
| `session.transcriptPath` | `string` | Путь к файлу стенограммы сессии |

Пользовательские хуки поддерживают транзитивные локальные импорты, async/await и доступ к `process.env`. Ошибки открыты (логируются в `~/.failproofai/hook.log`, встроенные политики продолжают работу). Полное руководство см. в [docs/custom-hooks.mdx](docs/custom-hooks.mdx).

### Политики на основе соглашений

Поместите файлы `*policies.{js,mjs,ts}` в `.failproofai/policies/` и они будут загружены автоматически — никаких флагов или изменений конфигурации не требуется. Закоммитьте директорию в git и каждый член команды получит одинаковые стандарты качества автоматически.

```text
# Уровень проекта — закоммичено в git, доступно команде
.failproofai/policies/security-policies.mjs
.failproofai/policies/workflow-policies.mjs

# Уровень пользователя — личные, применяются ко всем проектам
~/.failproofai/policies/my-policies.mjs
```

Загружаются оба уровня (объединение). Файлы загружаются в алфавитном порядке в каждой директории. Префиксируйте с `01-`, `02-`, и т.д. для управления порядком. Когда ваша команда обнаружит новые ошибки, добавьте политику и push — все получат обновление при следующем pull. Готовые примеры см. в [examples/convention-policies/](examples/convention-policies/).

---

## Телеметрия

Failproof AI собирает анонимную телеметрию использования через PostHog для понимания использования функций. Содержимое сессий, имена файлов, входные данные инструментов или персональная информация никогда не отправляются.

Отключите её:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## Документация

| Руководство | Описание |
|-------------|---------|
| [Getting Started](docs/getting-started.mdx) | Установка и первые шаги |
| [Built-in Policies](docs/built-in-policies.mdx) | Все 32 встроенные политики с параметрами |
| [Custom Policies](docs/custom-policies.mdx) | Пишите свои политики |
| [Configuration](docs/configuration.mdx) | Формат файла конфигурации и объединение областей |
| [Dashboard](docs/dashboard.mdx) | Мониторьте сессии и просматривайте активность политик |
| [Architecture](docs/architecture.mdx) | Как работает система хуков |
| [Testing](docs/testing.mdx) | Запуск тестов и написание новых |

### Запустите документацию локально

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

Открывает сайт документации Mintlify на `http://localhost:3000`. Контейнер следит за изменениями, если вы монтируете директорию docs:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## Примечание для участников failproofai

`.claude/settings.json` этого репозитория использует `bun ./bin/failproofai.mjs --hook <EventType>` вместо стандартной команды `npx -y failproofai`. Это связано с тем, что запуск `npx -y failproofai` внутри самого проекта failproofai создаёт конфликт с самоссылкой.

Для всех остальных репозиториев рекомендуемый подход — `npx -y failproofai`, установленный через:

```bash
failproofai policies --install --scope project
```

## Участие в разработке

Смотрите [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Лицензия

Смотрите [LICENSE](LICENSE).

---

Разработано и поддерживается **ExosphereHost: Reliability Research Lab for Your Agents**. Мы помогаем предприятиям и стартапам повысить надёжность своих ИИ-агентов через собственные агентов, программное обеспечение и опыт. Подробнее на [exosphere.host](https://exosphere.host).
