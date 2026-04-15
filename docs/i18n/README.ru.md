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

Самый простой способ управлять политиками, которые делают ваших AI-агентов надежными, сосредоточенными и способными работать автономно — для **Claude Code** и **Agents SDK**.

- **30 встроенных политик** - Предотвращайте типичные сбои агентов уже из коробки. Блокируйте деструктивные команды, предотвращайте утечку секретов, держите агентов в границах проекта, обнаруживайте циклы и многое другое.
- **Пользовательские политики** - Напишите собственные правила надежности на JavaScript. Используйте API `allow`/`deny`/`instruct` для обеспечения соглашений, предотвращения отклонений, управления операциями или интеграции с внешними системами.
- **Простая конфигурация** - Настраивайте любую политику без написания кода. Устанавливайте списки разрешений, защищенные ветви, пороги для каждого проекта или глобально. Конфигурация трех уровней автоматически объединяется.
- **Монитор агентов** - Узнайте, что делали ваши агенты, пока вас не было. Просматривайте сеансы, проверяйте каждый вызов инструмента и смотрите, где именно сработали политики.

Всё работает локально — никакие данные не покидают вашу машину.

---

## Требования

- Node.js >= 20.9.0
- Bun >= 1.3.0 (необязательно — требуется только для разработки / сборки из исходного кода)

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

Добавляет записи перехватчиков в `~/.claude/settings.json`. Теперь Claude Code будет вызывать failproofai до и после каждого вызова инструмента.

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

### Уровни

| Уровень | Команда | Где записывает |
|---------|---------|----------------|
| Глобальный (по умолчанию) | `failproofai policies --install` | `~/.claude/settings.json` |
| Проект | `failproofai policies --install --scope project` | `.claude/settings.json` |
| Локальный | `failproofai policies --install --scope local` | `.claude/settings.local.json` |

### Установите конкретные политики

```bash
failproofai policies --install block-sudo block-rm-rf sanitize-api-keys
```

### Удаление политик

```bash
failproofai policies --uninstall
# или для конкретного уровня:
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
      "hint": "Use apt-get directly without sudo."
    },
    "block-push-master": {
      "protectedBranches": ["main", "release", "prod"],
      "hint": "Try creating a fresh branch instead."
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

**Три уровня конфигурации** автоматически объединяются (проект → локальный → глобальный). Полные правила объединения см. в [docs/configuration.mdx](docs/configuration.mdx).

---

## Встроенные политики

| Политика | Описание | Настраиваемо |
|----------|---------|:---:|
| `block-sudo` | Предотвратите запуск привилегированных системных команд агентами | `allowPatterns` |
| `block-rm-rf` | Предотвратите случайное рекурсивное удаление файлов | `allowPaths` |
| `block-curl-pipe-sh` | Предотвратите передачу ненадежных скриптов агентами в оболочку | |
| `block-failproofai-commands` | Предотвратите самоудаление | |
| `sanitize-jwt` | Остановите утечку JWT-токенов в контекст агента | |
| `sanitize-api-keys` | Остановите утечку API-ключей в контекст агента | `additionalPatterns` |
| `sanitize-connection-strings` | Остановите утечку учетных данных базы данных в контекст агента | |
| `sanitize-private-key-content` | Скройте блоки PEM-ключей из выходных данных | |
| `sanitize-bearer-tokens` | Скройте токены Authorization Bearer из выходных данных | |
| `block-env-files` | Не позволяйте агентам читать файлы .env | |
| `protect-env-vars` | Предотвратите вывод переменных окружения агентами | |
| `block-read-outside-cwd` | Держите агентов внутри границ проекта | `allowPaths` |
| `block-secrets-write` | Предотвратите запись в файлы приватных ключей и сертификатов | `additionalPatterns` |
| `block-push-master` | Предотвратите случайные отправки на main/master | `protectedBranches` |
| `block-work-on-main` | Держите агентов от защищенных ветвей | `protectedBranches` |
| `block-force-push` | Предотвратите `git push --force` | |
| `warn-git-amend` | Напомните агентам перед изменением коммитов | |
| `warn-git-stash-drop` | Напомните агентам перед удалением сохранений | |
| `warn-all-files-staged` | Поймайте случайный `git add -A` | |
| `warn-destructive-sql` | Поймайте DROP/DELETE SQL перед выполнением | |
| `warn-schema-alteration` | Поймайте ALTER TABLE перед выполнением | |
| `warn-large-file-write` | Поймайте неожиданно большие записи файлов | `thresholdKb` |
| `warn-package-publish` | Поймайте случайный `npm publish` | |
| `warn-background-process` | Поймайте непреднамеренные фоновые процессы | |
| `warn-global-package-install` | Поймайте непреднамеренные глобальные установки пакетов | |
| …и еще | | |

Полная информация о политиках и справочник параметров: [docs/built-in-policies.mdx](docs/built-in-policies.mdx)

---

## Пользовательские политики

Напишите собственные политики, чтобы ваши агенты были надежными и сосредоточенными:

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

### Вспомогательные функции для решений

| Функция | Эффект |
|---------|--------|
| `allow()` | Разрешить операцию |
| `allow(message)` | Разрешить и отправить информационный контекст Claude *(бета)* |
| `deny(message)` | Заблокировать операцию; сообщение показано Claude |
| `instruct(message)` | Добавить контекст в подсказку Claude; не блокирует |

### Объект контекста (`ctx`)

| Поле | Тип | Описание |
|------|-----|---------|
| `eventType` | `string` | `"PreToolUse"`, `"PostToolUse"`, `"Notification"`, `"Stop"` |
| `toolName` | `string` | Вызываемый инструмент (`"Bash"`, `"Write"`, `"Read"`, …) |
| `toolInput` | `object` | Входные параметры инструмента |
| `payload` | `object` | Полный необработанный payload события |
| `session.cwd` | `string` | Рабочая директория сеанса Claude Code |
| `session.sessionId` | `string` | Идентификатор сеанса |
| `session.transcriptPath` | `string` | Путь к файлу стенограммы сеанса |

Пользовательские перехватчики поддерживают переходные локальные импорты, async/await и доступ к `process.env`. Ошибки безопасны (логируются в `~/.failproofai/hook.log`, встроенные политики продолжают работу). Полное руководство см. в [docs/custom-hooks.mdx](docs/custom-hooks.mdx).

### Политики на основе соглашений (v0.0.2-beta.7+)

Поместите файлы `*policies.{js,mjs,ts}` в `.failproofai/policies/` — они будут автоматически загружены без флага `--custom` или изменения конфигурации. Работает как git-хуки: поместите файл, и всё работает.

```text
# Уровень проекта — коммитится в git, общее с командой
.failproofai/policies/security-policies.mjs
.failproofai/policies/workflow-policies.mjs

