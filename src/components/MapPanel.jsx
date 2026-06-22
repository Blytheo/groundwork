import { useEffect, useRef, useState } from 'react';
const mapboxgl = window.mapboxgl;

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
import { buildSunPathSVG } from '../utils/solar.js';
import { arcgisQueryGeom } from '../api/arcgis.js';
import { esriFeaturesToGeoJSON, nearestFeature } from '../utils/geojson.js';
import { safe } from '../utils/helpers.js';
import { EP } from '../data/config.js';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_KEY;

export default function MapPanel({ ctx }) {
  const mapContainerRef = useRef(null);
  const overlayRef = useRef(null);
  const mapRef = useRef(null);
  const [dateMode, setDateMode] = useState('now');

  function drawOverlay(mode) {
    const el = overlayRef.current;
    if (!el) return;
    const w = el.clientWidth, h = el.clientHeight;
    if (!w || !h) return;
    const inner = buildSunPathSVG(ctx.lat, w, h, mode);
    el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;pointer-events:none;">${inner}</svg>`;
  }

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [ctx.lon, ctx.lat],
      zoom: 17,
      scrollZoom: false,
    });
    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Site marker
    new mapboxgl.Marker({ color: '#9b3028' })
      .setLngLat([ctx.lon, ctx.lat])
      .setPopup(new mapboxgl.Popup({ offset: 12 }).setText(ctx.typedAddress))
      .addTo(map);

    const layerPopup = new mapboxgl.Popup({ offset: 4, className: 'map-info-popup', closeButton: true });

    function showPopup(lngLat, html) {
      layerPopup.setLngLat(lngLat).setHTML(html).addTo(map);
    }

    map.on('load', async () => {
      // Draw sun path overlay once map is ready
      drawOverlay(dateMode);

      // Lot boundary — fetch cadastre polygon geometry
      if (ctx.isNSW) {
        const pLon = ctx.propertyPoint?.lon ?? ctx.lon;
        const pLat = ctx.propertyPoint?.lat ?? ctx.lat;
        const lotFeats = nearestFeature(
          await safe(arcgisQueryGeom(EP.cadastre, pLon, pLat, { distance: 10 }), []),
          pLon, pLat
        );
        if (lotFeats.length) {
          const geojson = esriFeaturesToGeoJSON(lotFeats);
          addHousenumberLabels(map);
          map.addSource('lot', { type: 'geojson', data: geojson });
          map.addLayer({
            id: 'lot-fill',
            type: 'fill',
            source: 'lot',
            paint: { 'fill-color': '#9b3028', 'fill-opacity': 0.08 },
          });
          map.addLayer({
            id: 'lot-outline',
            type: 'line',
            source: 'lot',
            paint: { 'line-color': '#9b3028', 'line-width': 2.5, 'line-opacity': 0.85 },
          });

          map.on('click', 'lot-fill', e => {
            if (!e.features?.length) return;
            const p = e.features[0].properties;
            const lotId = p.lotidstring || p.LOTIDSTRING || '';
            const plan = p.planlabel || p.PLANLABEL || p.plannumber || '';
            const area = p.shape_area || p['Shape.STArea()'] || p.Shape__Area || p.SHAPE_Area || '';
            const title = lotId || plan || 'Lot boundary';
            const areaStr = area ? `${Math.round(+area).toLocaleString()} m²` : '';
            const rows = [
              plan && lotId && `<div class="mpop-row"><span>Plan</span><b>${plan}</b></div>`,
              areaStr && `<div class="mpop-row"><span>Area</span><b>${areaStr}</b></div>`,
            ].filter(Boolean).join('');
            showPopup(e.lngLat, `<div class="mpop"><strong class="mpop-title">${title}</strong>${rows}</div>`);
          });
          map.on('mouseenter', 'lot-fill', () => { map.getCanvas().style.cursor = 'pointer'; });
          map.on('mouseleave', 'lot-fill', () => { map.getCanvas().style.cursor = ''; });

          // Fit map to lot bounds with padding
          const bounds = new mapboxgl.LngLatBounds();
          geojson.features.forEach(f => {
            if (f.geometry.type === 'Polygon') {
              f.geometry.coordinates[0].forEach(coord => bounds.extend(coord));
            }
          });
          if (!bounds.isEmpty()) {
            map.fitBounds(bounds, { padding: 60, maxZoom: 19, duration: 800 });
          }
        }

        // Heritage area on this site (LEP) — shown as a warning tint
        const heritageFeats = await safe(arcgisQueryGeom(EP.heritage, ctx.lon, ctx.lat), []);
        if (heritageFeats.length) {
          map.addSource('heritage', { type: 'geojson', data: esriFeaturesToGeoJSON(heritageFeats) });
          map.addLayer({
            id: 'heritage-fill',
            type: 'fill',
            source: 'heritage',
            paint: { 'fill-color': '#6b7a4b', 'fill-opacity': 0.1 },
          });
          map.addLayer({
            id: 'heritage-outline',
            type: 'line',
            source: 'heritage',
            paint: { 'line-color': '#6b7a4b', 'line-width': 1.5, 'line-dasharray': [3, 2] },
          });

          map.on('click', 'heritage-fill', e => {
            if (!e.features?.length) return;
            const p = e.features[0].properties;
            const name = p.SHR_NAME || p.ITEM_NAME || p.NAME || p.EPI_NAME || 'Heritage item';
            const no = p.SHR_NO || p.HERIMAGE_NO || p.ITEM_NO || '';
            const sig = p.SIGNIFICANCE || p.ITEM_SIGNIFICANCE || p.LEP_SIGNIFICANCE || '';
            const lga = p.LGA_NAME || p.LGA || '';
            const rows = [
              sig && `<div class="mpop-row"><span>Significance</span><b>${sig}</b></div>`,
              no && `<div class="mpop-row"><span>Reference</span><b>${no}</b></div>`,
              lga && `<div class="mpop-row"><span>LGA</span><b>${lga}</b></div>`,
            ].filter(Boolean).join('');
            showPopup(e.lngLat, `<div class="mpop"><strong class="mpop-title">${name}</strong>${rows || '<div class="mpop-row"><span>Heritage item on this site</span></div>'}</div>`);
          });
          map.on('mouseenter', 'heritage-fill', () => { map.getCanvas().style.cursor = 'pointer'; });
          map.on('mouseleave', 'heritage-fill', () => { map.getCanvas().style.cursor = ''; });
        }
      }
    });

    map.on('resize', () => drawOverlay(dateMode));

    return () => { map.remove(); mapRef.current = null; };
  }, [ctx.lat, ctx.lon]);

  useEffect(() => {
    setTimeout(() => drawOverlay(dateMode), 50);
  }, [dateMode]);

  return (
    <div className="panel panel-map">
      <div className="panel-head">
        <h3>Site &amp; sun path</h3>
        <select value={dateMode} onChange={e => setDateMode(e.target.value)} aria-label="Select date for sun path">
          <option value="now">Today, live</option>
          <option value="summer">Summer solstice (21 Dec)</option>
          <option value="winter">Winter solstice (21 Jun)</option>
          <option value="equinox">Equinox (21 Mar)</option>
        </select>
      </div>
      <div className="map-stage">
        <div ref={mapContainerRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
        <div ref={overlayRef} className="sun-path-overlay" />
      </div>
      <div className="map-legend">
        <span><i style={{ background: '#ff7759' }} />Summer solstice</span>
        <span><i style={{ background: '#1863dc' }} />Winter solstice</span>
        <span><i style={{ background: '#93939f' }} />Equinox</span>
        <span>
          <i style={{ background: '#e8920a', height: 8, width: 8, borderRadius: '50%', display: 'inline-block' }} />
          Current position
        </span>
        {ctx.isNSW && <span><i style={{ background: '#9b3028', opacity: 0.7 }} />Lot boundary</span>}
      </div>
    </div>
  );
}
