import { cadastreSummary } from '../../utils/summaries.js';

export default function Lot({ ctx }) {
  const d = ctx.nswData;
  const c = cadastreSummary(d);

  return (
    <>
      <h4>Land &amp; title</h4>
      {c ? (
        <>
          <div className="kv-grid">
            {(c.lotId || c.planLabel) && (
              <div className="kv">
                <div className="k">Lot / DP</div>
                <div className="v">{c.lotId || c.planLabel || '—'}</div>
              </div>
            )}
            {c.planLabel && c.lotId && (
              <div className="kv">
                <div className="k">Plan label</div>
                <div className="v">{c.planLabel}</div>
              </div>
            )}
            {c.area ? (
              <div className="kv">
                <div className="k">Lot area</div>
                <div className="v">{c.area} {c.units}</div>
              </div>
            ) : (
              <div className="kv">
                <div className="k">Lot area</div>
                <div className="v" style={{ color: 'var(--ink-faint)' }}>Not published</div>
              </div>
            )}
          </div>
          {!c.area && (
            <div className="note-box warn">
              Lot area isn't published for this parcel in the NSW Digital Cadastral Database (DCDB) — this is a known gap in the underlying dataset, not a fetch error. Confirm the lot area directly on the{' '}
              <a href="https://www.planningportal.nsw.gov.au/spatialviewer/#/find-a-property/address" target="_blank" rel="noopener">
                NSW Planning Portal Spatial Viewer ↗
              </a>
              {' '}or by ordering a title search from NSW Land Registry Services.
            </div>
          )}
        </>
      ) : (
        <div className="note-box warn">
          No cadastre record was returned for this location. The parcel boundary may sit outside the current coverage of the NSW Digital Cadastral Database layer, or the coordinate may fall at a boundary edge. Try the{' '}
          <a href="https://www.planningportal.nsw.gov.au/spatialviewer/#/find-a-property/address" target="_blank" rel="noopener">
            NSW Planning Portal Spatial Viewer ↗
          </a>{' '}
          to confirm lot details manually.
        </div>
      )}
    </>
  );
}
