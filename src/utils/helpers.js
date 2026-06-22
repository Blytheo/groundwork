export function escapeHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function titleCase(s) {
  if (!s) return '';
  return String(s).toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

export async function safe(promise, fallback = null) {
  try { return await promise; } catch (e) { console.warn(e); return fallback; }
}

export async function safeStatus(promise) {
  try { const value = await promise; return { ok: true, value }; }
  catch (e) { console.warn(e); return { ok: false, value: [] }; }
}

export function degreesToCardinal(deg) {
  if (deg === null || deg === undefined) return '—';
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

export function avgArr(arr) {
  const valid = (arr || []).filter(v => v !== null && v !== undefined && !isNaN(v));
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
}

export function fmtNum(n, decimals = 1) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return Number(n).toFixed(decimals);
}
