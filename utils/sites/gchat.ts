import { cleanText, earlier, keepNonEmpty, textOf, type SiteAdapter } from './shared';

// Google Chat has no public markup contract. These attributes were read from the
// live page (Nov 2026); if highlighting stops working, this is the file to update.
const MESSAGE = 'div[jsname="Ne3sFf"]';
const BODY = '[jsname="bgckF"]';
const SENDER = '[data-message-id][data-name]';
const CONVERSATION = '[jsname="yoHpJ"]'; // the scrolling list of one conversation

const sender = (message: Element) => (message.querySelector(SENDER)?.getAttribute('data-name') ?? '').trim();
const bodyText = (message: Element) => cleanText(textOf(message.querySelector(BODY)));

export const gchat: SiteAdapter = {
  site: 'gchat',
  messageSelector: MESSAGE,
  extract(message) {
    const text = bodyText(message);
    if (!text) return null;
    const conversation = message.closest(CONVERSATION) ?? message.ownerDocument;
    return {
      site: 'gchat',
      sender: sender(message),
      text,
      thread: keepNonEmpty(
        earlier(conversation, MESSAGE, message).map((m) => ({ sender: sender(m), text: bodyText(m) })),
      ),
    };
  },
};
