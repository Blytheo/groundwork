import { STATE_LINKS, NATIONAL_LINKS } from '../data/stateLinks.js';

function LinkRow({ name, desc, site }) {
  return (
    <div className="link-item">
      <div>
        <span className="li-name">{name}</span>
        <span className="li-desc">{desc}</span>
      </div>
      <a className="li-go" href={site} target="_blank" rel="noopener">Open ↗</a>
    </div>
  );
}

export default function LinksPanel({ ctx }) {
  const { council, state } = ctx;
  const stateLinks = STATE_LINKS[state] || [];

  return (
    <div className="panel">
      <div className="panel-head"><h3>Council &amp; government links</h3></div>
      <div className="linklist">
        {council && <LinkRow name={council.name} desc={council.verified ? 'Your local council' : 'Best match — verify council name'} site={council.site} />}
        {stateLinks.map(l => <LinkRow key={l.name} {...l} />)}
        {NATIONAL_LINKS.map(l => <LinkRow key={l.name} {...l} />)}
      </div>
    </div>
  );
}
