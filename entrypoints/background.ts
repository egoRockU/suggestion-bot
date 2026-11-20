import { HelperDownError, SUGGEST_TIMEOUT_MS, health, suggest } from '@/utils/helper-client';
import type { Message } from '@/utils/messages';
import { settingsItem, suggestionItem } from '@/utils/storage';
import type { SuggestionState } from '@/utils/types';

async function patch(changes: Partial<SuggestionState>) {
  const state = await suggestionItem.getValue();
  await suggestionItem.setValue({ ...state, ...changes });
}

/** Asks the helper for a reply to the stored capture and writes the outcome to storage. */
async function generate(changes: Partial<SuggestionState> = {}) {
  const requestId = crypto.randomUUID();
  const state: SuggestionState = {
    ...(await suggestionItem.getValue()),
    ...changes,
    requestId,
    startedAt: Date.now(),
  };
  if (!state.capture) {
    await suggestionItem.setValue(state);
    return;
  }
  await suggestionItem.setValue({ ...state, status: 'loading', reply: '', error: '', errorKind: null });

  let result: Partial<SuggestionState>;
  try {
    const reply = await suggest({
      capture: state.capture,
      tone: state.tone,
      settings: await settingsItem.getValue(),
    });
    result = { status: 'done', reply, helper: 'connected' };
  } catch (e) {
    result =
      e instanceof HelperDownError
        ? { status: 'error', errorKind: 'helper', error: e.message, helper: 'down' }
        : { status: 'error', errorKind: 'claude', error: e instanceof Error ? e.message : String(e), helper: 'connected' };
  }

  // A newer request (another message, tone change) replaced this one: drop the result.
  if ((await suggestionItem.getValue()).requestId !== requestId) return;
  await patch(result);
}

async function checkHelper() {
  await patch({ helper: (await health()) ? 'connected' : 'down' });
}

/** If the worker was stopped mid-request, the stored state would say "loading" forever. */
async function clearStaleLoading() {
  const state = await suggestionItem.getValue();
  if (state.status === 'loading' && Date.now() - state.startedAt > SUGGEST_TIMEOUT_MS + 5000) {
    await patch({ status: 'error', errorKind: 'claude', error: 'The request was interrupted.' });
  }
}

export default defineBackground(() => {
  void clearStaleLoading();

  browser.runtime.onMessage.addListener((message: Message, sender) => {
    switch (message.type) {
      case 'capture': {
        // Must run before any await: opening the panel needs the user's click gesture.
        const tabId = sender.tab?.id;
        if (tabId != null) browser.sidePanel.open({ tabId }).catch(() => {});
        void generate({ capture: message.capture });
        break;
      }
      case 'regenerate':
        void generate();
        break;
      case 'setTone':
        void generate({ tone: message.tone });
        break;
      case 'checkHelper':
        void checkHelper().then(clearStaleLoading);
        break;
    }
  });
});
