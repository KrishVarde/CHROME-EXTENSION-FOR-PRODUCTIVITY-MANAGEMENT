// =====================================================
// FocusGuard – Background Service Worker
// Handles: time tracking, site blocking, API sync
// =====================================================

const API_BASE = "http://localhost:5000/api";

// ── State ─────────────────────────────────────────
let activeTabId = null;
let activeOrigin = null;
let sessionStart = null;

// ── Helpers ───────────────────────────────────────
function getOrigin(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function isInternalUrl(url) {
  if (!url) return true;
  return (
    url.startsWith("chrome://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("about:") ||
    url.startsWith("edge://")
  );
}

// ── Time Tracking ─────────────────────────────────
async function flushSession() {
  if (!activeOrigin || !sessionStart) return;

  const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
  if (elapsed < 2) return; // ignore very short sessions

  const today = new Date().toISOString().split("T")[0];

  // Save locally first
  const key = `usage_${today}_${activeOrigin}`;
  const result = await chrome.storage.local.get([key]);
  const prev = result[key] || 0;
  await chrome.storage.local.set({ [key]: prev + elapsed });

  // Sync to backend
  try {
    await fetch(`${API_BASE}/analytics/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        domain: activeOrigin,
        seconds: elapsed,
        date: today,
      }),
    });
  } catch (_) {
    // Backend offline — local storage already updated
  }

  sessionStart = null;
  activeOrigin = null;
}

async function startSession(url) {
  await flushSession();
  const origin = getOrigin(url);
  if (!origin) return;

  const blocked = await getBlockedSites();
  if (blocked.includes(origin)) return; // don't track blocked sites

  activeOrigin = origin;
  sessionStart = Date.now();
}

// ── Blocking ──────────────────────────────────────
async function getBlockedSites() {
  const result = await chrome.storage.local.get(["blockedSites"]);
  return result.blockedSites || [
    "youtube.com",
    "instagram.com",
    "reddit.com",
    "facebook.com",
  ];
}

async function isBlocked(url) {
  if (!url || isInternalUrl(url)) return false;
  const origin = getOrigin(url);
  if (!origin) return false;
  const blocked = await getBlockedSites();
  return blocked.some(
    (b) => origin === b || origin.endsWith(`.${b}`)
  );
}

async function checkAndBlock(tabId, url) {
  if (!url || isInternalUrl(url)) return;
  const blocked = await isBlocked(url);
  if (blocked) {
    const blockedUrl = chrome.runtime.getURL("blocked.html") +
      `?site=${encodeURIComponent(getOrigin(url))}`;
    chrome.tabs.update(tabId, { url: blockedUrl });
  }
}

// ── Tab Event Listeners ───────────────────────────
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  activeTabId = tabId;
  const tab = await chrome.tabs.get(tabId).catch(() => null);
  if (tab?.url) await startSession(tab.url);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "loading" && tab.url) {
    await checkAndBlock(tabId, tab.url);
  }
  if (tabId === activeTabId && changeInfo.status === "complete" && tab.url) {
    await startSession(tab.url);
  }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  if (tabId === activeTabId) {
    await flushSession();
    activeTabId = null;
  }
});

// Periodic flush every 30 seconds
chrome.alarms.create("flush", { periodInMinutes: 0.5 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "flush") {
    // Re-check current active tab
    if (activeTabId && activeOrigin && sessionStart) {
      const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
      if (elapsed >= 30) await flushSession();
      // Restart session for same origin
      const tab = await chrome.tabs.get(activeTabId).catch(() => null);
      if (tab?.url) await startSession(tab.url);
    }
  }
});

// ── Message Listener (from popup/settings) ────────
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    switch (msg.type) {
      case "GET_BLOCKED_SITES": {
        const sites = await getBlockedSites();
        sendResponse({ sites });
        break;
      }
      case "ADD_BLOCKED_SITE": {
        const sites = await getBlockedSites();
        if (!sites.includes(msg.domain)) {
          const updated = [...sites, msg.domain];
          await chrome.storage.local.set({ blockedSites: updated });
          // Sync to backend
          try {
            await fetch(`${API_BASE}/blocked`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ domain: msg.domain }),
            });
          } catch (_) {}
        }
        sendResponse({ ok: true });
        break;
      }
      case "REMOVE_BLOCKED_SITE": {
        const sites = await getBlockedSites();
        const updated = sites.filter((s) => s !== msg.domain);
        await chrome.storage.local.set({ blockedSites: updated });
        try {
          await fetch(`${API_BASE}/blocked/${encodeURIComponent(msg.domain)}`, {
            method: "DELETE",
          });
        } catch (_) {}
        sendResponse({ ok: true });
        break;
      }
      case "GET_TODAY_STATS": {
        const today = new Date().toISOString().split("T")[0];
        const allData = await chrome.storage.local.get(null);
        const stats = {};
        for (const [k, v] of Object.entries(allData)) {
          if (k.startsWith(`usage_${today}_`)) {
            const domain = k.replace(`usage_${today}_`, "");
            stats[domain] = v;
          }
        }
        sendResponse({ stats });
        break;
      }
      case "GET_WEEK_STATS": {
        const allData = await chrome.storage.local.get(null);
        const stats = {};
        const now = Date.now();
        for (const [k, v] of Object.entries(allData)) {
          if (!k.startsWith("usage_")) continue;
          const parts = k.split("_");
          const dateStr = parts[1];
          const domain = parts.slice(2).join("_");
          const diff = (now - new Date(dateStr).getTime()) / 86400000;
          if (diff <= 7) {
            stats[domain] = (stats[domain] || 0) + v;
          }
        }
        sendResponse({ stats });
        break;
      }
      case "CLEAR_DATA": {
        const allData = await chrome.storage.local.get(null);
        const keysToRemove = Object.keys(allData).filter((k) =>
          k.startsWith("usage_")
        );
        await chrome.storage.local.remove(keysToRemove);
        sendResponse({ ok: true });
        break;
      }
      default:
        sendResponse({ error: "Unknown message type" });
    }
  })();
  return true; // async
});

console.log("[FocusGuard] Background service worker started.");
