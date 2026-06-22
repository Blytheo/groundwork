import { useParams } from 'react-router-dom';
import { CATEGORIES } from '../data/categories.js';
import { useSiteSearch } from '../hooks/useSiteSearch.js';
import LoadingBar from '../components/LoadingBar.jsx';
import AddressAutocomplete from '../components/AddressAutocomplete.jsx';
import LinksPanel from '../components/LinksPanel.jsx';
import MapPanel from '../components/MapPanel.jsx';
import LotMapPanel from '../components/LotMapPanel.jsx';
import LandmarksMap from '../components/LandmarksMap.jsx';
import Accordion from '../components/Accordion.jsx';
import HeritageAccordion from '../components/accordions/Heritage.jsx';
import Regulatory from '../components/accordions/Regulatory.jsx';
import Lot from '../components/accordions/Lot.jsx';
import Hazards from '../components/accordions/Hazards.jsx';
import Climate from '../components/accordions/Climate.jsx';
import FloraFauna from '../components/accordions/FloraFauna.jsx';
import History from '../components/accordions/History.jsx';
import PDFButton from '../components/PDFButton.jsx';
import SiteMap from '../components/SiteMap.jsx';

const CATEGORY_MESSAGES = {
  zoning:   ['Geocoding address…', 'Checking zoning controls…', 'Cross-referencing LEP layers…', 'Putting the report together…'],
  lot:      ['Geocoding address…', 'Looking up cadastre & lot data…', 'Putting the report together…'],
  heritage: ['Geocoding address…', 'Searching heritage register…', 'Cross-referencing LEP heritage layers…', 'Putting the report together…'],
  hazards:  ['Geocoding address…', 'Checking bushfire overlays…', 'Checking flood & landslide data…', 'Putting the report together…'],
  climate:  ['Geocoding address…', 'Fetching climate history…', 'Calculating sun path…', 'Putting the report together…'],
  flora:    ['Geocoding address…', 'Looking up nearby species records…', 'Filtering flora & fauna observations…', 'Putting the report together…'],
  history:  ['Geocoding address…', 'Looking up site history…', 'Finding nearby landmarks…', 'Putting the report together…'],
};


function CategoryContent({ categoryKey, ctx }) {
  switch (categoryKey) {
    case 'zoning':
      return (
        <>
          <SiteMap ctx={ctx} />
          <div className="accordions">
            <Accordion num="01" title="Zoning & planning" sub="land use · FSR · height · lot size" defaultOpen={true}>
              <Regulatory ctx={ctx} />
            </Accordion>
          </div>
        </>
      );

    case 'lot':
      return (
        <>
          <LotMapPanel ctx={ctx} />
          <div className="accordions" style={{ marginTop: 24 }}>
            <Accordion num="02" title="Lot & cadastre" sub="lot/DP · plan · boundaries · area" defaultOpen={true}>
              <Lot ctx={ctx} />
            </Accordion>
          </div>
        </>
      );

    case 'heritage':
      return (
        <>
          <LandmarksMap ctx={ctx} />
          <div className="accordions">
            <HeritageAccordion num="03" ctx={ctx} />
          </div>
        </>
      );

    case 'hazards':
      return (
        <>
          <LandmarksMap ctx={ctx} />
          <div className="accordions">
            <Accordion num="04" title="Hazards" sub="bushfire · flood · landslide" defaultOpen={true}>
              <Hazards ctx={ctx} />
            </Accordion>
          </div>
        </>
      );

    case 'climate':
      return (
        <>
          <MapPanel ctx={ctx} />
          <div className="accordions" style={{ marginTop: 24 }}>
            <Accordion num="05" title="Climate & sun" sub="live · Open-Meteo 5-yr archive" defaultOpen={true}>
              <Climate ctx={ctx} />
            </Accordion>
          </div>
        </>
      );

    case 'flora':
      return (
        <>
          <SiteMap ctx={ctx} />
          <div className="accordions">
            <Accordion num="06" title="Flora & fauna" sub="live · Atlas of Living Australia" defaultOpen={true}>
              <FloraFauna ctx={ctx} />
            </Accordion>
          </div>
        </>
      );

    case 'history':
      return (
        <>
          <LandmarksMap ctx={ctx} />
          <div className="accordions">
            <Accordion num="07" title="Site history" sub="Wikipedia · landmark context" defaultOpen={true}>
              <History ctx={ctx} />
            </Accordion>
          </div>
        </>
      );

    default:
      return null;
  }
}

export default function CategoryPage() {
  const { category } = useParams();
  const cat = CATEGORIES.find(c => c.path === category);
  const { ctx, loading, error, search } = useSiteSearch(category);

  if (!cat) {
    return (
      <div className="cat-page wrap">
        <p>Category not found.</p>
      </div>
    );
  }

  const nswFallback = cat.nswOnly && ctx && !ctx.isNSW;

  return (
    <div className="cat-page">
      <div className="cat-page-head wrap">
        <div className="cat-page-bg-wrap" aria-hidden="true">
          <span className="cat-page-bg-num">{cat.code}</span>
        </div>
        <div className="cat-page-meta">
          <span className="cat-page-code">{cat.code}</span>
          <h2 className="cat-page-title">{cat.label}</h2>
          <p className="cat-page-sub">{cat.sub}</p>
        </div>
        {cat.nswOnly && (
          <p className="search-note">This data source currently covers NSW addresses only.</p>
        )}
        <AddressAutocomplete onSearch={search} loading={loading} className="cat-search-form" loadingLabel="Searching…" />
      </div>

      {loading && (
        <div className="wrap">
          <LoadingBar active={true} messages={CATEGORY_MESSAGES[category]} />
        </div>
      )}

      {error && (
        <div className="wrap">
          <div className="error-box" role="alert">{error}</div>
        </div>
      )}

      {ctx && (
        <div className="cat-page-body wrap">
          <div className="cat-address-bar">
            <strong>{ctx.display}</strong>
            <span>{ctx.lat.toFixed(5)}, {ctx.lon.toFixed(5)} · {ctx.suburb} {ctx.postcode}</span>
          </div>

          {nswFallback ? (
            <div className="note-box warn" style={{ marginBottom: 24 }}>
              This data source only covers NSW. The zoning, heritage and hazard lookups aren't available for {ctx.state} addresses — use the council and government links below to access your state's planning information directly.
            </div>
          ) : (
            <>
              <CategoryContent categoryKey={category} ctx={ctx} />
              <div className="pdf-btn-row">
                <PDFButton ctx={ctx} categoryKey={category} />
              </div>
            </>
          )}

          <div style={{ marginTop: 24 }}>
            <LinksPanel ctx={ctx} />
          </div>
        </div>
      )}
    </div>
  );
}
