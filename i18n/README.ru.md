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

Самый простой способ управлять политиками, которые делают ваших ИИ-агентов надёжными, сфокусированными на задаче и способными работать автономно — для **Claude Code** и **Agents SDK**.

- **30 встроенных политик** — выявляйте типичные сбои агентов прямо из коробки. Блокируйте деструктивные команды, предотвращайте утечки секретов, удерживайте агентов в пределах проекта, обнаруживайте зацикливание и многое другое.
- **Пользовательские политики** — пишите собственные правила надёжности на JavaScript. Используйте API `allow`/`deny`/`instruct` для соблюдения соглашений, предотвращения дрейфа, контроля операций или интеграции с внешними системами.
- **Простая настройка** — настраивайте любую политику без написания кода. Задавайте списки разрешённых значений, защищённые ветки, пороги для отдельных проектов или глобально. Три области конфигурации объединяются автоматически.
- **Монитор агентов** — смотрите, что делали ваши агенты, пока вас не было. Просматривайте сессии, изучайте каждый вызов инструмента и проверяйте, где именно сработали политики.

Всё работает локально — никакие данные не покидают ваш компьютер.

---

## Требования

- Node.js >= 20.9.0
- Bun >= 1.3.0 (опционально — нужен только для разработки или сборки из исходников)

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

Записывает записи хуков в `~/.claude/settings.json`. Теперь Claude Code будет вызывать failproofai до и после каждого вызова инструмента.

### 2. Запустите дашборд

```bash
failproofai
```

Открывает `http://localhost:8020` — просматривайте сессии, изучайте логи, управляйте политиками.

### 3. Проверьте активные политики

```bash
failproofai policies
```

---

## Установка политик

### Области видимости

| Область | Команда | Куда записывает |
|---------|---------|-----------------|
| Глобальная (по умолчанию) | `failproofai policies --install` | `~/.claude/settings.json` |
| Проект | `failproofai policies --install --scope project` | `.claude/settings.json` |
| Локальная | `failproofai policies --install --scope local` | `.claude/settings.local.json` |

### Установка конкретных политик

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

Конфигурация политик хранится в `~/.failproofai/policies-config.json` (глобально) или `.failproofai/policies-config.json` в вашем проекте (на уровне проекта).

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

**Три области конфигурации** объединяются автоматически (проект → локальная → глобальная). Полные правила объединения см. в [docs/configuration.mdx](docs/configuration.mdx).

---

## Встроенные политики

| Политика | Описание | Настраиваемые параметры |
|----------|----------|:-----------------------:|
| `block-sudo` | Запрещает агентам выполнять привилегированные системные команды | `allowPatterns` |
| `block-rm-rf` | Предотвращает случайное рекурсивное удаление файлов | `allowPaths` |
| `block-curl-pipe-sh` | Запрещает агентам передавать ненадёжные скрипты в оболочку | |
| `block-failproofai-commands` | Предотвращает самоудаление | |
| `sanitize-jwt` | Останавливает утечку JWT-токенов в контекст агента | |
| `sanitize-api-keys` | Останавливает утечку API-ключей в контекст агента | `additionalPatterns` |
| `sanitize-connection-strings` | Останавливает утечку учётных данных базы данных в контекст агента | |
| `sanitize-private-key-content` | Скрывает блоки PEM приватных ключей из вывода | |
| `sanitize-bearer-tokens` | Скрывает токены Authorization Bearer из вывода | |
| `block-env-files` | Запрещает агентам читать .env-файлы | |
| `protect-env-vars` | Запрещает агентам выводить переменные окружения | |
| `block-read-outside-cwd` | Удерживает агентов в пределах проекта | `allowPaths` |
| `block-secrets-write` | Запрещает запись в файлы приватных ключей и сертификатов | `additionalPatterns` |
| `block-push-master` | Предотвращает случайные пуши в main/master | `protectedBranches` |
| `block-work-on-main` | Удерживает агентов вне защищённых веток | `protectedBranches` |
| `block-force-push` | Запрещает `git push --force` | |
| `warn-git-amend` | Напоминает агентам перед изменением коммитов | |
| `warn-git-stash-drop` | Напоминает агентам перед удалением стешей | |
| `warn-all-files-staged` | Отлавливает случайный `git add -A` | |
| `warn-destructive-sql` | Перехватывает DROP/DELETE SQL перед выполнением | |
| `warn-schema-alteration` | Перехватывает ALTER TABLE перед выполнением | |
| `warn-large-file-write` | Отлавливает неожиданно большую запись файлов | `thresholdKb` |
| `warn-package-publish` | Отлавливает случайный `npm publish` | |
| `warn-background-process` | Отлавливает непреднамеренный запуск фоновых процессов | |
| `warn-global-package-install` | Отлавливает непреднамеренную глобальную установку пакетов | |
| …и другие | | |

Полное описание политик и справочник по параметрам: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## Пользовательские политики

Пишите собственные политики, чтобы агенты оставались надёжными и сфокусированными на задаче:

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

Установите с помощью:

```bash
failproofai policies --install --custom ./my-policies.js
```

### Вспомогательные функции принятия решений

| Функция | Действие |
|---------|----------|
| `allow()` | Разрешить операцию |
| `allow(message)` | Разрешить и передать информационный контекст в Claude *(бета)* |
| `deny(message)` | Заблокировать операцию; сообщение показывается Claude |
| `instruct(message)` | Добавить контекст в промпт Claude; не блокирует |

### Объект контекста (`ctx`)

| Поле | Тип | Описание |
|------|-----|----------|
| `eventType` | `string` | `"PreToolUse"`, `"PostToolUse"`, `"Notification"`, `"Stop"` |
| `toolName` | `string` | Вызываемый инструмент (`"Bash"`, `"Write"`, `"Read"`, …) |
| `toolInput` | `object` | Входные параметры инструмента |
| `payload` | `object` | Полная необработанная полезная нагрузка события |
| `session.cwd` | `string` | Рабочая директория сессии Claude Code |
| `session.sessionId` | `string` | Идентификатор сессии |
| `session.transcriptPath` | `string` | Путь к файлу транскрипта сессии |

Пользовательские хуки поддерживают транзитивные локальные импорты, async/await и доступ к `process.env`. Ошибки не блокируют работу (логируются в `~/.failproofai/hook.log`, встроенные политики продолжают работать). Полное руководство см. в [docs/custom-hooks.mdx](docs/custom-hooks.mdx).

---

## Телеметрия

Failproof AI собирает анонимную телеметрию использования через PostHog для понимания того, как используются функции. Содержимое сессий, имена файлов, входные данные инструментов и персональная информация никогда не передаются.

Отключить:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## Документация

| Руководство | Описание |
|-------------|----------|
| [Начало работы](docs/getting-started.mdx) | Установка и первые шаги |
| [Встроенные политики](docs/built-in-policies.mdx) | Все 30 встроенных политик с параметрами |
| [Пользовательские политики](docs/custom-policies.mdx) | Создание собственных политик |
| [Конфигурация](docs/configuration.mdx) | Формат конфигурационного файла и объединение областей |
| [Дашборд](docs/dashboard.mdx) | Мониторинг сессий и просмотр активности политик |
| [Архитектура](docs/architecture.mdx) | Как работает система хуков |
| [Тестирование](docs/testing.mdx) | Запуск тестов и написание новых |

### Локальный запуск документации

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

Открывает сайт документации Mintlify по адресу `http://localhost:3000`. Контейнер отслеживает изменения, если вы монтируете директорию с документацией:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## Вклад в проект

См. [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Лицензия

См. [LICENSE](LICENSE).
