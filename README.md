# Chrome Auto Tab Grouper

Smart tab grouping Chrome extension that automatically groups open tabs by content relevance using AI.

## Features

- Get URLs and titles of all open tabs
- Call LLM API for intelligent grouping
- Automatically create Chrome tab groups with colors

## Installation

1. Open Chrome extensions page `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select this project folder

## Configuration

1. Click extension icon, select "Settings"
2. Fill in your LLM API configuration:
   - API URL (e.g.: `https://api.openai.com/v1/chat/completions`)
   - API Key
   - Model name (e.g.: `gpt-5-mini-2025-08-07`)

## Usage

1. Open multiple tabs
2. Click extension icon
3. Click "Group Tabs"
4. Wait for AI analysis and automatic tab group creation

## File Structure

- `manifest.json` - Extension configuration
- `popup.html/js` - Popup window interface
- `options.html/js` - Settings page
