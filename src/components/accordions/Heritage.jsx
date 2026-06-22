import { useState } from 'react';
import { heritageSummary, refetchHeritage } from '../../utils/summaries.js';
import Accordion from '../Accordion.jsx';

function SHRCards({ named, radius }) {
  if (!named.length) {
    return (
      <>
        <h4>Named items on the State Heritage Register (within {radius}m)</h4>
        <p>No individual items from the NSW State Heritage Register were found within {radius}m.</p>
      </>
    );
  }
  return (
    <>
      <h4>Named items on the State Heritage Register (within {radius}m)</h4>
      {named.slice(0, 10).map((f, i) => {
        const name = f.SHR_NAME || f.ITEM_NAME || f.NAME || 'Unnamed item';
        const no = f.SHR_NO || f.HERIMAGE_NO || f.ITEM_NO || '';
        const sig = f.SIGNIFICANCE || f.ITEM_SIGNIFICANCE || '';
        const date = f.LISTED_DATE || f.DATE_LISTED || f.LISTING_DATE || '';
        return (
          <div className="shr-card" key={i}>
            <div className="shr-tag">State Heritage Register{no ? ` · #${no}` : ''}</div>
            <div className="shr-name">{String(name)}</div>
            {sig && <div className="shr-meta">Significance: {String(sig)}</div>}
            {date && <div className="shr-meta">Listed: {String(date)}</div>}
          </div>
        );
      })}
      {named.length > 10 && (
        <p style={{ fontSize: 13, color: 'var(--ink-faint)' }}>
          …and {named.length - 10} more items.{' '}
          <a href="https://www.heritage.nsw.gov.au/" target="_blank" rel="noopener">Search the full SHR ↗</a>
        </p>
      )}
    </>
  );
}

export default function HeritageAccordion({ num, ctx }) {
  const [radius, setRadius] = useState(200);
  const [nswData, setNswData] = useState(ctx.nswData);
  const [loading, setLoading] = useState(false);

  const h = heritageSummary(nswData);
  const noteClass = h.level === 'clear' ? 'good' : 'warn';

  async function handleRadiusChange(e) {
    const r = parseInt(e.target.value, 10);
    setLoading(true);
    try {
      const { feats, namedFeats } = await refetchHeritage(ctx.lon, ctx.lat, r);
      setNswData(prev => ({ ...prev, heritageNear: feats, heritageNamedFeats: namedFeats }));
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
      setRadius(r);
    }
  }

  const radiusSelect = (
    <select onClick={e => e.stopPropagation()} onChange={handleRadiusChange} aria-label="Heritage search radius">
      <option value="200">Within 200m</option>
      <option value="500">Within 500m</option>
      <option value="1000">Within 1km</option>
    </select>
  );

  return (
    <Accordion num={num} title="Heritage" sub="live · LEP + State Heritage Register" defaultOpen={true} extraHead={radiusSelect}>
      <h4>LEP heritage mapping</h4>
      <p dangerouslySetInnerHTML={{ __html: h.html }} />
      <div className={`note-box ${noteClass}`}>
        Search radius: {radius}m. This layer reports the LEP heritage class/area — not individual item names, which are shown separately below from the State Heritage Register.
      </div>
      {loading
        ? <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink-faint)' }}>Loading heritage data…</p>
        : <SHRCards named={nswData.heritageNamedFeats || []} radius={radius} />
      }
      <a href="https://www.heritage.nsw.gov.au/" target="_blank" rel="noopener" style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent-ink)' }}>
        Search Heritage NSW State Heritage Register ↗
      </a>
    </Accordion>
  );
}
