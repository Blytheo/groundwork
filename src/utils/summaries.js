import { escapeHtml } from './helpers.js';
import { arcgisQuery } from '../api/arcgis.js';
import { safe } from './helpers.js';
import { EP } from '../data/config.js';

export function zoningSummary(d) {
  const z = d.zoning[0];
  if (!z) return 'No mapped land zoning was returned for this exact point. Check the council\'s LEP zoning map directly, as the boundary may sit just outside the queried layer\'s coverage.';
  const code = z.SYM_CODE || z.sym_code || '';
  const desc = z.LAY_CLASS || z.lay_class || '';
  const epi = z.EPI_NAME || z.epi_name || 'the applicable Local Environmental Plan';
  return `This site is zoned <strong>${escapeHtml(code)}</strong>${desc ? ` — ${escapeHtml(desc)}` : ''} under the <strong>${escapeHtml(epi)}</strong>. Permitted and prohibited land uses, and any site-specific provisions, are set out against this zone in the LEP's land use table.`;
}

export function fsrSummary(d) {
  const f = d.fsr[0];
  if (!f) return 'No floor space ratio control was returned for this point — many low-density residential zones control built form through height and setbacks rather than FSR, so this can be a genuine absence rather than missing data.';
  const ratio = f.FSR ?? f.fsr;
  const epi = f.EPI_NAME || f.epi_name || 'the LEP';
  return `Floor space ratio is capped at <strong>${escapeHtml(ratio)}:1</strong> under the ${escapeHtml(epi)} — meaning total gross floor area is limited to ${escapeHtml(ratio)} times the site area.`;
}

export function heightSummary(d) {
  const h = d.height[0];
  if (!h) return 'No building height control was returned for this point. Confirm the limit directly with council, as height planes are sometimes set by DCP rather than the LEP height-of-building map.';
  const cls = h.LAY_CLASS || h.lay_class || '';
  const epi = h.EPI_NAME || h.epi_name || 'the LEP';
  return `Maximum building height is controlled under height class <strong>${escapeHtml(cls)}</strong> of the ${escapeHtml(epi)}. This is a coded control band rather than a literal metre figure — cross-check the exact metre limit on council's height-of-building map or LEP clause 4.3.`;
}

export function lotSizeSummary(d) {
  const l = d.lotsize[0];
  if (!l) return 'No minimum lot size control applies at this point, or none was mapped — common where the zone doesn\'t restrict further subdivision.';
  const size = l.LOT_SIZE ?? l.lot_size;
  const units = l.UNITS || l.units || 'm²';
  return `Minimum lot size for further subdivision is <strong>${escapeHtml(size)} ${escapeHtml(units)}</strong>.`;
}

export function acidSulfateSummary(d) {
  const a = d.acidSulfate?.[0];
  if (!a) return null;
  const cls = a.LAY_CLASS || a.lay_class || 'an acid sulfate soils class';
  const epi = a.EPI_NAME || a.epi_name || 'the LEP';
  return `This site falls within a mapped <strong>Acid Sulfate Soils</strong> area (${escapeHtml(cls)}) under the ${escapeHtml(epi)}. Works involving soil disturbance or changes to groundwater levels may require an Acid Sulfate Soils Management Plan before a DA can be determined.`;
}

export function lotsizeSecondarySummary(d) {
  const l = d.lotsizeSecondary?.[0];
  if (!l) return null;
  const size = l.LOT_SIZE ?? l.lot_size;
  if (size == null) return null;
  const units = l.UNITS || l.units || 'm²';
  const epi = l.EPI_NAME || l.epi_name || 'the LEP';
  return `Minimum lot size to erect a secondary dwelling is <strong>${escapeHtml(String(size))} ${escapeHtml(units)}</strong> under the ${escapeHtml(epi)}.`;
}

export function streetFrontageSummary(d) {
  const s = d.streetFrontage?.[0];
  if (!s) return null;
  const cls = s.LAY_CLASS || s.lay_class || 'active street frontage';
  const epi = s.EPI_NAME || s.epi_name || 'the LEP';
  return `This site is designated an <strong>Active Street Frontage</strong> (${escapeHtml(cls)}) under the ${escapeHtml(epi)}. Ground-floor uses are restricted to active uses — blank walls and residential uses at street level are generally prohibited.`;
}

export function foreshoreSummary(d) {
  const f = d.foreshoreLine?.[0];
  if (!f) return null;
  const cls = f.LAY_CLASS || f.lay_class || 'foreshore building line';
  const epi = f.EPI_NAME || f.epi_name || 'the LEP';
  return `This site falls within a mapped <strong>Foreshore Building Line</strong> setback area (${escapeHtml(cls)}) under the ${escapeHtml(epi)}. Development within this setback is generally restricted to preserve foreshore character and public waterway access.`;
}

