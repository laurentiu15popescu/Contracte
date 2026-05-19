# Claude Rules — ALUMA Contracte

> Context tehnic complet: vezi `PROJECT_CONTEXT.md` din rădăcina repo.
> (Versiunile vechi ale acestui fișier descriau alt proiect — „MagnetoApp/Expo". Ignoră orice referire la React Native/Expo.)

## Proiect
Aplicație internă de management contracte pentru ALUMA S.R.L. UI în limba română.
Stack: **React 19 + Vite 8** (SPA, fără TypeScript, fără React Router — navigare prin state).
Backend: **Firebase** (Auth email/parolă + Firestore). Desktop: **Electron** (electron-builder + electron-updater). Web: **Firebase Hosting** (`alumacontracte.web.app`). Monitorizare: `@sentry/react`.

## Scop
Construiește, repară și stabilizează aplicația cu regresii minime, consum minim de tokeni și respect maxim pentru codul existent.

## 1. Sursa de adevăr
Folosește doar: codul din repo, fișierele furnizate, `package.json`, cerințele explicite din chat.
Dacă lipsește ceva, spune exact: **„Nu pot confirma din input."** și cere strict piesa minimă lipsă.
Nu inventa fișiere, funcții, colecții/câmpuri Firestore, cerințe sau erori.
Dacă chat-ul intră în conflict cu codul curent, prevalează codul curent.

## 2. Moduri de lucru
- **BUILD**: implementează pas cu pas, păstrează arhitectura și UI, cea mai mică implementare corectă.
- **FIX**: identifică cauza-rădăcină (nu doar simptomul), patch minim sigur, păstrează comportamentul din afara bug-ului.
- **REVIEW**: judecă critic siguranța, fără regresii, versiune finală minimă corectată.

## 3. Reguli non-negociabile
- Patch minim; nu rescrie fișiere mari fără necesitate.
- Păstrează structura, funcționalitatea și UI existente.
- Fără refactor de arhitectură fără aprobare (explică de ce e necesar, riscul, apoi oprește-te și așteaptă).
- Nu adăuga librării dacă nu e necesar. Nu face „cleanup" nelegat de task.

## 4. Firebase / Firestore
- Nu redenumi colecții/câmpuri fără confirmare. Nu presupune schema sau regulile.
- Colecții: `drafturi` (soft-delete via `deleted:true`), `modele` (id=hashClauze), `statusContracte/{nr}`, `users/{uid}`.
- Auth (email/parolă) e separat de profilul Firestore. Tratează stările loading/empty/missing-doc.
- **Regulile Firestore se deployează MANUAL** (`firebase deploy --only firestore:rules`) — niciodată pas în CI.

## 5. Cod & livrare
- Fișier mic/mediu: poți livra fișierul final dacă scopul e local și sigur.
- Fișier mare: patch exact (cale + snippet exact de găsit + snippet de înlocuit), copy-paste ready.
- Dacă se schimbă importurile, arată explicit ce se adaugă/scoate.
- Fără pseudocod parțial.

## 6. Debug
Cauză probabilă → verifică importuri, flux state, async, apeluri Firebase, paritate web/desktop (Electron = Chromium).
Dacă sunt mai multe cauze, spune-o pe cea mai probabilă și patch-uiește doar aceea.

## 7. Niveluri de risc (clasifică intern înainte de patch)
- **Low**: fix import, guard/null check, condiție, state local.
- **Medium**: logică query, flux state, lifecycle, comportament condiționat de platformă.
- **High**: auth, routing pe rol, presupuneri schema Firestore, utilitar shared folosit în multe locuri.
Anunță scurt dacă e Medium/High înainte de patch.

## 8. Output
Răspuns tehnic, concis, profesional, în română. Fără explicații inutile, fără repetarea promptului.
Format scurt pentru task-uri mici. Pentru REVIEW: e sigur? · ce e corect · ce e riscat · versiune finală minimă · ce testez.

## 9. Comportament
Critic, nu de complezență. Cea mai mică corecție sigură. Fără over-engineering, fără arhitectură improvizată.
Nu ascunde incertitudinea. Dacă lipsește info, cere un singur lucru minim. Dacă se poate face sigur din input curent, fă-o direct.

## 10. Priorități
1. stabilitate · 2. păstrarea funcționalității · 3. comportament Firebase corect · 4. paritate web/desktop · 5. claritate cod · 6. consistență UI.
Viteza contează, corectitudinea mai mult.
