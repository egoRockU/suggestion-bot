export type Site = 'gmail' | 'gchat';

export type Tone = 'friendly' | 'formal' | 'short';

export const TONES: { id: Tone; label: string }[] = [
  { id: 'friendly', label: 'Friendly' },
  { id: 'formal', label: 'Formal' },
  { id: 'short', label: 'Short' },
];

export interface ThreadMessage {
  sender: string;
  text: string;
}

/** A message the user asked a suggestion for, plus the earlier messages around it. */
export interface Capture {
  site: Site;
  sender: string;
  text: string;
  /** Email subject, when the site has one. */
  subject?: string;
  /** Earlier messages in the same conversation, oldest first. */
  thread: ThreadMessage[];
}

export type HelperStatus = 'unknown' | 'connected' | 'down';

export interface SuggestionState {
  status: 'idle' | 'loading' | 'done' | 'error';
  capture: Capture | null;
  reply: string;
  tone: Tone;
  /** 'helper' = the local helper is unreachable, 'claude' = it answered with an error. */
  errorKind: 'helper' | 'claude' | null;
  error: string;
  helper: HelperStatus;
  /** Identifies the request in flight so a slow, superseded reply is dropped. */
  requestId: string;
  startedAt: number;
}

export interface Settings {
  name: string;
  instructions: string;
}
