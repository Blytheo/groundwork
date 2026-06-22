import { useEffect, useRef, useState } from 'react';
import { arcgisQueryGeom } from '../api/arcgis.js';
import { esriFeaturesToGeoJSON, nearestFeature } from '../utils/geojson.js';
import { safe } from '../utils/helpers.js';
import { EP } from '../data/config.js';
import { solarPosition, dayOfYear, shadowPathCoords, shadowTipCoord } from '../utils/solar.js';

const mapboxgl = window.mapboxgl;
const REF_HEIGHT = 3;

function addHousenumberLabels(map) {
  if (map.getLayer('house-numbers')) return;
  map.addLayer({
    id: 'house-numbers',
    type: 'symbol',
    source: 'composite',
    'source-layer': 'housenum_label',
    minzoom: 17,
    layout: {
      'text-field': ['get', 'house_num'],
      'text-size': 11,
      'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
      'text-anchor': 'center',
    },
    paint: {
      'text-color': '#4a3030',
      'text-halo-color': 'rgba(255,255,255,0.9)',
      'text-halo-width': 1.5,
    },
  });
}

const SEASONS = [
  { key: 'summer',  color: '#ff7759', label: 'Summer shadow',  doyFn: yr => dayOfYear(new Date(yr, 11, 21)) },
  { key: 'winter',  color: '#1863dc', label: 'Winter shadow',  doyFn: yr => dayOfYear(new Date(yr,  5, 21)) },
  { key: 'equinox', color: '#93939f', label: 'Equinox shadow', doyFn: yr => dayOfYear(new Date(yr,  2, 21)), dash: true },
];

function resolveTime(mode) {
  const now = new Date();
  const yr = now.getFullYear();
  if (mode === 'summer')  return { doy: dayOfYear(new Date(yr, 11, 21)), hour: 12 };
  if (mode === 'winter')  return { doy: dayOfYear(new Date(yr,  5, 21)), hour: 12 };
  if (mode === 'equinox') return { doy: dayOfYear(new Date(yr,  2, 21)), hour: 12 };
  return { doy: dayOfYear(now), hour: now.getHours() + now.getMinutes() / 60 };
}

function makeTipData(lat, lon, mode) {
  const { doy, hour } = resolveTime(mode);
  const tip = shadowTipCoord(lat, lon, REF_HEIGHT, doy, hour);
  return {
    line: { type: 'Feature', geometry: { type: 'LineString', coordinates: tip ? [[lon, lat], tip] : [[lon, lat], [lon, lat]] }, properties: {} },
    tip:  { type: 'Feature', geometry: { type: 'Point', coordinates: tip ?? [lon, lat] }, properties: { vis: tip ? 1 : 0 } },
  };
}

function sunLight(lat, mode) {
  const { doy, hour } = resolveTime(mode);
  const pos = solarPosition(lat, doy, hour);
  if (pos.alt < 0) return null;
  return {
    position: [1.15, ((90 - pos.az) + 360) % 360, 90 - pos.alt],
    color: pos.alt > 25 ? '#fff8f0' : '#ffe8c8',
    intensity: Math.min(0.7, pos.alt / 60 + 0.25),
  };
}

