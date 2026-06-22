export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="disc">
          Data drawn live from NSW Spatial Services (ArcGIS), NSW Planning Portal, Heritage NSW (State Heritage Register), Atlas of Living Australia, Open-Meteo historical archive, OpenStreetMap Nominatim, Wikipedia, and CartoDB. Summaries are auto-generated from live data, not written by a planner. This is a starting point for desk-based research — not a substitute for council advice, a registered surveyor, or a planning consultant before lodging a DA.
        </div>
        <div>
          Groundwork ·{' '}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap</a>
        </div>
      </div>
    </footer>
  );
}