export function heritageSummary(d) {
  const on = d.heritageOn;
  const near = d.heritageNear.filter(n => !on.some(o => (o.OBJECTID || o.objectid) === (n.OBJECTID || n.objectid)));
  if (on.length) {
    const epi = on[0].EPI_NAME || on[0].epi_name || 'the LEP';
    const cls = on[0].LAY_CLASS || on[0].lay_class || 'a heritage item or conservation area';
    return { level: 'on-site', html: `This site sits within a mapped heritage area (<strong>${escapeHtml(cls)}</strong>) under the ${escapeHtml(epi)}. Heritage impact considerations are very likely to apply to any development application here — a heritage impact statement is typically required.` };
  }
  if (near.length) {
    return { level: 'nearby', html: 'No heritage listing applies directly to this site, but heritage-affected land was found within the search radius. Works here may still need to consider impacts on the setting of nearby heritage items, particularly for anything visible from the heritage area.' };
  }
  return { level: 'clear', html: 'No heritage listing or conservation area was found on this site or within the search radius under current LEP mapping.' };
}

export function hazardSummary(label, feats, descKey) {
  if (!feats.length) return { flagged: false, html: `No ${label.toLowerCase()} was returned for this point under current mapping.` };
  const f = feats[0];
  const desc = f[descKey] || f.LAY_CLASS || f.lay_class || 'mapped risk area';
  return { flagged: true, html: `This site falls within mapped <strong>${escapeHtml(label)}</strong> (${escapeHtml(desc)}). This will typically trigger additional assessment requirements at DA stage.` };
}

export function cadastreSummary(d) {
  const c = d.cadastre[0];
  if (!c) return null;
  return {
    lotId: c.lotidstring || c.LOTIDSTRING || '',
    planLabel: c.planlabel || c.PLANLABEL || '',
    area: c.planlotarea || c.PLANLOTAREA,
    units: c.planlotareaunits || c.PLANLOTAREAUNITS || '',
  };
}

export function buildOpportunitiesConstraints(d, lat) {
  const items = [];
  const heritage = heritageSummary(d);
  if (heritage.level === 'on-site') items.push({ type: 'constraint', text: 'Heritage-listed land — a heritage impact statement is likely required before lodging a DA, and approval timelines may extend.' });
  else if (heritage.level === 'nearby') items.push({ type: 'constraint', text: 'Heritage land nearby — consider streetscape and visual impact on the adjoining heritage area in any design response.' });
  else items.push({ type: 'opportunity', text: 'No heritage constraints identified — generally more design flexibility for contemporary built form.' });

  if (d.heritageNamedFeats && d.heritageNamedFeats.length) {
    const name = d.heritageNamedFeats[0].SHR_NAME || d.heritageNamedFeats[0].ITEM_NAME || d.heritageNamedFeats[0].NAME || 'a named State Heritage Register item';
    items.push({ type: 'constraint', text: `Named item on the NSW State Heritage Register nearby (${name}) — individual listed items carry additional state-level consent requirements beyond local LEP controls.` });
  }

  if (d.acidSulfate?.length) items.push({ type: 'constraint', text: 'Acid sulfate soils mapped at this site — soil disturbance works may require an Acid Sulfate Soils Management Plan at DA stage.' });
  if (d.foreshoreLine?.length) items.push({ type: 'constraint', text: 'Foreshore building line applies — development setback from the waterway is restricted under the LEP.' });

  if (d.bushfire.length) items.push({ type: 'constraint', text: 'Bushfire prone land — expect a Bushfire Attack Level (BAL) assessment and construction requirements under AS 3959.' });
  if (d.flood.length) items.push({ type: 'constraint', text: 'Flood-affected land — a flood study and design to the Flood Planning Level is likely to be required.' });
  if (d.landslide.length) items.push({ type: 'constraint', text: 'Landslide risk land — a geotechnical report is likely to be required to support any DA.' });
  if (!d.bushfire.length && !d.flood.length && !d.landslide.length) items.push({ type: 'opportunity', text: 'No bushfire, flood or landslide overlays identified at this point — fewer specialist reports likely needed at DA stage.' });

  const fsr = d.fsr[0];
  if (fsr && (fsr.FSR ?? fsr.fsr) >= 1) items.push({ type: 'opportunity', text: 'A floor space ratio of 1:1 or higher suggests reasonable density potential for this site\'s zoning.' });

  if (lat < 0) items.push({ type: 'opportunity', text: 'North-facing glazing and outdoor living areas will track the high arc shown in the sun path diagram above, the strongest passive solar orientation available in the Southern Hemisphere.' });

  return items;
}

export async function refetchHeritage(lon, lat, radius) {
  const [feats, namedFeats] = await Promise.all([
    safe(arcgisQuery(EP.heritage, lon, lat, { distance: radius }), []),
    safe(arcgisQuery(EP.heritageNamed, lon, lat, { distance: radius }), []),
  ]);
  return { feats, namedFeats };
}
