import { describe, expect, it } from 'vitest';
import { buildSystemPrompt, buildUserPrompt } from './prompt.mjs';

const capture = {
  site: 'gmail',
  sender: 'Maya Torres',
  subject: 'Q3 report timing',
  text: 'Could you send the Q3 draft by Thursday?',
  thread: [{ sender: 'Jon Park', text: 'Adding the finance team here.' }],
};

describe('buildSystemPrompt', () => {
  it('applies tone, name and standing instructions', () => {
    const prompt = buildSystemPrompt({
      tone: 'short',
      settings: { name: 'Sam', instructions: 'Always reply in English' },
      capture,
    });
    expect(prompt).toContain('one or two sentences');
    expect(prompt).toContain("The user's name is Sam");
    expect(prompt).toContain('Always reply in English');
    expect(prompt).toContain('This is an email');
  });

  it('falls back to the friendly tone and treats chat differently', () => {
    const prompt = buildSystemPrompt({ tone: 'nonsense', settings: {}, capture: { ...capture, site: 'gchat' } });
    expect(prompt).toContain('Warm and friendly');
    expect(prompt).toContain('This is a chat message');
    expect(prompt).not.toContain("The user's name");
  });
});

describe('buildUserPrompt', () => {
  it('wraps other people’s text in tags and puts the thread before the message', () => {
    const prompt = buildUserPrompt({ capture });
    expect(prompt).toContain('Q3 report timing');
    expect(prompt).toContain('[Jon Park]\nAdding the finance team here.');
    expect(prompt).toContain('<message>\nCould you send the Q3 draft by Thursday?\n</message>');
    expect(prompt.indexOf('Jon Park')).toBeLessThan(prompt.indexOf('<message>'));
  });

  it('works without a thread and caps very long messages', () => {
    const prompt = buildUserPrompt({ capture: { sender: '', text: 'x'.repeat(20000) } });
    expect(prompt).toContain('an unknown sender');
    expect(prompt.length).toBeLessThan(9000);
  });
});
