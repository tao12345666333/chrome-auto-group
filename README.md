# Chrome Auto Tab Grouper

A Chrome extension that groups open tabs by content relevance using AI.

## Features

- Supports two providers:
  - **Chrome AI** (built-in Prompt API)
  - **Custom API** (OpenAI-compatible chat completions endpoint)
- Reads all open tabs (ID, title, URL) and asks the model to return JSON groups
- Automatically creates Chrome tab groups in parallel
- Supports group colors: `grey`, `blue`, `red`, `yellow`, `green`, `pink`, `purple`, `cyan`, `orange`
- Skips invalid groups (requires at least 2 valid numeric tab IDs)

## Installation

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this project folder

## Configuration

1. Click the extension icon, then click **Settings**
2. Configure fields in the options page:
   - `API URL` (example: `https://api.openai.com/v1/chat/completions`)
   - `API Key`
   - `Model` (optional, default is `gpt-3.5-turbo`)

Notes:
- If you use **Chrome AI**, API URL and API Key are optional.
- If you use **Custom API**, API URL and API Key are required.

## Usage

1. Open multiple tabs
2. Click the extension icon
3. Choose provider:
   - **Chrome AI (免费)**
   - **Custom API**
4. Click **Group Tabs**
5. Wait for grouping to complete

## Chrome AI Mode Notes

- Requires browser/device support for `LanguageModel`
- Handles model download progress in the popup status area
- Uses JSON response constraints to enforce `{"groups":[...]}` output

## Project Structure

- `manifest.json` - Extension manifest (MV3)
- `popup.html` - Popup UI (provider selector + actions)
- `popup.js` - Grouping workflow, provider switch, model calls
- `options.html` - Settings page
- `options.js` - Settings persistence via `chrome.storage.sync`
- `styles.css` - Shared UI styles
