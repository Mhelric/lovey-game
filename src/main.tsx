import { render } from 'preact';
import { App } from './App';
import './styles/global.css';

const root = document.getElementById('app');
if (root) {
  render(<App />, root);
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
