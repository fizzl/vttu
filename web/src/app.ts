/**
 * VTTU — frontend behaviour.
 *
 * This is a satirical showcase page: nothing is sent anywhere and no data is
 * collected. The form is handled entirely client-side. The script is defensive
 * — if an element is missing it simply does nothing rather than throwing, so a
 * future page that drops the form still loads cleanly.
 */

const form = document.querySelector<HTMLFormElement>('#submission-form');
const input = document.querySelector<HTMLInputElement>('#submission-value');
const statusElement = document.querySelector<HTMLElement>('#submission-status');

if (form && input && statusElement) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const value = input.value.trim();
    if (!value) {
      statusElement.textContent = 'Syötä nimi ennen lähettämistä.';
      return;
    }

    // No network call — this is satire. Acknowledge locally and reset.
    statusElement.textContent = `Kiitos, ${value}! Tervetuloa VITTU töihin. (Tämä on satiiri, mitään ei lähetetty.)`;
    form.reset();
  });

  form.addEventListener('reset', () => {
    statusElement.textContent = '';
  });
}
