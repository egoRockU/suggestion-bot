import { browser } from 'wxt/browser';
import { useSuggestion } from '@/hooks/useSuggestion';
import { TONES, type Capture, type HelperStatus, type SuggestionState, type Tone } from '@/utils/types';
import { BubbleIcon, CheckIcon, CopyIcon, RefreshIcon, SettingsIcon } from './Icons';

const SITE_LABEL: Record<Capture['site'], string> = { gmail: 'Email', gchat: 'Chat' };

function Header({ helper }: { helper: HelperStatus }) {
  return (
    <header className="header">
      <div className="brand">
        <span className="brand-mark">
          <BubbleIcon />
        </span>
        Suggestion Bot
      </div>
      {helper === 'connected' && (
        <div className="status">
          <span className="status-dot" />
          Claude connected
        </div>
      )}
      {helper === 'down' && (
        <div className="status down">
          <span className="status-dot" />
          Helper not running
        </div>
      )}
      <button className="icon-btn" aria-label="Settings" onClick={() => void browser.runtime.openOptionsPage()}>
        <SettingsIcon />
      </button>
    </header>
  );
}

function ErrorCard({ state, onRetry }: { state: SuggestionState; onRetry: () => void }) {
  const helperDown = state.errorKind === 'helper' || state.helper === 'down';
  return (
    <div className="error-card" role="alert">
      <div className="error-title">{helperDown ? "Can't reach Claude" : "Claude couldn't write a reply"}</div>
      {helperDown ? (
        <div>
          Start the Suggestion Bot helper on this computer (<code>pnpm helper</code> in the project folder), then try
          again.
        </div>
      ) : (
        <div className="error-detail">{state.error}</div>
      )}
      <button className="pill-btn" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

function ToneChips({ tone, disabled, onChange }: { tone: Tone; disabled: boolean; onChange: (tone: Tone) => void }) {
  return (
    <div className="chips" role="group" aria-label="Tone">
      {TONES.map((t) => (
        <button
          key={t.id}
          className="chip"
          aria-pressed={t.id === tone}
          disabled={disabled}
          onClick={() => t.id !== tone && onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** The whole panel. `compact` is the toolbar popup layout. */
export function SuggestionView({ compact = false }: { compact?: boolean }) {
  const { state, copied, copy, regenerate, setTone, retry } = useSuggestion();
  const { capture, status } = state;
  const loading = status === 'loading';
  const showError = status === 'error' || (state.helper === 'down' && !loading && status !== 'done');

  return (
    <div className={compact ? 'view compact' : 'view'}>
      <Header helper={state.helper} />

      <main className="thread">
        {!capture && !showError && (
          <div className="empty">
            <div className="empty-title">Nothing captured yet</div>
            <div className="empty-text">Hover a message in your email or chat, then choose See suggestions.</div>
          </div>
        )}

        {capture && (
          <div className="turn them">
            <div className="turn-label">
              {capture.sender ? `${capture.sender} · ` : ''}
              {SITE_LABEL[capture.site]}
            </div>
            <div className="bubble them">
              <div className="bubble-text">{capture.text}</div>
            </div>
          </div>
        )}

        {capture && loading && (
          <div className="turn reply">
            <div className="turn-label">Suggested reply</div>
            <div className="bubble loading" role="status">
              <span className="dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              Writing a reply…
            </div>
          </div>
        )}

        {capture && status === 'done' && (
          <div className="turn reply">
            <div className="turn-label">Suggested reply</div>
            <div className="bubble reply">{state.reply}</div>
            <button className={copied ? 'pill-btn done' : 'pill-btn'} onClick={() => void copy()}>
              {copied ? <CheckIcon /> : <CopyIcon />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}

        {showError && <ErrorCard state={state} onRetry={retry} />}
      </main>

      {capture && (loading || status === 'done') && (
        <footer className="bar">
          <div className="bar-label">Tone</div>
          <ToneChips tone={state.tone} disabled={loading} onChange={setTone} />
          <button className="regen" disabled={loading} onClick={regenerate}>
            <RefreshIcon />
            Regenerate
          </button>
        </footer>
      )}
    </div>
  );
}
