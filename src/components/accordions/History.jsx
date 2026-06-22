export default function History({ ctx }) {
  const { wiki, suburb, display } = ctx;

  if (!wiki) {
    return (
      <>
        <p>No Wikipedia summary could be matched to <strong>{suburb || 'this area'}</strong>. Try a broader local-history search instead.</p>
        <div className="note-box">
          Search the National Library of Australia's newspaper archive for historical references to this area:{' '}
          <a href={`https://trove.nla.gov.au/search/category/newspapers?keyword=${encodeURIComponent(suburb || display)}`} target="_blank" rel="noopener">Trove search ↗</a>
        </div>
      </>
    );
  }

  const pageUrl = wiki.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(wiki.title || '')}`;

  return (
    <div className="history-flex">
      {wiki.thumbnail && (
        <div className="history-thumb">
          <img src={wiki.thumbnail.source} alt="" loading="lazy" />
        </div>
      )}
      <div className="history-text">
        <p>{wiki.extract}</p>
        <span className="source-tag">
          Source: Wikipedia ·{' '}
          <a href={pageUrl} target="_blank" rel="noopener">read full article ↗</a>
        </span>
      </div>
    </div>
  );
}
