import { useLocation } from 'react-router-dom';

export default function SiteHeader() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <header className={`site-header${isHome ? '' : ' site-header--flow'}`}>
      <div className="header-row wrap" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <div className="brand">
          <svg className="brand-mark" viewBox="0 0 28 28" fill="none">
            <g className="ring">
              <circle cx="14" cy="14" r="11" stroke="var(--ink-faint)" strokeWidth="1.2" strokeDasharray="3 5" />
            </g>
            <circle cx="14" cy="14" r="4.5" fill="var(--ink)" />
          </svg>
          <div className="brand-text">Groundwork</div>
          <div className="brand-tag">Desk-based site research · AU</div>
        </div>
      </div>
    </header>
  );
}
