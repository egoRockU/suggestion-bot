import React, { useEffect, useState, type FormEvent } from 'react';
import ReactDOM from 'react-dom/client';
import { settingsItem } from '@/utils/storage';
import type { Settings } from '@/utils/types';
import '@/assets/panel.css';

function Options() {
  const [settings, setSettings] = useState<Settings>({ name: '', instructions: '' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void settingsItem.getValue().then(setSettings);
  }, []);

  const update = (changes: Partial<Settings>) => {
    setSettings((s) => ({ ...s, ...changes }));
    setSaved(false);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    await settingsItem.setValue({ name: settings.name.trim(), instructions: settings.instructions.trim() });
    setSaved(true);
  };

  return (
    <form className="options" onSubmit={(e) => void save(e)}>
      <h1>Suggestion Bot settings</h1>

      <div className="field">
        <label htmlFor="name">Your name</label>
        <input id="name" value={settings.name} maxLength={100} onChange={(e) => update({ name: e.target.value })} />
        <div className="hint">Used to sign email replies.</div>
      </div>

      <div className="field">
        <label htmlFor="instructions">Extra instructions</label>
        <textarea
          id="instructions"
          value={settings.instructions}
          maxLength={2000}
          onChange={(e) => update({ instructions: e.target.value })}
        />
        <div className="hint">Added to every request, for example "Always reply in English" or "Keep replies under 80 words".</div>
      </div>

      <div className="options-actions">
        <button className="primary-btn" type="submit">
          Save
        </button>
        {saved && (
          <span className="saved" role="status">
            Saved
          </span>
        )}
      </div>
    </form>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>,
);
