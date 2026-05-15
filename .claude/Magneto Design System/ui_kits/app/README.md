# MagnetoApp UI Kit

High-fidelity recreation of the MagnetoApp React Native interface as a web prototype.

## Products Covered
- **Photographer View** — Field operator home screen with revenue entry, stats, and schedule
- **Admin View** — Dashboard with KPIs, leaderboard, quick actions, and navigation

## Usage
Open `index.html` for the full interactive prototype.

## Components
- `Theme.jsx` — Color tokens, typography, spacing (mirrors ThemeContext.js)
- `AppButton.jsx` — All 7 button variants with press animation
- `StatusBadge.jsx` — Status chips/badges
- `StatCard.jsx` — KPI card with left color strip
- `FormInput.jsx` — Text input with focus/error/disabled states
- `QuickActionTile.jsx` — Icon tile for action grids

## Design Notes
- Fonts: Plus Jakarta Sans (closest match to SF Pro used in app)
- Icons: Inline SVGs matching Ionicons / FontAwesome5 / MaterialIcons shapes
- Colors: Sourced directly from ThemeContext.js LightColors / DarkColors
- Interactions: Spring press animations mirroring React Native Animated behavior
- Language: Romanian (matches production app)
