import { useState } from 'react';
import Accordion from '../Accordion.jsx';

function OcList({ items, filter }) {
  const filtered = items.filter(i => filter === 'all' || i.type === filter);
  if (!filtered.length) {
    return <ul className="oc-list"><li><p style={{ color: 'var(--ink-faint)' }}>No items match this filter.</p></li></ul>;
  }
  return (
    <ul className="oc-list">
      {filtered.map((item, i) => (
        <li key={i} className={`oc-item ${item.type}`}>
          <span className="oc-icon">{item.type === 'constraint' ? '!' : '+'}</span>
          <p>{item.text}</p>
        </li>
      ))}
    </ul>
  );
}

export default function OpportunitiesAccordion({ num, items }) {
  const [filter, setFilter] = useState('all');

  const filterSelect = (
    <select onClick={e => e.stopPropagation()} value={filter} onChange={e => setFilter(e.target.value)} aria-label="Filter opportunities and constraints">
      <option value="all">All items</option>
      <option value="constraint">Constraints only</option>
      <option value="opportunity">Opportunities only</option>
    </select>
  );

  return (
    <Accordion num={num} title="Opportunities & constraints" sub="auto-generated" defaultOpen={true} extraHead={filterSelect}>
      <OcList items={items} filter={filter} />
    </Accordion>
  );
}
