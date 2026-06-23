function arcgisFetch(url, params, timeout = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  return fetch(`${url}/query?${params.toString()}`, { signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

export async function arcgisQuery(url, lon, lat, opts = {}) {
  const params = new URLSearchParams({
    geometry: `${lon},${lat}`,
    geometryType: 'esriGeometryPoint',
    inSR: '4283',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: '*',
    returnGeometry: 'false',
    f: 'json',
  });
  if (opts.distance) { params.set('distance', opts.distance); params.set('units', 'esriSRUnit_Meter'); }
  const res = await arcgisFetch(url, params);
  if (!res.ok) throw new Error('ArcGIS HTTP ' + res.status);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'ArcGIS error');
  return (data.features || []).map(f => f.attributes || {});
}

export async function arcgisQueryGeom(url, lon, lat, opts = {}) {
  const params = new URLSearchParams({
    geometry: `${lon},${lat}`,
    geometryType: 'esriGeometryPoint',
    inSR: '4283',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: '*',
    returnGeometry: 'true',
    outSR: '4326',
    f: 'json',
  });
  if (opts.distance) { params.set('distance', opts.distance); params.set('units', 'esriSRUnit_Meter'); }
  const res = await arcgisFetch(url, params);
  if (!res.ok) throw new Error('ArcGIS HTTP ' + res.status);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'ArcGIS error');
  return data.features || [];
}

export function esriRingsToLatLngs(geometry) {
  if (!geometry || !Array.isArray(geometry.rings)) return [];
  return geometry.rings.map(ring => ring.map(pt => [pt[1], pt[0]]));
}
