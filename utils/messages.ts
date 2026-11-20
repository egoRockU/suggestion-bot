import { browser } from 'wxt/browser';
import type { Capture, Tone } from './types';

export type Message =
  | { type: 'capture'; capture: Capture }
  | { type: 'regenerate' }
  | { type: 'setTone'; tone: Tone }
  | { type: 'checkHelper' };

export function sendMessage(message: Message): Promise<void> {
  return browser.runtime.sendMessage(message).catch(() => {
    // The background worker may be restarting; state is re-read from storage anyway.
  });
}
