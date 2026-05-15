# MagnetoApp — Design & UI Rules for Claude

You are working on **MagnetoApp** — a React Native (Expo SDK 54 + Firebase) internal app for a photography team that sells photo magnets at live events. The app is written entirely in **Romanian**.

---

## STACK
- React Native + Expo SDK 54
- Firebase (Firestore + Auth)
- `@expo/vector-icons` (Ionicons, FontAwesome5, MaterialIcons)
- `expo-linear-gradient` for gradients
- `react-native-web` for web compatibility
- Theme system: `src/context/ThemeContext.js` — always use `useTheme()` to access colors, typography, spacing, shadows

---

## COLORS — always use theme tokens, never hardcode

### Light Mode (`theme.colors.*`)
```js
brand:            '#6366F1'   // primary identity
accent:           '#6366F1'   // primary CTA
accentSecondary:  '#34CAE8'   // cyan, gradient end
bg:               '#F0F4F8'
surface:          '#FFFFFF'
card:             '#FFFFFF'
panel:            '#F7F8FC'
surfaceHighlight: '#EEF2FF'
inputBg:          '#FFFFFF'
text:             '#1A1A1A'
textPrimary:      '#1A1A1A'
textSecondary:    '#737373'
subText:          '#A3A3A3'
border:           '#E8E8E8'
borderStrong:     '#D4D4D4'
separator:        '#F0F0F0'
success:          '#10B981'
danger:           '#EF4444'
warning:          '#F59E0B'
gold:             '#EAB308'
info:             '#34CAE8'
rank1:            '#FACC15'
rank2:            '#34CAE8'
rank3:            '#6366F1'
chipSuccessBg:    '#ECFDF5'   chipSuccessText: '#047857'
chipWarningBg:    '#FFFBEB'   chipWarningText: '#B45309'
chipDangerBg:     '#FEF2F2'   chipDangerText:  '#B91C1C'
chipInfoBg:       '#EFF6FF'   chipInfoText:    '#1D4ED8'
chipNeutralBg:    '#F4F4F5'   chipNeutralText: '#52525B'
```

### Dark Mode (key differences)
```js
bg:               '#0F1626'
surface:          '#151D2E'
card:             '#1A2438'
panel:            '#1E2A40'
surfaceHighlight: '#243047'
inputBg:          '#121B2C'
brand:            '#7570F5'
accent:           '#5ED4F4'
text:             '#F4F7FB'
textSecondary:    '#94A3B8'
subText:          '#7D8CA3'
border:           '#2D3A52'
borderStrong:     '#3F4F6C'
success:          '#34D399'
danger:           '#F87171'
warning:          '#FBBF24'
gold:             '#FACC15'
```

### Brand Gradient
```js
// Always: brand → accent, left to right
<LinearGradient colors={[theme.colors.brand, theme.colors.accent]} start={{x:0,y:0}} end={{x:1,y:0}} />
// Login screen background (light):
['#f8fafc', '#e0e7ff', '#4f46e5']
// Login screen background (dark):
['#0f172a', '#1e1b4b', '#312e81']
```

---

## TYPOGRAPHY — always use `theme.typography.*`

```js
h1:           { fontSize: scaleFont(24), fontWeight: '900', letterSpacing: -0.4 }
h2:           { fontSize: scaleFont(20), fontWeight: '800', letterSpacing: -0.3 }
h3:           { fontSize: scaleFont(16), fontWeight: '700' }
h4:           { fontSize: scaleFont(14), fontWeight: '700', letterSpacing: -0.1 }
body:         { fontSize: scaleFont(13), lineHeight: scaleFont(19) }
bodyBold:     { fontSize: scaleFont(13), fontWeight: '700' }
bodyMedium:   { fontSize: scaleFont(13), fontWeight: '600' }
label:        { fontSize: scaleFont(10), fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 }
caption:      { fontSize: scaleFont(11), fontWeight: '700' }
small:        { fontSize: scaleFont(10) }
bigNumber:    { fontSize: scaleFont(32), fontWeight: '900', letterSpacing: -1 }
sectionCaption: { fontSize: scaleFont(11), fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 }
```

Font stack: system font (SF Pro on iOS, Roboto on Android, system-ui on web). Never import custom fonts.

