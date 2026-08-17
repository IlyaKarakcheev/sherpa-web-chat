---
name: fast-new-component
description: Scaffold an isolated standalone component repository (Polyrepo) according to Cursor Component Factory standards. Use when creating a new component repository or when the user says /new-component, /new-repo, or asks to create a component repository.
---

# Cursor Component Factory: Component Repository Initialization (/new-component, /new-repo)

This skill guides the agent through bootstrapping a new, isolated component repository according to `Cursor Component Factory` standards (`Prototype → Ready` lifecycle).

## Core Rules

1. Follow `fast-workflow/CORE_WORKFLOW.md` and `fast-workflow/COMPONENT_REPO_WORKFLOW.md`.
2. Each component is a **standalone Git repository** with its own `.git`, rules, tests, and mock definitions.
3. Every component has a passport `COMPONENT.md` with status `Prototype` and an approved contract schema draft.
4. Always initialize Git (branch `main`) and create the initial commit.

## Workflow

### 1. Gather Parameters

Identify or confirm from user prompt:
- **Component Name:** in `kebab-case` (e.g., `billing-service`, `auth-module`).
- **Purpose & Scope:** 1–2 sentences explaining business responsibility.
- **Tech Stack & Contract Standard:**
  - `REST / HTTP`: OpenAPI 3.1 (`contracts/api/<name>-v1.yaml`)
  - `TypeScript Domain`: Zod / TypeBox (`contracts/domain/<name>-models.ts`)
  - `Python Domain`: Pydantic v2 (`contracts/domain/<name>_models.py`)
  - `1C:Enterprise`: OpenAPI / BSL TypeDoc
  - `Async / Events`: AsyncAPI / JSON Schema (`contracts/events/<name>-events-v1.json`)
- **Target Location:** target directory path (e.g., `d:\__ai-factory\projects\<name>` or `../<name>`).

### 2. Create Directory Structure

Create the required directories in the target component folder:
- `product/features/`
- `contracts/api/`, `contracts/events/`, `contracts/domain/`
- `src/`
- `mocks/`
- `tests/unit/`, `tests/integration/`

### 3. Generate Component Passport (`COMPONENT.md`)

Create `COMPONENT.md`:

```markdown
# <component-name>

## Назначение
<Краткое описание ответственности>

## Входы
- Параметры запроса согласно contracts/

## Выходы
- Результаты обработки и типизированные ошибки

## Ответственность
- <Ключевые бизнес-правила>

## Не отвечает за
- Задачи и логику соседних модулей

## Зависимости
- Zero-Manual Mocks из схем контрактов

## Связанные контракты
- contracts/api/<component-name>-v1.yaml (v1.0.0)

## Версия
0.1.0

## Статус
Prototype

## Проверенная ревизия
Не назначена (Prototype)

## Открытые вопросы
- [ ] Уточнить граничные условия и правила валидации
```

### 4. Generate Initial Contract Schema

Create starter schema in `contracts/api/<component-name>-v1.yaml` (e.g., OpenAPI 3.1):

```yaml
openapi: 3.1.0
info:
  title: <component-name> API
  version: 1.0.0
  description: <purpose>
paths:
  /health:
    get:
      summary: Health check
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    example: "ok"
```

### 5. Generate Starter README.md

Create `README.md`:

```markdown
# <component-name>

## Назначение
<Краткое описание бизнес-роли и используемого стека>

## Статус и версия
- **Версия:** 0.1.0
- **Статус:** Prototype
- **Проверенная ревизия:** Не назначена (Prototype)

## Что нового в последней версии
- Начальная инициализация репозитория и контракта.

## Инструкция по развертыванию и запуску
### Режим с Zero-Manual Mocks (автономный)
<Команды запуска с моками>

### Живой / боевой режим
<Команды запуска>

## Инструкция по тестированию
<Команды запуска тестов>
```

### 6. Copy Cursor Rules & Fast-Workflow Guidelines

Copy into the component repository root:
1. `.cursor/rules/` (`component-workflow.mdc`, `component-repo-workflow.mdc`, `integration-repo-workflow.mdc`).
2. `.cursor/skills/` (`fast-new-component`, `fast-new-integration`, `fast-spec`, `fast-implement`, `fast-integrate`).
3. `fast-workflow/` core documentation files.
4. `.gitignore`:

```text
**/node_modules/**
**/dist/**
**/build/**
**/coverage/**
*.log
**/*.secret
**/*.env*
```

### 7. Initialize Git & Make Initial Commit

1. Run `git init -b main` in the component directory.
2. Run `git add .`
3. Run `git commit -m "Initial commit: scaffold <component-name> component repository"`

### 8. Report to User

Provide a structured summary:
1. **Путь к созданному репозиторию:** (Full path).
2. **Созданные артефакты:** `README.md`, `COMPONENT.md`, `contracts/`, `.cursor/`, `.gitignore`.
3. **Статус:** `Prototype` (v0.1.0).
4. **Следующий шаг:**
   - Открыть репозиторий в Cursor: `cursor "<путь>"`.
   - Запустить проектирование первой фичи: `/spec <требование>`.
