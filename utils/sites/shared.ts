import type { Capture, Site, ThreadMessage } from '../types';

/** Knows how to find and read messages on one site. Add a site by adding an adapter. */
export interface SiteAdapter {
  site: Site;
  /** Matches the element that wraps one whole message. */
  messageSelector: string;
  /** Reads the message and the earlier messages of its conversation. */
  extract(message: Element): Capture | null;
}

export const MAX_THREAD_MESSAGES = 12;
const MAX_TEXT = 8000;

export function cleanText(text: string): string {
  return text
    .replace(/ /g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, MAX_TEXT);
}

/** Visible text of an element; innerText keeps line breaks, textContent is the fallback. */
export function textOf(el: Element | null | undefined): string {
  if (!el) return '';
  return (el as HTMLElement).innerText || el.textContent || '';
}

/** Elements matching `selector` that come before `message` in the page, oldest first. */
export function earlier(root: ParentNode, selector: string, message: Element): Element[] {
  return [...root.querySelectorAll(selector)]
    .filter((el) => el !== message && !!(el.compareDocumentPosition(message) & Node.DOCUMENT_POSITION_FOLLOWING))
    .slice(-MAX_THREAD_MESSAGES);
}

export function keepNonEmpty(messages: ThreadMessage[]): ThreadMessage[] {
  return messages.filter((m) => m.text);
}
