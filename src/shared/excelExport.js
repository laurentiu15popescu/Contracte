/* Export Excel — workbook cu 3 sheet-uri (Contracte / Anexe / Beneficiari).
   Folosește dynamic import pentru xlsx (~500KB) — bundle-ul principal nu crește.
   Citește direct din schema V2: contracte/{nr} + contracte/{nr}/anexe + beneficiari/{cui}. */

import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

const todayDmy = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
};

const sumBudget = (b) =>
  (Number(b?.valoareServicii) || 0) +
  (Number(b?.transport) || 0) +
  (Number(b?.diurna) || 0) +
  (Number(b?.cazare) || 0) +
  (Number(b?.alteCheltuieli) || 0);

const applyAutofilterAndWidths = (XLSX, ws, rows) => {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const range = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: rows.length, c: keys.length - 1 },
  });
  ws["!autofilter"] = { ref: range };
  ws["!cols"] = keys.map((k) => {
    const lengths = rows.map((r) => {
      const v = r[k];
      return v == null ? 0 : String(v).length;
    });
    const max = Math.max(k.length, ...lengths);
    return { wch: Math.min(Math.max(max + 2, 8), 42) };
  });
};

const buildContracteRows = (contracte) =>
  contracte.map((c) => ({
    "Nr. contract": c.numarContract || c.id,
    "Dată contract": c.dataContract || "",
    "Valabilitate până la": c.clientData?.dataExpirare || "",
    "Tip contract": c.clientData?.tipContract || "",
    "Beneficiar": c.numeBeneficiar || "",
    "CUI": c.cui || "",
    "Status": c.status || "draft",
    "Trimis la semnat": c.dataTrimisLaSemnat || "",
    "Dată semnare": c.dataSemnare || "",
    "Nr. anexe": c.nrAnexe || 0,
    "Total servicii (LEI)": Number(c.total) || 0,
    "Total încasat (LEI)": Number(c.totalIncasat) || 0,
    "Total datorat (LEI)": Number(c.totalDatorat) || 0,
  }));

const buildAnexeRows = (anexeAll) =>
  anexeAll.map((a) => ({
    "Nr. contract": a._nrContract,
    "Nr. anexă": a.eventData?.numarAnexa || a.anexaIndex || "",
    "Dată emitere": a.eventData?.dataEmitere || "",
    "Scop": a.eventData?.scop || "",
    "Dată eveniment": a.eventData?.dataEveniment || "",
    "Locație": a.eventData?.locatie || "",
    "Zile predare": a.eventData?.zilePredare || "",
    "Zile încasare": a.eventData?.zileIncasare || "",
    "Include video": a.eventData?.includeVideo ? "Da" : "Nu",
    "Valoare servicii (LEI)": Number(a.budgetData?.valoareServicii) || 0,
    "Transport (LEI)": Number(a.budgetData?.transport) || 0,
    "Diurnă (LEI)": Number(a.budgetData?.diurna) || 0,
    "Cazare (LEI)": Number(a.budgetData?.cazare) || 0,
    "Alte cheltuieli (LEI)": Number(a.budgetData?.alteCheltuieli) || 0,
    "Total (LEI)": Number(a.sumaServicii) || sumBudget(a.budgetData),
    "Încasată": a.incasata ? "Da" : "Nu",
    "Dată încasare": a.dataIncasare || "",
    "Sumă încasată (LEI)": Number(a.sumaIncasata) || 0,
    "Nr. factură": a.nrFactura || "",
    "Dată factură": a.dataFactura || "",
  }));

const buildBeneficiariRows = (beneficiari) =>
  beneficiari.map((b) => ({
    "CUI": b.cui || b.id,
    "Beneficiar": b.numeBeneficiar || "",
    "Sediu": b.sediu || "",
    "Nr. Reg. Com.": b.nrRegCom || "",
    "Reprezentant": b.reprezentant || "",
    "Email": b.email || "",
    "Telefon": b.telefon || "",
    "IBAN": b.iban || "",
    "Banca": b.banca || "",
    "Nr. contracte": Number(b.nrContracte) || 0,
    "Total servicii (LEI)": Number(b.totalServicii) || 0,
    "Total încasat (LEI)": Number(b.totalIncasat) || 0,
    "Total datorat (LEI)": Number(b.totalDatorat) || 0,
    "Primul contract": b.primulContract?.nr || "",
    "Ultimul contract": b.ultimulContract?.nr || "",
  }));

/* Export complet — 3 sheet-uri. */
export const exportAllExcel = async ({ filename } = {}) => {
  const XLSX = await import("xlsx");

  const [contracteSnap, beneficiariSnap] = await Promise.all([
    getDocs(collection(db, "contracte")),
    getDocs(collection(db, "beneficiari")).catch(() => ({ docs: [] })),
  ]);
  const contracte = contracteSnap.docs
    .filter((d) => !d.data().deleted)
    .map((d) => ({ id: d.id, ...d.data() }));

  const anexeAll = [];
  for (const c of contracte) {
    const anexeSnap = await getDocs(collection(db, "contracte", c.id, "anexe"));
    anexeSnap.docs
      .map((a) => ({ ...a.data(), _nrContract: c.numarContract || c.id }))
      .sort((a, b) => (a.anexaIndex || 0) - (b.anexaIndex || 0))
      .forEach((a) => anexeAll.push(a));
  }

  const beneficiari = beneficiariSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const wb = XLSX.utils.book_new();

  const wsC = XLSX.utils.json_to_sheet(buildContracteRows(contracte));
  applyAutofilterAndWidths(XLSX, wsC, buildContracteRows(contracte));
  XLSX.utils.book_append_sheet(wb, wsC, "Contracte");

  const wsA = XLSX.utils.json_to_sheet(buildAnexeRows(anexeAll));
  applyAutofilterAndWidths(XLSX, wsA, buildAnexeRows(anexeAll));
  XLSX.utils.book_append_sheet(wb, wsA, "Anexe");

  const wsB = XLSX.utils.json_to_sheet(buildBeneficiariRows(beneficiari));
  applyAutofilterAndWidths(XLSX, wsB, buildBeneficiariRows(beneficiari));
  XLSX.utils.book_append_sheet(wb, wsB, "Beneficiari");

  XLSX.writeFile(wb, filename || `aluma-export-${todayDmy()}.xlsx`);
  return { contracte: contracte.length, anexe: anexeAll.length, beneficiari: beneficiari.length };
};

