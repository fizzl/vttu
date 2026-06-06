"use strict";
const form = document.querySelector('#submission-form');
const input = document.querySelector('#submission-value');
const statusElement = document.querySelector('#submission-status');
if (!form || !input || !statusElement) {
    throw new Error('Form elements were not found.');
}
const config = window.VTTU_CONFIG;
if (!config || !config.apiUrl) {
    throw new Error('Missing VTTU_CONFIG.apiUrl in config.js.');
}
form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const value = input.value.trim();
    if (!value) {
        statusElement.textContent = 'Please provide a value before submitting.';
        return;
    }
    statusElement.textContent = 'Submitting...';
    try {
        const response = await fetch(config.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ value })
        });
        const body = await response.json();
        if (!response.ok) {
            statusElement.textContent = body.message ?? 'Submission failed.';
            return;
        }
        input.value = '';
        statusElement.textContent = `Saved successfully. ID: ${body.id ?? 'unknown'}`;
    }
    catch (error) {
        statusElement.textContent = `Request failed: ${error.message}`;
    }
});
