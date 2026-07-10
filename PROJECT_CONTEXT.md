# PROJECT CONTEXT — ALUMA Contracte

> Lipește acest fișier la începutul unui chat nou ca să înțelegi proiectul fără explicații suplimentare.

## Ce este
Aplicație internă de **management contracte** pentru firma **ALUMA S.R.L.** (1–2 utilizatori, un singur fotograf).
UI integral în **limba română**. Generează contracte + anexe, le previzualizează ca document A4, exportă PDF/Word/Excel, trimite pe email, ține evidența drafturilor și statusurilor.

## Stack real
- **Frontend:** React 19 + Vite 8 (SPA). Fără TypeScript, fără React Router (navigare prin state `step`).
- **Backend:** Firebase — Auth (email/parolă) + Firestore (cu `persistentLocalCache` offline).
- **Desktop:** Electron + electron-builder + electron-updater (auto-update Win/Mac). Entry `electron/main.cjs`.
- **Web:** Firebase Hosting → `alumacontracte.web.app`. Proiect Firebase: `alumacontracte`.
- **Excel:** `xlsx` (SheetJS) ~425KB, dynamic import (nu intră în bundle principal).
- **Monitorizare:** `@sentry/react` (inert până se setează `VITE_SENTRY_DSN`).
- `dexie` în deps dar **legacy/neutilizat** (persistența integral în Firestore).

## Structură (`src/`, organizare pe feature)
- `main.jsx` — entry; `Sentry.ErrorBoundary > DialogProvider > AuthGate > App`.
- `App.jsx` — **monolitul central** (~2300 linii): state navigare (`step`), `clientData`/`anexe`,
  acțiuni (save, PDF, Word, Excel, email, ANAF), drawer mobil, **bara flux-tabs sticky**, auto-save.
- `shared/`
  - `firebase.js` — init; `initializeFirestore` cu cache persistent; `setPersistence(browserLocalPersistence)`.
  - `db.js` — TOT accesul Firestore. **Schema V1 (legacy)** și **V2 (curentă)** coexistă cu sufix `V2`.
  - `excelExport.js` — export xlsx (3 funcții: all / contracte filtrate / beneficiari filtrați / rapoarte filtrate).
  - `migrateToV2.js` — one-shot migrare V1→V2 (idempotentă). Accesibilă din Setări/Contul Meu.
  - `AuthGate.jsx`, `utils.js` (`validateCUI`, `validateCNP`, normalizări), `Dialog.jsx` (Promise-based),
    `HubPage.jsx`, `EditableField.jsx`, `Icon.jsx` (set SVG `currentColor`, stroke 1.5).
- `FluxContract/` — `Contract.jsx`, `Anexa.jsx`, `contractTemplate.jsx`, `clauzeUtils.jsx`,
  `PageMarks.jsx` (randare A4 + clauze + paginare print).
- `Biblioteca/` — `Modele.jsx`, `Contracte.jsx`, `Clienti.jsx`, `Biblioteca.jsx`.
- `Sistem/` — `ContSetari.jsx` (cont + buton migrare V2 + log), `importDocx.js`.
- `Dashboard/`, `Rapoarte/` — statistici (citesc din schema V2).

## Date (Firestore) — schema CURENTĂ V2

> Migrarea V1 → V2 a fost rulată; aplicația citește acum din V2.
> `salveazaContract` în App.jsx face **dual-write** (legacy + V2) best-effort.

**Colecții V2 (sursa de adevăr):**
- `contracte/{numarContract}` — document principal contract. Câmpuri: `numarContract, dataContract, cui,
  numeBeneficiar, numeBeneficiarLower, total, totalIncasat, totalDatorat, nrAnexe, clientData (snapshot
  complet), status (draft/trimis/semnat/finalizat), dataTrimisLaSemnat, dataSemnare, createdAt, updatedAt,
  deleted (soft)`. ID-ul = `numarContract` sanitizat (slash → `-`).
- `contracte/{nr}/anexe/{Ai}` — subcolecție. ID `A1, A2, ...`. Câmpuri: `anexaIndex, eventData, budgetData,
  sumaServicii, incasata, dataIncasare, sumaIncasata, nrFactura, dataFactura, updatedAt`.
- `beneficiari/{cui}` — agregat pe client (auto-recompute la save contract). Câmpuri: profil + `nrContracte,
  totalServicii, totalIncasat, totalDatorat, primulContract, ultimulContract`.
- `modele/{hashClauze}` — modele de contract (FNV-1a hash pentru deduplicare).
- `users/{uid}` — **DOAR profil auth** (email/telefon). Old snapshot `users/{nr}` a fost eliminat din save
  și șters manual din Console. *Niciodată* nu se mai scrie aici cu nr de contract.

