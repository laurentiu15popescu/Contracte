const MAX_PAGES = 14;

const PageMarks = () => (
  <div className="page-marks no-print" aria-hidden="true" contentEditable={false}>
    {Array.from({ length: MAX_PAGES }, (_, i) => (
      <div
        key={i}
        className="page-mark-num"
        style={{ top: `${(i + 1) * 297 - 8}mm` }}
      >
        {i + 1}
      </div>
    ))}
  </div>
);

export default PageMarks;
