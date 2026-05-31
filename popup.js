const $ = (id) => document.getElementById(id);
const validColors = ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange']

const ui = {
  setStatus(msg, type = '') {
    const el = $('status');
    el.textContent = msg;
    el.className = `status ${type}`;
  }
};

const api = {
  async getConfig() {
    const config = await chrome.storage.sync.get(['apiKey', 'apiUrl', 'model']);
    if (!config.apiKey || !config.apiUrl) throw new Error('Please configure API settings first');
    return config;
  },

  async callCustomLLM(tabs, config) {
    const prompt = `Group the following tabs by content relevance. Return JSON only.

Tabs:
${tabs.map(t => `ID:${t.id} | ${t.title} | ${t.url}`).join('\n')}

Return format:
{"groups":[{"name":"Group Name","color":"blue","tabIds":[${tabs[0]?.id}]}]}

Colors: grey, blue, red, yellow, green, pink, purple, cyan, orange`;

    const res = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'API request failed');
    return this.parseGroupsResult(data.choices?.[0]?.message?.content);
  },

  parseGroupsResult(text) {
    if (text && typeof text === 'object') return text

    if (typeof text !== 'string') {
      throw new Error('Model returned empty response');
    }

    try {
      return JSON.parse(text)
    } catch (_) {
      const match = text.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('Model did not return valid JSON')
      return JSON.parse(match[0])
    }
  },

  async callChromeAI(tabs, onProgress) {
    if (typeof LanguageModel === 'undefined') {
      throw new Error('Chrome Prompt API is not available in this browser')
    }

    const availability = await LanguageModel.availability({
      expectedInputs: [{ type: 'text', languages: ['en'] }],
      expectedOutputs: [{ type: 'text', languages: ['en'] }]
    })

    if (availability === 'unavailable') {
      throw new Error('Chrome Prompt API is unavailable on this device')
    }

    if ((availability === 'downloadable' || availability === 'downloading') && !navigator.userActivation?.isActive) {
      throw new Error('Please click "Group Tabs" to start Chrome AI model download')
    }

    let session

    try {
      session = await LanguageModel.create({
        initialPrompts: [{
          role: 'system',
          content: 'You are a tab organization assistant. Group tabs by content relevance. Always respond with valid JSON only.'
        }],
        expectedInputs: [{ type: 'text', languages: ['en'] }],
        expectedOutputs: [{ type: 'text', languages: ['en'] }],
        monitor(m) {
          m.addEventListener('downloadprogress', (e) => {
            if (onProgress) onProgress(`Downloading Chrome AI model... ${Math.round((e.loaded || 0) * 100)}%`)
          })
        }
      })

      const prompt = `Group these tabs by content relevance. Return JSON only.

Tabs:
${tabs.map(t => `ID:${t.id} | ${t.title} | ${t.url}`).join('\n')}

Return format:
{"groups":[{"name":"Group Name","color":"blue","tabIds":[${tabs[0]?.id}]}]}

Colors: grey, blue, red, yellow, green, pink, purple, cyan, orange`;

      const result = await session.prompt(prompt, {
        responseConstraint: {
          type: 'object',
          properties: {
            groups: { type: 'array' }
          },
          required: ['groups']
        },
        omitResponseConstraintInput: true
      })

      return this.parseGroupsResult(result)
    } finally {
      if (session) session.destroy()
    }
  }
};

const tabs = {
  async getAll() {
    const all = await chrome.tabs.query({});
    return all.map(t => ({ id: t.id, url: t.url, title: t.title }));
  },

  async createGroups(groupsData) {
    const groups = Array.isArray(groupsData?.groups) ? groupsData.groups : []
    if (!groups.length) throw new Error('Model returned no valid groups')

    const tasks = groups
      .filter(g => g.tabIds?.filter(id => typeof id === 'number' && id > 0).length > 1)
      .map(async (group) => {
        const ids = group.tabIds.filter(id => typeof id === 'number' && id > 0);
        const groupId = await chrome.tabs.group({ tabIds: ids });
        const color = validColors.includes(group.color) ? group.color : 'blue'
        await chrome.tabGroups.update(groupId, { title: group.name, color });
      });
    await Promise.all(tasks);
  }
};

async function loadProvider() {
  const { provider } = await chrome.storage.sync.get(['provider']);
  const selected = provider || 'chrome';
  $('providerChrome').checked = selected === 'chrome';
  $('providerCustom').checked = selected === 'custom';
}

async function saveProvider() {
  const provider = $('providerChrome').checked ? 'chrome' : 'custom';
  await chrome.storage.sync.set({ provider });
}

$('providerChrome').addEventListener('change', saveProvider);
$('providerCustom').addEventListener('change', saveProvider);

async function handleGroup() {
  ui.setStatus('Analyzing tabs...', 'loading');
  try {
    const provider = $('providerChrome').checked ? 'chrome' : 'custom';
    const tabsInfo = await tabs.getAll();

    let groups;
    if (provider === 'chrome') {
      ui.setStatus('Using Chrome AI...', 'loading');
      groups = await api.callChromeAI(tabsInfo, (msg) => ui.setStatus(msg, 'loading'));
    } else {
      const config = await api.getConfig();
      groups = await api.callCustomLLM(tabsInfo, config);
    }

    await tabs.createGroups(groups);
    ui.setStatus('Grouping completed!', 'success');
  } catch (e) {
    ui.setStatus(e.message, 'error');
  }
}

$('groupTabs').addEventListener('click', handleGroup);
$('openOptions').addEventListener('click', () => chrome.runtime.openOptionsPage());

loadProvider();