# Уровень пользователя — личное, применяется ко всем проектам
~/.failproofai/policies/my-policies.mjs
```

Загружаются оба уровня (объединение). Файлы загружаются в алфавитном порядке внутри каждой директории. Используйте префиксы `01-`, `02-`, и т.д., чтобы контролировать порядок. Готовые примеры см. в [examples/convention-policies/](examples/convention-policies/).

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
|-----------|---------|
| [Начало работы](docs/getting-started.mdx) | Установка и первые шаги |
| [Встроенные политики](docs/built-in-policies.mdx) | Все 30 встроенных политик с параметрами |
| [Пользовательские политики](docs/custom-policies.mdx) | Напишите собственные политики |
| [Конфигурация](docs/configuration.mdx) | Формат файла конфигурации и объединение уровней |
| [Панель управления](docs/dashboard.mdx) | Мониторинг сеансов и проверка активности политик |
| [Архитектура](docs/architecture.mdx) | Как работает система перехватчиков |
| [Тестирование](docs/testing.mdx) | Запуск тестов и написание новых |

### Запустите документацию локально

```bash
docker build -f Dockerfile.docs -t failproofai-docs .
docker run --rm -p 3000:3000 failproofai-docs
```

Откроет сайт документации Mintlify на `http://localhost:3000`. Контейнер отслеживает изменения, если вы монтируете директорию документов:

```bash
docker run --rm -p 3000:3000 -v $(pwd)/docs:/app/docs failproofai-docs
```

---

## Примечание для участников failproofai

`.claude/settings.json` этого репозитория использует `bun ./bin/failproofai.mjs --hook <EventType>` вместо стандартной команды `npx -y failproofai`. Это потому, что запуск `npx -y failproofai` внутри самого проекта failproofai создает конфликт самоссылающихся ссылок.

Для всех остальных репозиториев рекомендуемый подход — `npx -y failproofai`, установленный с помощью:

```bash
failproofai policies --install --scope project
```

## Участие в разработке

См. [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Лицензия

См. [LICENSE](LICENSE).

---

Создано и поддерживается компанией **ExosphereHost: Reliability Research Lab for Your Agents**. Мы помогаем предприятиям и стартапам повысить надежность своих AI-агентов через собственные агенты, программное обеспечение и экспертизу. Узнайте больше на [exosphere.host](https://exosphere.host).
```
