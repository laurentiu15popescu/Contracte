// StatCard.jsx — KPI card with left color strip + icon
// Mirrors src/components/ui/StatCard.js

function StatCard({ title, value, subValue, color, iconSvg, style = {} }) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <div style={{
      flex: 1, minWidth: '45%', position: 'relative', overflow: 'hidden',
      minHeight: 90, borderRadius: 12,
      background: c.card,
      border: `1px solid ${c.border}`,
      boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
      padding: '12px 14px 12px 18px',
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      ...style,
    }}>
      {/* Left gradient strip */}
      <div style={{
        position: 'absolute', left: 0, top: 16, bottom: 16, width: 5,
        borderRadius: 999,
        background: `linear-gradient(to bottom, ${color}, ${color}44)`,
      }} />
      {/* Icon bg — top right */}
      <div style={{
        position: 'absolute', top: 14, right: 14, width: 40, height: 40,
        borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `${color}30`,
        border: `1px solid ${color}18`,
      }}>
        {iconSvg}
      </div>
      {/* Text */}
      <div style={{ paddingRight: 52 }}>
        <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: c.subText }}>{title}</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: c.textPrimary, letterSpacing: '-0.5px', marginTop: 4, lineHeight: 1 }}>{value}</div>
        {subValue && <div style={{ fontSize: 10, color: c.subText, marginTop: 4 }}>{subValue}</div>}
      </div>
    </div>
  );
}

Object.assign(window, { StatCard });
