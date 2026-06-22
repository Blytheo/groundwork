import Accordion from './Accordion.jsx';
import HeritageAccordion from './accordions/Heritage.jsx';
import OpportunitiesAccordion from './accordions/Opportunities.jsx';
import History from './accordions/History.jsx';
import Regulatory from './accordions/Regulatory.jsx';
import Hazards from './accordions/Hazards.jsx';
import Climate from './accordions/Climate.jsx';
import FloraFauna from './accordions/FloraFauna.jsx';

export default function Accordions({ ctx }) {
  let n = 0;
  const pad = () => String(++n).padStart(2, '0');

  return (
    <div className="accordions">
      <Accordion num={pad()} title="Site history" sub="auto-summarised" defaultOpen={true}>
        <History ctx={ctx} />
      </Accordion>

      {ctx.isNSW && (
        <>
          <HeritageAccordion num={pad()} ctx={ctx} />
          <Accordion num={pad()} title="Regulatory controls" sub="zoning · FSR · height · lot size">
            <Regulatory ctx={ctx} />
          </Accordion>
          <Accordion num={pad()} title="Hazards & overlays" sub="bushfire · flood · landslide">
            <Hazards ctx={ctx} />
          </Accordion>
        </>
      )}

      <Accordion num={pad()} title="Climate & sun" sub="live · Open-Meteo 5-yr archive">
        <Climate ctx={ctx} />
      </Accordion>
      <Accordion num={pad()} title="Flora & fauna nearby" sub="live · Atlas of Living Australia">
        <FloraFauna ctx={ctx} />
      </Accordion>

      <OpportunitiesAccordion num={pad()} items={ctx.ocItems} />
    </div>
  );
}
