export const CATEGORIES = [
  { key: 'zoning',   path: 'zoning',   code: '01', label: 'Zoning & planning', sub: 'Land use, FSR, height, minimum lot size', nswOnly: true },
  { key: 'lot',      path: 'lot',      code: '02', label: 'Lot & cadastre',    sub: 'Lot/DP, plan, boundaries, area',          nswOnly: true },
  { key: 'heritage', path: 'heritage', code: '03', label: 'Heritage',          sub: 'Heritage listings and conservation areas', nswOnly: true },
  { key: 'hazards',  path: 'hazards',  code: '04', label: 'Hazards',           sub: 'Bushfire, flood, landslide risk',          nswOnly: true },
  { key: 'climate',  path: 'climate',  code: '05', label: 'Climate & sun',     sub: 'Sun path, seasonal climate data',          nswOnly: false },
  { key: 'flora',    path: 'flora',    code: '06', label: 'Flora & fauna',     sub: 'Threatened species and ecology',           nswOnly: false },
  { key: 'history',  path: 'history',  code: '07', label: 'Site history',      sub: 'Wikipedia and landmark context',           nswOnly: false },
];
