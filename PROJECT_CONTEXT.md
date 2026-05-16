# PROJECT CONTEXT — ALUMA Contracte

> Lipește acest fișier la începutul unui chat nou ca să înțelegi proiectul fără explicații suplimentare.

## ⚠️ Avertisment important
`.claude/CLAUDE.md` din acest repo descrie **alt proiect** ("MagnetoApp", React Native + Expo).
**Ignoră acel conținut tehnic.** Aplicația reală este descrisă mai jos: **NU e React Native, NU e Expo**.
Regulile generale de lucru (patch minim, fără refactor neaprobat) rămân valabile.

## Ce este
Aplicație internă de **management contracte** pentru firma **ALUMA S.R.L.**
UI integral în **limba română**. Utilizator: personal ALUMA (nu public).
Generează contracte + anexe, le previzualizează ca document A4, exportă PDF/Word,
trimite pe email, ține evidența drafturilor și a statusurilor.

## Stack real
- **Frontend:** React 19 + Vite 8 (SPA). Fără TypeScript, fără React Router (navigare prin state `step`).
- **Backend:** Firebase — Auth (email/parolă) + Firestore.
- **Desktop:** Electron + electron-builder + electron-updater (auto-update Win/Mac).
  - Entry: `electron/main.cjs` (`.cjs` pentru că `package.json` are `"type":"module"`).
- **Web:** Firebase Hosting → `alumacontracte.web.app` (rewrite SPA). Proiect Firebase: `alumacontracte`.
- **Monitorizare:** `@sentry/react` (inert până se setează `VITE_SENTRY_DSN`).
- `dexie` apare în dependencies dar e **legacy/neutilizat** (persistența s-a mutat integral în Firestore).

## Structură (`src/`, organizare pe feature)
- `main.jsx` — entry; montează `Sentry.ErrorBoundary > DialogProvider > AuthGate > App`.
- `App.jsx` — **monolitul central**: state de navigare (`step`), starea contractului
  (`clientData`, `anexe`, `currentContractId`), acțiuni (save, PDF, Word, email, ANAF), drawer mobil.
- `shared/`
  - `firebase.js` — init Firebase; `initializeFirestore` cu `persistentLocalCache` (offline);
    `setPersistence(browserLocalPersistence)`.
  - `db.js` — TOT accesul Firestore (vezi „Date" mai jos). Semnături stabile.
  - `AuthGate.jsx` — login (logo, show/hide parolă, „ține-mă minte", reset pe email, sesiune 7 zile).
  - `utils.js` — `validateCUI`, `validateCNP` (checksum mod 11), formatări, date.
  - `Dialog.jsx` — `alert/confirm` custom (Promise-based). `HubPage.jsx` — pagini-hub. `EditableField.jsx`.
- `FluxContract/` — `Contract.jsx`, `Anexa.jsx`, `contractTemplate.jsx`, `clauzeUtils.jsx`,
  `PageMarks.jsx`: randarea documentului A4 + clauze + paginare print.
- `Biblioteca/` — `Modele.jsx` (modele de contract), `Contracte.jsx`, `Clienti.jsx`, `Biblioteca.jsx`.
- `Sistem/` — `ContSetari.jsx` (cont: parolă/email/telefon), `importDocx.js`.
- `Dashboard/`, `Rapoarte/` — statistici și rapoarte.

## Date (Firestore)
Reguli: doar utilizatori autentificați (`request.auth != null`). **Deploy reguli MANUAL**
(`firebase deploy --only firestore:rules`) — niciodată în CI.

Colecții:
- `drafturi` — contracte (draft + trimise). `saveContract` addDoc/updateDoc; `status` (draft/trimis/...).
  **Soft-delete**: `deleteContract` setează `deleted:true` (recuperabil cu `restoreContract`,
  ștergere definitivă doar cu `purgeContract`). Listele filtrează `!deleted`.
  `subscribeDrafturi` = listă în timp real (onSnapshot).
- `modele` — modele de contract; doc id = `hashClauze` (FNV-1a, deduplicare).
- `statusContracte/{numarContract}` — sursa de adevăr pentru status.
- `users/{uid}` — profil (telefon etc.). Auth gestionează email/parolă separat.

## Fluxuri principale
1. Date client → ANAF auto-fetch (doar CUI firmă; CNP-ul nu declanșează ANAF) → contract + anexe.
2. Preview A4 (`.preview-container` / `.document-page`) → selecție print (contract / o anexă / tot).
3. Export: **Descarcă PDF** (jspdf+html2canvas), **Export Word** (html-to-docx), **Trimite email**
   (PDF + mailto; share pe mobil), **Printează**.
4. Salvare → `drafturi` + `statusContracte`. Avertizare `beforeunload` dacă există modificări nesalvate.

## Comenzi
- Dev web: `npm run dev` · Build: `npm run build` · Lint: `npm run lint`
- Electron dev: `npm run electron:dev` · Build desktop: `npm run electron:build:win` / `:mac`
- Deploy web: push pe `main` → GitHub Actions `firebase-hosting.yml`
- Release desktop: tag `v*` → `release.yml` (Win+Mac, serial, `max-parallel:1`)
- Reguli Firestore (manual): `firebase deploy --only firestore:rules`
- Backup: vezi `docs/BACKUP_FIRESTORE.md` (PITR + backup zilnic)

## Reguli de lucru
- Patch minim, păstrează structura și UI; fără refactor de arhitectură fără aprobare.
- Nu redenumi colecții/câmpuri Firestore fără confirmare.
- Nu adăuga pas de deploy reguli Firestore în CI.
- Paritate web ↔ desktop (Electron e tot Chromium; cod web compatibil).
- Răspuns tehnic, concis, în română.

## Variabile de mediu (`.env`, fără valori în repo)
`VITE_FIREBASE_API_KEY`, `..._AUTH_DOMAIN`, `..._PROJECT_ID`, `..._STORAGE_BUCKET`,
`..._MESSAGING_SENDER_ID`, `..._APP_ID`, `..._MEASUREMENT_ID`, opțional `VITE_SENTRY_DSN`.
