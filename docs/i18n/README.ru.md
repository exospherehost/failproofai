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

Самый простой способ управлять политиками, которые делают ваших AI-агентов надёжными, сосредоточенными и автономными — для **Claude Code** и **Agents SDK**.

- **30 встроенных политик** — Предотвращайте типичные сбои агентов из коробки. Блокируйте деструктивные команды, предотвращайте утечки секретов, удерживайте агентов в границах проекта, обнаруживайте циклы и многое другое.
- **Пользовательские политики** — Напишите свои правила надёжности на JavaScript. Используйте API `allow`/`deny`/`instruct` для обеспечения конвенций, предотвращения дрейфа, контроля операций или интеграции с внешними системами.
- **Простая конфигурация** — Настраивайте любую политику без написания кода. Устанавливайте списки разрешений, защищённые ветви, пороги на уровне проекта или глобально. Конфигурация трёх уровней автоматически объединяется.
- **Мониторинг агентов** — Смотрите, что делали ваши агенты, пока вас не было. Просматривайте сеансы, проверяйте каждый вызов инструмента и смотрите точно, где срабатывали политики.

Всё работает локально — никакие данные не покидают вашу машину.

---

## Требования

- Node.js >= 20.9.0
- Bun >= 1.3.0 (опционально — требуется только для разработки / сборки из исходников)

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

Записывает записи hook в `~/.claude/settings.json`. Claude Code теперь будет вызывать failproofai до и после каждого вызова инструмента.

### 2. Запустите панель управления

```bash
failproofai
```

Открывает `http://localhost:8020` — просматривайте сеансы, проверяйте логи, управляйте политиками.

### 3. Проверьте, что активно

```bash
failproofai policies
```

---

## Установка политик

### Области видимости

| Область | Команда | Где записывается |
|---------|---------|------------------|
| Глобальная (по умолчанию) | `failproofai policies --install` | `~/.claude/settings.json` |
| Проект | `failproofai policies --install --scope project` | `.claude/settings.json` |
| Локальная | `failproofai policies --install --scope local` | `.claude/settings.local.json` |

### Установка специфических политик

```bash
failproofai policies --install block-sudo block-rm-rf sanitize-api-keys
```

### Удаление политик

```bash
failproofai policies --uninstall
# или для конкретной области:
failproofai policies --uninstall --scope project
```

---

## Конфигурация

Конфигурация политик находится в `~/.failproofai/policies-config.json` (глобальная) или `.failproofai/policies-config.json` в вашем проекте (для каждого проекта).

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
      "hint": "Попробуйте создать свежую ветвь вместо этого."
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

**Три области конфигурации** автоматически объединяются (проект → локальная → глобальная). Смотрите [docs/configuration.mdx](docs/configuration.mdx) для полных правил объединения.

---

## Встроенные политики

| Политика | Описание | Настраивается |
|----------|---------|:---:|
| `block-sudo` | Предотвратить запуск привилегированных системных команд | `allowPatterns` |
| `block-rm-rf` | Предотвратить случайное рекурсивное удаление файлов | `allowPaths` |
| `block-curl-pipe-sh` | Предотвратить передачу ненадёжных скриптов в shell | |
| `block-failproofai-commands` | Предотвратить самостоятельное удаление | |
| `sanitize-jwt` | Остановить утечку JWT токенов в контекст агента | |
| `sanitize-api-keys` | Остановить утечку ключей API в контекст агента | `additionalPatterns` |
| `sanitize-connection-strings` | Остановить утечку учётных данных базы данных в контекст агента | |
| `sanitize-private-key-content` | Скрыть блоки PEM приватных ключей из вывода | |
| `sanitize-bearer-tokens` | Скрыть токены Authorization Bearer из вывода | |
| `block-env-files` | Удерживать агентов от чтения .env файлов | |
| `protect-env-vars` | Предотвратить вывод переменных окружения | |
| `block-read-outside-cwd` | Удерживать агентов в границах проекта | `allowPaths` |
| `block-secrets-write` | Предотвратить запись в файлы приватных ключей и сертификатов | `additionalPatterns` |
| `block-push-master` | Предотвратить случайные push в main/master | `protectedBranches` |
| `block-work-on-main` | Удерживать агентов от защищённых ветвей | `protectedBranches` |
| `block-force-push` | Предотвратить `git push --force` | |
| `warn-git-amend` | Напомнить агентам перед изменением коммитов | |
| `warn-git-stash-drop` | Напомнить агентам перед удалением стеша | |
| `warn-all-files-staged` | Поймать случайный `git add -A` | |
| `warn-destructive-sql` | Поймать DROP/DELETE SQL перед выполнением | |
| `warn-schema-alteration` | Поймать ALTER TABLE перед выполнением | |
| `warn-large-file-write` | Поймать неожиданно большие записи файлов | `thresholdKb` |
| `warn-package-publish` | Поймать случайный `npm publish` | |
| `warn-background-process` | Поймать непреднамеренные запуски фоновых процессов | |
| `warn-global-package-install` | Поймать непреднамеренные глобальные установки пакетов | |
| …и другие | | |

