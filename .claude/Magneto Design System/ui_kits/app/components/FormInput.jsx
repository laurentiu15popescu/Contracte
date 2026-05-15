// FormInput.jsx — Text input with label + error states
// Mirrors src/components/ui/FormInput.js

function FormInput({ label, error, required, placeholder, value, onChange, type = 'text', leftIcon, rightIcon, disabled, style = {} }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [focused, setFocused] = React.useState(false);

  const borderColor = error ? c.danger : focused ? c.accent : c.border;
  const borderWidth = error ? 1.5 : focused ? 2 : 1;

  return (
    <div style={{ marginBottom: 12, ...style }}>
      {label && (
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', color: c.textSecondary, marginBottom: 6 }}>
          {label}{required && <span style={{ color: c.danger }}> *</span>}
        </div>
      )}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: focused ? c.card : c.inputBg,
        border: `${borderWidth}px solid ${borderColor}`,
        borderRadius: 12,
        padding: '0 16px',
        height: 54,
        opacity: disabled ? 0.5 : 1,
        transition: 'border-color 0.15s, border-width 0.15s',
      }}>
        {leftIcon && <span style={{ display: 'flex', color: focused ? c.accent : c.subText, flexShrink: 0 }}>{leftIcon}</span>}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontFamily: 'inherit', fontSize: 13, color: c.text,
            '::placeholder': { color: c.subText },
          }}
        />
        {rightIcon && <span style={{ display: 'flex', color: c.subText, flexShrink: 0 }}>{rightIcon}</span>}
      </div>
      {error && <div style={{ fontSize: 11, fontWeight: 600, color: c.danger, marginTop: 4 }}>{error}</div>}
    </div>
  );
}

Object.assign(window, { FormInput });
