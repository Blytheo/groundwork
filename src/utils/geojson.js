function ringCentroid(ring) {
  let x = 0, y = 0;
  for (const [cx, cy] of ring) { x += cx; y += cy; }
  return [x / ring.length, y / ring.length];
}

// Returns a single-element array containing the feature whose polygon centroid
// is closest to [lon, lat]. Used to discard parcels on the wrong side of the street.
export function nearestFeature(features, lon, lat) {
  if (!features.length) return [];
  let best = features[0];
  let bestDist = Infinity;
  for (const f of features) {
    const ring = f.geometry?.rings?.[0];
    if (!ring || !ring.length) continue;
    const [cx, cy] = ringCentroid(ring);
    const d = (lon - cx) ** 2 + (lat - cy) ** 2;
    if (d < bestDist) { bestDist = d; best = f; }
  }
  return [best];
}

export function esriFeatureToGeoJSON(feature) {
  const geom = feature.geometry;
  if (!geom) return null;
  if (geom.rings) {
    return {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: geom.rings },
      properties: feature.attributes || {},
    };
  }
  if (geom.x !== undefined) {
    return {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [geom.x, geom.y] },
      properties: feature.attributes || {},
    };
  }
  return null;
}

export function esriFeaturesToGeoJSON(features) {
  return {
    type: 'FeatureCollection',
    features: (features || []).map(esriFeatureToGeoJSON).filter(Boolean),
  };
}
