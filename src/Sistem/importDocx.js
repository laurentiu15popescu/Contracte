import * as mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const norm = (s) => (s || "").replace(/\s+/g, " ").trim();

const toDmy = (raw) => {
  if (!raw) return "";
  const m = raw.match(/(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})/);
  if (!m) return "";
  const dd = m[1].padStart(2, "0");
  const mm = m[2].padStart(2, "0");
  let yy = m[3];
  if (yy.length === 2) yy = (Number(yy) > 50 ? "19" : "20") + yy;
  return `${dd}-${mm}-${yy}`;
};

const pick = (text, patterns) => {
  for (const re of patterns) {
    const m = text.match(re);
    if (m && m[1]) return norm(m[1]);
  }
  return "";
};

// Izolează blocul "Beneficiar" din preambul: de la ultimul "și" dinaintea
// primei mențiuni a cuvântului "Beneficiar", până la sfârșit (sau până la
// reapariția "Furnizor/Prestator/ALUMA", ca să nu prindem datele bancare ALUMA
// din finalul contractului).
const sliceBeneficiar = (t) => {
  const ben = t.match(/\bbeneficiar/i);
  if (!ben) return t;
  const before = t.slice(0, ben.index);
  const splits = [...before.matchAll(/\b[șs]i\b/gi)];
  const start = splits.length ? splits[splits.length - 1].index : Math.max(0, ben.index - 600);
  const tail = t.slice(ben.index);
  const reFurnizor = /\b(?:furnizor|prestator|ALUMA)\b/i;
  const mFur = tail.slice(ben[0].length).match(reFurnizor);
  const end = mFur ? ben.index + ben[0].length + mFur.index : t.length;
  return t.slice(start, end);
};

