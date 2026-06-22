import { downloadSectionPDF } from '../utils/pdf.js';

export default function PDFButton({ ctx, categoryKey }) {
  return (
    <button
      className="pdf-btn"
      type="button"
      onClick={() => downloadSectionPDF(ctx, categoryKey)}
    >
      <svg viewBox="0 0 16 16" fill="none" className="pdf-btn-icon" aria-hidden="true">
        <path
          d="M8 1v9m0 0L5 7m3 3 3-3M2 12v1a2 2 0 002 2h8a2 2 0 002-2v-1"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Download PDF
    </button>
  );
}
