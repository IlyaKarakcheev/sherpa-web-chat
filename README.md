# sherpa-web-chat

## Назначение
Тонкий клиентский интерфейс веб-чата для интеллектуального ассистента Outlook и 1С:CRM. Разработан на React 18 с использованием Microsoft Fluent UI v9 (`@fluentui/react-components`) и оптимизирован для узкой боковой панели Outlook (ширина 320–360px). Поддерживает рендеринг разметки Markdown GFM, бейджей сущностей, шагов стриминга FSM, кнопок быстрых ответов (Keyboard-First), плашки реплая (Reply Banner) и копирования ссылок `e1cib` в буфер обмена с Toast-уведомлением.

**Технологический стек:** React 18+, TypeScript, Vite, Microsoft Fluent UI v9, `react-markdown` + `remark-gfm`, Vitest, React Testing Library.

---

## Текущий статус и версия
- **Версия:** `0.1.0`
- **Статус:** `Ready`
- **Проверенная ревизия:** `v0.1.0`

---

## Что нового в последней версии (Changelog v0.1.0)
- Реализованы компоненты интерфейса Fluent UI v9: `ChatPanel`, `MarkdownRenderer`, `EntityChips`, `StreamingSteps`, `ReplyBanner`, `QuickReplies`, `ErrorBanner`, `EmailUpload`, `MessageItemView`.
- Реализован безопасный перехват ссылок 1С (`e1cib/data/...`) с копированием в буфер обмена (`navigator.clipboard.writeText`) и всплывающим Toast `✔ Скопировано`.
- Реализована Keyboard-First навигация по горячим цифровым клавишам `1..9` и закрытие плашки реплая по `Esc`.
- Реализован Drag-and-Drop и файловый инпут для загрузки писем `.msg` / `.eml`.
- Реализован Zero-Manual Mocks suite (`MockChatService`, фикстуры протокола, эмуляция потока SSE и ошибок 409/400).
- Написаны и успешно пройдены 24 автоматических теста (Vitest + React Testing Library) по спецификации `initial-spec.md`.

---

## Инструкция по развертыванию и запуску

### 1. Установка зависимостей
```bash
npm install
```

### 2. Запуск в режиме с Zero-Manual Mocks (автономный режим в браузере)
Запуск интерфейса с эмуляцией ответов оркестратора, SSE-стриминга и ошибок без необходимости поднятия бэкенда:
```bash
npm run dev:mock
```
Приложение откроется по адресу: `http://localhost:3000`.

---

### 3. Запуск в рабочем/live режиме
Подключение к реальному серверу `sherpa-agent-server` (по умолчанию `http://localhost:8000`):
```bash
npm run dev
```

---

### 4. Сборка для публикации (Production Build)
```bash
npm run build
```
Статические файлы сборки будут сгенерированы в каталоге `dist/`.

---

## Инструкция по тестированию

Запуск всех модульных и компонентных тестов:
```bash
npm test
```

Запуск тестов с отчетом о покрытии кода:
```bash
npm run test:coverage
```
