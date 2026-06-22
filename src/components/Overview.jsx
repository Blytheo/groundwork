import { heritageSummary } from '../utils/summaries.js';

export default function Overview({ ctx }) {
  const { display, lat, lon, state, council, suburb, postcode, isNSW, nswData, cadastre } = ctx;

  const chips = [];
  chips.push({ cls: 'accent', dot: true, label: state || 'Unknown state' });
  if (council) chips.push({ dot: true, label: council.name });
  if (cadastre?.lotId || cadastre?.planLabel) chips.push({ label: cadastre.lotId || cadastre.planLabel });

  if (isNSW && nswData) {
    const heritage = heritageSummary(nswData);
    chips.push(heritage.level === 'clear'
      ? { cls: 'clear', dot: true, label: 'No heritage flag' }
      : { cls: 'flag', dot: true, label: `Heritage ${heritage.level}` });

    const anyHazard = nswData.bushfire.length || nswData.flood.length || nswData.landslide.length;
    chips.push(anyHazard
      ? { cls: 'flag', dot: true, label: 'Hazard overlay present' }
      : { cls: 'clear', dot: true, label: 'No hazard overlay' });

    if (nswData.heritageNamedFeats?.length)
      chips.push({ cls: 'flag', dot: true, label: 'Named heritage item nearby' });
  }

  return (
    <div className="overview">
      <h2>{display}</h2>
      <div className="addr-sub">
        {lat.toFixed(5)}, {lon.toFixed(5)} · {suburb} {postcode}
      </div>
      <div className="chip-row">
        {chips.map((c, i) => (
          <span key={i} className={`chip${c.cls ? ' ' + c.cls : ''}`}>
            {c.dot && <span className="dot" />}
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}