**Colecții legacy (încă populate de save-ul vechi, citite la deschidere contract):**
- `drafturi/{randomId}` — drafturi (draft + trimise), soft-delete `deleted:true`. `subscribeDrafturi`
  încă folosit pentru tracking modificări locale. Fallback când nu există `numarContract`.
- `statusContracte/{nr}` — status (legacy, redundant cu `contracte/{nr}.status`).
- `evenimente/{nr_Ai}`, `incasari/{nr_Ai}` — date anexe (redundant cu `contracte/{nr}/anexe/{Ai}`).

Reguli: doar utilizatori autentificați. **Deploy reguli MANUAL** (`firebase deploy --only firestore:rules`).

## Funcționalități cheie

### Bara de tab-uri Flux contract (`.flux-tabs`)
Sticky în content, editorial folder-tab aesthetic, accent **terracotta** (`#B86A45`) local — separat de
indigo-ul global. `[Beneficiar] [A1] [A2] [A3] [A4] [A5] [▼ N] [+]` — fereastră de 5 + dropdown overflow.
Anexa activă mereu vizibilă. Mono (`Geist Mono`) pentru indici.

### Bifa „servicii videografice"
- Per anexă: `eventData.includeVideo` — schimbă text-ul anexei.
- La nivel de contract: `clientData.includeVideo` — forțează „și videografice" în clauzele contractului.
- `anyVideo` pasat la `<Contract>` = `clientData.includeVideo || anexe.some(a => a.eventData.includeVideo)`.

### Auto-save (în preview)
1. **Generează → save inițial silent** (fire-and-forget).
2. **Edit în editMode → debounce 2s** (clauze, dată).
3. **Descarcă/Printează/Word/Email/Back → flush sincron** (anulează debounce-ul pending, save înainte de acțiune).
4. **Indicator vizual „· nesalvat"** în bara preview (chip cremos warning) — apare când e dirty, dispare după save.

### Export Excel (dynamic import xlsx)
- **Sistem hub → „Export Excel"** (verde Excel `#1F7A3B`, cu confirmare) — workbook complet 3 sheet-uri.
- **Bibliotecă/Contracte** + **Bibliotecă/Clienți** + **Rapoarte** — buton `.btn-excel` cu sub-label
  „Filtru: «...»" lângă. Exportă lista filtrată.
- Auto-filter, lățimi calculate, format dată zz-ll-aaaa, numere ca Number (sumabile în Excel).

### Backup DB (`exportAll`/`importAll`)
- Export: `version: 2` cu `contracte` (inclusiv subcolecția `anexe` inline) + `beneficiari` + `modele`.
- Import: detectează `version`. `v ≥ 2` → restore în V2 cu `setDoc` (idempotent, ID-uri stabile).
  `v = 1` → fallback legacy în `drafturi` cu `addDoc` (păstrează compat cu backup-uri vechi).

### Sidebar
- Brand sticky-top + user-chip sticky-bottom; zona din mijloc scrollabilă.
- Sub `Flux contract`: doar `Editor contract` (cu badge nr anexe) + `Contract nou`.
- Sub `Sistem`: Export/Import JSON, Backup/Restore DB, Import .docx/PDF, Contul meu. **NU mai are** „Contract nou" (e în Flux).

## Versionare
- Versiunea din `package.json` e injectată la build prin `vite define: __APP_VERSION__`.
- Afișată în sidebar (`brand-sub`). Bump pe `package.json` → automat reflectat.
- Release: bump version → commit → tag `vX.Y.Z` → push origin main + tag → CI Electron/Hosting pornește.

## Fluxuri principale
1. Date client → ANAF auto-fetch pe CUI firmă (CNP nu declanșează) → contract + anexe.
2. Preview A4 (`.preview-container` / `.document-page`) → selecție print (contract / o anexă / tot).
3. Export: **Descarcă PDF** (window.print() native + slicing canvas pentru variant html2canvas),
   **Export Word** (html-to-docx), **Email** (PDF + mailto), **Printează**.
4. Save → V2 contracte/{nr} + V2 anexe + recompute beneficiari + legacy drafturi/evenimente/incasari (dual-write).

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
- **Workflow propunere → confirmare → aplicare** la cereri non-triviale. Utilizatorul scrie de obicei
  „nu aplici, doar propuneri" sau „confirmi nu aplici" — așteaptă OK explicit înainte de a edita.
- **Release doar la cererea explicită**. Nu bump-ui versiunea după fiecare commit.

## Variabile de mediu (`.env`, fără valori în repo)
`VITE_FIREBASE_API_KEY`, `..._AUTH_DOMAIN`, `..._PROJECT_ID`, `..._STORAGE_BUCKET`,
`..._MESSAGING_SENDER_ID`, `..._APP_ID`, `..._MEASUREMENT_ID`, opțional `VITE_SENTRY_DSN`.
