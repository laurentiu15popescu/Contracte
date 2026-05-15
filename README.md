# ALUMA Contracte

Aplicație web pentru generarea, gestionarea și arhivarea contractelor cadru și a anexelor pentru ALUMA S.R.L.

## Stack

- **Frontend**: React 19 + Vite
- **Local DB**: Dexie (IndexedDB) — drafturi și backup
- **Cloud**: Firebase Firestore (`users`, `evenimente`, `incasari`)
- **Import documente**: mammoth (.docx) + pdfjs-dist (.pdf cu text, fără OCR)
- **Fonturi**: Geist + Instrument Serif + Geist Mono (Google Fonts) pentru UI; Times New Roman pentru preview-ul printabil

## Setup

```bash
npm install
cp .env.example .env.local   # completează cu cheile tale Firebase
npm run dev
```

Aplicația pornește pe `http://localhost:5173`.

## Scripturi

| Comandă | Descriere |
| --- | --- |
| `npm run dev` | Vite dev server cu hot-reload |
| `npm run build` | Build de producție în `dist/` |
| `npm run preview` | Servește build-ul local |
| `npm run lint` | Rulează ESLint |

## Structură folder

```
src/
├── App.jsx, App.css, main.jsx       ← shell global, routing prin state `step`
├── Dashboard/                        ← pagina dashboard cu KPI și acțiuni rapide
├── Rapoarte/                         ← rapoarte agregate Firestore
├── FluxContract/                     ← flux principal: Contract + Anexa + clauze
├── Biblioteca/                       ← listare Contracte / Clienți din Firestore
├── Sistem/                           ← utilități: import .docx/.pdf
└── shared/                           ← cross-feature: db (Dexie), utils, firebase, HubPage
```

## Funcționalități cheie

- Generator contract cu numerotare automată, BNR converter, validare CUI/IBAN
- Anexe multiple per contract, fiecare cu eveniment + buget
- Drafturi salvate local cu status: `draft → trimis → semnat → finalizat`
- Import `.docx` / `.pdf` cu extragere automată (CUI, IBAN, nr. reg. com., etc.)
- Print / PDF prin browser print dialog
- Email prin Gmail compose (PDF atașat manual după print)
- Export / Import JSON + backup integral Dexie

## Date sensibile

- Cheile Firebase Web sunt în `.env.local` (gitignored). `.env.example` arată formatul.
- Cheile API Firebase Web sunt **publice prin design** — securitatea reală e în **Firestore Security Rules**.

## Înainte de producție

1. Configurează Firestore Security Rules (poate fi încă în test mode → public!).
2. Activează backup automat pe Firestore.
3. Verifică quotas Firestore + Analytics.
4. Adaugă Error Boundary global.
5. Rulează test suite (vezi `AGENTS.md`).
