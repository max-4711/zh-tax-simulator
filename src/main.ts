import './style.css';
import { renderApp } from './app';

const root = document.querySelector<HTMLElement>('#app');

if (root === null) {
  throw new Error('Das Anwendungselement wurde nicht gefunden.');
}

root.innerHTML = renderApp();
