# MagnetoApp — Claude Rules

Stack: React Native + Expo SDK 54 + Firebase. App intern pentru o echipă de fotografi care vinde magnete foto la evenimente live. Scris integral în **română**.

---

## COMPORTAMENT GENERAL

### Moduri de lucru
- **BUILD MODE** — creează / extinde funcționalitate, pas cu pas, arhitectură intactă
- **FIX MODE** — identifică root cause, patch minimal, fără side effects
- **REVIEW MODE** — evaluează critic propuneri externe, livrează versiunea corectă minimală

### Reguli non-negociabile
- Nu rescrie fișiere mari fără motiv
- Nu refactoriza arhitectura fără aprobare
- Nu schimba UI/UX fără cerere explicită
- Nu adăuga librării noi fără necesitate
- Nu inventa ecrane, câmpuri, colecții Firebase sau rute
- Nu face "cleanup" nelegat de task

### Format răspuns
1. Diagnostic
2. Plan
3. Fișiere afectate
4. Cod / patch
5. Ce testez
6. Riscuri (dacă există)

---

## DESIGN SYSTEM

### Tema
Folosește **întotdeauna** `useTheme()` din `src/context/ThemeContext.js`. Nu hardcoda culori, fonturi sau dimensiuni.

```js
const { theme, isDarkMode, toggleTheme } = useTheme();
const { scaleFont } = useResponsive(); // src/hooks/useResponsive.js
const c = theme.colors; // shorthand
```

---

### CULORI — `theme.colors.*`

#### Light Mode
```js
brand:            '#6366F1'   // identitate primară
accent:           '#6366F1'   // CTA principal
accentSecondary:  '#34CAE8'   // cyan, capăt gradient
bg:               '#F0F4F8'   // fundal ecran (NU alb pur)
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

#### Dark Mode (diferențe cheie)
```js
bg:               '#0F1626'   // navy adânc (NU negru pur)
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

#### Gradient brand
```js
// Buton CTA principal și borduri avatar:
<LinearGradient colors={[theme.colors.brand, theme.colors.accent]} start={{x:0,y:0}} end={{x:1,y:0}} />

// Login screen background:
light: ['#f8fafc', '#e0e7ff', '#4f46e5']
dark:  ['#0f172a', '#1e1b4b', '#312e81']
```

---

### TIPOGRAFIE — `theme.typography.*`

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

Font: system font (SF Pro iOS, Roboto Android, system-ui web). **Nu importa fonturi custom.**
Font size: **întotdeauna** prin `scaleFont()`. Nu scrie `fontSize: 14` direct.

---

### SPACING — `theme.spacing.*`

```js
xs: 4,  s: 6,  sm: 10,  m: 12,  l: 16,  xl: 24,  xxl: 32
radius:   12    // input/card standard
radiusLg: 16    // butoane, FAB
radiusXl: 20    // carduri mai mari
contentPadding: 20   // padding orizontal ecrane
sectionSpacing: 20   // gap vertical între secțiuni
inputHeight:    54   // înălțime input standard
```

#### Border radius pe component
| Component | Radius |
|---|---|
| Inputs | 12–14px |
| Butoane | 16px |
| Cards default | 12px |
| Cards section | 22px |
| Cards hero | 26px |
| Chips/badge | 9999px (pill) |
| Icon circles | 12px |

---

### SHADOWS — `theme.shadows.*`

```js
// Web:
sm:  '0px 4px 16px rgba(0,0,0,0.06), 0px 1px 4px rgba(78,73,242,0.07)'
md:  '0px 8px 28px rgba(0,0,0,0.07), 0px 2px 8px rgba(52,202,232,0.08)'
lg:  '0px 12px 40px rgba(0,0,0,0.15)'
// Dark mode — mai grele:
sm:  '0px 6px 18px rgba(0,0,0,0.24)'
md:  '0px 10px 30px rgba(0,0,0,0.42), 0px 0px 0px 1px rgba(255,255,255,0.03)'
// Colorate (butoane):
brand:   '0px 6px 18px rgba(79,70,229,0.36)'
success: '0px 8px 20px rgba(16,185,129,0.34)'
```

---

### CARD STYLES

```js
theme.cardStyle         // bg: card, radius: 12, border: 1px, shadow: md
theme.softCardStyle     // bg: surface, radius: 12, border: 1px, shadow: sm
theme.adminStyles.heroCard    // radius: 26, padding: 22, shadow: md
theme.adminStyles.sectionCard // radius: 22, padding: 18, shadow: sm
theme.adminStyles.mutedCard   // bg: surfaceHighlight, radius: 18
theme.adminStyles.listRow     // radius: 18, padding: 14, border: 1px
```

---

### COMPONENTE — `src/components/ui/`

#### AppButton
```jsx
<AppButton
  variant="gradient"   // gradient|primary|secondary|ghost|danger|success|warning
  label="Conectare"
  icon="arrow-forward"
  IconComponent={Ionicons}
  iconPosition="right"
  size="lg"            // sm(44px)|md(52px)|lg(58px)
  onPress={fn}
  loading={false}
  fullWidth
/>
// Animație: scale(0.965) spring pressIn → scale(1) pressOut
```

#### StatusBadge
```jsx
<StatusBadge
  label="Confirmat"
  variant="success"    // success|warning|danger|info|neutral
  size="md"            // sm|md|lg
  theme={theme}
/>
```

