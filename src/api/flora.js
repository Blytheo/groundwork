const HEADERS = { Accept: 'application/json' };
const DELAY = ms => new Promise(r => setTimeout(r, ms));

async function alaFetch(url) {
  let res = await fetch(url, { headers: HEADERS });
  if (res.status === 503 || res.status === 429) {
    await DELAY(2000);
    res = await fetch(url, { headers: HEADERS });
  }
  if (!res.ok) throw new Error('ALA HTTP ' + res.status);
  return res.json();
}

export async function fetchFloraFauna(lat, lon, radiusKm = 1) {
  const url = `https://api.ala.org.au/occurrences/occurrences/search?lat=${lat}&lon=${lon}&radius=${radiusKm}&pageSize=100`;
  const data = await alaFetch(url);
  const occurrences = data.occurrences || [];

  const dedupe = arr => {
    const seen = new Set();
    return arr.filter(o => {
      const key = o.scientificName || o.species || '';
      if (!key || seen.has(key)) return false;
      seen.add(key); return true;
    });
  };

  const flora = dedupe(occurrences.filter(o => (o.kingdom || '').toLowerCase() === 'plantae'));
  const fauna = dedupe(occurrences.filter(o => (o.kingdom || '').toLowerCase() === 'animalia'));
  const fungi = dedupe(occurrences.filter(o => (o.kingdom || '').toLowerCase() === 'fungi'));

  return { flora, fauna, fungi, total: data.totalRecords || 0, radiusKm };
}
