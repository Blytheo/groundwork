import { arcgisQuery } from './arcgis.js';
import { titleCase } from '../utils/helpers.js';
import NSW_LGA_DIRECTORY from '../data/lgaDirectory.js';
import { EP } from '../data/config.js';

export async function geocodeAddress(address) {
  const token = import.meta.env.VITE_MAPBOX_API_KEY;
  // Strip trailing ', Australia' we append before calling — Mapbox uses country=au param instead
  const query = address.replace(/,?\s*australia$/i, '').trim();
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` + new URLSearchParams({
    country: 'au',
    types: 'address',
    limit: '1',
    access_token: token,
  });
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error('Geocoding service unavailable');
  const data = await res.json();
  if (!data.features?.length) throw new Error('Address not found. Try including suburb and state.');
  const f = data.features[0];
  const [lon, lat] = f.center;
  // Build addr object from Mapbox context array
  const addr = {};
  for (const ctx of f.context || []) {
    const type = ctx.id.split('.')[0];
    if (type === 'locality' || type === 'neighborhood') addr.suburb = addr.suburb || ctx.text;
    else if (type === 'place') { addr.city = ctx.text; if (!addr.suburb) addr.suburb = ctx.text; }
    else if (type === 'region') addr.state = ctx.text;
    else if (type === 'postcode') addr.postcode = ctx.text;
    else if (type === 'district') addr.county = ctx.text;
  }
  return { lat, lon, display: f.place_name, addr };
}

export function deriveSuburb(addr) { return addr.suburb || addr.city_district || addr.town || addr.village || addr.municipality || addr.locality || addr.city || ''; }
export function derivePostcode(addr) { return addr.postcode || ''; }
export function deriveState(addr) { return addr.state || ''; }

export async function resolveLGA(lon, lat) {
  const feats = await arcgisQuery(EP.lga, lon, lat).catch(() => []);
  if (!feats.length) return null;
  const a = feats[0];
  const lganame = a.lganame || a.LGANAME || '';
  const councilname = a.councilname || a.COUNCILNAME || '';
  return { lganame: String(lganame).toUpperCase(), councilname };
}

export async function refineNSWPoint(typedAddress, lon, lat) {
  const numMatch = typedAddress.match(/^\s*(\d+)/);
  if (!numMatch) return null;
  const houseNum = parseInt(numMatch[1], 10);
  const params = new URLSearchParams({
    geometry: `${lon},${lat}`,
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    distance: 250,
    units: 'esriSRUnit_Meter',
    where: `housenumber = ${houseNum} AND addresspointtype = 'PROPERTY'`,
    outFields: 'housenumber,addresspointtype',
    returnGeometry: 'true',
    outSR: '4326',
    f: 'json',
  });
  const res = await fetch(
    `https://portal.spatial.nsw.gov.au/server/rest/services/NSW_Geocoded_Addressing_Theme/FeatureServer/0/query?${params}`
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (data.error || !data.features?.length) return null;
  let best = data.features[0];
  let bestDist = Infinity;
  for (const f of data.features) {
    const d = (f.geometry.x - lon) ** 2 + (f.geometry.y - lat) ** 2;
    if (d < bestDist) { bestDist = d; best = f; }
  }
  return { lon: best.geometry.x, lat: best.geometry.y };
}

export function resolveCouncilLink(lgaInfo) {
  if (!lgaInfo) return null;
  const dict = NSW_LGA_DIRECTORY[lgaInfo.lganame];
  if (dict) return { name: dict.name, site: dict.site, verified: true };
  const display = lgaInfo.councilname ? titleCase(lgaInfo.councilname) : titleCase(lgaInfo.lganame) + ' Council';
  return { name: display, site: 'https://www.google.com/search?q=' + encodeURIComponent(display + ' official website'), verified: false };
}
