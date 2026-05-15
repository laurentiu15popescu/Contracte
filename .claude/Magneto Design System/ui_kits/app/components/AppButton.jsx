// AppButton.jsx — Magneto unified button component
// Mirrors src/components/ui/AppButton.js

function AppButton({
  variant = 'primary',
  label,
  icon,
  iconPosition = 'left',
  size = 'md',
  onPress,
  disabled = false,
  loading = false,
  fullWidth = false,
  style = {},
  labelStyle = {},
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [pressed, setPressed] = React.useState(false);

  const HEIGHT = { sm: 44, md: 52, lg: 58 }[size] ?? 52;
  const FONT   = { sm: 13, md: 15, lg: 16 }[size] ?? 15;
  const PADH   = { sm: 14, md: 20, lg: 26 }[size] ?? 20;

  const getVariant = () => {
    switch (variant) {
      case 'secondary': return {
        bg: theme.isDark ? c.surfaceHighlight : '#EEF3FF',
        border: theme.isDark ? c.border : '#C8D6F2',
        color: c.text,
        shadow: '0 4px 12px rgba(15,23,42,0.10)',
        gradient: null,
      };
      case 'ghost': return {
        bg: theme.isDark ? 'rgba(148,163,184,0.08)' : 'rgba(255,255,255,0.04)',
        border: c.border,
        color: c.text,
        shadow: '0 3px 10px rgba(15,23,42,0.08)',
        gradient: null,
      };
      case 'danger': return {
        bg: theme.isDark ? '#450A0A' : '#FEF2F2',
        border: theme.isDark ? '#7F1D1D' : '#FECACA',
        color: c.danger,
        shadow: 'none',
        gradient: null,
      };
      case 'success': return {
        bg: c.success,
        border: c.success,
        color: '#FFFFFF',
        shadow: `0 8px 20px ${c.success}55`,
        gradient: null,
      };
      case 'warning': return {
        bg: c.warning,
        border: c.warning,
        color: '#FFFFFF',
        shadow: 'none',
        gradient: null,
      };
      case 'gradient': return {
        bg: 'transparent',
        border: theme.isDark ? '#818CF8' : '#4F46E5',
        color: '#FFFFFF',
        shadow: `0 6px 18px rgba(79,70,229,0.36)`,
        gradient: `linear-gradient(to right, ${c.brand}, ${c.accent})`,
      };
      default: return { // primary
        bg: c.accent,
        border: theme.isDark ? '#818CF8' : '#4F46E5',
        color: '#FFFFFF',
        shadow: `0 4px 14px rgba(99,102,241,0.28)`,
        gradient: null,
      };
    }
  };

  const v = getVariant();
  const isDisabled = disabled || loading;
  const scale = pressed && !isDisabled ? 'scale(0.965)' : 'scale(1)';

  const containerStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: HEIGHT,
    padding: `0 ${PADH}px`,
    borderRadius: theme.spacing.radiusLg,
    border: `1px solid ${v.border}`,
    background: v.gradient || v.bg,
    boxShadow: v.shadow,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.52 : 1,
    transform: scale,
    transition: 'transform 0.12s cubic-bezier(0.34,1.56,0.64,1)',
    gap: 8,
    userSelect: 'none',
    ...(fullWidth ? { width: '100%' } : {}),
    ...style,
  };

  const labelStyles = {
    fontSize: FONT,
    fontWeight: 800,
    color: v.color,
    letterSpacing: '0.2px',
    fontFamily: 'inherit',
    ...labelStyle,
  };

  return (
    <button
      style={containerStyle}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => { setPressed(false); if (!isDisabled && onPress) onPress(); }}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => { setPressed(false); if (!isDisabled && onPress) onPress(); }}
      disabled={isDisabled}
    >
      {loading ? (
        <span style={{ width: 18, height: 18, border: `2px solid ${v.color}`, borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
      ) : (
        <>
          {icon && iconPosition === 'left' && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
          {label && <span style={labelStyles}>{label}</span>}
          {icon && iconPosition === 'right' && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
        </>
      )}
    </button>
  );
}

Object.assign(window, { AppButton });
