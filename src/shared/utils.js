// Prefix proxy pentru web hostat (Cloudflare Worker). Gol în dev/desktop.
const PROXY = import.meta.env.VITE_PROXY_BASE || "";

export const DATE_RE = /^(\d{2})-(\d{2})-(\d{4})$/;

export const todayDmy = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}-${String(
    d.getMonth() + 1
  ).padStart(2, "0")}-${d.getFullYear()}`;
};

export const parseDmy = (s) => {
  if (!s) return null;
  const m = DATE_RE.exec(s);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (
    d.getFullYear() !== Number(yyyy) ||
    d.getMonth() !== Number(mm) - 1 ||
    d.getDate() !== Number(dd)
  )
    return null;
  return d;
};

export const formatDmy = (d) =>
  `${String(d.getDate()).padStart(2, "0")}-${String(
    d.getMonth() + 1
  ).padStart(2, "0")}-${d.getFullYear()}`;

export const addDays = (dmy, n) => {
  const d = parseDmy(dmy);
  if (!d) return "";
  d.setDate(d.getDate() + Number(n));
  return formatDmy(d);
};

export const addMonths = (dmy, n) => {
  const d = parseDmy(dmy);
  if (!d) return "";
  const day = d.getDate();
  d.setMonth(d.getMonth() + Number(n));
  // dacă ziua a sărit (ex. 31 ian + 1 lună), revino la ultima zi a lunii dorite
  if (d.getDate() !== day) d.setDate(0);
  return formatDmy(d);
};

export const isValidDmy = (s) => parseDmy(s) !== null;

export const normalizeDate = (s) => {
  if (!s) return "";
  const trimmed = String(s).trim();
  // yyyy-mm-dd from picker
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (iso) return `${iso[3]}-${iso[2]}-${iso[1]}`;
  // various separators: / . - space
  const m = /^(\d{1,2})[\/.\-\s](\d{1,2})[\/.\-\s](\d{2,4})$/.exec(trimmed);
  if (!m) return trimmed;
  const dd = m[1].padStart(2, "0");
  const mm = m[2].padStart(2, "0");
  let yyyy = m[3];
  if (yyyy.length === 2) yyyy = (Number(yyyy) >= 70 ? "19" : "20") + yyyy;
  return `${dd}-${mm}-${yyyy}`;
};

export const validateCUI = (s) => {
  if (!s) return false;
  const v = s.replace(/^RO/i, "").trim();
  if (/^\d{13}$/.test(s)) return true; // CNP
  if (!/^\d{2,10}$/.test(v)) return false;
  const digits = v.split("").map(Number);
  const control = digits.pop();
  const weights = [7, 5, 3, 2, 1, 7, 5, 3, 2];
  const padded = [...Array(weights.length - digits.length).fill(0), ...digits];
  const sum = padded.reduce((s, d, i) => s + d * weights[i], 0);
  const calc = (sum * 10) % 11 % 10;
  return calc === control;
};

const HISTORY_KEY = "aluma-clienti-v1";
const COUNTER_KEY = "aluma-contract-counter-v1";

export const saveClientHistory = (clientData) => {
  if (!clientData?.cui) return;
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[clientData.cui] = clientData;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
};

export const listClientHistory = () => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? Object.values(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
};

export const findClientByCui = (cui) => {
  if (!cui) return null;
  return listClientHistory().find((c) => c.cui === cui) || null;
};

export const getNextContractNumber = () => {
  try {
    const n = Number(localStorage.getItem(COUNTER_KEY) || "0") + 1;
    localStorage.setItem(COUNTER_KEY, String(n));
    return String(n);
  } catch {
    return "1";
  }
};

export const peekNextContractNumber = () => {
  try {
    return Number(localStorage.getItem(COUNTER_KEY) || "0") + 1;
  } catch {
    return 1;
  }
};

export const setContractCounterStart = (n) => {
  const v = Math.max(1, Math.floor(Number(n) || 0));
  try {
    localStorage.setItem(COUNTER_KEY, String(v - 1));
  } catch {
    // ignore
  }
  return v;
};

const LOCATIONS_KEY = "aluma-locatii-v1";

export const saveLocation = (loc) => {
  const v = String(loc || "").trim();
  if (!v) return;
  try {
    const raw = localStorage.getItem(LOCATIONS_KEY);
    const set = new Set(raw ? JSON.parse(raw) : []);
    set.add(v);
    localStorage.setItem(LOCATIONS_KEY, JSON.stringify([...set]));
  } catch {
    // ignore
  }
};

export const listLocations = () => {
  try {
    const raw = localStorage.getItem(LOCATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const BUCURESTI_SECTOARE = [
  "București - Sector 1",
  "București - Sector 2",
  "București - Sector 3",
  "București - Sector 4",
  "București - Sector 5",
  "București - Sector 6",
];

export const searchRoLocations = async (query) => {
  const q = String(query || "").trim();
  if (q.length < 2) return [];
  const ql = q.toLowerCase();
  const out = [];
  const seen = new Set();
  const add = (label) => {
    if (label && !seen.has(label)) {
      seen.add(label);
      out.push(label);
    }
  };
  for (const s of BUCURESTI_SECTOARE) {
    if (s.toLowerCase().includes(ql)) add(s);
  }
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=ro&limit=8&addressdetails=1&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: { "Accept-Language": "ro" } });
    if (res.ok) {
      const arr = await res.json();
      for (const item of arr) {
        const a = item.address || {};
        if (a.city === "București" && a.city_district?.startsWith("Sector")) {
          add(`București - ${a.city_district}`);
          continue;
        }
        if (a.village || a.hamlet) {
          const sat = a.village || a.hamlet;
          const parts = [sat];
          if (a.municipality && a.municipality !== sat)
            parts.push(`com. ${a.municipality}`);
          if (a.county) parts.push(`jud. ${a.county}`);
          add(parts.join(", "));
        } else {
          const loc = a.city || a.town || a.municipality;
          if (!loc) continue;
          add(a.county ? `${loc}, jud. ${a.county}` : loc);
        }
      }
    }
  } catch {
    // ignore
  }
  return out;
};

export const EVENT_PACKAGES = {
  Nuntă: { valoareServicii: 5000, transport: 200, diurna: 0, cazare: 0 },
  Botez: { valoareServicii: 2500, transport: 100, diurna: 0, cazare: 0 },
  Corporate: { valoareServicii: 3500, transport: 150, diurna: 200, cazare: 0 },
  Brand: { valoareServicii: 4000, transport: 100, diurna: 0, cazare: 0 },
  "Eveniment privat": { valoareServicii: 2000, transport: 100, diurna: 0, cazare: 0 },
};

const BANK_CODES = {
  BTRL: "Banca Transilvania",
  RNCB: "BCR",
  BRDE: "BRD",
  INGB: "ING Bank",
  RZBR: "Raiffeisen Bank",
  CECE: "CEC Bank",
  BACX: "UniCredit Bank",
  OTPV: "OTP Bank",
  BREL: "Libra Internet Bank",
  PIRB: "First Bank",
  BPOS: "Patria Bank",
  CRDZ: "Credit Europe Bank",
  BUCU: "Alpha Bank",
  TREZ: "Trezoreria Statului",
  WBAN: "EximBank",
  VBBU: "Vista Bank",
  PORL: "Porsche Bank",
  CARP: "ProCredit Bank",
  MIRO: "ProCredit Bank",
  EGNA: "Garanti BBVA",
  TBIB: "TBI Bank",
  CITI: "Citibank",
  CAIX: "CaixaBank",
  REVO: "Revolut Bank",
  TRWI: "Wise (TransferWise)",
  BFER: "Banca Comercială Feroviară",
  MILB: "Salt Bank",
  BCYP: "Bank of Cyprus",
  NBOR: "BNR (Trezorerie)",
  RZBL: "Raiffeisen Leasing",
  DAFB: "Banca Comercială Feroviară",
  UGBI: "Garanti BBVA",
};

export const bankFromIban = (iban) => {
  if (!iban) return "";
  const v = iban.replace(/\s+/g, "").toUpperCase();
  if (!/^RO\d{2}[A-Z]{4}/.test(v)) return "";
  return BANK_CODES[v.slice(4, 8)] || "";
};

export const validateIBAN = (s) => {
  if (!s) return false;
  const v = s.replace(/\s+/g, "").toUpperCase();
  return /^RO\d{2}[A-Z0-9]{20}$/.test(v);
};

const STORAGE_KEY = "aluma-contracte-v1";

export const saveLocal = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
};

export const loadLocal = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const exportJSON = (data, filename = "contract.json") => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const fetchAnaf = async (cui) => {
  const clean = String(cui).replace(/^RO/i, "").trim();
  if (!/^\d{2,10}$/.test(clean)) throw new Error("CUI invalid");
  const today = new Date().toISOString().slice(0, 10);
  const paths = [
    `${PROXY}/anaf/api/PlatitorTvaRest/v9/tva`,
    `${PROXY}/anaf/api/PlatitorTvaRest/v8/tva`,
  ];
  let res;
  let json;
  let lastStatus;
  for (const url of paths) {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([{ cui: Number(clean), data: today }]),
    });
    lastStatus = res.status;
    if (res.ok) {
      try {
        json = await res.json();
        if (json) break;
      } catch {
        // try next
      }
    }
  }
  if (!json)
    throw new Error(
      `ANAF nu răspunde (ultim status ${lastStatus}). Posibil down temporar sau path-ul API s-a schimbat. Reîncearcă în câteva minute sau completează manual.`
    );
  const f = json?.found?.[0];
  if (!f) throw new Error("CUI inexistent la ANAF");
  const dg = f.date_generale || {};
  return {
    numeBeneficiar: dg.denumire || "",
    cui: dg.cui ? `RO${dg.cui}` : "",
    nrRegCom: dg.nrRegCom || "",
    sediu: dg.adresa || "",
  };
};

/**
 * Aduce cursul BNR oficial pentru o monedă la o dată (zz-ll-aaaa).
 * Sursă: cursbnr.ro (scrape HTML). Pentru weekend/sărbători cade pe ultima zi publicată.
 */
export const fetchBnrRate = async (currency, dmyDate) => {
  const cur = String(currency || "EUR").toUpperCase();
  if (cur === "RON") return { rate: 1, date: dmyDate, currency: "RON" };
  const p = parseDmy(dmyDate);
  if (!p) throw new Error("Data invalidă");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // dacă data e în viitor → cere cursul de azi
  if (p > today) p.setTime(today.getTime());

  const fetchFor = async (date) => {
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const isToday = date.getTime() === today.getTime();
    const url = isToday
      ? `${PROXY}/cursbnr/curs-bnr-azi`
      : `${PROXY}/cursbnr/arhiva-curs-bnr-${iso}`;
    return fetch(url);
  };

  // încearcă data cerută; dacă 404 (weekend/sărbătoare), dă înapoi până 7 zile
  let res = await fetchFor(p);
  let attempts = 0;
  while (!res.ok && attempts < 7) {
    p.setDate(p.getDate() - 1);
    res = await fetchFor(p);
    attempts++;
  }
  if (!res.ok) throw new Error(`cursbnr.ro ${res.status}`);
  const html = await res.text();
  // Extrage TOATE rândurile din tabelul de curs și construiește harta { COD: rate }.
  // Format tipic cursbnr.ro: <tr> ... <td>EUR</td> <td>Euro</td> <td>4.9772</td> ... </tr>
  // sau cu prefix unitate: <td>1 EUR</td> ... <td>4.9772</td>
  const map = {};
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let row;
  while ((row = rowRe.exec(html))) {
    const codeM = />\s*(?:\d+\s*)?([A-Z]{3})\s*</.exec(row[1]);
    if (!codeM) continue;
    const code = codeM[1];
    if (code === "RON") continue;
    const numM = /<td[^>]*>\s*([0-9]+[\.,][0-9]{2,6})\s*<\/td>/.exec(row[1]);
    if (!numM) continue;
    const v = Number(numM[1].replace(",", "."));
    if (v > 0 && !map[code]) map[code] = v;
  }
  console.log("[BNR] currencies parsed:", Object.keys(map).length, map);
  if (!map[cur]) throw new Error(`Nu am găsit cursul ${cur} în pagină`);
  const rate = map[cur];
  // încearcă să extragi data publicării; dacă nu, folosește data cerută
  const dm = /curs\s+(?:valutar\s+)?BNR[^0-9]{0,20}(\d{2})[.\/-](\d{2})[.\/-](\d{4})/i.exec(html);
  const date = dm ? `${dm[1]}-${dm[2]}-${dm[3]}` : dmyDate;
  return { rate, date, currency: cur };
};

export const importJSON = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      try {
        resolve(JSON.parse(r.result));
      } catch (e) {
        reject(e);
      }
    };
    r.onerror = reject;
    r.readAsText(file);
  });
