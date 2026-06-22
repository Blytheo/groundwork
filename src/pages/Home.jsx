import { Link } from 'react-router-dom';
import { CATEGORIES } from '../data/categories.js';
import HomeBg from '../components/HomeBg.jsx';

export default function Home() {
  return (
    <div className="home-page">
      <section className="home-viewport">
        <HomeBg showCutout={false} />

        <div className="home-float-block">
          <p className="home-eyebrow">Desk-based site research · NSW</p>
          <h1>Any NSW address.<br />One site brief.</h1>
          <p className="home-lead">
            Zoning, heritage, hazards, history, climate, flora and sun path — pulled live from government data sources, instantly.
          </p>
          <div className="home-cta-row">
            <Link to="/full-analysis" className="home-cta-btn">
              Full site analysis
              <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M2 10L10 2M10 2H4M10 2V8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>

        <div className="home-wordmark" aria-hidden="true">Groundwork</div>
      </section>

      <section className="home-cats wrap">
        <p className="home-cats-label">Or search by category</p>
        <div className="home-cat-grid">
          {CATEGORIES.map(cat => (
            <Link
              key={cat.key}
              to={`/search/${cat.path}`}
              className="home-cat-card"
              onMouseMove={e => {
                const r = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
                e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
              }}
            >
              <span className="home-cat-num">{cat.code}</span>
              <div className="home-cat-body">
                <span className="home-cat-name">{cat.label}</span>
                <span className="home-cat-desc">{cat.sub}</span>
              </div>
              <svg className="home-cat-arrow" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M2 10L10 2M10 2H4M10 2V8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