Полные детали политик и справочник параметров: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## Пользовательские политики

Напишите свои политики, чтобы сделать агентов надёжными и сосредоточенными на задаче:

```js
import { customPolicies, allow, deny, instruct } from "failproofai";

customPolicies.add({
  name: "no-production-writes",
  description: "Заблокировать запись в пути, содержащие 'production'",
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
| `session.cwd` | `string` | Рабочая директория сеанса Claude Code |
| `session.sessionId` | `string` | Идентификатор сеанса |
| `session.transcriptPath` | `string` | Путь к файлу транскрипта сеанса |

Пользовательские hooks поддерживают переходные локальные импорты, async/await и доступ к `process.env`. Ошибки являются fail-open (логируются в `~/.failproofai/hook.log`, встроенные политики продолжают работу). Смотрите [docs/custom-hooks.mdx](docs/custom-hooks.mdx) для полного руководства.

### Политики на основе соглашений

Поместите файлы `*policies.{js,mjs,ts}` в `.failproofai/policies/` и они автоматически загружаются — без флага `--custom` или изменений конфигурации. Работает как git hooks: положите файл, и он просто работает.

```text
# Уровень проекта — зафиксировано в git, общее с командой
.failproofai/policies/security-policies.mjs
.failproofai/policies/workflow-policies.mjs

# Уровень пользователя — персональное, применяется ко всем проектам
~/.failproofai/policies/my-policies.mjs
```

Оба уровня загружаются (объединение). Файлы загружаются в алфавитном порядке в каждой директории. Используйте префиксы `01-`, `02-` и т.д. для контроля порядка. Смотрите [examples/convention-policies/](examples/convention-policies/) для готовых примеров.

---

## Телеметрия

Failproof AI собирает анонимную телеметрию использования через PostHog для понимания использования функций. Содержимое сеанса, имена файлов, входные данные инструментов или личная информация никогда не отправляются.

Отключите это:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## Документация

| Руководство | Описание |
|-----------|----------|
| [Начало работы](docs/getting-started.mdx) | Установка и первые шаги |
| [Встроенные политики](docs/built-in-policies.mdx) | Все 30 встроенных политик с параметрами |
| [Пользовательские политики](docs/custom-policies.mdx) | Напишите свои политики |
| [Конфигурация](docs/configuration.mdx) | Формат файла конфигурации и объединение областей видимости |
| [Панель управления](docs/dashboard.mdx) | Мониторинг сеансов и проверка активности политик |
| [Архитектура](docs/architecture.mdx) | Как работает система hooks |
| [Тестирование](docs/testing.mdx) | Запуск тестов и написание новых |

### Запустите документацию локально

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

Открывает сайт документации Mintlify на `http://localhost:3000`. Контейнер следит за изменениями, если вы примонтируете директорию docs:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## Примечание для участников failproofai

`.claude/settings.json` этого репозитория использует `bun ./bin/failproofai.mjs --hook <EventType>` вместо стандартной команды `npx -y failproofai`. Это потому, что запуск `npx -y failproofai` внутри самого проекта failproofai создаёт конфликт самоссылки.

Для всех других репозиториев рекомендуемый подход — `npx -y failproofai`, установленный с помощью:

```bash
failproofai policies --install --scope project
```

## Помощь в разработке

Смотрите [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Лицензия

Смотрите [LICENSE](LICENSE).

---

Создано и поддерживается **ExosphereHost: Reliability Research Lab for Your Agents**. Мы помогаем предприятиям и стартапам улучшить надёжность своих AI-агентов благодаря собственным агентам, программному обеспечению и опыту. Узнайте больше на [exosphere.host](https://exosphere.host).
```
