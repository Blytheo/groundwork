export async function fetchWikiSummary(suburb, state) {
  if (!suburb) return null;
  const candidates = [`${suburb}, ${state}`, suburb, `${suburb}, New South Wales`];
  for (const title of candidates) {
    try {
      const enc = encodeURIComponent(title.trim().replace(/ /g, '_'));
      const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${enc}?origin=*`);
      if (res.ok) {
        const data = await res.json();
        if (data.extract && data.type !== 'disambiguation') return data;
      }
    } catch { /* try next */ }
  }
  return null;
}

export async function fetchNearbyLandmarks(lat, lon, radius = 1200, limit = 25) {
  const url = 'https://en.wikipedia.org/w/api.php?' + new URLSearchParams({
    action: 'query', list: 'geosearch', format: 'json', origin: '*',
    gscoord: `${lat}|${lon}`, gsradius: String(radius), gslimit: String(limit),
  });
  const res = await fetch(url);
  if (!res.ok) throw new Error('Wikipedia geosearch HTTP ' + res.status);
  const data = await res.json();
  const list = (data.query && data.query.geosearch) || [];
  return list.map(p => ({
    title: p.title, lat: p.lat, lon: p.lon, dist: Math.round(p.dist),
    url: 'https://en.wikipedia.org/wiki/' + encodeURIComponent(p.title.replace(/ /g, '_')),
  }));
}
