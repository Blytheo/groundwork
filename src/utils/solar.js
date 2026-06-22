export function solarPosition(latDeg, dayOfYearVal, hourDecimal) {
  const rad = Math.PI / 180, deg = 180 / Math.PI;
  const decl = 23.45 * Math.sin(rad * 360 / 365 * (dayOfYearVal + 284));
  const ha = 15 * (hourDecimal - 12);
  let sinAlt = Math.sin(rad * latDeg) * Math.sin(rad * decl) + Math.cos(rad * latDeg) * Math.cos(rad * decl) * Math.cos(rad * ha);
  sinAlt = Math.max(-1, Math.min(1, sinAlt));
  const alt = Math.asin(sinAlt) * deg;
  let cosAz = (Math.sin(rad * decl) - Math.sin(rad * alt) * Math.sin(rad * latDeg)) / (Math.cos(rad * alt) * Math.cos(rad * latDeg));
  cosAz = Math.max(-1, Math.min(1, cosAz));
  let az = Math.acos(cosAz) * deg;
  if (ha > 0) az = 360 - az;
  return { alt, az };
}

export function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 1);
  return Math.floor((date - start) / 86400000) + 1;
}

export function sunPathPoints(lat, doy, stepHrs = 0.25) {
  const pts = [];
  for (let h = 4; h <= 20; h += stepHrs) {
    const p = solarPosition(lat, doy, h);
    if (p.alt > 0.2) pts.push({ hour: h, alt: p.alt, az: p.az });
  }
  return pts;
}

export function polarXY(cx, cy, R, alt, az) {
  const r = ((90 - alt) / 90) * R, rad = Math.PI / 180;
  return { x: cx + r * Math.sin(rad * az), y: cy - r * Math.cos(rad * az) };
}

export function shadowPathCoords(lat, lon, heightM, doy, stepHrs = 0.25) {
  const coords = [];
  for (let h = 4; h <= 20; h += stepHrs) {
    const pos = solarPosition(lat, doy, h);
    if (pos.alt < 1) continue;
    const altRad = pos.alt * Math.PI / 180;
    const length = Math.min(heightM / Math.tan(altRad), 60);
    const shadowAzRad = ((pos.az + 180) % 360) * Math.PI / 180;
    const dxM = length * Math.sin(shadowAzRad);
    const dyM = length * Math.cos(shadowAzRad);
    coords.push([lon + dxM / (111320 * Math.cos(lat * Math.PI / 180)), lat + dyM / 111320]);
  }
  return coords;
}

export function shadowTipCoord(lat, lon, heightM, doy, hour) {
  const pos = solarPosition(lat, doy, hour);
  if (pos.alt < 1) return null;
  const altRad = pos.alt * Math.PI / 180;
  const length = Math.min(heightM / Math.tan(altRad), 60);
  const shadowAzRad = ((pos.az + 180) % 360) * Math.PI / 180;
  const dxM = length * Math.sin(shadowAzRad);
  const dyM = length * Math.cos(shadowAzRad);
  return [lon + dxM / (111320 * Math.cos(lat * Math.PI / 180)), lat + dyM / 111320];
}

export function buildSunPathSVG(lat, w, h, dateMode) {
  const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.42;
  const now = new Date();
  const doySummer = dayOfYear(new Date(now.getFullYear(), 11, 21));
  const doyWinter = dayOfYear(new Date(now.getFullYear(), 5, 21));
  const doyEquinox = dayOfYear(new Date(now.getFullYear(), 2, 21));
  const arcs = [
    { doy: doySummer, color: '#ff7759', label: 'Summer' },
    { doy: doyWinter, color: '#1863dc', label: 'Winter' },
    { doy: doyEquinox, color: '#93939f', label: 'Equinox', dash: '4 4' },
  ];
  let svg = '';
  for (const a of [15, 30, 45, 60, 75]) {
    const rr = ((90 - a) / 90) * R;
    svg += `<circle cx="${cx}" cy="${cy}" r="${rr}" fill="none" stroke="rgba(0,0,0,.09)" stroke-width="1"/>`;
  }
  svg += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="1.2"/>`;
  const dirs = [[0, 'N'], [90, 'E'], [180, 'S'], [270, 'W']];
  for (let az = 0; az < 360; az += 30) {
    const p1 = polarXY(cx, cy, R, 0, az);
    svg += `<line x1="${cx}" y1="${cy}" x2="${p1.x}" y2="${p1.y}" stroke="rgba(0,0,0,.07)" stroke-width="1"/>`;
  }
  for (const [az, label] of dirs) {
    const p = polarXY(cx, cy, R + 14, 0, az);
    svg += `<text x="${p.x}" y="${p.y}" font-size="11" font-family="IBM Plex Mono,monospace" font-weight="500" fill="${az === 0 ? '#1863dc' : 'rgba(0,0,0,.45)'}" text-anchor="middle" dominant-baseline="middle">${label}</text>`;
  }
  for (const arc of arcs) {
    const pts = sunPathPoints(lat, arc.doy);
    if (!pts.length) continue;
    const d = pts.map((p, i) => {
      const xy = polarXY(cx, cy, R, p.alt, p.az);
      return (i === 0 ? 'M' : 'L') + xy.x.toFixed(1) + ',' + xy.y.toFixed(1);
    }).join(' ');
    svg += `<path class="sun-arc" d="${d}" fill="none" stroke="${arc.color}" stroke-width="2" ${arc.dash ? `stroke-dasharray="${arc.dash}"` : ''} opacity="0.9"/>`;
  }
  let markerInfo;
  if (dateMode === 'summer') markerInfo = { doy: doySummer, hour: 12, color: '#ff7759', label: 'Solar noon, summer' };
  else if (dateMode === 'winter') markerInfo = { doy: doyWinter, hour: 12, color: '#1863dc', label: 'Solar noon, winter' };
  else if (dateMode === 'equinox') markerInfo = { doy: doyEquinox, hour: 12, color: '#93939f', label: 'Solar noon, equinox' };
  else {
    const hourDecimal = now.getHours() + now.getMinutes() / 60;
    markerInfo = { doy: dayOfYear(now), hour: hourDecimal, color: '#e8920a', label: 'Now' };
  }
  const mp = solarPosition(lat, markerInfo.doy, markerInfo.hour);
  if (mp.alt > 0) {
    const xy = polarXY(cx, cy, R, mp.alt, mp.az);
    svg += `<g class="sun-now">
      <circle class="glow" cx="${xy.x}" cy="${xy.y}" r="13" fill="${markerInfo.color}" opacity="0.25"/>
      <circle cx="${xy.x}" cy="${xy.y}" r="6" fill="${markerInfo.color}" stroke="#fff" stroke-width="1.5"/>
    </g>`;
  } else {
    svg += `<text x="${cx}" y="${h - 12}" font-size="11" font-family="IBM Plex Mono,monospace" fill="rgba(0,0,0,.4)" text-anchor="middle">Sun below horizon at this time</text>`;
  }
  return svg;
}
