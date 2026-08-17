import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import '../src/app.js';

const SherpaChatApp = globalThis.SherpaChatApp;

describe('Markdown Parser in SherpaChatApp', () => {
  const app = new SherpaChatApp({
    container: {
      querySelector: () => null,
      querySelectorAll: () => []
    }
  });

  test('Positive: parses tables properly into <table>, <thead>, <tbody>, <tr>, <th>, <td>', () => {
    const md = `| Продукт | Цена |
|---|---|
| **Astra Linux** | 15 000 ₽ |
| **Postgres Pro** | 120 000 ₽ |`;

    const html = app.parseMarkdown(md);
    assert.ok(html.includes('<table><thead><tr><th>Продукт</th><th>Цена</th></tr></thead>'), 'Should create table header');
    assert.ok(html.includes('<tbody><tr><td><strong>Astra Linux</strong></td><td>15 000 ₽</td></tr>'), 'Should create table body row');
    assert.ok(html.includes('<td><strong>Postgres Pro</strong></td>'), 'Should support bold inside table');
  });

  test('Positive: parses lists and inline formatting', () => {
    const md = `- Первый пункт с **жирным** текстом
- Второй пункт с \`кодом\`
- Третий с *курсивом*`;

    const html = app.parseMarkdown(md);
    assert.ok(html.includes('<ul>'), 'Should wrap in <ul>');
    assert.ok(html.includes('<li>Первый пункт с <strong>жирным</strong> текстом</li>'), 'Should format bold');
    assert.ok(html.includes('<li>Второй пункт с <code>кодом</code></li>'), 'Should format inline code');
    assert.ok(html.includes('<li>Третий с <em>курсивом</em></li>'), 'Should format italic');
    assert.ok(html.includes('</ul>'), 'Should close </ul>');
  });

  test('Positive: parses plain paragraphs', () => {
    const md = 'Привет, я Шерпа.\nЧем помочь?';
    const html = app.parseMarkdown(md);
    assert.ok(html.includes('<p>Привет, я Шерпа.</p>'), 'Should wrap line in paragraph');
    assert.ok(html.includes('<p>Чем помочь?</p>'), 'Should wrap second line in paragraph');
  });
});
