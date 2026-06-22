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
import { fetchNearbyLandmarks } from '../api/wiki.js';
import { arcgisQueryGeom } from '../api/arcgis.js';
import { esriFeaturesToGeoJSON, nearestFeature } from '../utils/geojson.js';
import { safe } from '../utils/helpers.js';
import { EP } from '../data/config.js';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_KEY;

const LAYERS = {
  lot:       { id: 'lot',       label: 'Lot boundary',              color: '#9b3028' },
  landmarks: { id: 'landmarks', label: 'Landmarks',                 color: '#67524a' },
  heritage:  { id: 'heritage',  label: 'Heritage areas (LEP)',      color: '#6b7a4b' },
  shr:       { id: 'shr',       label: 'Named heritage items (SHR)', color: '#9b3028' },
  hazards:   { id: 'hazards',   label: 'Hazard areas',             color: '#b07d3c' },
};

export default function LandmarksMap({ ctx }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [error, setError] = useState(false);
  const [visible, setVisible] = useState({
    lot: ctx.isNSW,
    landmarks: true,
    heritage: ctx.isNSW,
    shr: ctx.isNSW,
    hazards: ctx.isNSW,
  });

  function toggleLayer(key, show) {
    const map = mapRef.current;
    if (!map) return;
    const layerIds = map.getStyle()?.layers?.map(l => l.id) || [];

    if (key === 'landmarks') {
      markersRef.current.forEach(m => m.getElement().style.display = show ? '' : 'none');
    } else {
      [`${key}-fill`, `${key}-outline`].forEach(id => {
        if (layerIds.includes(id)) {
          map.setLayoutProperty(id, 'visibility', show ? 'visible' : 'none');
        }
      });
    }
  }

  function handleToggle(key, checked) {
    setVisible(v => ({ ...v, [key]: checked }));
    toggleLayer(key, checked);
  }

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    markersRef.current = [];
    setError(false);

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [ctx.lon, ctx.lat],
      zoom: 13,
      scrollZoom: false,
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Site marker
    new mapboxgl.Marker({ color: '#17171c', scale: 1.1 })
      .setLngLat([ctx.lon, ctx.lat])
      .setPopup(new mapboxgl.Popup({ offset: 12 }).setHTML('<strong>Searched site</strong>'))
      .addTo(map);

    map.on('load', async () => {
      try {
        // Lot boundary from NSW Spatial Viewer cadastre
        if (ctx.isNSW) {
          const pLon = ctx.propertyPoint?.lon ?? ctx.lon;
          const pLat = ctx.propertyPoint?.lat ?? ctx.lat;
          const lotFeats = nearestFeature(
            await safe(arcgisQueryGeom(EP.cadastre, pLon, pLat, { distance: 10 }), []),
            pLon, pLat
          );
          if (lotFeats.length) {
            const lotGeoJSON = esriFeaturesToGeoJSON(lotFeats);
            addHousenumberLabels(map);
            map.addSource('lot', { type: 'geojson', data: lotGeoJSON });
            map.addLayer({
              id: 'lot-fill', type: 'fill', source: 'lot',
              layout: { visibility: visible.lot ? 'visible' : 'none' },
              paint: { 'fill-color': '#9b3028', 'fill-opacity': 0.12 },
            });
            map.addLayer({
              id: 'lot-outline', type: 'line', source: 'lot',
              layout: { visibility: visible.lot ? 'visible' : 'none' },
              paint: { 'line-color': '#9b3028', 'line-width': 2.5 },
            });
            const bounds = new mapboxgl.LngLatBounds();
            lotGeoJSON.features.forEach(f => {
              if (f.geometry.type === 'Polygon') f.geometry.coordinates[0].forEach(c => bounds.extend(c));
            });
            if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 800 });
          }
        }

        // Wikipedia landmarks
        const places = await safe(fetchNearbyLandmarks(ctx.lat, ctx.lon, 1200, 25), []);
        places.forEach(p => {
          const el = document.createElement('div');
          el.style.cssText = `width:12px;height:12px;border-radius:50%;background:#9b3028;border:2px solid #e4dfd6;box-shadow:0 1px 4px rgba(43,18,23,.25);cursor:pointer;`;
          if (!visible.landmarks) el.style.display = 'none';
          const marker = new mapboxgl.Marker({ element: el })
            .setLngLat([p.lon, p.lat])
            .setPopup(
              new mapboxgl.Popup({ offset: 10 }).setHTML(
                `<strong>${p.title}</strong><br>${p.dist} m away<br><a href="${p.url}" target="_blank" rel="noopener">Wikipedia ↗</a>`
              )
            )
            .addTo(map);
          markersRef.current.push(marker);
        });

        if (ctx.isNSW) {
          const [heritageFeats, shrPolyFeats, bushfireFeats, floodFeats, landslideFeats] = await Promise.all([
            safe(arcgisQueryGeom(EP.heritage, ctx.lon, ctx.lat, { distance: 500 }), []),
            safe(arcgisQueryGeom(EP.heritageNamedPoly, ctx.lon, ctx.lat, { distance: 500 }), []),
            safe(arcgisQueryGeom(EP.bushfire, ctx.lon, ctx.lat, { distance: 500 }), []),
            safe(arcgisQueryGeom(EP.flood, ctx.lon, ctx.lat, { distance: 500 }), []),
            safe(arcgisQueryGeom(EP.landslide, ctx.lon, ctx.lat, { distance: 500 }), []),
          ]);

          const addPolygonLayer = (id, features, fillColor, lineColor, opacity = 0.15) => {
            if (!features.length) return;
            const geojson = esriFeaturesToGeoJSON(features);
            map.addSource(id, { type: 'geojson', data: geojson });
            map.addLayer({
              id: `${id}-fill`, type: 'fill', source: id,
              layout: { visibility: visible[id] ? 'visible' : 'none' },
              paint: { 'fill-color': fillColor, 'fill-opacity': opacity },
            });
            map.addLayer({
              id: `${id}-outline`, type: 'line', source: id,
              layout: { visibility: visible[id] ? 'visible' : 'none' },
              paint: { 'line-color': lineColor, 'line-width': 2 },
            });
          };

          addPolygonLayer('heritage', heritageFeats, '#6b7a4b', '#6b7a4b', 0.12);
          addPolygonLayer('shr', shrPolyFeats, '#9b3028', '#9b3028', 0.16);

          const hazardAll = [...bushfireFeats, ...floodFeats, ...landslideFeats];
          addPolygonLayer('hazards', hazardAll, '#b07d3c', '#b07d3c', 0.12);
        }
      } catch (e) {
        console.warn(e);
        setError(true);
      }
    });

    return () => { map.remove(); mapRef.current = null; markersRef.current = []; };
  }, [ctx.lat, ctx.lon]);

  if (error) {
    return (
      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-head"><h3>Nearby landmarks map</h3></div>
        <div className="lm-stage"><div className="lm-fallback">Nearby landmarks map unavailable right now.</div></div>
      </div>
    );
  }

  return (
    <div className="panel" style={{ marginBottom: 24 }}>
      <div className="panel-head"><h3>Nearby landmarks map</h3></div>
      <div className="lm-stage" ref={mapContainerRef} />
      <div className="map-legend lm-toggle-row">
        {Object.values(LAYERS).map(({ id, label, color }) => {
          if (id !== 'landmarks' && !ctx.isNSW) return null;
          if (id === 'lot' && !ctx.isNSW) return null;
          return (
            <label key={id} className="lm-toggle">
              <input
                type="checkbox"
                checked={visible[id]}
                onChange={e => handleToggle(id, e.target.checked)}
                aria-label={`Toggle ${label} layer`}
              />
              <i style={{ background: color }} />{label}
            </label>
          );
        })}
      </div>
    </div>
  );
}
