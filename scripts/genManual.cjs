/* Generator manual de utilizare (.docx) — Contracte APP / ALUMA
   Rulează: node scripts/genManual.cjs
   Sursă de adevăr: codul aplicației (nu se inventează funcții). */
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, PageBreak, ShadingType,
} = require("docx");

const BRAND = "6366F1";
const INK = "1A1A1A";
const MUTED = "6B6375";

const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 320, after: 160 }, children: [new TextRun({ text: t, bold: true, color: BRAND, size: 30 })] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 }, children: [new TextRun({ text: t, bold: true, color: INK, size: 25 })] });
const H3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 180, after: 90 }, children: [new TextRun({ text: t, bold: true, color: INK, size: 22 })] });
const P = (t, opts = {}) => new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: t, size: 21, color: opts.muted ? MUTED : INK, italics: !!opts.i, bold: !!opts.b })] });
const LI = (t) => new Paragraph({ bullet: { level: 0 }, spacing: { after: 60 }, children: [new TextRun({ text: t, size: 21, color: INK })] });
const NUM = (t, ref) => new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 60 }, children: [new TextRun({ text: t, size: 21, color: INK })] });
const CODE = (t) => new Paragraph({
  spacing: { after: 80, before: 40 },
  shading: { type: ShadingType.CLEAR, fill: "F4F3EC" },
  children: [new TextRun({ text: t, font: "Consolas", size: 19, color: "08060D" })],
});
const SPACER = () => new Paragraph({ children: [new TextRun({ text: "" })] });

const cell = (t, opts = {}) => new TableCell({
  width: { size: opts.w || 50, type: WidthType.PERCENTAGE },
  shading: opts.head ? { type: ShadingType.CLEAR, fill: BRAND } : undefined,
  margins: { top: 60, bottom: 60, left: 90, right: 90 },
  children: [new Paragraph({ children: [new TextRun({ text: t, bold: !!opts.head, color: opts.head ? "FFFFFF" : INK, size: 20 })] })],
});
const table = (headers, data) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  borders: {
    top: { style: BorderStyle.SINGLE, size: 2, color: "D9D9D9" },
    bottom: { style: BorderStyle.SINGLE, size: 2, color: "D9D9D9" },
    left: { style: BorderStyle.SINGLE, size: 2, color: "D9D9D9" },
    right: { style: BorderStyle.SINGLE, size: 2, color: "D9D9D9" },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "E5E4E7" },
    insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "E5E4E7" },
  },
  rows: [
    new TableRow({ tableHeader: true, children: headers.map((h, idx) => cell(h, { head: true, w: 100 / headers.length })) }),
    ...data.map((r) => new TableRow({ children: r.map((c) => cell(String(c), { w: 100 / headers.length })) })),
  ],
});

const children = [];

