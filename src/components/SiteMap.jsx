import { useEffect, useRef } from 'react';
import { arcgisQueryGeom } from '../api/arcgis.js';
import { esriFeaturesToGeoJSON, nearestFeature } from '../utils/geojson.js';
import { safe } from '../utils/helpers.js';
import { EP } from '../data/config.js';

const mapboxgl = window.mapboxgl;

function addHousenumberLabels(map) {
  if (map.getLayer('house-numbers')) return;
  map.addLayer({
    id: 'house-numbers',
    type: 'symbol',
    source: 'composite',
    'source-layer': 'housenum_label',
    minzoom: 16,
    layout: {
      'text-field': ['get', 'house_num'],
      'text-size': 11,
      'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
      'text-anchor': 'center',
    },
    paint: {
      'text-color': '#67524a',
      'text-halo-color': 'rgba(228,223,214,0.95)',
      'text-halo-width': 1.5,
    },
  });
}

export default function SiteMap({ ctx }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

    const pLon = ctx.propertyPoint?.lon ?? ctx.lon;
    const pLat = ctx.propertyPoint?.lat ?? ctx.lat;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [pLon, pLat],
      zoom: 18,
      scrollZoom: false,
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    new mapboxgl.Marker({ color: '#9b3028', scale: 1.1 })
      .setLngLat([pLon, pLat])
      .setPopup(new mapboxgl.Popup({ offset: 12 }).setText(ctx.display))
      .addTo(map);

    const layerPopup = new mapboxgl.Popup({ offset: 4, className: 'map-info-popup', closeButton: true });

    map.on('load', async () => {
      addHousenumberLabels(map);
      if (!ctx.isNSW) return;
      const feats = nearestFeature(
        await safe(arcgisQueryGeom(EP.cadastre, pLon, pLat, { distance: 10 }), []),
        pLon, pLat
      );
      if (!feats.length) return;
      const geojson = esriFeaturesToGeoJSON(feats);
      map.addSource('lot', { type: 'geojson', data: geojson });
      map.addLayer({ id: 'lot-fill',    type: 'fill', source: 'lot', paint: { 'fill-color': '#9b3028', 'fill-opacity': 0.1 } });
      map.addLayer({ id: 'lot-outline', type: 'line', source: 'lot', paint: { 'line-color': '#9b3028', 'line-width': 2.5 } });

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
        layerPopup.setLngLat(e.lngLat).setHTML(`<div class="mpop"><strong class="mpop-title">${title}</strong>${rows}</div>`).addTo(map);
      });
      map.on('mouseenter', 'lot-fill', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'lot-fill', () => { map.getCanvas().style.cursor = ''; });

      const bounds = new mapboxgl.LngLatBounds();
      geojson.features.forEach(f => {
        if (f.geometry.type === 'Polygon') f.geometry.coordinates[0].forEach(c => bounds.extend(c));
      });
      if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 60, maxZoom: 19, duration: 800 });
    });

    return () => { map.remove(); mapRef.current = null; };
  }, [ctx.lat, ctx.lon]);

  return (
    <div className="panel" style={{ marginBottom: 24 }}>
      <div className="panel-head">
        <h3>Lot boundary</h3>
        {!ctx.isNSW && <span className="search-note" style={{ margin: 0 }}>Lot polygon available for NSW addresses only</span>}
      </div>
      <div className="lm-stage" ref={containerRef} />
      {ctx.isNSW && (
        <div className="map-legend">
          <span><i style={{ background: '#9b3028', opacity: 0.7 }} />Lot boundary</span>
        </div>
      )}
    </div>
  );
}