export const parseDocxText = (text) => {
  const t = norm(text);
  const b = sliceBeneficiar(t);

  const numarContract = pick(t, [
    /(?:contract\s*(?:nr\.?|nr|num[ăa]r)\.?|nr\.?\s*contract|num[ăa]r\s*contract)\s*[:\-]?\s*([A-Za-z0-9./\-]+)/i,
    /\bnr\.?\s*([0-9]{1,6})\s*\/\s*\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4}/i,
  ]);

  const dataContract = toDmy(
    pick(t, [
      /(?:data\s*(?:contractului|contract)?|\bdin\b|\bla\s*data\s*de)\s*[:\-]?\s*(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4})/i,
      /\bnr\.?\s*[0-9]{1,6}\s*\/\s*(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4})/i,
      /(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4})/,
    ])
  );

  const cui = pick(b, [
    /\bC\.?\s*[UI]\.?\s*[FI]\.?\s*[:\-]?\s*(RO\s*\d{2,10}|\d{2,10})/i,
    /\bcod\s*(?:unic\s*de\s*[îi]nregistrare|fiscal|de\s*[îi]nregistrare\s*fiscal[ăa])\s*[:\-]?\s*(RO\s*\d{2,10}|\d{2,10})/i,
  ]).replace(/\s+/g, "");

  const nrRegCom = pick(b, [
    /\b(?:nr\.?\s*reg\.?\s*com\.?|reg\.?\s*com\.?|registrul\s*comer[țt]ului)\s*[:\-]?\s*(J\s*\d{1,2}\s*\/\s*\d{1,6}\s*\/\s*\d{2,4})/i,
    /\b(J\s*\d{1,2}\s*\/\s*\d{1,6}\s*\/\s*\d{2,4})/i,
  ]).replace(/\s+/g, "");

  const numeBeneficiar = pick(b, [
    /(?:beneficiar|client|societatea|denumire)\s*[:\-]?\s*([^,\n;]{3,120}?(?:S\.?\s*R\.?\s*L\.?|S\.?\s*A\.?|S\.?\s*C\.?\s*[^,\n;]{0,80}?S\.?\s*R\.?\s*L\.?|P\.?\s*F\.?\s*A\.?))/i,
    /\b(S\.?\s*C\.?\s*[A-ZĂÂÎȘȚ][^,\n;]{2,80}?S\.?\s*R\.?\s*L\.?)/,
    /\b([A-ZĂÂÎȘȚ][A-Za-zĂÂÎȘȚăâîșț0-9 .\-&]{2,80}?\s+S\.?\s*R\.?\s*L\.?)/,
  ]);

  // Adresele românești conțin virgule (Str., nr., Bl., Sc., Ap., oraș, județ),
  // așa că oprim doar la următorul câmp structurat (CUI, J.., tel, email, IBAN etc.).
  const sediu = pick(b, [
    /(?:cu\s*sediul\s*(?:social\s*)?(?:[îi]n)?|sediu(?:l)?(?:\s*social)?|adresa)\s*[:-]?\s*([^\n;]{5,250}?)(?=\s*,?\s*(?:C\.?\s*[UI]\.?\s*[FI]\.?|cod\s*(?:unic|fiscal|de\s*[îi]nregistrare)|nr\.?\s*reg|nr\.?\s*(?:de\s*)?ordine|registrul\s*comer|[îi]nmatricul|\bJ\s*\d|tel(?:efon)?\b|e-?mail|iban|banca|cont|denumit|reprezentat|sub\s*nr|$))/i,
  ]);

  const reprezentant = pick(b, [
    /(?:reprezentat[ăa]?\s*(?:legal\s*)?(?:prin|de)|administrator|reprezentant)\s*[:\-]?\s*([A-ZĂÂÎȘȚ][A-Za-zĂÂÎȘȚăâîșț .\-]{3,80}?)(?=\s*(?:,|;|\bîn\b|\bavând\b|\bca\b|\bcu\b|tel|email|$))/i,
  ]);

  const telefon = pick(b, [
    /(?:tel(?:efon)?\.?|mobil)\s*[:\-]?\s*(\+?\d[\d .\-/]{7,17}\d)/i,
    /\b(\+?40[\d .\-]{8,14})\b/,
    /\b(07\d{2}[ .\-]?\d{3}[ .\-]?\d{3})\b/,
  ]).replace(/[ .\-]/g, "");

  const email = pick(b, [
    /([A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,})/,
  ]);

  const iban = pick(b, [
    /\b(RO\d{2}[A-Z0-9 ]{16,30})\b/i,
  ]).replace(/\s+/g, "").toUpperCase();

  // Banca NU se mai extrage din text — e nesigură (capta "r nr. RO..." etc.).
  // În UI se derivează automat din IBAN via bankFromIban (BIC pozițiile 5-8).
  const banca = "";

  return {
    numarContract,
    dataContract,
    numeBeneficiar,
    sediu,
    cui,
    nrRegCom,
    reprezentant,
    telefon,
    email,
    iban,
    banca,
  };
};

const extractDocxText = async (file) => {
  const buf = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
  return value;
};

const extractPdfText = async (file) => {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  let out = "";
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    out += content.items.map((it) => it.str).join(" ") + "\n";
  }
  return out;
};

export const extractFromFile = async (file) => {
  const name = (file.name || "").toLowerCase();
  let text = "";
  if (name.endsWith(".docx")) {
    text = await extractDocxText(file);
  } else if (name.endsWith(".pdf")) {
    text = await extractPdfText(file);
  } else {
    throw new Error("Format neacceptat. Folosește .docx sau .pdf.");
  }
  if (!norm(text)) {
    throw new Error(
      name.endsWith(".pdf")
        ? "PDF-ul pare scanat (fără text). Necesită OCR — folosește Word-ul original."
        : "Fișier gol sau ilizibil."
    );
  }
  const parsed = parseDocxText(text);
  const matched = Object.fromEntries(Object.entries(parsed).filter(([, v]) => v));
  const missing = Object.entries(parsed).filter(([, v]) => !v).map(([k]) => k);
  return { parsed, matched, missing, rawText: text };
};

export const extractFromDocx = extractFromFile;
