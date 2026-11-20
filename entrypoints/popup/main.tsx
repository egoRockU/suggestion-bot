import React from 'react';
import ReactDOM from 'react-dom/client';
import { SuggestionView } from '@/components/SuggestionView';
import '@/assets/panel.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SuggestionView compact />
  </React.StrictMode>,
);
