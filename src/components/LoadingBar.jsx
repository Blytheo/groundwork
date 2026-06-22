import { useState, useEffect } from 'react';

const DEFAULT_MESSAGES = [
  'Geocoding address…',
  'Locating council area…',
  'Checking zoning & planning controls…',
  'Searching heritage register…',
  'Checking bushfire, flood & landslide overlays…',
  'Fetching climate history…',
  'Looking up nearby species records…',
  'Looking up site history…',
  'Calculating sun path…',
  'Putting the report together…',
];

export default function LoadingBar({ active, messages }) {
  const msgs = messages || DEFAULT_MESSAGES;
  const [msgIdx, setMsgIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setMsgIdx(i => (i + 1) % msgs.length);
        setFade(true);
      }, 150);
    }, 900);
    return () => { clearInterval(id); setMsgIdx(0); setFade(true); };
  }, [active, msgs.length]);

  if (!active) return null;

  return (
    <div className="loading-box wrap">
      <div className="loading-bar" />
      <div className="loading-status" style={{ opacity: fade ? 1 : 0 }}>
        {msgs[msgIdx]}
      </div>
    </div>
  );
}
