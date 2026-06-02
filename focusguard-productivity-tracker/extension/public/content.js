// Content script — injected into every page
// Currently minimal; can be extended for advanced tracking

(function () {
  // Notify background of focus/blur for accurate time tracking
  document.addEventListener("visibilitychange", () => {
    chrome.runtime.sendMessage({
      type: "VISIBILITY_CHANGE",
      hidden: document.hidden,
    }).catch(() => {});
  });
})();
