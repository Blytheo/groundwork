import AddressAutocomplete from './AddressAutocomplete.jsx';

export default function Hero({ onSearch, loading }) {
  return (
    <section className="hero wrap">
      <h1>Any Australian address.<br />One site brief.</h1>
      <p className="lead">
        Zoning, heritage, hazards, history, climate, flora, sun path and the right council links — pulled live from government data.
      </p>
      <AddressAutocomplete
        onSearch={onSearch}
        loading={loading}
        buttonLabel="Analyse site"
        loadingLabel="Analysing…"
      />
      <div className="search-note">
        Full live regulatory, hazard and cadastre lookups currently run for NSW addresses. Other states return state planning links.
      </div>
    </section>
  );
}
