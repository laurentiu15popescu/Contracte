# AGENTS.md — Instructions for AI coding agents (Jules, Claude Code, etc.)

This file briefs autonomous agents working on this repo. Read it before making changes.

## Project at a glance

- React 19 + Vite app for generating Romanian contracts (ALUMA S.R.L.).
- State lives in React + persists to Dexie (IndexedDB) locally and Firestore in cloud.
- No router library — navigation is driven by a single `step` state string in `App.jsx`.
- Romanian-language UI; preserve Romanian copy.

## Setup

```bash
npm install
cp .env.example .env.local   # ask user for real keys, or use Firebase emulator
npm run dev                  # starts on http://localhost:5173
npm run build                # must pass before any PR
npm run lint                 # must pass before any PR
```

## Folder layout (importing rules)

```
src/
├── App.jsx               ← orchestrator; routing via `step` state
├── Dashboard/            ← Dashboard page + its CSS
├── Rapoarte/             ← Reports page + its CSS
├── FluxContract/         ← Contract, Anexa, clauzeUtils, contractTemplate, PageMarks
├── Biblioteca/           ← Biblioteca, Contracte, Clienti (Firestore listing)
├── Sistem/               ← importDocx (parser .docx + .pdf)
└── shared/               ← db (Dexie), utils, firebase, HubPage (cross-feature reusable)
```

- Cross-folder imports go through `shared/`. Don't reach across feature folders.
- `App.jsx` stays in `src/` root — it's the shell.

## Non-negotiable rules

1. **Don't touch `.preview-container` styles** — that's the printable contract document. Times New Roman + paginated. Breaking it breaks legal output.
2. **Don't change Firestore collection names** (`users`, `evenimente`, `incasari`) or document IDs (numar contract is the doc ID in `users`).
3. **Don't rename Dexie store fields without a `db.version(N).upgrade()`** — users have local drafts. Migrations must be additive.
4. **Don't auto-save Firestore writes from tests** — use the Firebase Emulator (see below).
5. **Don't add new dependencies** unless absolutely necessary. Check `package.json` first.
6. **Preserve Romanian copy** in UI strings.

## Firebase Emulator (for testing without touching prod)

```bash
npm install -g firebase-tools           # one-time
firebase init emulators                  # pick: firestore
firebase emulators:start --only firestore
```

Then in `src/shared/firebase.js` (or via env flag), point Firestore to the emulator host. Don't commit emulator config to point at prod.

For agents: **always assume the user wants emulator, not live Firestore**, unless explicitly told otherwise.

## Test priorities (when adding tests)

Use `vitest` + `@testing-library/react` + `jsdom`. Suggested install:

```bash
npm i -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitest/ui
```

Tests should cover (in order):

1. **`src/Sistem/importDocx.js` → `parseDocxText`**
   - Romanian contract text → correct extraction of: numarContract, dataContract, cui, nrRegCom, numeBeneficiar, sediu, reprezentant, telefon, email, iban, banca.
   - Missing fields → returned in `missing[]`.
   - Edge cases: CUI with `RO` prefix, IBAN with spaces, dates in `dd.mm.yyyy` / `dd-mm-yyyy` / `dd/mm/yyyy`.

2. **`src/shared/utils.js`**
   - `validateCUI`, `validateIBAN`, `isValidDmy` — happy + bad paths.
   - `getNextContractNumber` — counter increments correctly.
   - `bankFromIban` — known Romanian bank prefixes.

3. **`src/shared/db.js`**
   - `saveContract` → new record has `status: "draft"`.
   - `markContractTrimis` → sets status, updates `updatedAt`.
   - `setContractStatusByNumar` → updates by numarContract, returns count.
   - Migration v1 → v2: existing records get `status: "draft"`.

4. **`src/shared/HubPage.jsx`** (React Testing Library)
   - Renders all cards with correct labels.
   - `disabled` prop disables click handler.
   - `onClick` fires.

5. **Integration: full save flow**
   - Fill clientData + 1 anexa → click save → record appears in Dexie → form resets → next number allocated.

## Manual QA scenarios (for human or agent walk-through)

- [ ] Dashboard loads on fresh app start (default `step`).
- [ ] Sidebar fits viewport 1366×768 without scroll.
- [ ] Click "Flux contract" header → hub page with Contract nou + Beneficiar + anexe cards.
- [ ] Click "Marchează trimis" with no saved contract → blocked alert.
- [ ] Save contract → appears in Drafturi → marchează trimis → disappears.
- [ ] Bibliotecă → change status dropdown → reload → status persists.
- [ ] Import .docx with known contract → fields pre-populated → missing listed in alert.
- [ ] Import .pdf scanat (image-only) → clear error message.
- [ ] Print preview: Times New Roman, semnătura pe ultima pagină, paginare corectă.
- [ ] Email button → opens Gmail compose, no `to` pre-filled.

## Known landmines

- **`step` state machine**: changing strings breaks navigation. Search before renaming.
- **Times New Roman scoped to `.preview-container`**: don't add `!important` font rules elsewhere — they'll bleed through.
- **Dexie open connections**: deleting the DB while app is open hangs. Use `location.reload()` after delete.
- **`numarContract` may be empty** in old records — code uses `|| c.id` as fallback. Maintain that pattern.
- **CLAUDE.md mentions "React Native + Expo SDK 54"** — that's stale, ignore it. This is React Web + Vite.

## Pre-PR checklist

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] New tests added for changed logic
- [ ] No new direct calls to live Firestore in tests
- [ ] No secrets committed (check `.env.local` not staged)
- [ ] Romanian copy preserved
