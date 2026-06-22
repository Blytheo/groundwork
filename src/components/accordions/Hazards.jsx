import { hazardSummary } from '../../utils/summaries.js';

function KV({ label, on }) {
  return <div className={`kv ${on ? 'flag' : 'ok'}`}><div className="k">{label}</div><div className="v">{on ? 'Flagged' : 'Clear'}</div></div>;
}

function GovHelp({ ctx, topic }) {
  const links = [];
  if (ctx.council?.verified) links.push(<a key="council" href={ctx.council.site} target="_blank" rel="noopener">{ctx.council.name} ↗</a>);
  links.push(<a key="nsw" href="https://www.planningportal.nsw.gov.au/spatialviewer/#/find-a-property/address" target="_blank" rel="noopener">NSW Planning Portal Spatial Viewer ↗</a>);
  return (
    <div className="note-box warn">
      Couldn't confirm {topic} for this exact point from live mapping. Check directly with:{' '}
      {links.reduce((acc, el, i) => i === 0 ? [el] : [...acc, ' · ', el], [])}
    </div>
  );
}

export default function Hazards({ ctx }) {
  const d = ctx.nswData;
  const failed = d.failed || {};
  const bf = hazardSummary('Bushfire Prone Land', d.bushfire, 'd_Category');
  const fl = hazardSummary('Flood Planning', d.flood, 'LAY_CLASS');
  const ls = hazardSummary('Landslide Risk', d.landslide, 'LAY_CLASS');

  return (
    <>
      <div className="kv-grid">
        <KV label="Bushfire" on={bf.flagged} />
        <KV label="Flood" on={fl.flagged} />
        <KV label="Landslide" on={ls.flagged} />
      </div>
      <h4>Bushfire</h4>
      <p dangerouslySetInnerHTML={{ __html: bf.html }} />
      {failed.bushfire && <GovHelp ctx={ctx} topic="bushfire prone land status" />}
      <h4>Flood</h4>
      <p dangerouslySetInnerHTML={{ __html: fl.html }} />
      {failed.flood && <GovHelp ctx={ctx} topic="flood planning status" />}
      <h4>Landslide</h4>
      <p dangerouslySetInnerHTML={{ __html: ls.html }} />
      {failed.landslide && <GovHelp ctx={ctx} topic="landslide risk status" />}
    </>
  );
}
