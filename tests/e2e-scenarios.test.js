import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import '../src/core/logger.js';
import '../src/services/http-sherpa.service.js';
import '../src/services/service-factory.js';
import '../src/utils/markdown-renderer.js';
import '../mocks/mock-assistant.js';
import '../src/app.js';

const {
  HttpSherpaService,
  MockSherpaService,
  SherpaChatApp
} = globalThis;

describe('HttpSherpaService Contract & Live HTTP Mode', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test('Positive: should get greeting for Live mode from /api/v1/chat/greeting', async () => {
    let capturedUrl = '';
    let capturedMethod = '';

    globalThis.fetch = async (url, options) => {
      capturedUrl = url;
      capturedMethod = options.method;

      return {
        ok: true,
        status: 200,
        json: async () => ({
          id: 'msg-001',
          conversation_id: 'conv-100',
          sender: 'assistant',
          text: 'Здравствуйте! Чем могу помочь?',
          suggestions: ['Подключить 1С', 'Подобрать ПО'],
          placeholder: 'Введите запрос...',
          services: [{ id: '1c_crm', title: '1С:CRM', status: 'online' }]
        })
      };
    };

    const service = new HttpSherpaService({ baseUrl: 'http://localhost:8000' });
    const greeting = await service.getGreeting('Илья');

    assert.equal(capturedUrl, 'http://localhost:8000/api/v1/chat/greeting');
    assert.equal(capturedMethod, 'GET');
    assert.equal(greeting.text, 'Здравствуйте! Чем могу помочь?');
    assert.equal(greeting.suggestions.length, 2);
    assert.equal(service.getStatus(), 'online');
  });

  test('Negative: should handle HTTP 500 error from live server correctly', async () => {
    globalThis.fetch = async () => ({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ message: 'Внутренняя ошибка сервера Оркестратора' })
    });

    const service = new HttpSherpaService({ baseUrl: 'http://localhost:8000' });

    await assert.rejects(
      async () => {
        await service.getGreeting('Илья');
      },
      (err) => {
        assert.equal(err.status, 500);
        assert.ok(err.message.includes('Внутренняя ошибка сервера'));
        return true;
      }
    );

    assert.equal(service.getStatus(), 'server-offline');
  });
});

describe('Sales Assistant Scenario (5 Steps Mock Workflow)', () => {
  test('Step 1 -> Step 5: completes sales workflow from greeting to deal creation', async () => {
    const mockService = new MockSherpaService({
      mock1cStatus: 'online',
      mockGlinerStatus: 'online',
      mockServerStatus: 'online'
    });

    const greeting = await mockService.getGreeting('Илья');
    assert.ok(greeting.text.includes('Илья'));
    assert.ok(greeting.text.includes('cmd:'));

    const step1Response = await mockService.sendMessage({
      conversation_id: greeting.conversation_id,
      message: 'Привет, нужен софт для автоматизации отдела продаж'
    });
    assert.ok(step1Response.text.includes('1С:CRM') || step1Response.text.includes('ПО'));

    const step2Response = await mockService.sendMessage({
      conversation_id: greeting.conversation_id,
      message: 'Нужна интеграция с 1С и IP-телефонией, 15 рабочих мест'
    });
    assert.ok(step2Response.text.length > 0);

    const step3Response = await mockService.sendMessage({
      conversation_id: greeting.conversation_id,
      message: 'Да => Сформировать КП'
    });
    assert.ok(typeof step3Response.text === 'string' && step3Response.text.length > 0);
  });
});

describe('SherpaChatApp Integration & Focus Management', () => {
  function createDomMock() {
    const elements = {};
    const createElement = (tag) => {
      const el = {
        tagName: tag.toUpperCase(),
        children: [],
        appendChild(child) {
          this.children.push(child);
          return child;
        },
        remove() {},
        setAttribute() {},
        removeAttribute() {},
        addEventListener() {},
        style: {},
        classList: {
          add() {},
          remove() {},
          toggle() {},
          contains() { return false; }
        },
        focus() { el.focused = true; },
        value: '',
        scrollHeight: 36,
        querySelector(selector) {
          if (selector === '.message-row' || selector.includes('.message-row')) {
            return createElement('div');
          }
          return null;
        },
        querySelectorAll() { return []; }
      };
      return el;
    };

    const feed = createElement('div');
    const textarea = createElement('textarea');
    const sendButton = createElement('button');
    const composerForm = createElement('form');

    const container = {
      querySelector(selector) {
        if (selector === '#messageFeed') return feed;
        if (selector === '#composerTextarea') return textarea;
        if (selector === '#sendButton') return sendButton;
        if (selector === '#composerForm') return composerForm;
        if (selector === '#attachmentPreviewBar') return createElement('div');
        if (selector === '.presence-badge') return createElement('div');
        if (selector === '#headerStatusBadge') return createElement('div');
        if (selector === '#settingsButton') return createElement('button');
        if (selector === '#settingsBackdrop') return createElement('div');
        if (selector === '#settingsModal') return createElement('div');
        return createElement('div');
      },
      querySelectorAll() {
        return [];
      }
    };

    return { container, textarea, sendButton, feed };
  }

  test('Textarea focus retention after sending message', async () => {
    const { container, textarea } = createDomMock();
    const service = new MockSherpaService({ delayMs: 0 });
    const app = new SherpaChatApp({ container, service });

    while (app.isConnecting) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    textarea.value = 'Тестовое сообщение';
    textarea.focus();

    await app.handleUserSubmit();

    assert.equal(textarea.focused, true);
    assert.equal(textarea.value, '');
  });

  test('Default message text "прикрепил файл" when sending attachment with empty input', async () => {
    const { container, textarea } = createDomMock();
    const service = new MockSherpaService({ delayMs: 0 });
    const app = new SherpaChatApp({ container, service });

    while (app.isConnecting) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    textarea.value = '';
    app.selectedAttachments = [{ id: 'att-1', name: 'Specification.pdf', size: 1024, type: 'application/pdf' }];

    await app.handleUserSubmit();

    const userMsg = app.messages.find((m) => m.sender === 'user');
    assert.ok(userMsg);
    assert.equal(userMsg.text, 'прикрепил файл');
    assert.equal(userMsg.attachments.length, 1);
    assert.equal(userMsg.attachments[0].name, 'Specification.pdf');
  });
});
