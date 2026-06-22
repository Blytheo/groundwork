export async function fetchFloraFauna(lat, lon, radiusKm = 1) {
  const res = await fetch(`/api/flora?lat=${lat}&lon=${lon}&radius=${radiusKm}`);
  if (!res.ok) throw new Error('Flora fetch failed: ' + res.status);
  const data = await res.json();
  if (data.error) throw new Error(data.error);

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