/* ---------- COPERTĂ ---------- */
children.push(
  new Paragraph({ spacing: { before: 2600, after: 200 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ALUMA S.R.L.", bold: true, size: 28, color: MUTED })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: "Aplicația Contracte", bold: true, size: 56, color: BRAND })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: "Manual de utilizare", size: 32, color: INK })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 1400 }, children: [new TextRun({ text: "Document de predare către beneficiar", italics: true, size: 22, color: MUTED })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Versiune aplicație: 1.0.1", size: 20, color: MUTED })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Web: https://alumacontracte.web.app", size: 20, color: MUTED })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Desktop: Windows și macOS", size: 20, color: MUTED })] }),
  new Paragraph({ children: [new PageBreak()] }),
);

/* ---------- CUPRINS ---------- */
children.push(H1("Cuprins"));
[
  "1. Despre aplicație",
  "2. Cum accesezi aplicația (Web / Desktop)",
  "3. Autentificare și securitate",
  "4. Contul meu (parolă, email, telefon)",
  "5. Structura interfeței și navigarea",
  "6. Dashboard (Panou de control)",
  "7. Flux contract (creare contract + anexe)",
  "8. Editarea clauzelor și modele de contract",
  "9. Export PDF / Word și import documente",
  "10. Bibliotecă (Contracte, Clienți, Modele)",
  "11. Rapoarte",
  "12. Sistem (backup, import/export, cont)",
  "13. Date în cloud (Firebase)",
  "14. Instalare pe Windows",
  "15. Instalare pe macOS",
  "16. Actualizări (update-uri) și comenzi",
  "17. Depanare rapidă (probleme frecvente)",
].forEach((t) => children.push(P(t)));
children.push(new Paragraph({ children: [new PageBreak()] }));

/* ---------- 1 ---------- */
children.push(H1("1. Despre aplicație"));
children.push(P("Aplicația Contracte este instrumentul intern ALUMA pentru întocmirea, gestionarea și urmărirea contractelor de prestări servicii fotografice și a anexelor aferente (comenzi ferme per eveniment)."));
children.push(P("Cu ea poți: genera contracte și anexe formatate profesional, le poți exporta în PDF sau Word, urmări termene de predare și încasare, analiza veniturile pe luni, păstra o bibliotecă de clienți și modele de contract, și sincroniza totul în cloud."));
children.push(P("Aplicația există în două forme, cu aceleași funcții:"));
children.push(LI("Versiune Web — se deschide în browser, fără instalare."));
children.push(LI("Versiune Desktop — aplicație instalabilă pe Windows și macOS, cu actualizare automată."));

/* ---------- 2 ---------- */
children.push(H1("2. Cum accesezi aplicația"));
children.push(H3("Versiunea Web"));
children.push(P("Deschide în browser (Chrome, Edge, Safari) adresa:"));
children.push(CODE("https://alumacontracte.web.app"));
children.push(P("Recomandat pentru acces rapid de pe orice dispozitiv. Funcționează și pe telefon."));
children.push(H3("Versiunea Desktop"));
children.push(P("Se instalează o singură dată (vezi capitolele 14 și 15). Pornește ca orice aplicație și se actualizează singură."));

/* ---------- 3 ---------- */
children.push(H1("3. Autentificare și securitate"));
children.push(P("La pornire apare ecranul de logare cu siglă. Introdu emailul și parola contului."));
children.push(H3("Funcții pe ecranul de logare"));
children.push(LI("Arată / Ascunde parola — buton care comută vizibilitatea parolei."));
children.push(LI("Mascare inteligentă — în timpul tastării, doar ultimul caracter introdus rămâne vizibil ~1 secundă, apoi se ascunde."));
children.push(LI("Ține-mă minte pe acest dispozitiv — bifează pentru a precompleta automat emailul și parola la următoarea deschidere pe acel calculator."));
children.push(LI("Ai uitat parola? — trimite pe email un link de resetare a parolei (verifică și folderul Spam)."));
children.push(H3("Sesiune păstrată"));
children.push(P("După logare, contul rămâne conectat pe dispozitiv timp de 7 zile (fără să te delogi). După 7 zile de la ultima autentificare, aplicația cere din nou logarea, pentru securitate."));
children.push(P("Apăsarea butonului „Ieșire” (roșu, în colțul de jos al meniului lateral) te deconectează imediat.", { muted: true }));
children.push(new Paragraph({ spacing: { after: 120 }, shading: { type: ShadingType.CLEAR, fill: "FFF8E1" }, children: [new TextRun({ text: "Atenție: „Ține-mă minte” salvează parola pe acel calculator. Folosește opțiunea doar pe dispozitive personale, nu pe calculatoare partajate.", size: 20, color: "8A6D1F" })] }));

/* ---------- 4 ---------- */
children.push(H1("4. Contul meu"));
children.push(P("Acces: meniul lateral → secțiunea Sistem → „Contul meu” (sau din pagina hub Sistem)."));
children.push(P("Pagina are trei zone:"));
children.push(H3("Schimbă parola"));
children.push(NUM("Introdu parola curentă.", "n"));
children.push(NUM("Introdu parola nouă (minim 6 caractere).", "n"));
children.push(NUM("Opțional bifează „Arată parolele” pentru verificare, apoi „Salvează parola”.", "n"));
children.push(H3("Schimbă emailul de logare"));
children.push(P("Introdu parola curentă și noul email. Vei primi un email de confirmare la noua adresă; emailul de logare se schimbă efectiv DUPĂ ce confirmi din acel mesaj."));
children.push(H3("Număr de telefon"));
children.push(P("Introdu numărul de telefon și „Salvează telefonul”. Este salvat ca dată de contact a contului (nu este folosit pentru autentificare prin SMS)."));

/* ---------- 5 ---------- */
children.push(H1("5. Structura interfeței și navigarea"));
children.push(P("Interfața are un meniu lateral (stânga) și zona de conținut (dreapta), cu o bară de căutare sus."));
children.push(H3("Meniul lateral — secțiuni"));
children.push(table(["Secțiune", "Conține"], [
  ["Panou", "Dashboard, Rapoarte"],
  ["Flux contract", "Contract nou, Beneficiar (pasul 1), Anexele 1..N, Adaugă anexă, Marchează trimis"],
  ["Bibliotecă", "Contracte, Clienți, Modele"],
  ["Sistem", "Contract nou, Export JSON, Import JSON, Backup DB, Restaurează backup, Import .docx/PDF, Contul meu"],
]));
children.push(P("Etichetele de secțiune (Flux contract, Bibliotecă, Sistem) sunt și butoane: clic pe ele deschide o pagină „hub” cu carduri mari pentru funcțiile din acea secțiune."));
children.push(H3("Bara de căutare (sus)"));
children.push(P("Caută după nume client, număr contract sau CUI. Pe măsură ce scrii, te duce automat în lista de contracte salvate filtrată."));
children.push(H3("Pe telefon / ecran mic"));
children.push(P("Meniul lateral devine un panou glisant: apasă butonul ☰ (hamburger) din stânga-sus pentru a-l deschide; se închide automat când alegi o opțiune sau atingi în afara lui."));

/* ---------- 6 ---------- */
children.push(H1("6. Dashboard (Panou de control)"));
children.push(P("Prima pagină după logare. Oferă o privire de ansamblu, citită din cloud:"));
children.push(LI("Indicatori (KPI): Contracte totale, Valoare totală (LEI), Luna curentă, Clienți unici."));
children.push(LI("Acțiuni rapide: Contract nou, Model contract (blank), Bibliotecă, Clienți, Rapoarte."));
children.push(LI("Contracte recente — ultimele contracte; clic pe un rând îl deschide."));
children.push(LI("Venituri · 6 luni — grafic cu veniturile ultimelor 6 luni."));
children.push(LI("Memento · Termene 30 zile — predări de materiale și termene de încasare în următoarele 30 de zile (urgent = sub 3 zile)."));
children.push(LI("Evenimente următoare — următoarele evenimente programate."));
children.push(P("Butonul mare „＋ Contract nou” din antet pornește un contract gol.", { muted: true }));

/* ---------- 7 ---------- */
children.push(H1("7. Flux contract (creare contract + anexe)"));
children.push(P("Acesta este fluxul principal de lucru pentru un contract."));
children.push(H3("Pasul 1 — Beneficiar (date client)"));
children.push(P("Din meniu: Flux contract → „Beneficiar”. Completezi datele clientului: nume beneficiar, reprezentant, CUI/CNP, sediu, email, telefon, numărul și data contractului, tipul de contract (eveniment unic sau contract-cadru)."));
children.push(H3("Pasul 2 — Anexe"));
children.push(P("Fiecare anexă este o comandă fermă pentru un eveniment. Pentru fiecare anexă completezi:"));
children.push(LI("Date eveniment: scop, dată eveniment, locație, zile până la predare, zile până la încasare."));
children.push(LI("Buget: valoare servicii, transport, diurnă, cazare, alte cheltuieli. Totalul anexei se calculează automat."));
children.push(P("„Adaugă anexă” creează o anexă nouă la același contract. Numărul anexelor apare în meniu (1, 2, 3…). Poți șterge o anexă din meniu (butonul de ștergere de pe anexă)."));
children.push(H3("Pasul 3 — Salvare și status"));
children.push(P("Salvezi contractul (devine „draft”). Drafturile apar în pagina hub „Flux contract” și pot fi redeschise sau șterse."));
children.push(P("„Marchează trimis” scoate contractul din lista de drafturi (necesită salvarea contractului în prealabil)."));
children.push(H3("Statusurile unui contract"));
children.push(P("Un contract trece prin patru stări, modificabile din Bibliotecă → Contracte:"));
children.push(table(["Status", "Semnificație"], [
  ["draft", "În lucru, încă neexpediat"],
  ["trimis", "Trimis clientului spre semnare"],
  ["semnat", "Semnat de client"],
  ["finalizat", "Încheiat / livrat"],
]));

/* ---------- 8 ---------- */
children.push(H1("8. Editarea clauzelor și modele de contract"));
children.push(P("Documentul (contract + anexe) este generat automat din date, dar clauzele pot fi personalizate."));
children.push(H3("Mod editare clauze"));
children.push(P("În modul de editare, fiecare clauză poate fi modificată, dezactivată sau înlocuită cu text propriu; poți adăuga clauze noi la finalul unei secțiuni. Documentul afișat este îngrădit cu un contur punctat cât timp ești în editare."));
children.push(H3("Model blank (pre-acord client)"));
children.push(P("„Model contract (blank)” (din Dashboard sau Bibliotecă → Modele) deschide un șablon gol, cu clauzele standard fără date — util pentru a trimite clientului spre pre-acord înainte de completarea datelor."));
children.push(H3("Salvare ca model"));
children.push(P("După ce ajustezi clauzele, poți salva configurația drept „model”. Modelele sunt indexate pe CUI și au un hash care evită duplicatele. Le regăsești în Bibliotecă → Modele, de unde le poți „Folosi” (aplică acele clauze pe un contract) sau „Șterge”."));

/* ---------- 9 ---------- */
children.push(H1("9. Export PDF / Word și import documente"));
children.push(H3("Export contract"));
children.push(LI("Export PDF — generează documentul (contract + anexe) ca PDF, formatat cu antet siglă și subsol, pregătit de tipărit/semnat."));
children.push(LI("Export Word (.docx) — generează același document în format editabil Word."));
children.push(H3("Export / Import JSON"));
children.push(P("Din Sistem: „Export JSON” salvează contractul curent ca fișier .json; „Import JSON” încarcă înapoi un astfel de fișier. Util pentru a muta un contract între dispozitive."));
children.push(H3("Import .docx / PDF"));
children.push(P("„Import .docx / PDF” (Sistem) citește un contract Word sau PDF existent și pre-populează datele în aplicație, ca punct de plecare. Verifică întotdeauna datele extrase înainte de salvare."));

/* ---------- 10 ---------- */
children.push(H1("10. Bibliotecă"));
children.push(P("Acces: meniul lateral → Bibliotecă. Are trei file:"));
children.push(H3("Contracte"));
children.push(P("Tabel cu toate contractele din cloud: număr, dată, beneficiar, CUI, data predării materialelor, termenul de plată (zile lucrătoare), total, status (modificabil din meniul derulant) și acțiuni: „Deschide” / „Șterge”. Câmp de căutare după nume, CUI sau număr. Butonul „↻ Reîmprospătează” recitește datele."));
children.push(new Paragraph({ spacing: { after: 120 }, shading: { type: ShadingType.CLEAR, fill: "FEEFEF" }, children: [new TextRun({ text: "Ștergerea unui contract elimină definitiv contractul și toate anexele/încasările lui din cloud. Operațiunea cere confirmare și nu poate fi anulată.", size: 20, color: "B91C1C" })] }));
children.push(H3("Clienți"));
children.push(P("Beneficiarii grupați după CUI. Extinde un client pentru a vedea contractele lui, iar fiecare contract pentru a vedea anexele (scop, dată, locație, defalcare buget, total). „Deschide” redeschide contractul."));
children.push(H3("Modele"));
children.push(P("Lista modelelor de contract salvate (client, CUI, dată creare/actualizare). Acțiuni: „Folosește” și „Șterge”. Tot aici se deschide modelul blank."));

/* ---------- 11 ---------- */
children.push(H1("11. Rapoarte"));
children.push(P("Acces: Panou → Rapoarte. Analize pe un interval de date selectabil (de la / până la). Are cinci file:"));
children.push(table(["Filă", "Conținut"], [
  ["Venituri", "Venituri pe luni, totaluri, defalcare"],
  ["Evenimente", "Lista evenimentelor și scadențelor"],
  ["Clienți", "Performanță pe client"],
  ["Contracte", "Situația contractelor"],
  ["Operațional", "Indicatori operaționali"],
]));
children.push(P("Datele pot fi exportate în format CSV (separator „;”, compatibil Excel) cu butonul de export din raport. Clic pe o înregistrare poate deschide contractul aferent."));

/* ---------- 12 ---------- */
children.push(H1("12. Sistem"));
children.push(P("Secțiunea Sistem (meniu lateral sau pagina hub Sistem) grupează operațiunile asupra datelor:"));
children.push(table(["Funcție", "Ce face"], [
  ["Contract nou", "Pornește un contract gol"],
  ["Export JSON", "Exportă contractul curent ca fișier .json"],
  ["Import JSON", "Încarcă un contract dintr-un fișier .json"],
  ["Backup DB", "Backup integral al bazei locale (toate contractele)"],
  ["Restaurează backup", "Reîncarcă datele dintr-un fișier de backup"],
  ["Import .docx / PDF", "Pre-populează un contract dintr-un Word/PDF"],
  ["Contul meu", "Parolă, email de logare, telefon"],
]));
children.push(P("Recomandare: fă periodic „Backup DB” și păstrează fișierul într-un loc sigur.", { b: true }));

/* ---------- 13 ---------- */
children.push(H1("13. Date în cloud (Firebase)"));
children.push(P("Contractele, evenimentele și încasările sunt sincronizate în cloud (Firebase / Firestore), astfel încât aceleași date apar pe Web și pe Desktop, pe orice dispozitiv pe care te loghezi cu același cont."));
children.push(P("Autentificarea este gestionată tot de Firebase. Datele de contact ale contului (telefon) se salvează în profilul utilizatorului din cloud."));
children.push(P("Notă tehnică: domeniul Web autorizat pentru logare este alumacontracte.web.app. Dacă aplicația se mută pe alt domeniu, acel domeniu trebuie adăugat în Firebase → Authentication → Authorized domains.", { muted: true }));

/* ---------- 14 ---------- */
children.push(H1("14. Instalare pe Windows"));
children.push(NUM("Deschide pagina de versiuni (Releases) a aplicației pe GitHub.", "w"));
children.push(NUM("Descarcă fișierul de tip „Contracte-Setup-x.y.z.exe” (cea mai recentă versiune).", "w"));
children.push(NUM("Rulează fișierul .exe. Dacă Windows afișează „Windows protected your PC”, apasă „More info” → „Run anyway” (instalerul nu este semnat cu certificat comercial).", "w"));
children.push(NUM("Alege folderul de instalare (opțional) și finalizează. Aplicația apare în meniul Start.", "w"));
children.push(NUM("Pornește „Contracte” și autentifică-te.", "w"));
children.push(P("Cerințe: Windows 10/11 (64-bit).", { muted: true }));

/* ---------- 15 ---------- */
children.push(H1("15. Instalare pe macOS"));
children.push(NUM("Deschide pagina de versiuni (Releases) pe GitHub.", "m"));
children.push(NUM("Descarcă fișierul .dmg potrivit: „Contracte-x.y.z.dmg” pentru Mac Intel sau „Contracte-x.y.z-arm64.dmg” pentru Mac cu Apple Silicon (M1/M2/M3).", "m"));
children.push(NUM("Deschide .dmg-ul și trage pictograma „Contracte” în folderul Applications.", "m"));
children.push(NUM("La prima deschidere, fiindcă aplicația nu este semnată Apple: clic-dreapta pe aplicație → „Open” → confirmă „Open”. (Dublu-clic simplu va fi blocat de Gatekeeper.)", "m"));
children.push(NUM("Autentifică-te.", "m"));
children.push(P("Cerințe: macOS recent, Intel sau Apple Silicon.", { muted: true }));

/* ---------- 16 ---------- */
children.push(H1("16. Actualizări (update-uri) și comenzi"));
children.push(H3("Pentru utilizatorul aplicației Desktop"));
children.push(P("Aplicația Desktop se actualizează automat (auto-update): la pornire verifică dacă există o versiune nouă, o descarcă și o aplică. Nu trebuie să reinstalezi manual — e suficient să repornești aplicația când ți se semnalează."));
children.push(H3("Pentru utilizatorul versiunii Web"));
children.push(P("Versiunea Web este mereu la zi automat. Dacă nu vezi o modificare recentă, fă un refresh „dur”: Ctrl+F5 (Windows) sau Cmd+Shift+R (Mac)."));
children.push(H3("Pentru cel care întreține aplicația — publicarea unei versiuni noi"));
children.push(P("Toate comenzile se rulează în folderul proiectului. Pe Windows folosește PowerShell și execută comenzile pe rânduri separate (nu cu „&&”)."));
children.push(P("1) Crește versiunea, salvează modificările și creează eticheta (tag):"));
children.push(CODE("npm version patch --no-git-tag-version"));
children.push(CODE("git add -A"));
children.push(CODE('git commit -m "Descriere modificari"'));
children.push(CODE("git tag v1.0.2"));
children.push(CODE("git push origin main --tags"));
children.push(P("• Push-ul pe „main” declanșează automat publicarea versiunii Web (Firebase Hosting) — fără pași manuali."));
children.push(P("• Push-ul de tag „v*” declanșează automat construirea aplicației Desktop pentru Windows și macOS pe GitHub Actions."));
children.push(P("2) Publicarea instalerelor Desktop: build-ul creează un Release în starea „Draft” pe GitHub. Intră la Releases → deschide draftul versiunii → „Publish release”. Abia după publicare instalerele pot fi descărcate și auto-update-ul vede versiunea nouă."));
children.push(P("3) Verificare rapidă a versiunii Web live:"));
children.push(CODE("https://alumacontracte.web.app"));
children.push(H3("Deploy manual Web (rar, doar dacă e nevoie)"));
children.push(CODE("npm run build"));
children.push(CODE("firebase deploy --only hosting"));
children.push(H3("Rulare locală pentru dezvoltare"));
children.push(CODE("npm install"));
children.push(CODE("npm run dev            # versiunea Web local"));
children.push(CODE("npm run electron:dev   # versiunea Desktop local"));
children.push(H3("Build local instalere Desktop"));
children.push(CODE("npm run electron:build:win   # instaler Windows"));
children.push(CODE("npm run electron:build:mac   # instaler macOS (necesită un Mac)"));

/* ---------- 17 ---------- */
children.push(H1("17. Depanare rapidă"));
children.push(table(["Problemă", "Soluție"], [
  ["„Email sau parolă greșite”", "Verifică datele; folosește „Ai uitat parola?” pentru resetare pe email."],
  ["Nu primesc emailul de resetare", "Verifică folderul Spam/Junk; reîncearcă după câteva minute."],
  ["Logare blocată pe Web (domeniu)", "Domeniul nu e autorizat în Firebase Authentication → Authorized domains."],
  ["Nu văd modificările recente (Web)", "Refresh dur: Ctrl+F5 (Win) / Cmd+Shift+R (Mac)."],
  ["Mac: aplicația nu se deschide", "Clic-dreapta → Open → Open (aplicația nu e semnată Apple)."],
  ["Windows: avertisment SmartScreen", "More info → Run anyway."],
  ["Datele nu apar", "Verifică internetul; apasă „↻ Reîmprospătează” în Bibliotecă."],
  ["Am șters din greșeală un contract", "Restaurează din ultimul „Backup DB” (Sistem → Restaurează backup)."],
]));
children.push(SPACER());
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 }, children: [new TextRun({ text: "— Sfârșitul manualului —", italics: true, color: MUTED, size: 20 })] }));

/* ---------- DOC ---------- */
const doc = new Document({
  creator: "ALUMA",
  title: "Manual de utilizare — Aplicația Contracte",
  description: "Document de predare către beneficiar",
  numbering: {
    config: ["n", "w", "m"].map((ref) => ({
      reference: ref,
      levels: [{ level: 0, format: "decimal", text: "%1.", alignment: AlignmentType.START }],
    })),
  },
  sections: [{
    properties: { page: { margin: { top: 1100, bottom: 1100, left: 1200, right: 1200 } } },
    children,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  const out = path.join(__dirname, "..", "Manual_Utilizare_Contracte_ALUMA.docx");
  fs.writeFileSync(out, buf);
  console.log("OK:", out, "(" + Math.round(buf.length / 1024) + " KB)");
});
