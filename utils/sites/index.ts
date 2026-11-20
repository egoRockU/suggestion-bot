import type { Capture } from '../types';
import { gchat } from './gchat';
import { gmail } from './gmail';
import type { SiteAdapter } from './shared';

// Tried on every hover rather than picked by hostname: Chat also runs inside Gmail.
export const adapters: SiteAdapter[] = [gmail, gchat];

export interface FoundMessage {
  element: Element;
  adapter: SiteAdapter;
}

/** The message that contains `target`, if any. */
export function findMessage(target: EventTarget | null): FoundMessage | null {
  if (!(target instanceof Element)) return null;
  for (const adapter of adapters) {
    const element = target.closest(adapter.messageSelector);
    if (element) return { element, adapter };
  }
  return null;
}

export function extractCapture(found: FoundMessage): Capture | null {
  return found.adapter.extract(found.element);
}
