import { afterEach, expect, it, vi } from 'vitest';
vi.mock('./_core/env', () => ({ ENV: { forgeApiKey: 'test-only-key', forgeApiUrl: 'https://example.invalid' } }));
import { invokeLLM } from './_core/llm';
afterEach(() => vi.unstubAllGlobals());
it('does not retry permanent provider errors', async () => {
  const fetch = vi.fn().mockResolvedValue(new Response('bad request', { status: 400 }));
  vi.stubGlobal('fetch', fetch);
  await expect(invokeLLM({ messages: [{ role: 'user', content: 'test' }] })).rejects.toThrow('400');
  expect(fetch).toHaveBeenCalledTimes(1);
});
it('aborts a provider request without retrying', async () => {
  const controller = new AbortController();
  const fetch = vi.fn(async (_url, init) => {
    controller.abort();
    init.signal.throwIfAborted();
  });
  vi.stubGlobal('fetch', fetch);
  await expect(invokeLLM({ messages: [{ role: 'user', content: 'test' }], signal: controller.signal })).rejects.toThrow();
  expect(fetch).toHaveBeenCalledTimes(1);
});
