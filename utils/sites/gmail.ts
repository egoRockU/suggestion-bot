import { cleanText, earlier, keepNonEmpty, textOf, type SiteAdapter } from './shared';

// Gmail has no public markup contract. These class names were read from the live
// page (Nov 2026); if highlighting stops working, this is the file to update.
const EXPANDED = '.adn[data-message-id]'; // an open message in a thread
const COLLAPSED = '.kv'; // a collapsed earlier message (not verified live)
const BODY = '.a3s';
const QUOTED = '.gmail_quote, blockquote';
const SENDER = '.gD, .yP, span[email]';
const SNIPPET = '.iA.g6';
const SUBJECT = 'h2.hP';

function sender(message: Element): string {
  const el = message.querySelector(SENDER);
  return (el?.getAttribute('name') || textOf(el)).trim();
}

/** Body text without the quoted earlier emails. */
function bodyText(message: Element): string {
  const body = message.querySelector(BODY);
  if (!body) return cleanText(textOf(message.querySelector(SNIPPET)));
  let text = textOf(body);
  for (const quote of body.querySelectorAll(QUOTED)) {
    const quoted = textOf(quote);
    if (quoted) text = text.replace(quoted, '');
  }
  return cleanText(text);
}

export const gmail: SiteAdapter = {
  site: 'gmail',
  messageSelector: EXPANDED,
  extract(message) {
    const text = bodyText(message);
    if (!text) return null;
    const doc = message.ownerDocument;
    const subject = textOf(doc.querySelector(SUBJECT)).trim();
    return {
      site: 'gmail',
      sender: sender(message),
      text,
      ...(subject ? { subject } : {}),
      thread: keepNonEmpty(
        earlier(doc, `${EXPANDED}, ${COLLAPSED}`, message).map((m) => ({ sender: sender(m), text: bodyText(m) })),
      ),
    };
  },
};
