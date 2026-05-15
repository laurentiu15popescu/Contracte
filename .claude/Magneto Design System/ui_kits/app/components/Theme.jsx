// Theme.jsx — Magneto design tokens
// Mirrors src/context/ThemeContext.js

const LightColors = {
  bg: '#F0F4F8',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  panel: '#F7F8FC',
  surfaceHighlight: '#EEF2FF',
  inputBg: '#FFFFFF',
  text: '#1A1A1A',
  textPrimary: '#1A1A1A',
  textSecondary: '#737373',
  subText: '#A3A3A3',
  textOnAccent: '#FFFFFF',
  border: '#E8E8E8',
  borderStrong: '#D4D4D4',
  separator: '#F0F0F0',
  accent: '#6366F1',
  brand: '#6366F1',
  accentSecondary: '#34CAE8',
  accentSoft: '#E8F4FE',
  accentSoftText: '#312E81',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  gold: '#EAB308',
  info: '#34CAE8',
  progressTrack: '#E8E8E8',
  overlay: 'rgba(26,26,26,0.48)',
  rank1: '#FACC15', rank2: '#34CAE8', rank3: '#6366F1',
  chipSuccessBg: '#ECFDF5', chipSuccessText: '#047857',
  chipWarningBg: '#FFFBEB', chipWarningText: '#B45309',
  chipDangerBg: '#FEF2F2', chipDangerText: '#B91C1C',
  chipInfoBg: '#EFF6FF', chipInfoText: '#1D4ED8',
  chipNeutralBg: '#F4F4F5', chipNeutralText: '#52525B',
};

const DarkColors = {
  bg: '#0F1626',
  surface: '#151D2E',
  card: '#1A2438',
  panel: '#1E2A40',
  surfaceHighlight: '#243047',
  inputBg: '#121B2C',
  text: '#F4F7FB',
  textPrimary: '#F4F7FB',
  textSecondary: '#94A3B8',
  subText: '#7D8CA3',
  textOnAccent: '#FFFFFF',
  border: '#2D3A52',
  borderStrong: '#3F4F6C',
  separator: '#222C3E',
  accent: '#5ED4F4',
  brand: '#7570F5',
  accentSecondary: '#5ED4F4',
  accentSoft: '#252E45',
  accentSoftText: '#A5B4FC',
  success: '#34D399',
  danger: '#F87171',
  warning: '#FBBF24',
  gold: '#FACC15',
  info: '#5ED4F4',
  progressTrack: '#243047',
  overlay: 'rgba(10,15,26,0.78)',
  rank1: '#FBBF24', rank2: '#5ED4F4', rank3: '#7570F5',
  chipSuccessBg: '#064E3B', chipSuccessText: '#6EE7B7',
  chipWarningBg: '#422006', chipWarningText: '#FCD34D',
  chipDangerBg: '#450A0A', chipDangerText: '#FCA5A5',
  chipInfoBg: '#1E3A5F', chipInfoText: '#93C5FD',
  chipNeutralBg: '#27272A', chipNeutralText: '#A1A1AA',
};

const spacing = {
  xs: 4, s: 6, sm: 10, m: 12, l: 16, xl: 24, xxl: 32,
  radius: 12, radiusLg: 16, radiusXl: 20,
  contentPadding: 20, sectionSpacing: 20, inputHeight: 54,
};

const buildTheme = (dark) => {
  const c = dark ? DarkColors : LightColors;
  const shadow = dark
    ? '0 10px 30px rgba(0,0,0,0.42), 0 0 0 1px rgba(255,255,255,0.03)'
    : '0 8px 28px rgba(0,0,0,0.07), 0 2px 8px rgba(52,202,232,0.08)';
  const softShadow = dark
    ? '0 6px 18px rgba(0,0,0,0.24)'
    : '0 4px 16px rgba(0,0,0,0.06), 0 1px 4px rgba(78,73,242,0.07)';

  return {
    colors: c,
    spacing,
    isDark: dark,
    shadow,
    softShadow,
    cardStyle: {
      background: c.card,
      borderRadius: 12,
      border: `1px solid ${c.border}`,
      boxShadow: shadow,
    },
    heroCardStyle: {
      background: dark ? c.panel : c.card,
      borderRadius: 26,
      padding: 22,
      border: `1px solid ${dark ? c.borderStrong : '#E3E7F3'}`,
      boxShadow: shadow,
    },
    sectionCardStyle: {
      background: c.card,
      borderRadius: 22,
      padding: 18,
      border: `1px solid ${c.border}`,
      boxShadow: softShadow,
    },
    typography: {
      h1: { fontSize: 24, fontWeight: 900, letterSpacing: '-0.4px', color: c.textPrimary },
      h2: { fontSize: 20, fontWeight: 800, letterSpacing: '-0.3px', color: c.textPrimary },
      h3: { fontSize: 16, fontWeight: 700, color: c.textPrimary },
      h4: { fontSize: 14, fontWeight: 700, color: c.textPrimary },
      body: { fontSize: 13, color: c.textPrimary, lineHeight: '19px' },
      bodyBold: { fontSize: 13, fontWeight: 700, color: c.textPrimary },
      label: { fontSize: 10, fontWeight: 800, color: c.textSecondary, textTransform: 'uppercase', letterSpacing: '0.8px' },
      caption: { fontSize: 11, fontWeight: 700, color: c.textSecondary },
      small: { fontSize: 10, color: c.textSecondary },
      bigNumber: { fontSize: 32, fontWeight: 900, letterSpacing: '-1px', color: c.textPrimary },
    },
    rankingColors: { first: c.rank1, second: c.rank2, third: c.rank3 },
  };
};

const ThemeContext = React.createContext(null);

function ThemeProvider({ children }) {
  const [dark, setDark] = React.useState(false);
  const theme = React.useMemo(() => buildTheme(dark), [dark]);
  return (
    <ThemeContext.Provider value={{ theme, dark, toggleTheme: () => setDark(d => !d) }}>
      {children}
    </ThemeContext.Provider>
  );
}

function useTheme() {
  return React.useContext(ThemeContext);
}

Object.assign(window, { ThemeProvider, useTheme, LightColors, DarkColors });
