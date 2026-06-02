export function formatSeconds(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatSecondsShort(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return m > 0 ? `${h}h${m}m` : `${h}h`;
}

export function getTopSites(stats, limit = 5) {
  return Object.entries(stats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([domain, seconds]) => ({ domain, seconds }));
}

export function getTotalSeconds(stats) {
  return Object.values(stats).reduce((a, b) => a + b, 0);
}

export function getFaviconUrl(domain) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}

export function getProductivityScore(stats, blockedSites = []) {
  const total = getTotalSeconds(stats);
  if (total === 0) return 100;
  const distractedSeconds = Object.entries(stats)
    .filter(([domain]) => blockedSites.some((b) => domain.includes(b)))
    .reduce((sum, [, s]) => sum + s, 0);
  return Math.round(((total - distractedSeconds) / total) * 100);
}
