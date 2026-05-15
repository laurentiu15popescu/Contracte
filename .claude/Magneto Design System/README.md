# Magneto Design System

## Overview

**MagnetoApp** is an internal React Native (Expo SDK 54 + Firebase) application built for a **photography team** that sells photo magnets at live events (concerts, weddings, etc.). It is a private, Romanian-language product.

### Products / Surfaces
1. **Mobile App (iOS & Android)** — The primary surface. Two role-based experiences:
   - **Photographer View** — Field operators log revenue, track magnet sales, view their schedule, check leaderboard rankings, and consume stock.
   - **Admin View** — Managers monitor real-time KPIs, manage events/scheduling, review team performance, handle payroll slips, manage inventory.
2. **Web App** — Same React Native codebase rendered via `react-native-web`. Used by admins on desktop.

### Source References
- **GitHub Repo:** `laurentiu15popescu/MagnetoApp` (private)  
  - Stack: React Native + Expo SDK 54 + Firebase (Firestore + Auth)
  - Key folders: `src/screens/`, `src/components/ui/`, `src/context/ThemeContext.js`, `src/navigation/`
- No Figma file was provided; the design system was reverse-engineered from source code.

---

## Content Fundamentals

### Language
The app is written entirely in **Romanian**. All UI copy, error messages, labels, section headers, and motivational messages are Romanian.

### Tone & Voice
- **Direct, motivational, informal.** The app speaks to photographers like a coach, not a corporate tool.
- **Second person ("Tu/Ești")** — "Ești pe val!", "Tu dai direcția."
- **Energetic and punchy** — short sentences, action verbs, confident assertions.
- **Warmth with professionalism** — celebratory when targets are hit (confetti cannon!), humorous in motivational quotes.
- **Emoji used sparingly** — only in motivational messages and rank indicators (🏆🥈🥉🔥🏅). Never in UI labels or form copy.
- **Casing:** Title case for section headers ("Acțiuni Rapide", "Încasări Azi"). All-caps with letter-spacing for section labels/badges. Sentence case for body copy and error messages.
- **Numbers:** Romanian format — thousands separator is `.` (dot), e.g. `1.500 RON`.

### Example Copy Patterns
| Context | Example |
|---|---|
| Greeting | "Bună dimineața, Alexandru" |
| Motivational | "Ești o mașinărie de vândut!" / "Sky is the limit!" |
| Error | "Introdu o sumă validă." / "Selectează locația." |
| Success toast | "Încasarea a fost salvată." / "Stocul a fost actualizat." |
| Empty state | "Nicio încasare azi. După ce validezi, va apărea aici." |
| Section label | "ACȚIUNI DIRECTE" / "TOP FOTOGRAFI AZI" |
| Action button | "Conectare" / "Validare Încasare" / "Salvează" |

---

## Visual Foundations

### Color System
Two complete palettes: **Light** and **Dark**. Dark mode uses a deep blue-slate base (not pure black), keeping brand warmth.

**Brand Gradient:** `#34CAE8` (cyan) → `#6366F1` (indigo/violet)  
The gradient runs left-to-right on primary action buttons and avatar borders.

See `colors_and_type.css` for full token list.

#### Key Color Roles
| Token | Light | Dark | Usage |
|---|---|---|---|
| `--color-brand` | `#6366F1` | `#7570F5` | Primary brand, borders, icons |
| `--color-accent` | `#6366F1` | `#5ED4F4` | Primary CTA buttons |
| `--color-accent-secondary` | `#34CAE8` | `#5ED4F4` | Gradient end, info color |
| `--color-bg` | `#F0F4F8` | `#0F1626` | Screen backgrounds |
| `--color-surface` | `#FFFFFF` | `#151D2E` | Cards, modals |
| `--color-success` | `#10B981` | `#34D399` | Revenue, positive states |
| `--color-danger` | `#EF4444` | `#F87171` | Errors, delete, warnings |
| `--color-warning` | `#F59E0B` | `#FBBF24` | Caution states |
| `--color-gold` | `#EAB308` | `#FACC15` | Rankings, records |