---

## SPACING — always use `theme.spacing.*`

```js
xs: 4,  s: 6,  sm: 10,  m: 12,  l: 16,  xl: 24,  xxl: 32
radius: 12       // standard input/card
radiusLg: 16     // buttons
radiusXl: 20     // larger cards
contentPadding: 20   // horizontal screen padding
sectionSpacing: 20   // vertical gap between sections
inputHeight: 54      // standard input height
```

### Border radius by component
| Component | Radius |
|---|---|
| Inputs | 12–14px |
| Buttons | 16px (`radiusLg`) |
| Cards (default) | 12px |
| Cards (section) | 22px |
| Cards (hero) | 26px |
| Chips/badges | 9999px (pill) |
| Icon circles | 12px |
| FAB | 16px |

---

## SHADOWS — always use `theme.shadows.*` or `theme.cardStyle`

```js
// Web platform:
sm:  '0px 4px 16px rgba(0,0,0,0.06), 0px 1px 4px rgba(78,73,242,0.07)'
md:  '0px 8px 28px rgba(0,0,0,0.07), 0px 2px 8px rgba(52,202,232,0.08)'
lg:  '0px 12px 40px rgba(0,0,0,0.15)'

// Dark mode — heavier:
sm:  '0px 6px 18px rgba(0,0,0,0.24)'
md:  '0px 10px 30px rgba(0,0,0,0.42), 0px 0px 0px 1px rgba(255,255,255,0.03)'

// Colored shadows (for buttons):
brand:   '0px 6px 18px rgba(79,70,229,0.36)'
success: '0px 8px 20px rgba(16,185,129,0.34)'
```

---

## CARD STYLES — use `theme.cardStyle`, `theme.softCardStyle`, `theme.adminStyles.*`

```js
cardStyle:      { bg: card, radius: 12, border: 1px border, shadow: md }
softCardStyle:  { bg: surface, radius: 12, border: 1px border, shadow: sm }
adminStyles: {
  heroCard:    { bg: panel(dark)/card(light), radius: 26, padding: 22, shadow: md }
  sectionCard: { bg: card, radius: 22, padding: 18, shadow: sm }
  mutedCard:   { bg: surfaceHighlight, radius: 18, padding: 16 }
  listRow:     { bg: card, radius: 18, padding: 14, border: 1px border }
}
```

---

## COMPONENTS — use existing components from `src/components/ui/`

### AppButton
```jsx
<AppButton
  variant="gradient"   // 'gradient'|'primary'|'secondary'|'ghost'|'danger'|'success'|'warning'
  label="Conectare"
  icon="arrow-forward"
  IconComponent={Ionicons}
  iconPosition="right"  // 'left'|'right'
  size="lg"            // 'sm'(44px) | 'md'(52px) | 'lg'(58px)
  onPress={fn}
  loading={false}
  fullWidth
/>
// Press animation: scale(0.965) spring on pressIn, scale(1) on pressOut
```

### StatusBadge
```jsx
<StatusBadge
  label="Confirmat"
  variant="success"  // 'success'|'warning'|'danger'|'info'|'neutral'
  size="md"          // 'sm'|'md'|'lg'
  theme={theme}
/>
```

### StatCard (KPI)
```jsx
<StatCard
  title="Încasări Azi"
  value="1.850"
  subValue="Cash: 1.200 | Card: 650"
  icon="attach-money"
  IconComponent={MaterialIcons}
  color={theme.colors.success}
  theme={theme}
  scaleFont={scaleFont}
/>
// Has left gradient color strip + icon circle top-right
```

### Card
```jsx
<Card variant="elevated" theme={theme} onPress={fn}>
  {/* variant: 'default'|'elevated'|'outlined'|'soft' */}
</Card>
// Pressable cards animate: scale(0.97) on press
```

### FormInput
```jsx
<FormInput
  label="Email"
  error="Introdu o adresă validă."
  required
  theme={theme}
  placeholder="fotograf@magneto.ro"
  // Focus: border becomes accent color, width 2px
  // Error: border becomes danger, width 1.5px
/>
```

