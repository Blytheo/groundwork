import { arcgisQuery } from './arcgis.js';
import { safe, safeStatus } from '../utils/helpers.js';
import { EP } from '../data/config.js';

export async function gatherNSWData(lon, lat, heritageRadius = 200) {
  const [zoning, fsr, height, lotsize, heritageOn, heritageNear, heritageNamedFeats,
    bushfireR, floodR, landslideR, cadastre,
    acidSulfate, lotsizeSecondary, streetFrontage, foreshoreLine] = await Promise.all([
    safe(arcgisQuery(EP.zoning, lon, lat), []),
    safe(arcgisQuery(EP.fsr, lon, lat), []),
    safe(arcgisQuery(EP.height, lon, lat), []),
    safe(arcgisQuery(EP.lotsize, lon, lat), []),
    safe(arcgisQuery(EP.heritage, lon, lat), []),
    safe(arcgisQuery(EP.heritage, lon, lat, { distance: heritageRadius }), []),
    safe(arcgisQuery(EP.heritageNamed, lon, lat, { distance: heritageRadius }), []),
    safeStatus(arcgisQuery(EP.bushfire, lon, lat)),
    safeStatus(arcgisQuery(EP.flood, lon, lat)),
    safeStatus(arcgisQuery(EP.landslide, lon, lat)),
    safe(arcgisQuery(EP.cadastre, lon, lat), []),
    safe(arcgisQuery(EP.acidSulfate, lon, lat), []),
    safe(arcgisQuery(EP.lotsizeSecondary, lon, lat), []),
    safe(arcgisQuery(EP.streetFrontage, lon, lat), []),
    safe(arcgisQuery(EP.foreshoreLine, lon, lat), []),
  ]);
  const failed = { bushfire: !bushfireR.ok, flood: !floodR.ok, landslide: !landslideR.ok };
  return {
    zoning, fsr, height, lotsize, heritageOn, heritageNear, heritageNamedFeats,
    bushfire: bushfireR.value, flood: floodR.value, landslide: landslideR.value, cadastre, failed,
    acidSulfate, lotsizeSecondary, streetFrontage, foreshoreLine,
  };
}
