"use strict";
const form = document.querySelector('#submission-form');
const input = document.querySelector('#submission-value');
const statusElement = document.querySelector('#submission-status');
if (form && input && statusElement) {
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const value = input.value.trim();
        if (!value) {
            statusElement.textContent = 'Syötä nimi ennen lähettämistä.';
            return;
        }
        statusElement.textContent = `Kiitos, ${value}. Hakemus on vastaanotettu esittelytilassa: tämä on satiiria, eikä mitään lähetetty tai tallennettu.`;
        form.reset();
    });
    form.addEventListener('reset', () => {
        statusElement.textContent = '';
    });
}
