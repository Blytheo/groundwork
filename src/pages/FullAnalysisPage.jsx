import { useSiteSearch } from '../hooks/useSiteSearch.js';
import Hero from '../components/Hero.jsx';
import LoadingBar from '../components/LoadingBar.jsx';
import Overview from '../components/Overview.jsx';
import MapPanel from '../components/MapPanel.jsx';
import LinksPanel from '../components/LinksPanel.jsx';
import LandmarksMap from '../components/LandmarksMap.jsx';
import Accordions from '../components/Accordions.jsx';

export default function FullAnalysisPage() {
  const { ctx, loading, error, search } = useSiteSearch();

  return (
    <>
      <Hero onSearch={search} loading={loading} />

      {loading && (
        <div className="wrap">
          <LoadingBar active={true} />
        </div>
      )}

      {error && (
        <div className="wrap">
          <div className="error-box" role="alert">{error}</div>
        </div>
      )}

      {ctx && (
        <div className="wrap report">
          <Overview ctx={ctx} />
          <div className="grid-main">
            <MapPanel ctx={ctx} />
            <LinksPanel ctx={ctx} />
          </div>
          <LandmarksMap ctx={ctx} />
          <Accordions ctx={ctx} />
        </div>
      )}
    </>
  );
}
