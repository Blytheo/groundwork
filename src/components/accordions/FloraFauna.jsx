import { useState } from 'react';

function SpeciesCard({ o }) {
  const sci    = o.scientificName || o.species || 'Unknown species';
  const common = o.vernacularName || o.commonName || '';
  const src    = o.dataResourceName || o.institutionName || '';
  return (
    <div className="flora-item">
      <div className="fi-name">{sci}</div>
      {common && <div className="fi-common">{common}</div>}
      {src    && <div className="fi-source">{src}</div>}
    </div>
  );
}

function SpeciesSection({ title, items, emptyMsg }) {
  const [showAll, setShowAll] = useState(false);
  const INITIAL = 12;
  const visible = showAll ? items : items.slice(0, INITIAL);

  return (
    <>
      <h4>{title} ({items.length} species)</h4>
      {items.length === 0 ? (
        <p>{emptyMsg}</p>
      ) : (
        <>
          <div className="flora-grid">
            {visible.map((o, i) => <SpeciesCard key={i} o={o} />)}
          </div>
          {items.length > INITIAL && (
            <button
              onClick={() => setShowAll(v => !v)}
              style={{
                marginTop: 10, background: 'none', border: 'none',
                fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent-ink)',
                cursor: 'pointer', padding: 0,
              }}
            >
              {showAll ? 'Show fewer ↑' : `Show all ${items.length} species ↓`}
            </button>
          )}
        </>
      )}
    </>
  );
}

export default function FloraFauna({ ctx }) {
  const ff = ctx.floraFauna;

  if (!ff || ff.error) {
    return <p>Flora and fauna occurrence data could not be retrieved. The Atlas of Living Australia may be temporarily unavailable.</p>;
  }

  const radiusLabel = `${ff.radiusKm} km`;
  const totalLabel  = ff.total > 0 ? `${ff.total.toLocaleString()} total records` : '';

  return (
    <>
      <div className="note-box">
        Species recorded near this site by museums, herbaria and citizen-science projects{totalLabel ? ` — ${totalLabel} in the area` : ''}. Occurrences within {radiusLabel} — not a site survey, not suitable for ecological assessment.
      </div>

      <SpeciesSection
        title="Plants"
        items={ff.flora}
        emptyMsg={`No plant occurrence records found within ${radiusLabel}. This is common in areas with limited survey effort.`}
      />
      <SpeciesSection
        title="Animals"
        items={ff.fauna}
        emptyMsg={`No animal occurrence records found within ${radiusLabel}.`}
      />
      {ff.fungi?.length > 0 && (
        <SpeciesSection
          title="Fungi"
          items={ff.fungi}
          emptyMsg=""
        />
      )}

      <p style={{ marginTop: 12 }}>
        <a
          href="https://www.ala.org.au/"
          target="_blank"
          rel="noopener"
          style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent-ink)' }}
        >
          Browse the full Atlas of Living Australia dataset ↗
        </a>
      </p>
    </>
  );
}
