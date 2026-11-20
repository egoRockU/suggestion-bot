import type { Capture, Settings, Tone } from './types';

export const HELPER_URL = 'http://127.0.0.1:43117';
export const SUGGEST_TIMEOUT_MS = 100_000;

/** The helper process is not reachable (not started, or wrong port). */
export class HelperDownError extends Error {
  constructor() {
    super('Helper not running');
    this.name = 'HelperDownError';
  }
}

export async function health(): Promise<boolean> {
  try {
    const res = await fetch(`${HELPER_URL}/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function suggest(input: { capture: Capture; tone: Tone; settings: Settings }): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`${HELPER_URL}/suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(SUGGEST_TIMEOUT_MS),
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'TimeoutError') throw new Error('Claude took too long to answer.');
    throw new HelperDownError();
  }
  const data = (await res.json().catch(() => null)) as { reply?: string; error?: string } | null;
  if (!res.ok || !data?.reply) throw new Error(data?.error || 'The helper returned no reply.');
  return data.reply;
}
