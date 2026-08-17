import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { MockSherpaService } from '../mocks/mock-assistant.js';

describe('MockSherpaService Contract & Domain Logic', () => {
  test('Positive: should return DBMS recommendations with Markdown tables and suggestions', async () => {
    const service = new MockSherpaService({ delayMs: 10 });
    const response = await service.sendMessage({
      message: 'Подбери отечественную СУБД для 1С'
    });

    assert.equal(response.sender, 'assistant');
    assert.ok(response.id, 'Response must have UUID id');
    assert.ok(response.conversation_id, 'Response must have conversation_id');
    assert.ok(response.text.includes('Postgres Pro'), 'Must recommend Postgres Pro');
    assert.ok(response.text.includes('| Продукт | Вендор |'), 'Must include markdown table header');
    assert.ok(Array.isArray(response.suggestions), 'Must include suggestions array');
    assert.ok(response.suggestions.length > 0, 'Suggestions must not be empty');
  });

  test('Positive: should return OS recommendations for Linux queries', async () => {
    const service = new MockSherpaService({ delayMs: 10 });
    const response = await service.sendMessage({
      message: 'Какие есть лицензии Astra Linux?'
    });

    assert.equal(response.sender, 'assistant');
    assert.ok(response.text.includes('Astra Linux'), 'Must mention Astra Linux');
    assert.ok(response.text.includes('ФСТЭК'), 'Must mention certifications');
    assert.ok(response.suggestions.some((s) => s.includes('Astra Linux')), 'Must include relevant chip');
  });

  test('Positive: should return 1C licensing advice for 1C queries', async () => {
    const service = new MockSherpaService({ delayMs: 10 });
    const response = await service.sendMessage({
      message: 'Как лицензируется 1С сервер и клиенты?'
    });

    assert.equal(response.sender, 'assistant');
    assert.ok(response.text.includes('1С:Предприятие 8'), 'Must describe 1C Enterprise');
    assert.ok(response.text.includes('ПРОФ') && response.text.includes('КОРП'), 'Must contrast PROF and CORP');
  });

  test('Negative (Expected Failure): should throw 500 error when failNext is set', async () => {
    const service = new MockSherpaService({ delayMs: 10 });
    service.setFailNext(true);

    await assert.rejects(
      async () => {
        await service.sendMessage({ message: 'Любой запрос' });
      },
      (err) => {
        assert.equal(err.status, 500);
        assert.equal(err.code, 'LLM_SERVICE_UNAVAILABLE');
        assert.ok(err.message.includes('временно недоступен'));
        return true;
      }
    );
  });
});