### Typography
No custom font files — the app uses the **system font stack** (San Francisco on iOS, Roboto on Android, system-ui on Web). Font weight carries all the visual hierarchy work:
- `900` — Hero numbers, primary headings
- `800` — Section headers, button labels, labels
- `700` — Body bold, list item titles
- `600` — Body medium, secondary labels
- Regular — Body text, captions

Font sizes are **scaled dynamically** using a `scaleFont()` utility tied to screen width. Base sizes: 10px (label/caption) → 13px (body) → 16–20px (h3/h2) → 24–32px (h1/big numbers).

**Closest Google Font substitutes (used in design system previews):** `Plus Jakarta Sans` (matches weight range and rounded humanist feel closest to SF Pro/Roboto).

### Spacing & Layout
- `xs: 4`, `s: 6`, `sm: 10`, `m: 12`, `l: 16`, `xl: 24`, `xxl: 32`
- Content padding: `20px` horizontal on all screens
- Section spacing: `20px` vertical between sections
- Input height: `54px` standard
- Max page width: `860px` (desktop/web)

### Border Radius
- Cards: `12px` (soft), `18–22px` (section cards), `26px` (hero cards)
- Buttons: `16px`
- Chips/badges: `999px` (pill)
- Icon circles: `12px`
- Inputs: `12–14px`

### Shadows
Three levels:
- **sm (soft):** Used on list cards, section cards. Subtle depth.
- **md:** Used on hero cards, modals. More prominent.
- **lg:** Used sparingly for floating elements.
Dark mode shadows are heavier and darker (opacity 0.42 vs 0.10 in light).

Web uses `box-shadow`; native uses `shadowColor/elevation`.

### Backgrounds
- **Light:** `#F0F4F8` — light blue-grey tint, not pure white.
- **Dark:** `#0F1626` — deep navy, rich and premium.
- **Login screen:** Full-screen linear gradient (`#f8fafc → #e0e7ff → #4f46e5` light; `#0f172a → #1e1b4b → #312e81` dark) with large blurred blob shapes (circles with brand/accent colors, low opacity) for visual interest.
- **No repeating patterns, textures, or full-bleed images** in the main app UI.
- **No illustration** (UI is purely typographic + icon-based).

### Cards
Three card variants:
1. **Default / Elevated** (`cardStyle`): White bg, `12px` radius, `1px` border, medium shadow.
2. **Soft** (`softCardStyle`): Same but softer shadow.
3. **Hero card** (`heroCard`): `26px` radius, `22px` padding, stronger shadow. Used for dashboard headers.
4. **Section card** (`sectionCard`): `22px` radius, `18px` padding, soft shadow.
5. **Muted card**: `surfaceHighlight` background, no shadow.

### Buttons
See `AppButton` component. Variants:
- **gradient** — Brand gradient fill, strong indigo shadow. Primary CTA.
- **primary** — Solid accent color fill.
- **secondary** — `#EEF3FF` fill, subtle border.
- **ghost** — Transparent, border only.
- **danger** — Red tint bg, red text.
- **success** — Green fill.
- **warning** — Amber fill.

Press animation: `scale(0.965)` spring, `bounciness: 0` on press-in; `scale(1)` spring `bounciness: 4` on release. Subtle tactile feel.

### Animations & Interactions
- **Spring press:** Cards and buttons scale down to `0.97` on press, spring back to `1`.
- **Login entry:** Fade + translateY spring animation on mount.
- **Toast notifications:** Fade in/out via `Animated.sequence`.
- **Confetti cannon:** Triggered when a photographer hits their monthly target.
- **No page transition animations** beyond React Navigation defaults.
- **Hover states (web):** Not explicitly coded — relies on native browser behavior.

### Icons
Uses **`@expo/vector-icons`** which bundles multiple icon families:
- `Ionicons` — Most common. Used for nav, general UI, input icons.
- `FontAwesome5` — Used for business/finance icons (trophy, boxes, invoice).
- `MaterialIcons` — Used in admin stat cards (attach-money, event-available).
- `MaterialCommunityIcons` — Occasional use.

