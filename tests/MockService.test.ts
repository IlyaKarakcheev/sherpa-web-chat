import { describe, it, expect, vi } from 'vitest';
import { MockChatService } from '../mocks/mockService';
import { SSEEvent } from '../contracts/front/types';

describe('MockChatService', () => {
  it('returns health check status ok', async () => {
    const service = new MockChatService();
    const res = await service.healthCheck();
    expect(res.status).toBe('ok');
    expect(res.mock_mode).toBe(true);
  });

  it('streams SSE events sequence correctly', async () => {
    const service = new MockChatService({ streamingStepDelayMs: 5 });
    const events: SSEEvent[] = [];
    const donePromise = new Promise<void>((resolve) => {
      service.streamSessionEvents(
        'test-session',
        (ev) => {
          events.push(ev);
        },
        undefined,
        () => resolve()
      );
    });

    await donePromise;
    expect(events.length).toBeGreaterThanOrEqual(5);
    expect(events.some((e) => e.type === 'step')).toBe(true);
    expect(events.some((e) => e.type === 'message')).toBe(true);
    expect(events.some((e) => e.type === 'suggestions')).toBe(true);
    expect(events.some((e) => e.type === 'done')).toBe(true);
  });

  it('handles network error in streaming', async () => {
    const service = new MockChatService({ simulateNetworkError: true });
    const onError = vi.fn();
    service.streamSessionEvents('test-session', vi.fn(), onError);
    expect(onError).toHaveBeenCalled();
  });
});
