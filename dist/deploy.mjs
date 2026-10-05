// Retired wallet flow. Kept at the previous URL so old HTML cannot request a wallet when refreshed.
const message = 'Підключення призупинене через попередження MetaMask. Скасуй запит у гаманці й онови сторінку.';
for (const id of ['connect', 'deploy']) {
  const button = document.getElementById(id);
  if (button) { button.disabled = true; button.hidden = true; }
}
for (const id of ['quote', 'receipt']) {
  const section = document.getElementById(id);
  if (section) section.hidden = true;
}
const status = document.getElementById('owner-status');
if (status) status.textContent = message;
