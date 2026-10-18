import React from 'react';
import { createRoot } from 'react-dom/client';
import CloudEntry from './CloudEntry.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(<React.StrictMode><CloudEntry /></React.StrictMode>);
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
