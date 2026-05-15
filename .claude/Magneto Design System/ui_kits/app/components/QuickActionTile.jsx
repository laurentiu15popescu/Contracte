// QuickActionTile.jsx — Icon action tile
// Mirrors src/components/ui/QuickActionTile.js

function QuickActionTile({ label, iconSvg, color, onPress, disabled }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [pressed, setPressed] = React.useState(false);

  return (
    <button
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 8, flex: 1, minWidth: 80, height: 100,
        paddingTop: 14, paddingBottom: 14, paddingLeft: 10, paddingRight: 10,
        background: c.card, borderRadius: 12, border: `1px solid ${c.border}`,
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transform: pressed ? 'scale(0.94)' : 'scale(1)',
        transition: 'transform 0.12s cubic-bezier(0.34,1.56,0.64,1)',
        outline: 'none',
        userSelect: 'none',
        fontFamily: 'inherit',
      }}
      onMouseDown={() => !disabled && setPressed(true)}
      onMouseUp={() => { setPressed(false); if (!disabled && onPress) onPress(); }}
      onMouseLeave={() => setPressed(false)}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `linear-gradient(135deg, ${color}2E, ${color}12)`,
      }}>
        {iconSvg}
      </div>
      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', color: c.text, textAlign: 'center' }}>
        {label}
      </span>
    </button>
  );
}

Object.assign(window, { QuickActionTile });
