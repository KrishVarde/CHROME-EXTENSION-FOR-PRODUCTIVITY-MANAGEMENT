// Utility to safely call chrome.runtime.sendMessage
// Falls back to mock data when running outside extension context

const isChromeExtension = typeof chrome !== "undefined" && chrome.runtime?.id;

export async function sendMessage(type, payload = {}) {
  if (!isChromeExtension) {
    return getMockResponse(type, payload);
  }
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type, ...payload }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn("[FocusGuard]", chrome.runtime.lastError.message);
        resolve(getMockResponse(type, payload));
      } else {
        resolve(response);
      }
    });
  });
}

// ── Mock data for development/preview ─────────────
function getMockResponse(type, _payload) {
  switch (type) {
    case "GET_TODAY_STATS":
      return {
        stats: {
          "github.com": 4320,
          "stackoverflow.com": 2180,
          "notion.so": 1560,
          "figma.com": 980,
          "npmjs.com": 420,
          "docs.google.com": 310,
        },
      };
    case "GET_WEEK_STATS":
      return {
        stats: {
          "github.com": 28800,
          "stackoverflow.com": 14400,
          "notion.so": 10800,
          "figma.com": 7200,
          "npmjs.com": 3600,
          "docs.google.com": 2400,
          "youtube.com": 1800,
        },
      };
    case "GET_BLOCKED_SITES":
      return {
        sites: ["youtube.com", "instagram.com", "reddit.com", "facebook.com"],
      };
    case "ADD_BLOCKED_SITE":
    case "REMOVE_BLOCKED_SITE":
    case "CLEAR_DATA":
      return { ok: true };
    default:
      return {};
  }
}
