const $ = (id) => document.getElementById(id);
const fields = ['apiUrl', 'apiKey', 'model'];

function showStatus(msg, type) {
  const el = $('status');
  el.textContent = msg;
  el.className = `status ${type}`;
  setTimeout(() => { el.textContent = ''; el.className = 'status'; }, 3000);
}

async function loadSettings() {
  const saved = await chrome.storage.sync.get(fields);
  fields.forEach(f => { if (saved[f]) $(f).value = saved[f]; });
}

async function saveSettings(e) {
  e.preventDefault();
  const settings = Object.fromEntries(fields.map(f => [f, $(f).value]));
  try {
    await chrome.storage.sync.set(settings);
    showStatus('Settings saved!', 'success');
  } catch (err) {
    showStatus('Save failed: ' + err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', loadSettings);
$('settingsForm').addEventListener('submit', saveSettings);
