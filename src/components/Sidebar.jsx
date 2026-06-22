import { NavLink, Link } from 'react-router-dom';
import { CATEGORIES } from '../data/categories.js';

export default function Sidebar() {
  return (
    <nav className="sidebar" aria-label="Category navigation">
      <Link to="/" className="sidebar-brand">Groundwork</Link>
      <ul className="sidebar-list">
        {CATEGORIES.map(cat => (
          <li key={cat.key}>
            <NavLink
              to={`/search/${cat.path}`}
              className={({ isActive }) => `sidebar-btn${isActive ? ' active' : ''}`}
              onMouseMove={e => {
                const r = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
                e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
              }}
            >
              <span className="sidebar-btn-num">{cat.code}</span>
              <span className="sidebar-btn-label">{cat.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="sidebar-divider" />
      <NavLink
        to="/full-analysis"
        className={({ isActive }) => `sidebar-full-btn${isActive ? ' active' : ''}`}
      >
        Full site analysis
      </NavLink>
    </nav>
  );
}
