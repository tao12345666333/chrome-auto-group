# Chrome Auto Group Extension

Chrome extension that groups tabs by content relevance using either Chrome built-in Prompt API or a custom LLM API.

## Dev Environment

- No build step required
- Load as unpacked extension from `chrome://extensions/`
- Enable Developer mode, then select this project directory
- Use popup DevTools to debug `popup.js`

## Project Structure

- `manifest.json` - MV3 manifest
- `popup.html` - Popup UI (provider switch + actions)
- `popup.js` - Grouping workflow, provider selection, model calls
- `options.html` - Settings page
- `options.js` - Settings persistence (`chrome.storage.sync`)
- `styles.css` - Shared styles

## Runtime Modes

- **Chrome Prompt API mode**
  - Uses `LanguageModel.availability()` and `LanguageModel.create()`
  - Handles model download progress via `monitor(downloadprogress)`
  - Requires compatible Chrome/device support
- **Custom API mode**
  - Uses configured `apiUrl`, `apiKey`, and optional `model`
  - Calls OpenAI-compatible chat completion endpoint

Provider choice is stored in `chrome.storage.sync` with key `provider` (`chrome` or `custom`).

## Key APIs

- `LanguageModel` (Chrome Prompt API)
- `chrome.tabs` / `chrome.tabGroups` (tab grouping)
- `chrome.storage.sync` (settings + provider persistence)
- `chrome.runtime.openOptionsPage()` (navigate to settings)

## Business Rules

- Grouping is done per current window tab set
- LLM output must contain `groups` array
- Groups with fewer than 2 valid numeric tab IDs are skipped
- Valid group colors: `grey`, `blue`, `red`, `yellow`, `green`, `pink`, `purple`, `cyan`, `orange`
- Custom API credentials are optional when provider is `chrome`

## Coding Style

- Vanilla JS (ES6+)
- 4-space indentation
- Single quotes
- `async/await`
- No semicolons

## Validation

- No automated lint/test/build pipeline in repo
- Validate by:
  1. Manual extension smoke test in Chrome
  2. `node --check popup.js`
  3. `node --check options.js`

## PR / Commit Notes

- Keep changes minimal and focused
- Verify both provider modes still work before merge
