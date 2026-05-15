// StatusBadge.jsx — Chip/badge component
// Mirrors src/components/ui/StatusBadge.js

function StatusBadge({ label, variant = 'neutral', size = 'md', icon, style = {} }) {
  const { theme } = useTheme();
  const c = theme.colors;

  const variants = {
    success: { bg: c.chipSuccessBg, color: c.chipSuccessText },
    warning: { bg: c.chipWarningBg, color: c.chipWarningText },
    danger:  { bg: c.chipDangerBg,  color: c.chipDangerText  },
    info:    { bg: c.chipInfoBg,    color: c.chipInfoText    },
    neutral: { bg: c.chipNeutralBg, color: c.chipNeutralText },
  };

  const sizes = {
    sm: { px: 8,  py: 4, fs: 11 },
    md: { px: 12, py: 6, fs: 12 },
    lg: { px: 14, py: 8, fs: 13 },
  };

  const v = variants[variant] || variants.neutral;
  const s = sizes[size] || sizes.md;

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: `${s.py}px ${s.px}px`,
      borderRadius: 9999,
      background: v.bg,
      color: v.color,
      fontSize: s.fs,
      fontWeight: 700,
      ...style,
    }}>
      {icon && <span style={{ display: 'flex' }}>{icon}</span>}
      {label}
    </span>
  );
}

Object.assign(window, { StatusBadge });
