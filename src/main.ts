import './style.css';
import { renderApp } from './app';
import { BasicInputsForm } from './basic-inputs-form';
import { getBrowserStorage } from './basic-inputs-store';
import { fetchCalculatorMetadata } from './calculator-api';

const root = document.querySelector<HTMLElement>('#app');

if (root === null) {
  throw new Error('Das Anwendungselement wurde nicht gefunden.');
}

root.innerHTML = renderApp();

const form = root.querySelector<HTMLFormElement>('#basic-inputs');

if (form === null) {
  throw new Error('Das Eingabeformular wurde nicht gefunden.');
}

const basicInputs = new BasicInputsForm(form, getBrowserStorage());

async function loadChoices(): Promise<void> {
  try {
    const metadata = await fetchCalculatorMetadata();
    basicInputs.applyMetadata(metadata);
  } catch {
    basicInputs.showLoadingError();
  }
}

await loadChoices();
