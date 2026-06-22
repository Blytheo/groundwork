import { fmtNum } from '../../utils/helpers.js';

export default function Climate({ ctx }) {
  const cl = ctx.climate;

  if (!cl || cl.error) {
    return (
      <p>
        Live climate data could not be retrieved for this location. Try refreshing the page, or check the{' '}
        <a href="http://www.bom.gov.au/" target="_blank" rel="noopener">Bureau of Meteorology ↗</a> for station data.
      </p>
    );
  }

  const sunHours = cl.sunshineDuration !== null ? (cl.sunshineDuration / 3600).toFixed(1) : '—';
  const wind = cl.windSpeed !== null ? fmtNum(cl.windSpeed, 1) + ' km/h' : '—';
  const windDir = cl.windDir || '—';
  const rain = cl.precipitation !== null ? fmtNum(cl.precipitation, 1) + ' mm/day' : '—';
  const uv = cl.uvMax !== null ? fmtNum(cl.uvMax, 1) : '—';
  const yearRange = `${cl.startYear}–${cl.endYear}`;

  return (
    <>
      <p>
        5-year historical climate averages ({yearRange}) from the Open-Meteo archive — based on ERA5 reanalysis data for this coordinate. These are indicative typical figures, not station-level Bureau of Meteorology readings.
      </p>
      <div className="climate-grid kv-grid">
        <div className="kv"><div className="k">Avg daily sun</div><div className="v">{sunHours} hrs</div></div>
        <div className="kv"><div className="k">Prevailing wind</div><div className="v">{windDir} · {wind}</div></div>
        <div className="kv"><div className="k">Avg daily rain</div><div className="v">{rain}</div></div>
        <div className="kv"><div className="k">Avg max UV index</div><div className="v">{uv}</div></div>
      </div>
      <p>
        For passive solar design, the sun path diagram above remains the primary tool — showing actual solar arcs for summer solstice, winter solstice and equinox at this specific latitude.
      </p>
      <div className="note-box">
        <a href="https://www.bom.gov.au/" target="_blank" rel="noopener">Bureau of Meteorology ↗</a> has station-level historical data for energy modelling and NCC climate zone confirmation.
      </div>
    </>
  );
}
