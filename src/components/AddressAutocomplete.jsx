import { useState, useEffect, useRef } from 'react';

const TOKEN = import.meta.env.VITE_MAPBOX_API_KEY;

function mapboxUrl(q) {
  return `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?country=au&types=address&autocomplete=true&limit=5&access_token=${TOKEN}`;
}

export default function AddressAutocomplete({
  onSearch,
  loading,
  placeholder = 'e.g. 1 Spring Street, Chatswood NSW 2067',
  buttonLabel = 'Search',
  loadingLabel = null,
  className = '',
}) {
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [open, setOpen] = useState(false);
  const abortRef = useRef(null);
  const timerRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    function onMouseDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  useEffect(() => {
    clearTimeout(timerRef.current);
    const q = value.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      try {
        const res = await fetch(mapboxUrl(q), { signal: abortRef.current.signal });
        if (!res.ok) return;
        const data = await res.json();
        const feats = data.features || [];
        setSuggestions(feats);
        setOpen(feats.length > 0);
        setActiveIdx(-1);
      } catch (err) {
        if (err.name !== 'AbortError') console.error('Geocoding error', err);
      }
    }, 250);
    return () => clearTimeout(timerRef.current);
  }, [value]);

  function pick(placeName) {
    setValue(placeName);
    setSuggestions([]);
    setOpen(false);
    setActiveIdx(-1);
    onSearch(placeName);
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      setOpen(false);
      setActiveIdx(-1);
      return;
    }
    if (!open || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const val = value.trim();
        if (val) { setOpen(false); onSearch(val); }
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx >= 0) pick(suggestions[activeIdx].place_name);
      else { const val = value.trim(); if (val) { setOpen(false); onSearch(val); } }
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    setOpen(false);
    const val = value.trim();
    if (val) onSearch(val);
  }

  const btnLoading = loadingLabel || (buttonLabel + 'ing…').replace('Searchinging', 'Searching').replace('Analyseing', 'Analysing');
  const displayLabel = loading ? btnLoading : buttonLabel;

  return (
    <form
      className={`search-form${className ? ' ' + className : ''}`}
      onSubmit={handleSubmit}
      autoComplete="off"
    >
      <div className="autocomplete-wrap" ref={wrapRef}>
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          required
          aria-label="Australian address"
          aria-autocomplete="list"
          aria-expanded={open}
          disabled={loading}
        />
        {open && suggestions.length > 0 && (
          <ul className="autocomplete-list" role="listbox" aria-label="Address suggestions">
            {suggestions.map((feat, i) => {
              const sub = feat.place_name.startsWith(feat.text + ', ')
                ? feat.place_name.slice(feat.text.length + 2)
                : feat.place_name;
              return (
                <li
                  key={feat.id}
                  role="option"
                  aria-selected={i === activeIdx}
                  className={`autocomplete-item${i === activeIdx ? ' autocomplete-item--active' : ''}`}
                  onMouseDown={() => pick(feat.place_name)}
                >
                  <span className="autocomplete-main">{feat.text}</span>
                  <span className="autocomplete-sub">{sub}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <button type="submit" disabled={loading} aria-label={buttonLabel}>
        {displayLabel}
      </button>
    </form>
  );
}
