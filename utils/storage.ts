import { storage } from 'wxt/utils/storage';
import type { Settings, SuggestionState } from './types';

export const INITIAL_SUGGESTION: SuggestionState = {
  status: 'idle',
  capture: null,
  reply: '',
  tone: 'friendly',
  errorKind: null,
  error: '',
  helper: 'unknown',
  requestId: '',
  startedAt: 0,
};

/** Single source of truth read by the side panel and the popup. */
export const suggestionItem = storage.defineItem<SuggestionState>('local:suggestion', {
  fallback: INITIAL_SUGGESTION,
});

export const settingsItem = storage.defineItem<Settings>('local:settings', {
  fallback: { name: '', instructions: '' },
});
