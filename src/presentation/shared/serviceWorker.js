// Service worker (background).
// Handles toolbar click and omnibox commands.


// ── Omnibox Integration ──────────────────────────────────────────────────────
// Usage: type "nt " in the Chrome address bar to activate.
//   nt todo <task text>    → Saves a task directly to storage
//   nt note <text>         → Saves a quick note directly to storage
//   nt open <url or query> → Opens the URL or Google searches the query

const SEARCH_ENGINES = {
  google: "https://www.google.com/search?q=",
  youtube: "https://www.youtube.com/results?search_query=",
  duckduckgo: "https://duckduckgo.com/?q=",
  bing: "https://www.bing.com/search?q=",
};

// Provide suggestions in the address bar
chrome.omnibox.onInputChanged.addListener((text, suggest) => {
  const lower = text.toLowerCase().trim();
  const suggestions = [];

  if (lower.startsWith("todo ")) {
    const taskText = text.slice(5).trim();
    if (taskText) {
      suggestions.push({ content: text, description: `<match>Add todo:</match> <dim>${taskText}</dim>` });
    }
  } else if (lower.startsWith("note ")) {
    const noteText = text.slice(5).trim();
    if (noteText) {
      suggestions.push({ content: text, description: `<match>Save note:</match> <dim>${noteText}</dim>` });
    }
  } else {
    suggestions.push({ content: `todo ${text}`, description: `<match>todo</match> ${text} — add as task` });
    suggestions.push({ content: `note ${text}`, description: `<match>note</match> ${text} — save as quick note` });
  }

  suggest(suggestions);
});

// Handle when user submits a command
chrome.omnibox.onInputEntered.addListener(async (text, disposition) => {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  if (lower.startsWith("todo ")) {
    const taskText = trimmed.slice(5).trim();
    if (!taskText) return;
    try {
      const stored = await chrome.storage.local.get("tasks");
      const tasks = Array.isArray(stored.tasks) ? stored.tasks : [];
      const maxOrder = tasks.reduce((m, t) => Math.max(m, t.order ?? 0), -1);
      const newTask = {
        id: crypto.randomUUID(),
        title: taskText.slice(0, 200),
        completed: false,
        order: maxOrder + 1,
        scheduledTime: "",
        durationMinutes: null,
      };
      tasks.push(newTask);
      await chrome.storage.local.set({ tasks });
    } catch (err) {
      console.error("[Omnibox] Failed to add task:", err);
    }
    return;
  }

  if (lower.startsWith("note ")) {
    const noteText = trimmed.slice(5).trim();
    if (!noteText) return;
    try {
      const stored = await chrome.storage.local.get("quickNote");
      const existing = stored.quickNote ?? "";
      const separator = existing ? "\n" : "";
      await chrome.storage.local.set({ quickNote: existing + separator + noteText });
    } catch (err) {
      console.error("[Omnibox] Failed to save note:", err);
    }
    return;
  }

  // Default: open as URL or search
  let url;
  try {
    const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    url = parsed.href;
  } catch {
    // Not a URL, search with current engine
    const stored = await chrome.storage.local.get("settings").catch(() => ({}));
    const engine = stored.settings?.searchEngine ?? "google";
    const base = SEARCH_ENGINES[engine] ?? SEARCH_ENGINES.google;
    url = base + encodeURIComponent(trimmed);
  }

  if (disposition === "currentTab") {
    chrome.tabs.update({ url });
  } else {
    chrome.tabs.create({ url });
  }
});