### QuickActionTile
```jsx
<QuickActionTile
  label="Încasare"
  icon="hand-holding-usd"
  IconComponent={FontAwesome5}
  color={theme.colors.success}
  onPress={fn}
  theme={theme}
  scaleFont={scaleFont}
/>
// Icon bg: linear-gradient(color+'2E', color+'12')
// Press: scale(0.94) spring
```

---

## ICONS — always use `@expo/vector-icons`

```js
// Primary sets:
import { Ionicons } from '@expo/vector-icons';           // general UI
import { FontAwesome5 } from '@expo/vector-icons';       // business/finance
import { MaterialIcons } from '@expo/vector-icons';      // admin stats
import { MaterialCommunityIcons } from '@expo/vector-icons'; // occasional

// Sizes: xs=16, sm=18, md=20, lg=24, xl=32
// Color: always matches semantic context (brand/success/danger/warning/gold)

// Common icons:
// home, notifications-outline, moon, sunny, power  → Ionicons
// hand-holding-usd, file-invoice-dollar, trophy, box-open, boxes → FontAwesome5
// attach-money, event-available → MaterialIcons
```

---

## COPY & LANGUAGE RULES

- **All UI copy in Romanian**
- **Tone:** Direct, motivational, second person ("Tu", "Ești")
- **Casing:**
  - Section headers → Title Case: "Acțiuni Rapide"
  - Labels/badges → ALL CAPS: "ACȚIUNI DIRECTE"
  - Body/errors → Sentence case: "Introdu o sumă validă."
- **Numbers:** Dot as thousands separator: `1.500 RON`
- **Emoji:** Only in motivational messages and rank indicators (🏆🥈🥉🔥🏅). Never in labels, buttons, or error messages.

### Copy patterns
```
Greeting:     "Bună dimineața, {prenume}"
Error:        "Introdu o sumă validă." / "Selectează locația."
Success toast:"Încasarea a fost salvată."
Empty state:  "Nicio încasare azi. După ce validezi, va apărea aici."
Button:       "Conectare" / "Validare Încasare" / "Salvează" / "Anulează"
```

---

## ANIMATIONS & INTERACTIONS

- **Button press:** `Animated.spring(scale, { toValue: 0.965, speed: 50, bounciness: 0 })` on pressIn; `{ toValue: 1, speed: 22, bounciness: 4 }` on pressOut
- **Card press:** same but `toValue: 0.97`
- **Screen entry:** `Animated.parallel([fadeIn 800ms, spring translateY from 30→0])`
- **Toast:** `Animated.sequence([fadeIn 300ms, delay 2200ms, fadeOut 300ms])`
- **Confetti:** trigger `react-native-confetti-cannon` when monthly target is first crossed
- **No custom page transitions** — use React Navigation defaults

---

## LAYOUT RULES

- Screen content padding: `20px` horizontal (`theme.spacing.contentPadding`)
- Section gap: `20px` (`theme.spacing.sectionSpacing`)
- Max content width (web/desktop): `860px`, centered
- Input height: `54px` (`theme.spacing.inputHeight`)
- Tab bar height: `74px`, `paddingBottom: 10`, `paddingTop: 8`
- Always wrap screens in `<ScreenLayout>` from `src/components/ScreenLayout.js`
- Use `useResponsive()` from `src/hooks/useResponsive.js` for `scaleFont`

---

## SCREEN BACKGROUNDS

- Light: `#F0F4F8` (blue-grey tint, not pure white)
- Dark: `#0F1626` (deep navy)
- Login only: full-screen `LinearGradient` with decorative blur blobs (brand + accentSecondary, opacity 0.15–0.20)
- No patterns, textures, illustrations, or full-bleed images in regular screens

---

## WHAT NOT TO DO

- ❌ Never hardcode colors — always use `theme.colors.*`
- ❌ Never use custom fonts — system font only
- ❌ Never add emoji to UI labels, buttons, or error messages
- ❌ Never use pure black (`#000000`) or pure white (`#FFFFFF`) as background
- ❌ Never invent new screens, fields, Firebase collections, or navigation routes without confirmation
- ❌ Never refactor architecture or rename routes without approval
- ❌ Never change UI unless explicitly requested
- ❌ Never use `px` font sizes directly — always wrap in `scaleFont()`
