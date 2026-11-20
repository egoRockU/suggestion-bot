import { useCallback, useEffect, useRef, useState } from 'react';
import { sendMessage } from '@/utils/messages';
import { INITIAL_SUGGESTION, suggestionItem } from '@/utils/storage';
import type { SuggestionState, Tone } from '@/utils/types';

/** Live view of the stored suggestion, shared by the side panel and the popup. */
export function useSuggestion() {
  const [state, setState] = useState<SuggestionState>(INITIAL_SUGGESTION);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    void suggestionItem.getValue().then(setState);
    const unwatch = suggestionItem.watch((value) => setState(value));
    void sendMessage({ type: 'checkHelper' });
    return () => {
      unwatch();
      clearTimeout(copiedTimer.current);
    };
  }, []);

  // A new reply is not the one that was copied.
  useEffect(() => setCopied(false), [state.reply]);

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(state.reply);
    setCopied(true);
    clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 2000);
  }, [state.reply]);

  const regenerate = useCallback(() => void sendMessage({ type: 'regenerate' }), []);
  const setTone = useCallback((tone: Tone) => void sendMessage({ type: 'setTone', tone }), []);
  const retry = useCallback(
    () => void sendMessage(state.capture ? { type: 'regenerate' } : { type: 'checkHelper' }),
    [state.capture],
  );

  return { state, copied, copy, regenerate, setTone, retry };
}
