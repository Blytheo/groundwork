export default async function handler(req, res) {
  const { lat, lon, radius = 1 } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'lat and lon required' });
  }

  const url = `https://api.ala.org.au/occurrences/occurrences/search?lat=${lat}&lon=${lon}&radius=${radius}&pageSize=100`;

  const attempt = async () => {
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error('ALA HTTP ' + r.status);
    return r.json();
  };

  try {
    let data;
    try {
      data = await attempt();
    } catch {
      await new Promise(r => setTimeout(r, 2000));
      data = await attempt();
    }
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json(data);
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
}
