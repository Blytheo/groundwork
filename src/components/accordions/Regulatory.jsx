import { zoningSummary, fsrSummary, heightSummary, lotSizeSummary, cadastreSummary, acidSulfateSummary, lotsizeSecondarySummary, streetFrontageSummary, foreshoreSummary } from '../../utils/summaries.js';

function GovHelp({ ctx, topic }) {
  const links = [];
  if (ctx.council?.verified) links.push(<a key="council" href={ctx.council.site} target="_blank" rel="noopener">{ctx.council.name} ↗</a>);
  links.push(<a key="nsw" href="https://www.planningportal.nsw.gov.au/spatialviewer/#/find-a-property/address" target="_blank" rel="noopener">NSW Planning Portal Spatial Viewer ↗</a>);
  return (
    <div className="note-box warn">
      Couldn't confirm {topic} for this exact point from live mapping. Check directly with:{' '}
      {links.reduce((acc, el, i) => i === 0 ? [el] : [...acc, ' · ', el], [])}
    </div>
  );
}

export default function Regulatory({ ctx }) {
  const d = ctx.nswData;
  const c = cadastreSummary(d);
  const acidSulfate = acidSulfateSummary(d);
  const lotsizeSecondary = lotsizeSecondarySummary(d);
  const streetFrontage = streetFrontageSummary(d);
  const foreshore = foreshoreSummary(d);

  return (
    <>
      <h4>Land &amp; title</h4>
      <div className="kv-grid">
        {c && <div className="kv"><div className="k">Lot / DP</div><div className="v">{c.lotId || c.planLabel || '—'}</div></div>}
        {c?.area && <div className="kv"><div className="k">Lot area</div><div className="v">{c.area} {c.units}</div></div>}
      </div>
      {!c && <GovHelp ctx={ctx} topic="lot and title details" />}

      <h4>Zoning</h4>
      <p dangerouslySetInnerHTML={{ __html: zoningSummary(d) }} />
      {!d.zoning.length && <GovHelp ctx={ctx} topic="land zoning" />}

      <h4>Floor space ratio</h4>
      <p dangerouslySetInnerHTML={{ __html: fsrSummary(d) }} />
      {!d.fsr.length && <GovHelp ctx={ctx} topic="the floor space ratio control" />}

      <h4>Height of building</h4>
      <p dangerouslySetInnerHTML={{ __html: heightSummary(d) }} />
      {!d.height.length && <GovHelp ctx={ctx} topic="the building height control" />}

      <h4>Minimum lot size</h4>
      <p dangerouslySetInnerHTML={{ __html: lotSizeSummary(d) }} />
      {!d.lotsize.length && <GovHelp ctx={ctx} topic="the minimum lot size control" />}

      {lotsizeSecondary && (
        <>
          <h4>Secondary dwelling — minimum lot size</h4>
          <p dangerouslySetInnerHTML={{ __html: lotsizeSecondary }} />
        </>
      )}

      {acidSulfate && (
        <>
          <h4>Acid sulfate soils</h4>
          <p dangerouslySetInnerHTML={{ __html: acidSulfate }} />
        </>
      )}

      {streetFrontage && (
        <>
          <h4>Active street frontage</h4>
          <p dangerouslySetInnerHTML={{ __html: streetFrontage }} />
        </>
      )}

      {foreshore && (
        <>
          <h4>Foreshore building line</h4>
          <p dangerouslySetInnerHTML={{ __html: foreshore }} />
        </>
      )}
    </>
  );
}