Icon sizes: `xs: 16`, `sm: 18`, `md: 20`, `lg: 24`, `xl: 32`.

Icon colors always match the semantic context (brand/accent/success/danger/warning/gold).

### Status Chips / Badges
Pill-shaped (`radius: 999`), colored backgrounds with matching text. Five variants: success, warning, danger, info, neutral. Used for event status, payment methods, role indicators.

### Color Vibe of Imagery
No photography or illustration in the UI. The visual identity is purely typographic + icon-driven, with color as the primary differentiator.

### Transparency & Blur
- Used sparingly on login card (`rgba(255,255,255,0.85)` in light, `rgba(30,41,59,0.6)` in dark).
- `expo-blur` is in the dependency list but used rarely.
- Surface overlays use semi-transparent brand colors (e.g., `brand + '18'` for badge backgrounds).

---

## Iconography

The app uses **@expo/vector-icons** (CDN: `https://unpkg.com/@expo/vector-icons`) which bundles:
- `Ionicons` (v5/v7 style) — primary icon set
- `FontAwesome5`
- `MaterialIcons`
- `MaterialCommunityIcons`

No custom SVG icons. No icon sprites. No PNG icons in UI. No emoji in UI (only in motivational message text strings).

Key icons by context:
| Context | Icon | Library |
|---|---|---|
| Dashboard/Home | `home` | Ionicons |
| Revenue/Money | `hand-holding-usd`, `file-invoice-dollar` | FontAwesome5 |
| Revenue (admin) | `attach-money` | MaterialIcons |
| Calendar/Events | `calendar`, `event-available` | Ionicons / MaterialIcons |
| Notifications | `notifications-outline` | Ionicons |
| Settings | `settings-outline` | Ionicons |
| Dark mode | `moon` / `sunny` | Ionicons |
| Logout | `power` | Ionicons |
| Trophy/Rank | `trophy`, `medal` | FontAwesome5 / Ionicons |
| Inventory | `box-open`, `boxes` | FontAwesome5 |
| Location | `location`, `location-outline` | Ionicons |
| WhatsApp report | `logo-whatsapp` | Ionicons |
| Edit | `create-outline` | Ionicons |
| Close | `close-circle` | Ionicons |
| Add | `add-circle` | Ionicons |
| Check | `checkmark` | Ionicons |
| Email | `mail` | Ionicons |
| Lock | `lock-closed` | Ionicons |
| Eye toggle | `eye` / `eye-off` | Ionicons |

Logo: `assets/logo_magneto.png` — white/dark circular logo mark.  
App icon: `assets/icon.png` — square app icon with brand colors.

---

## File Index

```
README.md                    ← This file
colors_and_type.css          ← Full CSS token system (colors + typography)
SKILL.md                     ← Agent skill descriptor

assets/
  logo_magneto.png           ← Primary brand logo
  icon.png                   ← App icon
  adaptive-icon.png          ← Android adaptive icon
  img_avatar.png             ← Default avatar placeholder

preview/
  colors-brand.html          ← Brand & accent color swatches
  colors-semantic.html       ← Semantic color swatches (success/danger/warning/info)
  colors-surface.html        ← Surface, background, border colors
  colors-chips.html          ← Status chip color system
  type-scale.html            ← Typography scale specimen
  type-weights.html          ← Font weight showcase
  spacing-tokens.html        ← Spacing & radius tokens
  shadows.html               ← Shadow system
  buttons.html               ← Button variants (all 7)
  inputs.html                ← Form input states
  cards.html                 ← Card variants
  badges.html                ← Status badges & chips
  stat-card.html             ← KPI StatCard component
  quick-action-tile.html     ← QuickActionTile component
  logo.html                  ← Logo & brand mark

ui_kits/
  app/
    README.md                ← UI kit documentation
    index.html               ← Interactive app prototype (Photographer + Admin views)
    components/
      Theme.jsx              ← Theme tokens & context
      AppButton.jsx          ← Button component
      StatusBadge.jsx        ← Badge/chip component
      StatCard.jsx           ← KPI card component
      FormInput.jsx          ← Input component
      QuickActionTile.jsx    ← Action tile component
```
