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
        statusElement.textContent = `Kiitos, ${value}! Tervetuloa VITTU töihin. (Tämä on satiiri, mitään ei lähetetty.)`;
        form.reset();
    });
    form.addEventListener('reset', () => {
        statusElement.textContent = '';
    });
}
