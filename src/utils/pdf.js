import {
  zoningSummary, fsrSummary, heightSummary, lotSizeSummary, cadastreSummary,
  acidSulfateSummary, lotsizeSecondarySummary, streetFrontageSummary, foreshoreSummary,
  heritageSummary, hazardSummary,
} from './summaries.js';
import { fmtNum } from './helpers.js';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_API_KEY;

function staticMapImg(lon, lat, zoom = 15) {
  if (!MAPBOX_TOKEN) return '';
  const url = `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/pin-s-circle+9b3028(${lon},${lat})/${lon},${lat},${zoom}/640x300@2x?access_token=${MAPBOX_TOKEN}`;
  return `<div class="pdf-map"><img src="${url}" alt="Site location map" /></div>`;
}

function esc(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function section(title, bodyHtml) {
  if (!bodyHtml || !bodyHtml.trim()) return '';
  return `<div class="section"><h3>${title}</h3><div class="section-body">${bodyHtml}</div></div>`;
}

function kv(label, value, mod = '') {
  return `<div class="kv${mod ? ' ' + mod : ''}"><div class="k">${label}</div><div class="v">${value || '—'}</div></div>`;
}

function noteBox(html) {
  return `<div class="note">${html}</div>`;
}

// ─── Content builders ────────────────────────────────────────────────────────

function zoningContent(ctx) {
  if (!ctx.nswData) return '<p>NSW data not available for this address.</p>';
  const d = ctx.nswData;
  const c = cadastreSummary(d);

  let html = staticMapImg(ctx.lon, ctx.lat, 16);

  let titleHtml = '<div class="kv-grid">';
  if (c) {
    if (c.lotId || c.planLabel) titleHtml += kv('Lot / DP', esc(c.lotId || c.planLabel));
    if (c.area) titleHtml += kv('Lot area', `${esc(String(c.area))} ${esc(c.units)}`);
    titleHtml += '</div>';
  } else {
    titleHtml = '<p>Lot and title details could not be confirmed from live mapping.</p>';
  }
  html += section('Land & Title', titleHtml);
  html += section('Zoning', `<p>${zoningSummary(d)}</p>`);
  html += section('Floor Space Ratio', `<p>${fsrSummary(d)}</p>`);
  html += section('Height of Building', `<p>${heightSummary(d)}</p>`);
  html += section('Minimum Lot Size', `<p>${lotSizeSummary(d)}</p>`);

  const sec = lotsizeSecondarySummary(d);
  if (sec) html += section('Secondary Dwelling — Minimum Lot Size', `<p>${sec}</p>`);

  const ass = acidSulfateSummary(d);
  if (ass) html += section('Acid Sulfate Soils', `<p>${ass}</p>`);

  const sf = streetFrontageSummary(d);
  if (sf) html += section('Active Street Frontage', `<p>${sf}</p>`);

  const fsl = foreshoreSummary(d);
  if (fsl) html += section('Foreshore Building Line', `<p>${fsl}</p>`);

  return html;
}

function lotContent(ctx) {
  if (!ctx.nswData) return '<p>NSW data not available for this address.</p>';
  const d = ctx.nswData;
  const c = cadastreSummary(d);
  if (!c) return '<p>Lot and cadastre data could not be retrieved for this address.</p>';

  let html = staticMapImg(ctx.lon, ctx.lat, 17);
  html += '<div class="kv-grid">';
  if (c.lotId || c.planLabel) html += kv('Lot / DP', esc(c.lotId || c.planLabel));
  if (c.area) html += kv('Lot area', `${esc(String(c.area))} ${esc(c.units)}`);
  html += '</div>';
  html += noteBox('Lot boundary from NSW DCDB. Area from Spatial Plan data — may differ from the registered title area.');
  return section('Lot & Cadastre Details', html);
}

function heritageContent(ctx) {
  if (!ctx.nswData) return '<p>NSW data not available for this address.</p>';
  const d = ctx.nswData;
  const h = heritageSummary(d);

  let html = staticMapImg(ctx.lon, ctx.lat, 15);
  html += section('Heritage Status', `<p>${h.html}</p>`);

  const named = d.heritageNamedFeats || [];
  let shrHtml = '';
  if (named.length) {
    named.slice(0, 10).forEach(f => {
      const name = f.SHR_NAME || f.ITEM_NAME || f.NAME || 'Unnamed item';
      const no = f.SHR_NO || f.HERIMAGE_NO || f.ITEM_NO || '';
      const sig = f.SIGNIFICANCE || f.ITEM_SIGNIFICANCE || '';
      const date = f.LISTED_DATE || f.DATE_LISTED || f.LISTING_DATE || '';
      shrHtml += `<div class="heritage-card">
        <div class="heritage-tag">State Heritage Register${no ? ` · #${esc(String(no))}` : ''}</div>
        <div class="heritage-name">${esc(String(name))}</div>
        ${sig ? `<div class="heritage-meta">Significance: ${esc(String(sig))}</div>` : ''}
        ${date ? `<div class="heritage-meta">Listed: ${esc(String(date))}</div>` : ''}
      </div>`;
    });
    if (named.length > 10) shrHtml += `<p style="color:#837568;font-size:9pt">…and ${named.length - 10} more items.</p>`;
  } else {
    shrHtml = '<p>No individual items from the NSW State Heritage Register were found within 200m.</p>';
  }
  html += section('Named Items — State Heritage Register (within 200m)', shrHtml);
  return html;
}

function hazardsContent(ctx) {
  if (!ctx.nswData) return '<p>NSW data not available for this address.</p>';
  const d = ctx.nswData;
  const bf = hazardSummary('Bushfire Prone Land', d.bushfire, 'd_Category');
  const fl = hazardSummary('Flood Planning', d.flood, 'LAY_CLASS');
  const ls = hazardSummary('Landslide Risk', d.landslide, 'LAY_CLASS');

  let html = staticMapImg(ctx.lon, ctx.lat, 13);
  html += `<div class="kv-grid">
    ${kv('Bushfire', bf.flagged ? 'Flagged' : 'Clear', bf.flagged ? 'flag' : 'ok')}
    ${kv('Flood', fl.flagged ? 'Flagged' : 'Clear', fl.flagged ? 'flag' : 'ok')}
    ${kv('Landslide', ls.flagged ? 'Flagged' : 'Clear', ls.flagged ? 'flag' : 'ok')}
  </div>`;
  html += section('Bushfire', `<p>${bf.html}</p>`);
  html += section('Flood', `<p>${fl.html}</p>`);
  html += section('Landslide', `<p>${ls.html}</p>`);
  return html;
}

function climateContent(ctx) {
  const cl = ctx.climate;
  if (!cl || cl.error) return '<p>Live climate data could not be retrieved for this location.</p>';

  const sunHours = cl.sunshineDuration != null ? (cl.sunshineDuration / 3600).toFixed(1) + ' hrs' : '—';
  const wind = cl.windSpeed != null ? fmtNum(cl.windSpeed, 1) + ' km/h' : '—';
  const windDir = cl.windDir || '';
  const rain = cl.precipitation != null ? fmtNum(cl.precipitation, 1) + ' mm/day' : '—';
  const uv = cl.uvMax != null ? fmtNum(cl.uvMax, 1) : '—';

  let html = staticMapImg(ctx.lon, ctx.lat, 14);
  html += `<p style="color:#837568;font-size:9pt;margin-bottom:12px">5-year historical averages (${esc(String(cl.startYear))}–${esc(String(cl.endYear))}) from Open-Meteo ERA5 reanalysis data.</p>`;
  html += `<div class="kv-grid">
    ${kv('Avg daily sun', sunHours)}
    ${kv('Prevailing wind', windDir && wind ? `${esc(windDir)} · ${wind}` : wind)}
    ${kv('Avg daily rain', rain)}
    ${kv('Avg max UV', uv)}
  </div>`;
  return section('Climate Data', html);
}

function floraContent(ctx) {
  const ff = ctx.floraFauna;
  if (!ff || ff.error) return '<p>Flora and fauna data could not be retrieved.</p>';

  let html = staticMapImg(ctx.lon, ctx.lat, 13);
  html += noteBox(`Occurrence records within ${esc(String(ff.radiusKm))} km — not a site survey, not suitable for ecological assessment.`);

  const renderSpecies = (list, label) => {
    if (!list.length) return `<p style="color:#837568;font-size:9pt">No ${label} occurrence records found.</p>`;
    let out = `<h4 style="margin:14px 0 8px;color:#9b3028;font-size:8pt;letter-spacing:0.08em;text-transform:uppercase;font-family:monospace">${label} (${list.length} shown)</h4>`;
    out += '<div class="species-grid">';
    list.forEach(o => {
      const sci = o.scientificName || o.species || '';
      const common = o.vernacularName || o.commonName || '';
      out += `<div class="species-item"><div class="sci">${esc(sci)}</div>${common ? `<div class="common">${esc(common)}</div>` : ''}</div>`;
    });
    out += '</div>';
    return out;
  };

  html += renderSpecies(ff.flora.slice(0, 12), 'Plants');
  html += renderSpecies(ff.fauna.slice(0, 8), 'Animals');
  return html;
}

function historyContent(ctx) {
  const { wiki, suburb } = ctx;
  if (!wiki) return `<p>No Wikipedia summary matched to <strong>${esc(suburb || 'this area')}</strong>.</p>`;

  let html = staticMapImg(ctx.lon, ctx.lat, 14);
  html += `<p>${esc(wiki.extract || '')}</p>`;
  if (wiki.title) html += `<p style="margin-top:10px;font-size:8.5pt;color:#837568;font-family:monospace">Source: Wikipedia — ${esc(wiki.title)}</p>`;
  return section('Site History', html);
}

// ─── Styles ──────────────────────────────────────────────────────────────────

function pdfStyles() {
  return `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Space Grotesk', system-ui, sans-serif;
      font-size: 10pt;
      line-height: 1.65;
      color: #2b1217;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .pdf-page { max-width: 680px; margin: 0 auto; padding: 52px 48px; }
    @media print { .pdf-page { padding: 0; max-width: 100%; } }

    /* Header */
    .pdf-header { margin-bottom: 36px; }
    .brand {
      font-size: 28pt; font-weight: 600; letter-spacing: -0.04em; line-height: 1; margin-bottom: 18px;
      background: linear-gradient(135deg, #2b1217 0%, #9b3028 50%, #6b7a4b 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .rule { border: none; border-top: 1.5px solid #bfb8ae; margin-bottom: 14px; }
    .meta-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 8px; }
    .address { font-size: 12pt; font-weight: 500; }
    .date-stamp { font-family: 'IBM Plex Mono', monospace; font-size: 8pt; color: #837568; white-space: nowrap; padding-top: 3px; }
    .section-tag { font-family: 'IBM Plex Mono', monospace; font-size: 8pt; color: #9b3028; letter-spacing: 0.07em; text-transform: uppercase; }

    /* Sections */
    .section { margin-bottom: 24px; }
    .section h3 {
      font-family: 'IBM Plex Mono', monospace; font-size: 7.5pt; font-weight: 500;
      letter-spacing: 0.1em; text-transform: uppercase; color: #9b3028;
      margin-bottom: 9px; padding-bottom: 7px; border-bottom: 1px solid #d4cec5;
    }
    .section h4 { font-size: 9.5pt; font-weight: 600; margin: 14px 0 6px; }
    .section-body p { font-size: 9.5pt; margin-bottom: 8px; }
    .section-body p:last-child { margin-bottom: 0; }
    .section-body strong { font-weight: 600; }

    /* KV grid */
    .kv-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 14px; }
    .kv { padding: 10px 13px; background: #f5f0eb; border-radius: 5px; }
    .kv .k { font-family: 'IBM Plex Mono', monospace; font-size: 7pt; color: #837568; margin-bottom: 3px; text-transform: uppercase; letter-spacing: 0.05em; }
    .kv .v { font-size: 11pt; font-weight: 500; }
    .kv.ok .v { color: #6b7a4b; }
    .kv.flag .v { color: #b34d3c; }

    /* Note */
    .note { background: #f5f0eb; border-left: 3px solid #bfb8ae; padding: 10px 14px; font-size: 8.5pt; color: #67524a; margin: 8px 0 14px; border-radius: 0 4px 4px 0; line-height: 1.5; }

    /* Heritage */
    .heritage-card { border: 1px solid #d4cec5; border-radius: 5px; padding: 12px 14px; margin-bottom: 8px; }
    .heritage-tag { font-family: 'IBM Plex Mono', monospace; font-size: 7.5pt; color: #9b3028; margin-bottom: 4px; }
    .heritage-name { font-size: 11pt; font-weight: 500; margin-bottom: 4px; }
    .heritage-meta { font-size: 8.5pt; color: #67524a; }

    /* Species */
    .species-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; margin-bottom: 12px; }
    .species-item { padding: 8px 10px; border: 1px solid #d4cec5; border-radius: 4px; }
    .sci { font-style: italic; font-size: 9pt; }
    .common { font-size: 8pt; color: #67524a; margin-top: 2px; }

    /* Map */
    .pdf-map { margin: 0 0 20px; border-radius: 7px; overflow: hidden; border: 1px solid #d4cec5; background: #eee; line-height: 0; }
    .pdf-map img { width: 100%; height: auto; display: block; }

    /* Footer */
    .pdf-footer { margin-top: 48px; padding-top: 14px; border-top: 1.5px solid #bfb8ae; font-family: 'IBM Plex Mono', monospace; font-size: 7pt; color: #837568; line-height: 1.6; }

    @media print {
      .section { page-break-inside: avoid; }
      .heritage-card { page-break-inside: avoid; }
      .pdf-footer { page-break-before: avoid; }
    }
  `;
}

// ─── Category registry ───────────────────────────────────────────────────────

const CATS = {
  zoning:  { num: '01', label: 'Zoning & planning' },
  lot:     { num: '02', label: 'Lot & cadastre' },
  heritage:{ num: '03', label: 'Heritage' },
  hazards: { num: '04', label: 'Hazards' },
  climate: { num: '05', label: 'Climate & sun' },
  flora:   { num: '06', label: 'Flora & fauna' },
  history: { num: '07', label: 'Site history' },
  full:    { num: '—',  label: 'Full site analysis' },
};

function buildContent(ctx, key) {
  switch (key) {
    case 'zoning':   return zoningContent(ctx);
    case 'lot':      return lotContent(ctx);
    case 'heritage': return heritageContent(ctx);
    case 'hazards':  return hazardsContent(ctx);
    case 'climate':  return climateContent(ctx);
    case 'flora':    return floraContent(ctx);
    case 'history':  return historyContent(ctx);
    case 'full':     return [zoningContent, lotContent, heritageContent, hazardsContent, climateContent, floraContent, historyContent].map(fn => fn(ctx)).join('');
    default:         return '';
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function downloadSectionPDF(ctx, categoryKey) {
  const cat = CATS[categoryKey] || { num: '—', label: categoryKey };
  const date = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
  const content = buildContent(ctx, categoryKey);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Groundwork — ${cat.label} — ${esc(ctx.display)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>${pdfStyles()}</style>
</head>
<body>
  <div class="pdf-page">
    <header class="pdf-header">
      <div class="brand">Groundwork</div>
      <hr class="rule">
      <div class="meta-row">
        <div class="address">${esc(ctx.display)}</div>
        <div class="date-stamp">${date}</div>
      </div>
      <div class="section-tag">${cat.num} &middot; ${cat.label}</div>
    </header>
    <main class="pdf-main">${content}</main>
    <footer class="pdf-footer">
      Data drawn live from NSW Spatial Services (ArcGIS), NSW Planning Portal, Heritage NSW (State Heritage Register), Atlas of Living Australia, Open-Meteo historical archive and OpenStreetMap Nominatim. Summaries are auto-generated and not written by a planner — this is not professional planning advice. Generated by Groundwork &mdash; ${date}.
    </footer>
  </div>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) {
    alert('PDF blocked by popup blocker. Please allow popups for this site and try again.');
    return;
  }
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 700);
}
