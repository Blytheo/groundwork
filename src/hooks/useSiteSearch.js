import { useState } from 'react';
import { geocodeAddress, deriveState, deriveSuburb, derivePostcode, resolveLGA, resolveCouncilLink, refineNSWPoint } from '../api/geocode.js';
import { gatherNSWData } from '../api/nsw.js';
import { fetchWikiSummary } from '../api/wiki.js';
import { fetchClimate } from '../api/climate.js';
import { fetchFloraFauna } from '../api/flora.js';
import { cadastreSummary, buildOpportunitiesConstraints } from '../utils/summaries.js';
import { safe } from '../utils/helpers.js';

const CATEGORY_NEEDS = {
  zoning:   { nsw: true,  wiki: false, climate: false, flora: false },
  lot:      { nsw: true,  wiki: false, climate: false, flora: false },
  heritage: { nsw: true,  wiki: false, climate: false, flora: false },
  hazards:  { nsw: true,  wiki: false, climate: false, flora: false },
  climate:  { nsw: false, wiki: false, climate: true,  flora: false },
  flora:    { nsw: false, wiki: false, climate: false, flora: true  },
  history:  { nsw: false, wiki: true,  climate: false, flora: false },
};
const ALL_NEEDS = { nsw: true, wiki: true, climate: true, flora: true };

export function useSiteSearch(category = null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ctx, setCtx] = useState(null);

  async function search(typedAddress) {
    setError(null);
    setCtx(null);
    setLoading(true);

    try {
      const geo = await geocodeAddress(typedAddress + ', Australia');
      const state = deriveState(geo.addr);
      const suburb = deriveSuburb(geo.addr);
      const postcode = derivePostcode(geo.addr);
      const isNSW = state === 'New South Wales';

      const needs = category ? (CATEGORY_NEEDS[category] || ALL_NEEDS) : ALL_NEEDS;

      const [lgaInfo, nswData, wiki, climate, floraFauna, refinedPoint] = await Promise.all([
        isNSW ? resolveLGA(geo.lon, geo.lat) : Promise.resolve(null),
        isNSW && needs.nsw ? gatherNSWData(geo.lon, geo.lat) : Promise.resolve(null),
        needs.wiki ? safe(fetchWikiSummary(suburb, state), null) : Promise.resolve(null),
        needs.climate ? safe(fetchClimate(geo.lat, geo.lon), { error: true }) : Promise.resolve(null),
        needs.flora ? safe(fetchFloraFauna(geo.lat, geo.lon, 1), { error: true, flora: [], fauna: [], total: 0, radiusKm: 1 }) : Promise.resolve(null),
        isNSW ? safe(refineNSWPoint(typedAddress, geo.lon, geo.lat), null) : Promise.resolve(null),
      ]);
      // propertyPoint: NSW Geocoded Addressing Theme point (inside lot boundary) or geocoded fallback
      const propertyPoint = refinedPoint ?? { lon: geo.lon, lat: geo.lat };

      const council = isNSW ? resolveCouncilLink(lgaInfo) : null;
      const cadastre = isNSW && nswData ? cadastreSummary(nswData) : null;
      const ocItems = isNSW && nswData
        ? buildOpportunitiesConstraints(nswData, geo.lat)
        : [
            { type: 'opportunity', text: 'North-facing glazing and outdoor living areas will track the high arc shown in the sun path diagram above.' },
            { type: 'constraint', text: 'Detailed zoning, heritage and hazard lookups are currently available for NSW addresses only — check the state planning links above for this address.' },
          ];

      setCtx({ typedAddress, display: geo.display, lat: geo.lat, lon: geo.lon, propertyPoint, state, suburb, postcode, isNSW, council, nswData, wiki, climate, floraFauna, cadastre, ocItems });
    } catch (err) {
      setError(err.message || 'Something went wrong while analysing this address. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setCtx(null);
    setError(null);
    setLoading(false);
  }

  return { ctx, loading, error, search, reset };
}