export default function LotMapPanel({ ctx }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const readyRef = useRef(false);
  const [dateMode, setDateMode] = useState('now');

  function applyLight(mode) {
    const map = mapRef.current;
    if (!map) return;
    const light = sunLight(ctx.lat, mode);
    if (light) map.setLight({ anchor: 'map', color: light.color, intensity: light.intensity, position: light.position });
  }

  function updateMarker(mode) {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const { line, tip } = makeTipData(ctx.lat, ctx.lon, mode);
    map.getSource('shadow-now-line')?.setData(line);
    map.getSource('shadow-now-tip')?.setData(tip);
    applyLight(mode);
  }

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    readyRef.current = false;

    const pLon = ctx.propertyPoint?.lon ?? ctx.lon;
    const pLat = ctx.propertyPoint?.lat ?? ctx.lat;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [pLon, pLat],
      zoom: 17,
      pitch: 50,
      bearing: -20,
      scrollZoom: false,
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    new mapboxgl.Marker({ color: '#9b3028' })
      .setLngLat([pLon, pLat])
      .setPopup(new mapboxgl.Popup({ offset: 12 }).setText(ctx.typedAddress))
      .addTo(map);

    map.on('load', async () => {
      const yr = new Date().getFullYear();

      // 3D building extrusions
      map.addLayer({
        id: '3d-buildings',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        minzoom: 14,
        paint: {
          'fill-extrusion-color': '#e8e4de',
          'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 14, 0, 14.5, ['get', 'height']],
          'fill-extrusion-base':   ['interpolate', ['linear'], ['zoom'], 14, 0, 14.5, ['get', 'min_height']],
          'fill-extrusion-opacity': 0.85,
        },
      });

      // Lot boundary
      if (ctx.isNSW) {
        const pLon = ctx.propertyPoint?.lon ?? ctx.lon;
        const pLat = ctx.propertyPoint?.lat ?? ctx.lat;
        const lotFeats = nearestFeature(
          await safe(arcgisQueryGeom(EP.cadastre, pLon, pLat, { distance: 10 }), []),
          pLon, pLat
        );
        if (lotFeats.length) {
          const geojson = esriFeaturesToGeoJSON(lotFeats);
          map.addSource('lot', { type: 'geojson', data: geojson });
          map.addLayer({ id: 'lot-fill',    type: 'fill', source: 'lot', paint: { 'fill-color': '#9b3028', 'fill-opacity': 0.1 } });
          map.addLayer({ id: 'lot-outline', type: 'line', source: 'lot', paint: { 'line-color': '#9b3028', 'line-width': 2.5, 'line-opacity': 0.9 } });
          addHousenumberLabels(map);
          const bounds = new mapboxgl.LngLatBounds();
          geojson.features.forEach(f => {
            if (f.geometry.type === 'Polygon') f.geometry.coordinates[0].forEach(c => bounds.extend(c));
          });
          if (!bounds.isEmpty()) {
            map.fitBounds(bounds, { padding: 80, maxZoom: 18, pitch: 50, bearing: -20, duration: 1000 });
          }
        }
      }

      // Shadow path arcs (ground-level lines on top of extrusions)
      for (const s of SEASONS) {
        const coords = shadowPathCoords(ctx.lat, ctx.lon, REF_HEIGHT, s.doyFn(yr));
        if (coords.length < 2) continue;
        map.addSource(`shadow-${s.key}`, {
          type: 'geojson',
          data: { type: 'Feature', geometry: { type: 'LineString', coordinates: coords }, properties: {} },
        });
        const paint = { 'line-color': s.color, 'line-width': 2, 'line-opacity': 0.8 };
        if (s.dash) paint['line-dasharray'] = [3, 2];
        map.addLayer({ id: `shadow-${s.key}`, type: 'line', source: `shadow-${s.key}`, paint });
      }

      // Current / selected-time shadow indicator
      const { line, tip } = makeTipData(ctx.lat, ctx.lon, dateMode);
      map.addSource('shadow-now-line', { type: 'geojson', data: line });
      map.addLayer({
        id: 'shadow-now-line', type: 'line', source: 'shadow-now-line',
        paint: { 'line-color': '#e8920a', 'line-width': 2.5, 'line-opacity': 0.95 },
      });
      map.addSource('shadow-now-tip', { type: 'geojson', data: tip });
      map.addLayer({
        id: 'shadow-now-tip', type: 'circle', source: 'shadow-now-tip',
        paint: {
          'circle-radius': 6, 'circle-color': '#e8920a',
          'circle-stroke-width': 2, 'circle-stroke-color': '#fff',
          'circle-opacity': ['get', 'vis'], 'circle-stroke-opacity': ['get', 'vis'],
        },
      });

      readyRef.current = true;
      applyLight(dateMode);
    });

    return () => { map.remove(); mapRef.current = null; readyRef.current = false; };
  }, [ctx.lat, ctx.lon]);

  useEffect(() => {
    updateMarker(dateMode);
  }, [dateMode]);

  const { doy, hour } = resolveTime(dateMode);
  const pos = solarPosition(ctx.lat, doy, hour);
  const sunAbove = pos.alt > 1;
  const shadowLen = sunAbove ? (REF_HEIGHT / Math.tan(pos.alt * Math.PI / 180)).toFixed(1) : null;

  return (
    <div className="panel panel-map">
      <div className="panel-head">
        <h3>Lot boundary &amp; shadow paths</h3>
        <select value={dateMode} onChange={e => setDateMode(e.target.value)} aria-label="Select date for shadow">
          <option value="now">Today, live</option>
          <option value="summer">Summer solstice (21 Dec)</option>
          <option value="winter">Winter solstice (21 Jun)</option>
          <option value="equinox">Equinox (21 Mar)</option>
        </select>
      </div>
      <div className="map-stage">
        <div ref={mapContainerRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      </div>
      <div className="map-legend">
        <span><i style={{ background: '#ff7759' }} />Summer shadow</span>
        <span><i style={{ background: '#1863dc' }} />Winter shadow</span>
        <span><i style={{ background: '#93939f' }} />Equinox shadow</span>
        <span>
          <i style={{ background: '#e8920a', height: 8, width: 8, borderRadius: '50%', display: 'inline-block' }} />
          {dateMode === 'now' ? 'Now' : 'Solar noon'}
        </span>
        {ctx.isNSW && <span><i style={{ background: '#9b3028', opacity: 0.7 }} />Lot boundary</span>}
      </div>
      <div className="shadow-note">
        {sunAbove
          ? <>3D buildings from Mapbox data · shadow paths from a 3 m reference at site centre — <strong>{shadowLen} m</strong> at {dateMode === 'now' ? 'this time' : 'solar noon'}.</>
          : <>Sun below horizon {dateMode === 'now' ? 'right now' : 'at solar noon'}. Rotate or zoom the 3D view with the controls top-right.</>
        }
      </div>
    </div>
  );
}
