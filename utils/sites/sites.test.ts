import { beforeEach, describe, expect, it } from 'vitest';
import { extractCapture, findMessage } from './index';

// Trimmed-down copies of the real markup, with made-up content.
const GMAIL = `
  <h2 class="hP">Q3 report timing</h2>
  <div class="kv">
    <span class="yP" name="Jon Park" email="jon@example.com">Jon</span>
    <div class="iA g6">Adding the finance team here.</div>
  </div>
  <div class="adn ads" data-message-id="m2">
    <span class="gD" name="Maya Torres" email="maya@example.com">Maya</span>
    <div class="a3s aiL"><div id="body">Could you send the Q3 draft by Thursday?</div><div class="gmail_quote">On Monday Jon wrote: Adding the finance team here.</div></div>
  </div>
  <div class="adn ads" data-message-id="m3">
    <span class="gD" name="Sam Lee">Sam</span>
    <div class="a3s aiL">Will do.</div>
  </div>`;

const chatRow = (id: string, name: string, text: string) => `
  <div jsname="Ne3sFf" data-id="${id}">
    <span role="heading" data-message-id="${id}" data-name="${name}">${name}</span>
    <div jsname="bgckF">${text}</div>
  </div>`;

const GCHAT = `
  <div jsname="yoHpJ">
    ${chatRow('a', 'Priya Nair', 'Did the client sign off?')}
    ${chatRow('b', 'Sam Lee', 'Yes, yesterday.')}
    ${chatRow('c', 'Priya Nair', '<span id="hover">Are we still on for 2pm?</span>')}
  </div>
  <div jsname="yoHpJ">${chatRow('z', 'Other Person', 'Unrelated conversation')}</div>`;

describe('gmail adapter', () => {
  beforeEach(() => {
    document.body.innerHTML = GMAIL;
  });

  it('finds the message around the hovered element and reads it', () => {
    const found = findMessage(document.getElementById('body'));
    expect(found?.adapter.site).toBe('gmail');
    const capture = extractCapture(found!);
    expect(capture).toMatchObject({
      site: 'gmail',
      sender: 'Maya Torres',
      subject: 'Q3 report timing',
      text: 'Could you send the Q3 draft by Thursday?',
    });
  });

  it('includes only earlier messages, with collapsed ones read from their snippet', () => {
    const capture = extractCapture(findMessage(document.getElementById('body'))!);
    expect(capture?.thread).toEqual([{ sender: 'Jon Park', text: 'Adding the finance team here.' }]);
  });

  it('ignores elements outside a message', () => {
    expect(findMessage(document.querySelector('h2'))).toBeNull();
  });
});

describe('gchat adapter', () => {
  beforeEach(() => {
    document.body.innerHTML = GCHAT;
  });

  it('reads the hovered message and the earlier ones in the same conversation', () => {
    const found = findMessage(document.getElementById('hover'));
    expect(found?.adapter.site).toBe('gchat');
    expect(extractCapture(found!)).toEqual({
      site: 'gchat',
      sender: 'Priya Nair',
      text: 'Are we still on for 2pm?',
      thread: [
        { sender: 'Priya Nair', text: 'Did the client sign off?' },
        { sender: 'Sam Lee', text: 'Yes, yesterday.' },
      ],
    });
  });

  it('returns nothing for a message with no text', () => {
    document.body.innerHTML = chatRow('x', 'Priya Nair', '');
    expect(extractCapture(findMessage(document.querySelector('[role=heading]'))!)).toBeNull();
  });
});
