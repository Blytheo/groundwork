import { avgArr, degreesToCardinal } from '../utils/helpers.js';

export async function fetchClimate(lat, lon) {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() - 1);
  const startDate = new Date(endDate);
  startDate.setFullYear(startDate.getFullYear() - 5);
  const fmtDate = d => d.toISOString().split('T')[0];
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}`
    + `&start_date=${fmtDate(startDate)}&end_date=${fmtDate(endDate)}`
    + `&daily=precipitation_sum,wind_speed_10m_max,wind_direction_10m_dominant,sunshine_duration,uv_index_max`
    + `&timezone=Australia%2FSydney`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Open-Meteo HTTP ' + res.status);
  const data = await res.json();
  if (data.error) throw new Error(data.reason || 'Open-Meteo error');
  const d = data.daily || {};
  const modalWindDir = (() => {
    const dirs = (d.wind_direction_10m_dominant || []).filter(v => v !== null);
    if (!dirs.length) return null;
    const counts = {};
    let best = null, bestCount = 0;
    dirs.forEach(deg => {
      const card = degreesToCardinal(deg);
      counts[card] = (counts[card] || 0) + 1;
      if (counts[card] > bestCount) { bestCount = counts[card]; best = card; }
    });
    return best;
  })();
  return {
    precipitation: avgArr(d.precipitation_sum),
    windSpeed: avgArr(d.wind_speed_10m_max),
    windDir: modalWindDir,
    sunshineDuration: avgArr(d.sunshine_duration),
    uvMax: avgArr(d.uv_index_max),
    startYear: startDate.getFullYear(),
    endYear: endDate.getFullYear(),
  };
}
