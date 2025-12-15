const $ = (id) => document.getElementById(id);

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

  async callLLM(tabs, config) {
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
    return JSON.parse(data.choices[0].message.content.match(/\{[\s\S]*\}/)[0]);
  }
};

const tabs = {
  async getAll() {
    const all = await chrome.tabs.query({});
    return all.map(t => ({ id: t.id, url: t.url, title: t.title }));
  },

  async createGroups(groupsData) {
    const tasks = groupsData.groups
      .filter(g => g.tabIds?.filter(id => typeof id === 'number' && id > 0).length > 1)
      .map(async (group) => {
        const ids = group.tabIds.filter(id => typeof id === 'number' && id > 0);
        const groupId = await chrome.tabs.group({ tabIds: ids });
        await chrome.tabGroups.update(groupId, { title: group.name, color: group.color || 'blue' });
      });
    await Promise.all(tasks);
  }
};

async function handleGroup() {
  ui.setStatus('Analyzing tabs...', 'loading');
  try {
    const config = await api.getConfig();
    const tabsInfo = await tabs.getAll();
    const groups = await api.callLLM(tabsInfo, config);
    await tabs.createGroups(groups);
    ui.setStatus('Grouping completed!', 'success');
  } catch (e) {
    ui.setStatus(e.message, 'error');
  }
}

$('groupTabs').addEventListener('click', handleGroup);
$('openOptions').addEventListener('click', () => chrome.runtime.openOptionsPage());
