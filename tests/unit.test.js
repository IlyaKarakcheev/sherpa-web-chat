import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import '../src/core/logger.js';
import '../src/services/http-sherpa.service.js';
import '../src/services/service-factory.js';
import '../src/utils/markdown-renderer.js';
import '../mocks/mock-assistant.js';
import '../src/app.js';

const {
  ChatLogger,
  HttpSherpaService,
  SherpaServiceFactory,
  MarkdownRenderer,
  MockSherpaService,
  SherpaChatApp
} = globalThis;

describe('Unit Tests: ChatLogger', () => {
  test('ChatLogger: logs entries, emits notifications to subscribers, and supports formatting and clearing', () => {
    const logger = new ChatLogger({ maxLogs: 10 });
    const receivedEntries = [];

    const unsubscribe = logger.subscribe((entry, allLogs) => {
      if (entry) receivedEntries.push(entry);
    });

    logger.log('info', 'SYS', 'Система запущена');
    logger.log('info', 'USER', 'Запрос пользователя', { query: 'Привет' });
    logger.log('warn', '1C', 'Предупреждение 1С');
    logger.log('error', 'HTTP', 'Ошибка сети 500');

    assert.equal(logger.getLogs().length, 4);
    assert.equal(receivedEntries.length, 4);
    assert.equal(receivedEntries[0].tag, 'SYS');
    assert.equal(receivedEntries[1].data.query, 'Привет');

    const formatted = logger.getFormattedText();
    assert.ok(formatted.includes('[SYS]'));
    assert.ok(formatted.includes('Система запущена'));

    logger.clear();
    assert.equal(logger.getLogs().length, 0);

    unsubscribe();
    logger.log('info', 'SYS', 'Новое сообщение после отписки');
    assert.equal(receivedEntries.length, 4);
  });
});

describe('Unit Tests: HttpSherpaService & Suggestion Card Command Extractors', () => {
  const service = new HttpSherpaService();

  test('extractSuggestionCommandText: extracts pure command name removing prefixes and descriptions', () => {
    assert.equal(service.extractSuggestionCommandText('Да => Подобрать решения'), 'Подобрать решения');
    assert.equal(service.extractSuggestionCommandText('! 1. Подходит — формируем КП => Сформировать КП'), 'Сформировать КП');
    assert.equal(service.extractSuggestionCommandText('~ 2. Отмена'), '2. Отмена');
    assert.equal(service.extractSuggestionCommandText(''), '');
  });

  test('formatResponseText: creates formatted markdown text with inline cmd links', () => {
    const reply = 'Выберите один из вариантов:';
    const suggestions = ['! Да => Выбрать Да', '~ Нет'];
    const placeholder = 'Ожидание выбора...';

    const result = service.formatResponseText(reply, suggestions, placeholder);

    assert.ok(result.includes('Выберите один из вариантов:'));
    assert.ok(result.includes('[! 1. Да](cmd:Выбрать Да)'));
    assert.ok(result.includes('[~ 2. Нет](cmd:Нет)'));
    assert.ok(result.includes(':::placeholder Ожидание выбора... :::'));
  });
});

describe('Unit Tests: MarkdownRenderer', () => {
  test('MarkdownRenderer: escapes HTML to prevent XSS injection', () => {
    const raw = '<script>alert("xss")</script>';
    const escaped = MarkdownRenderer.escapeHtml(raw);
    assert.ok(!escaped.includes('<script>'));
    assert.ok(escaped.includes('&lt;script&gt;'));
  });

  test('MarkdownRenderer: parses inline command links [Label](cmd:Command) to button tags', () => {
    const markdown = '[! Подходит => КП](cmd:Сформировать КП)';
    const html = MarkdownRenderer.render(markdown);
    assert.ok(html.includes('<button type="button" class="chip-button suggestion-chip primary" data-chip="Сформировать КП">Подходит =&gt; КП</button>'));
  });

  test('MarkdownRenderer: parses lists, headings, and dividers', () => {
    const md = '# Заголовок\n---\n- Элемент 1\n- Элемент 2';
    const html = MarkdownRenderer.render(md);
    assert.ok(html.includes('<h1 class="bubble-heading">Заголовок</h1>'));
    assert.ok(html.includes('<hr class="bubble-divider" />'));
    assert.ok(html.includes('<ul><li>Элемент 1</li><li>Элемент 2</li></ul>'));
  });

  test('MarkdownRenderer: parses :::facts directive into structured facts container', () => {
    const md = ':::facts\n- Клиент :: ООО Вектор\n- ИНН :: 7701234567\n:::';
    const html = MarkdownRenderer.render(md);
    assert.ok(html.includes('<div class="facts">'));
    assert.ok(html.includes('<span>Клиент</span>'));
    assert.ok(html.includes('<strong>ООО Вектор</strong>'));
  });

  test('MarkdownRenderer: parses :::deal-card directive into option card', () => {
    const md = ':::deal-card\n[Выбрать ПО](cmd:Выбрать ПО) :: Совпадение 95%\n1С:Предприятие 8.3\nАвтоматизация учета\n:::';
    const html = MarkdownRenderer.render(md);
    assert.ok(html.includes('<button type="button" class="option-card deal-card" data-chip="Выбрать ПО">'));
    assert.ok(html.includes('<span class="match">Совпадение 95%</span>'));
  });

  test('MarkdownRenderer: handles :::placeholder directive via callback', () => {
    let capturedPlaceholder = '';
    const md = ':::placeholder Укажите число рабочих мест :::';
    MarkdownRenderer.render(md, {
      onUpdatePlaceholder: (val) => {
        capturedPlaceholder = val;
      }
    });
    assert.equal(capturedPlaceholder, 'Укажите число рабочих мест');
  });
});

describe('Unit Tests: SherpaServiceFactory', () => {
  test('SherpaServiceFactory: creates MockSherpaService by default', () => {
    const service = SherpaServiceFactory.createService({ mode: 'mock', mock1cStatus: 'online' });
    assert.ok(service instanceof MockSherpaService);
    assert.equal(service.getStatus(), 'full');
  });

  test('SherpaServiceFactory: creates HttpSherpaService for live mode', () => {
    const service = SherpaServiceFactory.createService({ mode: 'live', apiUrl: 'http://localhost:8000' });
    assert.ok(service instanceof HttpSherpaService);
    assert.equal(service.baseUrl, 'http://localhost:8000');
  });
});