#### StatCard (KPI)
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
// Strip gradient stânga + icon bg top-right
```

#### Card
```jsx
<Card variant="elevated" theme={theme} onPress={fn}>
  {/* default|elevated|outlined|soft */}
</Card>
// Pressable: scale(0.97) spring
```

#### FormInput
```jsx
<FormInput
  label="Email"
  error="Introdu o adresă validă."
  required
  theme={theme}
  placeholder="fotograf@magneto.ro"
  // Focus: border accent 2px | Error: border danger 1.5px
/>
```

#### QuickActionTile
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
// Press: scale(0.94)
```

---

### ICONOGRAFIE — `@expo/vector-icons`

```js
import { Ionicons } from '@expo/vector-icons';            // UI general
import { FontAwesome5 } from '@expo/vector-icons';        // business/finance
import { MaterialIcons } from '@expo/vector-icons';       // admin stats
import { MaterialCommunityIcons } from '@expo/vector-icons'; // ocazional

// Mărimi: xs=16, sm=18, md=20, lg=24, xl=32
// Culoare: întotdeauna din context semantic (brand/success/danger/warning/gold)

// Iconuri frecvente:
// home, notifications-outline, moon, sunny, power → Ionicons
// hand-holding-usd, file-invoice-dollar, trophy, box-open, boxes → FontAwesome5
// attach-money, event-available → MaterialIcons
```

---

### ANIMAȚII

```js
// Button pressIn:
Animated.spring(scale, { toValue: 0.965, speed: 50, bounciness: 0, useNativeDriver: true })
// Button pressOut:
Animated.spring(scale, { toValue: 1, speed: 22, bounciness: 4, useNativeDriver: true })
// Card press: toValue: 0.97 (same params)

// Screen entry:
Animated.parallel([
  Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
  Animated.spring(slideAnim, { toValue: 0, friction: 5, useNativeDriver: true })
])

// Toast:
Animated.sequence([fadeIn 300ms, delay 2200ms, fadeOut 300ms])

// Confetti: react-native-confetti-cannon la atingerea target-ului lunar
// useNativeDriver: Platform.OS !== 'web'
```

---

### LAYOUT

```js
// Padding orizontal ecrane: theme.spacing.contentPadding (20px)
// Gap vertical secțiuni:    theme.spacing.sectionSpacing (20px)
// Înălțime input:           theme.spacing.inputHeight (54px)
// Tab bar: height: 74, paddingBottom: 10, paddingTop: 8
// Max width web/desktop:    860px, centrat
// Wrap ecrane în:           <ScreenLayout> (src/components/ScreenLayout.js)
```

---

### COPY & LIMBAJ

- **Română** — tot UI-ul, fără excepție
- **Ton:** direct, motivațional, persoana a 2-a ("Tu", "Ești")
- **Casing:** Title Case pentru section headers · ALL CAPS + letterSpacing pentru labels/badges · Sentence case pentru body/erori
- **Numere:** separator mii = punct: `1.500 RON`
- **Emoji:** doar în mesaje motivaționale și rank (🏆🥈🥉🔥🏅) — niciodată în labels, butoane, erori

```
Greeting:      "Bună dimineața, {prenume}"
Eroare:        "Introdu o sumă validă." / "Selectează locația."
Toast succes:  "Încasarea a fost salvată."
Empty state:   "Nicio încasare azi. După ce validezi, va apărea aici."
Buton:         "Conectare" / "Validare Încasare" / "Salvează" / "Anulează"
```

**Erori Firebase:** nu afișa `e.message` direct — wrap cu mesaj custom în română.

---

### CE NU FACE NICIODATĂ

```
❌ Hardcode culori — folosește theme.colors.*
❌ Fonturi custom — system font only
❌ Emoji în labels, butoane, mesaje de eroare
❌ Fundal #000000 sau #FFFFFF pur
❌ fontSize direct — întotdeauna scaleFont()
❌ Spacing magic (marginTop: 35) — folosește theme.spacing.*
❌ Carduri cu border-left accent (anti-pattern)
❌ Border-radius mic pe carduri/butoane (<12px)
❌ Ecrane/câmpuri/colecții Firebase noi fără confirmare
❌ Refactorizare arhitectură fără aprobare
❌ Schimbare UI fără cerere explicită
```

---

## FIREBASE

- Nu redenumi colecții/câmpuri fără confirmare
- Nu asuma schema Firestore
- Gestionează stările: loading / empty / missing-doc / invalid-role
- Păstrează comportamentul role-based
- Dacă schema e neconfirmată: **"Nu pot confirma schema exactă din input."**

## NAVIGARE

- Nu muta ecrane între foldere
- Nu redenumi rute fără confirmare
- Nu schimba structura navigator fără motiv puternic
- Auth flow și role routing = risc HIGH — menționează înainte de patch

## EXPO SDK 54

- Verifică compatibilitatea API cu SDK 54
- Verifică compatibilitatea Android/iOS/Web
- Preferă pachete deja instalate

## PRIORITĂȚI

1. Stabilitate app
2. Funcționalitate existentă intactă
3. Firebase corect
4. Navigare sigură
5. Compatibilitate Expo SDK 54
6. Paritate web/mobile
7. Claritate cod
8. Consistență UI
