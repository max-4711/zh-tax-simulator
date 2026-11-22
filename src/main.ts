import './style.css';
import { renderApp } from './app';
import { BasicInputsForm } from './basic-inputs-form';
import { getBrowserStorage } from './basic-inputs-store';
import { fetchCalculatorMetadata } from './calculator-api';
import { AppNavigation } from './navigation';
import { TaxCalculationPage } from './tax-calculation';
import { ComparisonPage } from './comparison';

const root = document.querySelector<HTMLElement>('#app');

if (root === null) {
  throw new Error('Das Anwendungselement wurde nicht gefunden.');
}

root.innerHTML = renderApp();

const form = root.querySelector<HTMLFormElement>('#basic-inputs');

if (form === null) {
  throw new Error('Das Eingabeformular wurde nicht gefunden.');
}

const navigation = new AppNavigation(root);
const basicInputs = new BasicInputsForm(form, new Date().getFullYear(), {
  storage: getBrowserStorage(),
  onCompleteChange: (complete) => navigation.setComplete(complete),
});
const comparisonForm = root.querySelector<HTMLFormElement>('#comparison-inputs');
if (comparisonForm === null) {
  throw new Error('Das Eingabeformular für den Vergleich wurde nicht gefunden.');
}
const comparison = new ComparisonPage(root, comparisonForm, () => basicInputs.getValues());
const calculation = new TaxCalculationPage(root, () => basicInputs.getValues());
navigation.setOnPageChange((page) => {
  if (page === 'basisrechnung') {
    void calculation.open();
  } else {
    comparison.close();
    if (page === 'vergleich-1-zu-1') {
      comparison.open();
    }
  }
});

async function loadChoices(): Promise<void> {
  try {
    const metadata = await fetchCalculatorMetadata();
    basicInputs.applyMetadata(metadata);
    comparison.applyMetadata(metadata);
  } catch (error) {
    console.error('Die Rechner-Metadaten konnten nicht geladen werden.', error);
    basicInputs.showLoadingError();
    comparison.showLoadingError();
  }
}

await loadChoices();
