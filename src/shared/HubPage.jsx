import "../Dashboard/Dashboard.css";

export default function HubPage({ eyebrow, title, subtitle, cards }) {
  return (
    <div className="dash">
      <div className="dash-hero">
        <div className="dash-hero-inner">
          <div>
            <div className="dash-hero-eyebrow">{eyebrow}</div>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
        </div>
      </div>

      <div className="section-cap">Acțiuni</div>
      <div className="qa-grid">
        {cards.map((c, i) => (
          <button
            key={i}
            className="qa"
            style={{ "--qa-color": c.color || "#6366F1" }}
            onClick={c.onClick}
            disabled={c.disabled}
          >
            <div className="qa-icon">{c.icon}</div>
            <div>
              <div className="qa-label">{c.label}</div>
              <div className="qa-desc">{c.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
