import { useState } from 'react';

export default function Accordion({ num, title, sub, children, defaultOpen = false, extraHead = null }) {
  const [open, setOpen] = useState(defaultOpen);

  function handleClick(e) {
    if (e.target.closest('select')) return;
    setOpen(o => !o);
  }

  return (
    <div className="accordion">
      <button
        className="acc-head"
        aria-expanded={open ? 'true' : 'false'}
        type="button"
        onClick={handleClick}
      >
        <span className="acc-num">{num}</span>
        <span className="acc-title">{title}</span>
        {sub && <span className="acc-sub">{sub}</span>}
        {extraHead}
        <svg className="acc-chev" viewBox="0 0 12 8" fill="none">
          <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className={`acc-body${open ? ' open' : ''}`}>
        <div className="acc-inner">
          <div className="acc-content">{children}</div>
        </div>
      </div>
    </div>
  );
}