/* Export beneficiari filtrați pe CUI (din Bibliotecă / Clienți). */
export const exportBeneficiariFilteredExcel = async (cuiList = [], { filename } = {}) => {
  const XLSX = await import("xlsx");
  const benefSnap = await getDocs(collection(db, "beneficiari")).catch(() => ({ docs: [] }));
  const set = new Set(cuiList.map(String));
  const beneficiari = benefSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((b) => set.has(b.cui) || set.has(b.id));

  const wb = XLSX.utils.book_new();
  const rows = buildBeneficiariRows(beneficiari);
  const ws = XLSX.utils.json_to_sheet(rows);
  applyAutofilterAndWidths(XLSX, ws, rows);
  XLSX.utils.book_append_sheet(wb, ws, "Beneficiari");
  XLSX.writeFile(wb, filename || `aluma-clienti-${todayDmy()}.xlsx`);
  return { beneficiari: beneficiari.length };
};

/* Export rapoarte — anexe filtrate (perechi {nrContract, anexaIndex}) + contractele aferente. */
export const exportRapoarteExcel = async (anexaKeys = [], { filename, fromIso, toIso } = {}) => {
  const XLSX = await import("xlsx");
  const keySet = new Set(anexaKeys.map((k) => `${k.nrContract}|${k.anexaIndex}`));
  const nrSet = new Set(anexaKeys.map((k) => String(k.nrContract)));

  const contracteSnap = await getDocs(collection(db, "contracte"));
  const contracte = contracteSnap.docs
    .filter((d) => !d.data().deleted && (nrSet.has(d.id) || nrSet.has(d.data().numarContract)))
    .map((d) => ({ id: d.id, ...d.data() }));

  const anexeAll = [];
  for (const c of contracte) {
    const anexeSnap = await getDocs(collection(db, "contracte", c.id, "anexe"));
    anexeSnap.docs
      .map((a) => ({ ...a.data(), _nrContract: c.numarContract || c.id }))
      .filter((a) => keySet.has(`${a._nrContract}|${a.anexaIndex}`))
      .sort((a, b) => (a.anexaIndex || 0) - (b.anexaIndex || 0))
      .forEach((a) => anexeAll.push(a));
  }

  const wb = XLSX.utils.book_new();
  const rowsC = buildContracteRows(contracte);
  const wsC = XLSX.utils.json_to_sheet(rowsC);
  applyAutofilterAndWidths(XLSX, wsC, rowsC);
  XLSX.utils.book_append_sheet(wb, wsC, "Contracte");

  const rowsA = buildAnexeRows(anexeAll);
  const wsA = XLSX.utils.json_to_sheet(rowsA);
  applyAutofilterAndWidths(XLSX, wsA, rowsA);
  XLSX.utils.book_append_sheet(wb, wsA, "Anexe");

  const suffix = fromIso && toIso ? `-${fromIso}_${toIso}` : "";
  XLSX.writeFile(wb, filename || `aluma-rapoarte${suffix}.xlsx`);
  return { contracte: contracte.length, anexe: anexeAll.length };
};

/* Export filtrat — doar Contracte + Anexe pentru un set dat de numere. */
export const exportContracteFilteredExcel = async (nrList = [], { filename } = {}) => {
  const XLSX = await import("xlsx");

  const contracteSnap = await getDocs(collection(db, "contracte"));
  const set = new Set(nrList.map(String));
  const contracte = contracteSnap.docs
    .filter((d) => !d.data().deleted && (set.has(d.id) || set.has(d.data().numarContract)))
    .map((d) => ({ id: d.id, ...d.data() }));

  const anexeAll = [];
  for (const c of contracte) {
    const anexeSnap = await getDocs(collection(db, "contracte", c.id, "anexe"));
    anexeSnap.docs
      .map((a) => ({ ...a.data(), _nrContract: c.numarContract || c.id }))
      .sort((a, b) => (a.anexaIndex || 0) - (b.anexaIndex || 0))
      .forEach((a) => anexeAll.push(a));
  }

  const wb = XLSX.utils.book_new();

  const rowsC = buildContracteRows(contracte);
  const wsC = XLSX.utils.json_to_sheet(rowsC);
  applyAutofilterAndWidths(XLSX, wsC, rowsC);
  XLSX.utils.book_append_sheet(wb, wsC, "Contracte");

  const rowsA = buildAnexeRows(anexeAll);
  const wsA = XLSX.utils.json_to_sheet(rowsA);
  applyAutofilterAndWidths(XLSX, wsA, rowsA);
  XLSX.utils.book_append_sheet(wb, wsA, "Anexe");

  XLSX.writeFile(wb, filename || `aluma-contracte-${todayDmy()}.xlsx`);
  return { contracte: contracte.length, anexe: anexeAll.length };
};
