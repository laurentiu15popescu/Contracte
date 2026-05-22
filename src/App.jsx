import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import Contract from "./FluxContract/Contract";
import Anexa from "./FluxContract/Anexa";
import Icon from "./shared/Icon";
import {
  addDays,
  addMonths,
  bankFromIban,
  exportJSON,
  fetchAnaf,
  fetchBnrRate,
  findClientByCui,
  getNextContractNumber,
  peekNextContractNumber,
  setContractCounterStart,
  importJSON,
  isValidDmy,
  normalizeDate,
  parseDmy,
  listClientHistory,
  saveLocation,
  searchRoLocations,
  loadLocal,
  saveClientHistory,
  saveLocal,
  todayDmy,
  validateCUI,
  validateIBAN,
} from "./shared/utils";
import { saveContract, exportAll, importAll, getContractByNumar, markContractTrimis, listDrafturi, subscribeDrafturi, getContract, deleteContract, saveModel, listModele, getModeleByCui, getModel, deleteModel, saveContractV2, upsertBeneficiar } from "./shared/db";
import { exportAllExcel } from "./shared/excelExport";
import { extractFromDocx } from "./Sistem/importDocx";
import { db } from "./shared/firebase";
import { LogoutButton } from "./shared/AuthGate";
import { doc, setDoc, deleteDoc, getDocs, getDoc, query, where, collection, serverTimestamp } from "firebase/firestore";
import Biblioteca from "./Biblioteca/Biblioteca";
import Dashboard from "./Dashboard/Dashboard";
import Rapoarte from "./Rapoarte/Rapoarte";
import HubPage from "./shared/HubPage";
import ContSetari from "./Sistem/ContSetari";
import { useDialog } from "./shared/Dialog";

/* ---------- empty factories (neschimbate) ---------- */
const emptyClient = () => ({
  tipContract: "cadru",
  includeVideo: false,
  numarContract: "",
  anexaStart: "",
  dataContract: todayDmy(),
  dataExpirare: addMonths(todayDmy(), 12),
  numeBeneficiar: "",
  sediu: "",
  cui: "",
  nrRegCom: "",
  reprezentant: "",
  telefon: "",
  email: "",
  iban: "",
  banca: "",
});
const emptyEvent = () => ({
  tip: "",
  scop: "",
  numarAnexa: "",
  dataEmitere: "",
  dataEveniment: "",
  locatie: "",
  zilePredare: "30",
  zileIncasare: "10",
  observatii: "",
  includeVideo: false,
});
const emptyBudget = () => ({
  valoareServicii: "",
  transport: "",
  diurna: "",
  cazare: "",
  alteCheltuieli: "",
});
const emptyAnexa = () => ({
  eventData: emptyEvent(),
  budgetData: emptyBudget(),
});

const sumBudget = (b) =>
  (Number(b.valoareServicii) || 0) +
  (Number(b.transport) || 0) +
  (Number(b.diurna) || 0) +
  (Number(b.cazare) || 0) +
  (Number(b.alteCheltuieli) || 0);

const anexaNr = (anexaStart, numarAnexa, idx) => {
  const ov = String(numarAnexa || "").trim();
  if (ov) return ov;
  const base = parseInt(anexaStart, 10);
  return String((Number.isFinite(base) && base > 0 ? base : 1) + idx);
};

const calcDataPredare = (dataEveniment, zilePredare) => {
  if (!isValidDmy(dataEveniment) || !zilePredare) return "";
  return addDays(dataEveniment, 1 + Number(zilePredare));
};

// adaugă N zile lucrătoare la o dată dmy (zz-ll-aaaa) și returnează dmy
const addBusinessDaysDmy = (dmy, n) => {
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(dmy || "");
  if (!m || !n) return "";
  const d = new Date(`${m[3]}-${m[2]}-${m[1]}`);
  let added = 0;
  while (added < Number(n)) {
    d.setDate(d.getDate() + 1);
    const wd = d.getDay();
    if (wd !== 0 && wd !== 6) added++;
  }
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
};

const calcTermenIncasare = (dataEveniment, zilePredare, zileIncasare) => {
  const predare = calcDataPredare(dataEveniment, zilePredare);
  return predare ? addBusinessDaysDmy(predare, zileIncasare) : "";
};

const fmt = (n) =>
  new Intl.NumberFormat("ro-RO").format(Number(n) || 0);

function App() {
  const { alert, confirm, prompt } = useDialog();
  const stored = loadLocal();
  const [step, setStep] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { setMenuOpen(false); }, [step]); // închide drawer-ul la navigare (mobil)
  const [showPreview, setShowPreview] = useState(false);
  const [blankPreview, setBlankPreview] = useState(false);
  const [blankData, setBlankData] = useState(null);
  const [printSelection, setPrintSelection] = useState("all");
  const [clientData, setClientData] = useState(stored?.clientData || emptyClient());
  const [anexe, setAnexe] = useState(stored?.anexe || [emptyAnexa()]);
  const [errors, setErrors] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [anafSyncAt, setAnafSyncAt] = useState(null);
  const backupFileRef = useRef(null);
  const fileRef = useRef(null);
  const docFileRef = useRef(null);
  const [fluxOverflowOpen, setFluxOverflowOpen] = useState(false);
  useEffect(() => { setFluxOverflowOpen(false); }, [step]);

  /* Auto-save în preview: dirty flag + debounce. */
  const [isDirty, setIsDirty] = useState(false);
  const autoSaveTimerRef = useRef(null);
  const autoSaveInFlightRef = useRef(false);
  const locationTimerRef = useRef(null);
  const [currentContractId, setCurrentContractId] = useState(stored?.currentContractId || null);
  const [drafturi, setDrafturi] = useState([]);
  const [search, setSearch] = useState("");
  const [bnrConv, setBnrConv] = useState({ currency: "EUR", rate: null, date: "", loading: false, error: "" });

  useEffect(() => {
    saveLocal({ clientData, anexe });
  }, [clientData, anexe]);

  // Avertizare la închiderea ferestrei dacă există modificări nesalvate
  const liveSnapRef = useRef("");
  liveSnapRef.current = JSON.stringify({ c: clientData, a: anexe });
  const savedSnapRef = useRef(null);
  // baseline „salvat” = starea la încărcare sau după schimbarea contractului curent
  useEffect(() => {
    savedSnapRef.current = liveSnapRef.current;
  }, [currentContractId]);
  useEffect(() => {
    const h = (e) => {
      if (savedSnapRef.current !== null && liveSnapRef.current !== savedSnapRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, []);

  useEffect(() => {
    if (step !== "hub-flux") return;
    const unsub = subscribeDrafturi(setDrafturi);
    return unsub;
  }, [step]);

  // Auto-completează numărul contractului la prima încărcare dacă lipsește
  const didInitNrRef = useRef(false);
  useEffect(() => {
    if (didInitNrRef.current) return;
    didInitNrRef.current = true;
    if (!clientData.numarContract && !currentContractId) {
      const n = getNextContractNumber();
      setClientData((prev) => (prev.numarContract ? prev : { ...prev, numarContract: n }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSetStartNumber = async () => {
    const next = peekNextContractNumber();
    const raw = await prompt(
      `Introdu numărul de la care să continue numerotarea automată.\n` +
        `Următorul nr. ar fi: ${next}.\n` +
        `Ex.: dacă ai emis deja până la 42, introdu 43.`,
      String(next),
      { title: "Setează numerotarea" }
    );
    if (raw == null) return;
    const v = parseInt(raw, 10);
    if (!Number.isFinite(v) || v < 1) {
      await alert("Număr invalid.", { variant: "danger" });
      return;
    }
    const start = setContractCounterStart(v);
    const n = getNextContractNumber();
    setClientData((prev) => ({ ...prev, numarContract: n }));
    await alert(`Numerotarea va continua de la ${start}.`, { variant: "success" });
  };

  const handleSetAnexaStart = async () => {
    const cur = parseInt(clientData.anexaStart, 10);
    const curVal = Number.isFinite(cur) && cur > 0 ? cur : 1;
    const raw = await prompt(
      `Introdu numărul de la care încep anexele acestui contract.\n` +
        `Implicit: 1. Ex.: dacă există deja 3 anexe încheiate, introdu 4.`,
      String(curVal),
      { title: "Start nr. anexe" }
    );
    if (raw == null) return;
    const v = parseInt(raw, 10);
    if (!Number.isFinite(v) || v < 1) {
      await alert("Număr invalid.", { variant: "danger" });
      return;
    }
    setClientData((prev) => ({ ...prev, anexaStart: String(v) }));
    await alert(`Anexele vor fi numerotate începând de la ${v}.`, { variant: "success" });
  };

  /* ---------- Actions ---------- */
  const handleSaveToDb = async () => {
    const errs = [];
    let localOk = false;
    let cloudOk = false;

    try {
      const id = await saveContract({ clientData, anexe, id: currentContractId });
      setCurrentContractId(id);
      localOk = true;
    } catch (e) {
      errs.push("Local: " + e.message);
    }

    try {
      await salveazaContract({ silent: true });
      cloudOk = true;
    } catch (e) {
      errs.push("Cloud: " + e.message);
    }

    if (localOk && cloudOk) {
      await alert("Contract salvat local și în Firestore.", { variant: "success" });
    } else if (localOk) {
      await alert("Salvat local, dar a eșuat în cloud.\n" + errs.join("\n"), { variant: "warning" });
    } else if (cloudOk) {
      await alert("Salvat în cloud, dar a eșuat local.\n" + errs.join("\n"), { variant: "warning" });
    } else {
      await alert("Eroare la salvare:\n" + errs.join("\n"), { variant: "danger" });
    }

    if (localOk || cloudOk) {
      const n = getNextContractNumber();
      const freshClient = { ...emptyClient(), numarContract: n };
      const freshAnexe = [emptyAnexa()];
      savedSnapRef.current = JSON.stringify({ c: freshClient, a: freshAnexe });
      setClientData(freshClient);
      setAnexe(freshAnexe);
      setCurrentContractId(null);
      setStep("hub-flux");
    }
  };
  const handleOpenFromFirestore = async (nr) => {
    try {
      const snap = await getDoc(doc(db, "contracte", nr));
      if (!snap.exists()) {
        await alert("Contractul nu a fost găsit în Firestore.", { variant: "warning" });
        return;
      }
      const data = snap.data();
      const cd = data.clientData || data;
      const [evSnap, incSnap] = await Promise.all([
        getDocs(query(collection(db, "evenimente"), where("numarContract", "==", nr))),
        getDocs(query(collection(db, "incasari"), where("numarContract", "==", nr))),
      ]);
      const ev = evSnap.docs.map((d) => d.data()).sort((a, b) => (a.anexaIndex || 0) - (b.anexaIndex || 0));
      const inc = incSnap.docs.map((d) => d.data());
      const strip = (obj, keys) => {
        const out = { ...obj };
        keys.forEach((k) => delete out[k]);
        return out;
      };
      const META = ["anexaIndex", "numarContract", "cuiBeneficiar", "updatedAt", "createdAt", "total"];
      const loadedAnexe = ev.length
        ? ev.map((e) => {
            const i = inc.find((x) => x.anexaIndex === e.anexaIndex) || {};
            return {
              eventData: { ...emptyEvent(), ...strip(e, META) },
              budgetData: { ...emptyBudget(), ...strip(i, META) },
            };
          })
        : [emptyAnexa()];
      setClientData({ ...emptyClient(), ...strip(cd, ["updatedAt", "createdAt"]) });
      setAnexe(loadedAnexe);
      const localRec = await getContractByNumar(nr);
      setCurrentContractId(localRec?.id ?? null);
      setStep("client");
    } catch (e) {
      console.error(e);
      await alert("Eroare la deschidere: " + e.message, { variant: "danger" });
    }
  };

  const onExport = () => exportJSON({ clientData, anexe });
  const onImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await importJSON(file);
      if (data.clientData) setClientData({ ...emptyClient(), ...data.clientData });
      if (Array.isArray(data.anexe)) setAnexe(data.anexe.length ? data.anexe : [emptyAnexa()]);
      setCurrentContractId(null);
    } catch {
      await alert("Fișier invalid.", { variant: "danger" });
    }
    e.target.value = "";
  };

  const handleNewContract = async () => {
    if (!(await confirm("Începi un contract nou? Datele curente vor fi golite."))) return;
    const n = getNextContractNumber();
    setClientData({ ...emptyClient(), numarContract: n });
    setAnexe([emptyAnexa()]);
    setCurrentContractId(null);
    setStep("client");
  };
  const handleImportDocx = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { parsed, missing } = await extractFromDocx(file);
      setClientData((prev) => ({ ...emptyClient(), ...prev, ...parsed }));
      setAnexe([emptyAnexa()]);
      setCurrentContractId(null);
      setStep("client");
      if (missing.length) {
        await alert(
          "Import .docx OK. Câmpuri NEdetectate (completează manual): " +
            missing.join(", "),
          { variant: "warning" }
        );
      } else {
        await alert("Import .docx OK. Verifică datele în formular înainte de salvare.", { variant: "success" });
      }
    } catch (err) {
      console.error(err);
      await alert("Eroare la citirea .docx: " + err.message, { variant: "danger" });
    }
    e.target.value = "";
  };

  const handleShowBlankTemplate = () => {
    if (!blankData) setBlankData({ client: emptyClient(), anexe: [emptyAnexa()] });
    setBlankPreview(true);
    setPrintSelection("all");
    setShowPreview(true);
  };

  const handleSaveAsModel = async () => {
    const clauze = blankData?.client?.clauzeCustom || {};
    const associate = await confirm(
      "Asociezi acest model cu un client anume? Anulează = salvează ca „Model generic” (fără client).",
      { confirmLabel: "Asociez cu client", cancelLabel: "Model generic" }
    );

    let cui = "";
    let numeBeneficiar = "Model generic";

    if (associate) {
      const history = listClientHistory();
      const options = history.map((c) => `${c.numeBeneficiar} — ${c.cui}`).join("\n");
      const input = await prompt(
        `Introdu CUI sau alege din istoric:\n\n${options || "(istoric gol)"}`,
        { defaultValue: "", placeholder: "CUI" }
      );
      if (!input) return;
      const raw = input.replace(/^RO/i, "").trim();
      const client = history.find((c) => (c.cui || "").replace(/^RO/i, "").trim() === raw);
      cui = client?.cui || (raw ? `RO${raw}` : "");
      numeBeneficiar = client?.numeBeneficiar || "";
      if (!numeBeneficiar) {
        const ok = await confirm(`CUI ${raw} nu apare în istoric. Salvez modelul oricum (fără denumire beneficiar)?`, { confirmLabel: "Salvează" });
        if (!ok) return;
      }
    }

    const defaultEvent = blankData?.anexe?.[0]?.eventData || {};
    const defaultBudget = blankData?.anexe?.[0]?.budgetData || {};
    const res = await saveModel({
      cui,
      numeBeneficiar,
      clauzeCustom: clauze,
      defaultEvent,
      defaultBudget,
    });
    if (res.duplicate) {
      await alert("Există deja un model identic salvat — nu îl resalvez.", { variant: "warning" });
    } else {
      await alert(`Model salvat${numeBeneficiar && numeBeneficiar !== "Model generic" ? ` pentru ${numeBeneficiar}` : " (generic)"}. Îl găsești în Bibliotecă → Modele.`, { variant: "success" });
    }
  };

  const handleExportBackup = async () => {
    const data = await exportAll();
    exportJSON(data, `backup-contracte-${todayDmy()}.json`);
  };
  const handleImportBackup = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await importJSON(file);
      const n = await importAll(data);
      await alert(`${n} contracte importate.`, { variant: "success" });
    } catch {
      await alert("Backup invalid.", { variant: "danger" });
    }
    e.target.value = "";
  };

  const onLocationChange = (idx, value) => {
    updateAnexa(idx, "eventData", "locatie", value);
    if (locationTimerRef.current) clearTimeout(locationTimerRef.current);
    locationTimerRef.current = setTimeout(async () => {
      try {
        const res = await searchRoLocations(value);
        setLocationSuggestions(res);
      } catch {
        setLocationSuggestions([]);
      }
    }, 350);
  };

  const handleClientChange = (e) => {
    const { name, value } = e.target;
    setClientData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "iban") {
        const b = bankFromIban(value);
        if (b) next.banca = b;
      }
      if (name === "cui") {
        const existing = findClientByCui(value);
        if (existing && !prev.numeBeneficiar) return { ...next, ...existing };
      }
      return next;
    });
  };

  const autoFetchAnaf = async (manual = false) => {
    if (!clientData.cui || !validateCUI(clientData.cui)) {
      if (manual === true) await alert("CUI lipsă sau invalid. Introdu un CUI corect.", { variant: "warning" });
      return;
    }
    // ANAF are doar firme (CUI 2-10 cifre); pentru CNP (persoană fizică) se sare peste.
    const cleanCui = String(clientData.cui).replace(/^RO/i, "").trim();
    const isCompanyCui = /^\d{2,10}$/.test(cleanCui);
    if (isCompanyCui) {
      try {
        const d = await fetchAnaf(clientData.cui);
        setClientData((prev) => ({ ...prev, ...d }));
        setAnafSyncAt(new Date());
      } catch (e) {
        console.warn("ANAF:", e.message);
        if (manual === true) await alert("ANAF: " + (e?.message || e), { variant: "danger" });
      }
    } else if (manual === true) {
      await alert("CUI-ul pare a fi CNP (persoană fizică). ANAF nu are date pentru persoane fizice.", { variant: "warning" });
    }
    try {
      const modele = await getModeleByCui(clientData.cui);
      if (modele && modele.length > 0) {
        const m = modele[0];
        const ok = await confirm(
          `Există ${modele.length} model${modele.length > 1 ? "e" : ""} salvat pentru acest client (ultimul: ${m.updatedAt?.slice(0, 10) || "—"}). Pornești de la el (clauze + valori implicite)?`,
          { confirmLabel: "Folosește modelul" }
        );
        if (ok) {
          setClientData((prev) => ({ ...prev, clauzeCustom: m.clauzeCustom || {} }));
          setAnexe((prev) => {
            const next = [...prev];
            if (next[0]) {
              next[0] = {
                eventData: { ...next[0].eventData, ...(m.defaultEvent || {}) },
                budgetData: { ...next[0].budgetData, ...(m.defaultBudget || {}) },
              };
            }
            return next;
          });
        }
      }
    } catch (e) {
      console.warn("Modele:", e.message);
    }
  };

  const generateContractNumber = () => {
    const n = getNextContractNumber();
    setClientData((prev) => ({ ...prev, numarContract: n }));
  };

  const generateContractPdfBlob = async () => {
    const source = document.querySelector(".preview-container");
    if (!source) throw new Error("Previzualizarea contractului nu este disponibilă.");
    const [{ default: html2canvas }, jsPDFmod] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);
    const jsPDF = jsPDFmod.jsPDF || jsPDFmod.default;
    const pages = Array.from(source.querySelectorAll(".document-page"));
    if (pages.length === 0) throw new Error("Nu există pagini de exportat.");

    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    const LOGO_W = 42, LOGO_H = 42, LOGO_X = 20, LOGO_Y = 8;
    const FOOTER_W = 180, FOOTER_H = 20, FOOTER_X = 15;
    const FOOTER_Y = pageH - FOOTER_H - 2;
    const CONTENT_TOP = LOGO_Y + LOGO_H + 4;
    const CONTENT_BOTTOM = FOOTER_Y - 2;
    const CONTENT_H = CONTENT_BOTTOM - CONTENT_TOP;

    const loadImg = (src) => new Promise((res) => {
      const im = new Image();
      im.crossOrigin = "anonymous";
      im.onload = () => res(im);
      im.onerror = () => res(null);
      im.src = src;
    });
    const toDataURL = (im, type) => {
      if (!im) return null;
      const c = document.createElement("canvas");
      c.width = im.naturalWidth || im.width;
      c.height = im.naturalHeight || im.height;
      c.getContext("2d").drawImage(im, 0, 0);
      return c.toDataURL(type);
    };
    const [logoImg, footerImg] = await Promise.all([loadImg("/LOGO1.png"), loadImg("/subsol3.jfif")]);
    const logoData = toDataURL(logoImg, "image/png");
    const footerData = toDataURL(footerImg, "image/jpeg");

    const stamp = () => {
      if (logoData) pdf.addImage(logoData, "PNG", LOGO_X, LOGO_Y, LOGO_W, LOGO_H);
      if (footerData) pdf.addImage(footerData, "JPEG", FOOTER_X, FOOTER_Y, FOOTER_W, FOOTER_H);
    };

    let firstPdfPage = true;

    for (let i = 0; i < pages.length; i++) {
      const stripElems = pages[i].querySelectorAll(".print-header, .print-footer");
      const oldDisplay = [];
      stripElems.forEach((el) => { oldDisplay.push(el.style.display); el.style.display = "none"; });

      let canvas;
      try {
        canvas = await html2canvas(pages[i], { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      } finally {
        stripElems.forEach((el, j) => { el.style.display = oldDisplay[j]; });
      }

      const mmPerPx = pageW / canvas.width;
      const canvasHeightMm = canvas.height * mmPerPx;
      const sliceHeightPx = Math.floor(CONTENT_H / mmPerPx);

      if (canvasHeightMm <= CONTENT_H + 0.5) {
        if (!firstPdfPage) pdf.addPage();
        stamp();
        pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, CONTENT_TOP, pageW, canvasHeightMm, undefined, "FAST");
        firstPdfPage = false;
      } else {
        let yOffset = 0;
        while (yOffset < canvas.height) {
          const thisSlicePx = Math.min(sliceHeightPx, canvas.height - yOffset);
          const sliceCanvas = document.createElement("canvas");
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = thisSlicePx;
          const ctx = sliceCanvas.getContext("2d");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
          ctx.drawImage(canvas, 0, yOffset, canvas.width, thisSlicePx, 0, 0, canvas.width, thisSlicePx);
          const sliceDataURL = sliceCanvas.toDataURL("image/jpeg", 0.92);
          const sliceHeightMm = thisSlicePx * mmPerPx;

          if (!firstPdfPage) pdf.addPage();
          stamp();
          pdf.addImage(sliceDataURL, "JPEG", 0, CONTENT_TOP, pageW, sliceHeightMm, undefined, "FAST");

          yOffset += thisSlicePx;
          firstPdfPage = false;
        }
      }
    }
    return pdf.output("blob");
  };

  const [pdfBusy, setPdfBusy] = useState(false);

  const sendEmail = async () => {
    await flushAutoSave();
    const subject = `Contract nr. ${clientData.numarContract || ""} - ALUMA S.R.L.`;
    const body = `Bună ziua,\n\nVă transmitem contractul nr. ${clientData.numarContract || ""}${clientData.dataContract ? ` din ${clientData.dataContract}` : ""} împreună cu anexele aferente.\n\nVă mulțumim.\n\nCu stimă,\nALUMA S.R.L.`;
    const to = clientData.email || "";
    const sanitize = (s) => (s || "").toString().replace(/[\\/:*?"<>|]/g, "").trim();
    const ben = sanitize(clientData.numeBeneficiar);
    const nrC = sanitize(clientData.numarContract) || "fara-nr";
    const dataC = sanitize(clientData.dataContract);
    const fileName = [ben, `Contract nr ${nrC} + anexe`, dataC].filter(Boolean).join(" - ") + ".pdf";

    let blob;
    setPdfBusy(true);
    try {
      blob = await generateContractPdfBlob();
    } catch (e) {
      setPdfBusy(false);
      await alert("Nu am putut genera PDF-ul: " + (e?.message || e), { variant: "danger" });
      return;
    }
    setPdfBusy(false);

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const file = new File([blob], fileName, { type: "application/pdf" });

    if (isMobile && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: subject, text: body });
        return;
      } catch (e) {
        if (e?.name === "AbortError") return;
      }
    }

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 60_000);

    const url = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
    setTimeout(() => {
      alert(`PDF-ul "${fileName}" a fost descărcat. Atașează-l (drag & drop) în clientul de email care s-a deschis.`, { title: "Email pregătit", variant: "success" });
    }, 300);
  };

  const exportDocx = async () => {
    try {
      await flushAutoSave();
      const source = document.querySelector(".preview-container");
      if (!source) return;

      const absolutize = (root) => {
        root.querySelectorAll("img").forEach((img) => {
          try {
            const abs = new URL(img.getAttribute("src"), window.location.href).href;
            img.setAttribute("src", abs);
          } catch { /* keep */ }
        });
      };

      // Imagini -> dataURL (html-to-docx nu poate fetch-ui async)
      const toDataUrl = async (url) => {
        const r = await fetch(url);
        const b = await r.blob();
        return await new Promise((res, rej) => {
          const fr = new FileReader();
          fr.onload = () => res(fr.result);
          fr.onerror = rej;
          fr.readAsDataURL(b);
        });
      };

      const pages = Array.from(source.querySelectorAll(".document-page"));
      if (pages.length === 0) return;

      // Header / Footer din prima pagină (logo + subsol)
      const firstTable = pages[0].querySelector("table.print-table");
      const headerImg = firstTable?.querySelector("thead img");
      const footerImg = firstTable?.querySelector("tfoot img");
      let headerHTML = "";
      let footerHTML = "";
      // mm -> px @ 96 DPI (html-to-docx folosește atribute width/height în px)
      const mmToPx = (mm) => Math.round(mm * 3.7795);
      if (headerImg) {
        const abs = new URL(headerImg.getAttribute("src"), window.location.href).href;
        const data = await toDataUrl(abs);
        headerHTML = `<p style="margin:0"><img src="${data}" width="${mmToPx(60)}" height="${mmToPx(30)}" /></p>`;
      }
      if (footerImg) {
        const abs = new URL(footerImg.getAttribute("src"), window.location.href).href;
        const data = await toDataUrl(abs);
        footerHTML = `<p style="margin:0;text-align:center"><img src="${data}" width="${mmToPx(180)}" height="${mmToPx(18)}" /></p>`;
      }

      // Conținut: doar tbody-ul fiecărei pagini, cu page-break între
      const bodyParts = [];
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i].cloneNode(true);
        page.querySelectorAll(".no-print, .page-marks").forEach((n) => n.remove());
        absolutize(page);

        // Semnătura imagine: dataURL + dimensiuni atribute HTML
        for (const sign of page.querySelectorAll("img.sign-img")) {
          try {
            const data = await toDataUrl(sign.src);
            sign.setAttribute("src", data);
            sign.setAttribute("width", String(mmToPx(50)));
            sign.setAttribute("height", String(mmToPx(20)));
          } catch { /* ignore */ }
        }

        // Flex -> table pentru .doc-signatures (Word nu înțelege flex)
        for (const sig of page.querySelectorAll(".doc-signatures")) {
          const boxes = Array.from(sig.querySelectorAll(".signature-box"));
          if (boxes.length === 2) {
            const tbl = document.createElement("table");
            tbl.setAttribute("style", "width:100%;margin-top:30pt;border:none");
            const tr = document.createElement("tr");
            boxes.forEach((b) => {
              const td = document.createElement("td");
              td.setAttribute("style", "width:50%;vertical-align:top;border:none;padding:0 6pt");
              td.innerHTML = b.innerHTML;
              tr.appendChild(td);
            });
            tbl.appendChild(tr);
            sig.replaceWith(tbl);
          }
        }

        const tbody = page.querySelector("table.print-table tbody");
        const inner = tbody ? tbody.innerHTML : page.innerHTML;
        const brk = i > 0 ? `<div style="page-break-before:always"></div>` : "";
        bodyParts.push(brk + inner);
      }

      const css = `
        body { font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.15; }
        p { margin: 6pt 0 0 0; text-align: justify; }
        strong, b { font-weight: bold; }
        .doc-title { text-align: center; font-size: 14pt; font-weight: bold; margin: 0 0 5pt 0; text-transform: uppercase; }
        .doc-subtitle { text-align: center; font-weight: bold; margin: 0 0 20pt 0; font-size: 12pt; }
        .text-center { text-align: center; }
        .doc-section { margin: 0 0 15pt 0; }
        .doc-section p { text-indent: 36pt; margin: 6pt 0 0 0; text-align: justify; }
        .doc-section h3 { font-size: 12pt; font-weight: bold; margin: 12pt 0 6pt 0; text-align: center; text-indent: 0; }
        .doc-section ul { margin: 6pt 0 0 0; padding-left: 72pt; }
        .doc-section li { margin: 6pt 0 0 0; text-align: justify; }
        .total-highlight { margin-top: 15pt; text-align: right; font-weight: bold; font-size: 12pt; }
        table { border-collapse: collapse; }
        table.budget-table { width: 100%; }
        table.budget-table td, table.budget-table th { border: 1px solid #000; padding: 4pt; }
      `;

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${bodyParts.join("")}</body></html>`;

      if (!window.HTMLToDOCX) {
        if (typeof window.global === "undefined") window.global = window;
        if (typeof window.Buffer === "undefined") {
          const { Buffer } = await import("buffer");
          window.Buffer = Buffer;
        }
        const scriptUrl = (await import("@turbodocx/html-to-docx/dist/html-to-docx.browser.js?url")).default;
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = scriptUrl;
          s.onload = resolve;
          s.onerror = () => reject(new Error("Nu s-a putut încărca html-to-docx browser bundle"));
          document.head.appendChild(s);
        });
      }
      const htmlToDocx = window.HTMLToDOCX;
      if (typeof htmlToDocx !== "function") throw new Error("HTMLToDOCX indisponibil");

      const blob = await htmlToDocx(html, headerHTML || null, {
        orientation: "portrait",
        pageSize: { width: 11906, height: 16838 }, // A4 in twips
        margins: { top: 850, right: 567, bottom: 1020, left: 1134 }, // 15/10/18/20 mm
        font: "Times New Roman",
        fontSize: 24, // 12pt
        table: { row: { cantSplit: true } },
        header: !!headerHTML,
        footer: !!footerHTML,
        pageNumber: true,
      }, footerHTML || null);

      const finalBlob = blob instanceof Blob
        ? blob
        : new Blob([blob.buffer ? blob.buffer.slice(blob.byteOffset, blob.byteOffset + blob.byteLength) : blob], {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          });
      const url = URL.createObjectURL(finalBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contract-${clientData.numarContract || "draft"}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export Word:", e);
      await alert("Eroare la exportul Word: " + (e?.message || e), { variant: "danger" });
    }
  };

  const updateAnexa = (idx, section, field, value) => {
    setAnexe((prev) =>
      prev.map((a, i) =>
        i === idx ? { ...a, [section]: { ...a[section], [field]: value } } : a
      )
    );
  };
  const addAnexa = () => {
    if (clientData.tipContract === "unic" && anexe.length >= 1) {
      alert("Contractul „Eveniment unic” permite o singură anexă. Schimbă tipul în „Cadru” pentru anexe multiple.");
      return;
    }
    setAnexe((prev) => [...prev, emptyAnexa()]);
    setStep(`anexa-${anexe.length}`);
  };
  const duplicateAnexa = (idx) => {
    if (clientData.tipContract === "unic" && anexe.length >= 1) {
      alert("Contractul „Eveniment unic” permite o singură anexă. Schimbă tipul în „Cadru” pentru anexe multiple.");
      return;
    }
    setAnexe((prev) => [
      ...prev,
      { eventData: { ...prev[idx].eventData }, budgetData: { ...prev[idx].budgetData } },
    ]);
    setStep(`anexa-${anexe.length}`);
  };
  const removeAnexa = (idx) => {
    setAnexe((prev) => prev.filter((_, i) => i !== idx));
    setStep("client");
  };
  const resetAll = async () => {
    if (!(await confirm("Ștergi toate datele?", { variant: "danger", confirmLabel: "Șterge" }))) return;
    setClientData(emptyClient());
    setAnexe([emptyAnexa()]);
    setStep("client");
  };

  /* ---------- Validation ---------- */
  const validate = () => {
    const errs = [];
    if (!clientData.numeBeneficiar) errs.push("Nume Beneficiar lipsă.");
    if (!clientData.reprezentant) errs.push("Reprezentant Legal lipsă.");
    if (!isValidDmy(clientData.dataContract)) errs.push("Data contractului trebuie zz-ll-aaaa.");
    if (clientData.tipContract === "cadru") {
      if (!isValidDmy(clientData.dataExpirare)) errs.push("Contract cadru: data de expirare este obligatorie (zz-ll-aaaa).");
      else if (clientData.dataExpirare && clientData.dataContract && parseDmy(clientData.dataExpirare) <= parseDmy(clientData.dataContract)) {
        errs.push("Data expirării trebuie să fie ulterioară datei contractului.");
      }
    }
    if (clientData.tipContract === "unic" && anexe.length > 1) {
      errs.push("Contract „Eveniment unic”: este permisă o singură anexă.");
    }
    if (clientData.cui && !validateCUI(clientData.cui)) errs.push("CUI/CNP are format invalid.");
    if (clientData.iban && !validateIBAN(clientData.iban)) errs.push("IBAN are format invalid.");
    anexe.forEach((a, i) => {
      const n = i + 1;
      if (!a.eventData.scop) errs.push(`Anexa ${n}: scop lipsă.`);
      if (!isValidDmy(a.eventData.dataEveniment)) errs.push(`Anexa ${n}: data evenimentului trebuie zz-ll-aaaa.`);
      if (!a.eventData.locatie) errs.push(`Anexa ${n}: locație lipsă.`);
      if (!a.eventData.zilePredare) errs.push(`Anexa ${n}: zile predare lipsă.`);
      if (!a.budgetData.valoareServicii) errs.push(`Anexa ${n}: valoare servicii lipsă.`);
    });
    return errs;
  };

  const salveazaContract = async ({ silent = false } = {}) => {
    const nr = (clientData.numarContract || "").trim();
    if (!nr) {
      const msg = "Contractul nu are număr. Generează un număr înainte de salvare.";
      if (silent) throw new Error(msg);
      await alert(msg, { variant: "warning" });
      return;
    }
    try {
      const keepIds = new Set(anexe.map((_, i) => `${nr}_A${i + 1}`));
      for (const col of ["evenimente", "incasari"]) {
        const snap = await getDocs(query(collection(db, col), where("numarContract", "==", nr)));
        await Promise.all(
          snap.docs
            .filter((d) => !keepIds.has(d.id))
            .map((d) => deleteDoc(doc(db, col, d.id)))
        );
      }

      for (let i = 0; i < anexe.length; i++) {
        const a = anexe[i];
        const total = sumBudget(a.budgetData);
        const anexaId = `${nr}_A${i + 1}`;

        await setDoc(doc(db, "evenimente", anexaId), {
          ...a.eventData,
          numarContract: nr,
          cuiBeneficiar: clientData.cui,
          anexaIndex: i + 1,
          updatedAt: serverTimestamp(),
        });

        await setDoc(doc(db, "incasari", anexaId), {
          ...a.budgetData,
          total,
          numarContract: nr,
          cuiBeneficiar: clientData.cui,
          anexaIndex: i + 1,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }

      // Dual-write — schema nouă (contracte/{nr} + anexe + beneficiari/{cui}).
      // Best-effort: dacă pică, NU întrerupe salvarea pe schema veche.
      try {
        await saveContractV2({ clientData, anexe });
        if (clientData.cui) await upsertBeneficiar(clientData);
      } catch (e) {
        console.warn("Dual-write V2 a eșuat (schema veche e ok):", e);
      }

      if (!silent) await alert("Datele au fost salvate cu succes în Firestore.", { variant: "success" });
    } catch (e) {
      console.error("Firestore:", e);
      if (silent) throw e;
      await alert("Eroare la salvarea în Firestore: " + e.message, { variant: "danger" });
    }
  };

  const doAutoSave = async () => {
    if (blankPreview) return;
    if (!clientData.numarContract) return;
    if (autoSaveInFlightRef.current) return;
    autoSaveInFlightRef.current = true;
    try {
      await salveazaContract({ silent: true });
      setIsDirty(false);
    } catch (e) {
      console.warn("Auto-save:", e?.message || e);
    } finally {
      autoSaveInFlightRef.current = false;
    }
  };
  const scheduleAutoSave = () => {
    if (blankPreview) return;
    setIsDirty(true);
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      autoSaveTimerRef.current = null;
      doAutoSave();
    }, 2000);
  };
  const flushAutoSave = async () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    if (isDirty || autoSaveInFlightRef.current) {
      await doAutoSave();
    }
  };

  const handleGenerate = (selection = "all") => {
    const errs = validate();
    setErrors(errs);
    if (errs.length === 0) {
      saveClientHistory(clientData);
      setPrintSelection(selection);
      setShowPreview(true);
      doAutoSave();
    }
  };

  /* ---------- Derived ---------- */
  const totalGeneral = useMemo(
    () => anexe.reduce((s, a) => s + sumBudget(a.budgetData), 0),
    [anexe]
  );
  const totalsByLine = useMemo(() => {
    const t = { valoareServicii: 0, transport: 0, diurna: 0, cazare: 0, alteCheltuieli: 0 };
    anexe.forEach((a) => {
      Object.keys(t).forEach((k) => (t[k] += Number(a.budgetData[k]) || 0));
    });
    return t;
  }, [anexe]);

  const checklist = useMemo(() => {
    const items = [];
    items.push({ ok: !!clientData.numeBeneficiar, text: "Denumire beneficiar completată" });
    items.push({ ok: !!clientData.reprezentant, text: "Reprezentant legal completat" });
    items.push({ ok: !!clientData.cui && validateCUI(clientData.cui), text: "CUI / CNP cu format corect" });
    items.push({ ok: !!clientData.iban && validateIBAN(clientData.iban), text: "IBAN cu format corect" });
    items.push({ ok: isValidDmy(clientData.dataContract), text: "Data contract validă" });
    anexe.forEach((a, i) => {
      const ok =
        !!a.eventData.scop &&
        isValidDmy(a.eventData.dataEveniment) &&
        !!a.eventData.locatie &&
        !!a.budgetData.valoareServicii;
      items.push({ ok, text: `Anexa ${i + 1} — eveniment & buget complet` });
    });
    return items;
  }, [clientData, anexe]);

  const doneCount = checklist.filter((c) => c.ok).length;

  /* ====================================================================
     PREVIEW MODE
     ==================================================================== */
  if (showPreview) {
    const previewClient = blankPreview ? (blankData?.client || emptyClient()) : clientData;
    const previewAnexe = blankPreview ? (blankData?.anexe || [emptyAnexa()]) : anexe;
    const setPreviewClauze = (cc) => {
      if (blankPreview) {
        setBlankData((prev) => ({ ...prev, client: { ...prev.client, clauzeCustom: cc } }));
      } else {
        setClientData((p) => ({ ...p, clauzeCustom: cc }));
        scheduleAutoSave();
      }
    };
    const setPreviewData = (iso) => {
      const v = normalizeDate(iso);
      if (blankPreview) {
        setBlankData((prev) => ({ ...prev, client: { ...prev.client, dataContract: v } }));
      } else {
        setClientData((p) => ({ ...p, dataContract: v }));
        scheduleAutoSave();
      }
    };
    const setPreviewAnexaData = (idx, iso) => {
      const v = normalizeDate(iso);
      const apply = (an, i) =>
        i === idx ? { ...an, eventData: { ...an.eventData, dataEmitere: v } } : an;
      if (blankPreview) {
        setBlankData((prev) => ({ ...prev, anexe: (prev.anexe || []).map(apply) }));
      } else {
        setAnexe((prev) => prev.map(apply));
        scheduleAutoSave();
      }
    };
    const showContract = printSelection === "all" || printSelection === "contract";
    const sanitizeFilename = (s) => (s || "").replace(/[\\/:*?"<>|]/g, "").trim();
    const buildPdfTitle = () => {
      const ben = sanitizeFilename(previewClient.numeBeneficiar);
      const nrC = sanitizeFilename(previewClient.numarContract) || "fara-nr";
      const dataC = sanitizeFilename(previewClient.dataContract);
      let core;
      let dataPart = dataC;
      if (printSelection === "all") {
        core = `Contract nr ${nrC} + anexe`;
      } else if (printSelection === "contract") {
        core = `Contract nr ${nrC}`;
      } else {
        const a = previewAnexe[printSelection];
        const nrA = anexaNr(previewClient.anexaStart, a?.eventData?.numarAnexa, printSelection);
        core = `Anexa nr ${nrA} la contract nr ${nrC}`;
        dataPart = sanitizeFilename(a?.eventData?.dataEmitere) || dataC;
      }
      return [ben, core, dataPart].filter(Boolean).join(" - ");
    };
    const handlePrint = async () => {
      await flushAutoSave();
      const original = document.title;
      document.title = buildPdfTitle();
      const restore = () => {
        document.title = original;
        window.removeEventListener("afterprint", restore);
      };
      window.addEventListener("afterprint", restore);
      window.print();
    };
    const visibleAnexe =
      printSelection === "all"
        ? previewAnexe.map((a, i) => ({ ...a, idx: i }))
        : typeof printSelection === "number"
          ? [{ ...previewAnexe[printSelection], idx: printSelection }]
          : [];

    return (
      <div className="preview-container">
        <div className="no-print print-controls">
          <button className="back-btn" onClick={async () => { await flushAutoSave(); setShowPreview(false); setBlankPreview(false); }}>
            ← Înapoi la editare
          </button>
          {!blankPreview && isDirty && (
            <span title="Modificări nesalvate — se salvează automat" style={{ alignSelf: "center", padding: "4px 10px", background: "#FEF3C7", color: "#92400E", borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
              · nesalvat
            </span>
          )}
          {blankPreview && (
            <span style={{ alignSelf: "center", padding: "4px 10px", background: "#FEF3C7", color: "#92400E", borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
              MODEL BLANK · pentru pre-acord client
            </span>
          )}
          <select
            value={printSelection}
            onChange={(e) => {
              const v = e.target.value;
              setPrintSelection(v === "all" || v === "contract" ? v : Number(v));
            }}
          >
            <option value="all">Contract + toate anexele</option>
            <option value="contract">Doar contract</option>
            {previewAnexe.map((_, i) => (
              <option key={i} value={i}>Doar Anexa nr. {i + 1}</option>
            ))}
          </select>
          {!blankPreview && printSelection === "all" && anexe.length > 1 && (
            <span style={{ alignSelf: "center", fontFamily: "Instrument Serif, serif", fontSize: 18 }}>
              Total general: {fmt(totalGeneral)} LEI
            </span>
          )}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button className="back-btn" onClick={() => setEditMode((v) => !v)}>
              {editMode ? "Ieși din editare" : "Editare inline"}
            </button>
            <button className="back-btn" onClick={exportDocx}>Export Word</button>
            <button className="back-btn" onClick={handlePrint}>⬇ Descarcă PDF</button>
            <button className="back-btn" onClick={sendEmail} disabled={pdfBusy}>
              {pdfBusy ? "Se generează…" : "Trimite email"}
            </button>
            {blankPreview && (
              <button className="back-btn" onClick={handleSaveAsModel} title="Salvează acest model editat pentru un client">
                <Icon name="save" /> Salvează ca model
              </button>
            )}
            <button className="print-btn" onClick={handlePrint}>Printează / PDF</button>
          </div>
        </div>

        <div className="no-print print-note">
          <strong>Pentru PDF curat:</strong> în dialogul de print → „More settings" → debifează
          <em> „Headers and footers"</em> și setează <em>Margins: None</em>. Destinație:
          <em> Save as PDF</em>.
        </div>

        {showContract && (
          <Contract
            clientData={previewClient}
            anyVideo={!!clientData.includeVideo || previewAnexe.some((a) => a?.eventData?.includeVideo)}
            editMode={editMode}
            onClauzeChange={setPreviewClauze}
            onDataChange={setPreviewData}
          />
        )}
        {visibleAnexe.map((a) => (
          <Anexa
            key={a.idx}
            anexaNumber={anexaNr(previewClient.anexaStart, a.eventData.numarAnexa, a.idx)}
            clientData={previewClient}
            eventData={{
              ...a.eventData,
              dataPredare: calcDataPredare(a.eventData.dataEveniment, a.eventData.zilePredare),
              termenIncasare: calcTermenIncasare(a.eventData.dataEveniment, a.eventData.zilePredare, a.eventData.zileIncasare),
            }}
            budgetData={a.budgetData}
            calculeazaTotal={() => sumBudget(a.budgetData)}
            editMode={editMode}
            onClauzeChange={setPreviewClauze}
            onDataChange={(iso) => setPreviewAnexaData(a.idx, iso)}
          />
        ))}
      </div>
    );
  }

  /* ====================================================================
     EDIT MODE
     ==================================================================== */
  const anexaIdx =
    typeof step === "string" && step.startsWith("anexa-") ? Number(step.split("-")[1]) : null;
  const currentAnexa = anexaIdx !== null ? anexe[anexaIdx] : null;

  /* Reusable date field */
  const dateField = (value, onChange, label) => {
    const isoVal = (() => {
      const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value || "");
      return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
    })();
    return (
      <div className="field">
        <label>{label} <span className="hint" style={{ textTransform: "none", letterSpacing: 0 }}>(zz-ll-aaaa)</span></label>
        <div className="date-with-cal">
          <input
            type="text"
            placeholder="zz-ll-aaaa"
            value={value}
            onChange={onChange}
            onBlur={(e) => {
              const n = normalizeDate(e.target.value);
              if (n !== e.target.value) onChange({ target: { value: n } });
            }}
            style={{ borderColor: value && !isValidDmy(value) ? "var(--danger)" : undefined }}
          />
          <div style={{ position: "relative" }}>
            <button
              type="button"
              className="cal-btn"
              onClick={(e) => {
                const inp = e.currentTarget.nextElementSibling;
                if (inp?.showPicker) inp.showPicker();
                else inp?.focus();
              }}
            >
              <Icon name="calendar" /> Calendar
            </button>
            <input
              type="date"
              value={isoVal}
              onChange={(e) => onChange({ target: { value: normalizeDate(e.target.value) } })}
              style={{ position: "absolute", left: 0, top: "100%", width: 0, height: 0, opacity: 0, border: 0, padding: 0, pointerEvents: "none" }}
            />
          </div>
        </div>
      </div>
    );
  };

  const isAnnex = currentAnexa !== null;
  const isClient = step === "client";
  const isDashboard = step === "dashboard";
  const isRapoarte = step === "rapoarte";
  const isSaved = step === "salvate" || step === "biblioteca-contracte" || step === "biblioteca-clienti" || step === "biblioteca-modele";
  const isHubFlux = step === "hub-flux";
  const isHubBiblioteca = step === "hub-biblioteca";
  const isHubSistem = step === "hub-sistem";
  const isCont = step === "cont";
  const isHub = isHubFlux || isHubBiblioteca || isHubSistem;
  const bibliotecaTab = step === "biblioteca-clienti" ? "clienti" : step === "biblioteca-modele" ? "modele" : "contracte";

  const refreshDrafturi = async () => {
    try { setDrafturi(await listDrafturi()); } catch { setDrafturi([]); }
  };

  const handleOpenDraft = async (id) => {
    try {
      const rec = await getContract(id);
      if (!rec) { await alert("Draft inexistent.", { variant: "warning" }); return; }
      setClientData({ ...emptyClient(), ...(rec.clientData || {}) });
      setAnexe(Array.isArray(rec.anexe) && rec.anexe.length ? rec.anexe : [emptyAnexa()]);
      setCurrentContractId(rec.id);
      setStep("client");
    } catch (e) {
      await alert("Eroare la deschidere draft: " + e.message, { variant: "danger" });
    }
  };
  const handleDeleteDraft = async (id) => {
    if (!(await confirm("Ștergi acest draft definitiv?", { variant: "danger", confirmLabel: "Șterge" }))) return;
    try {
      await deleteContract(id);
      if (currentContractId === id) setCurrentContractId(null);
      await refreshDrafturi();
    } catch (e) {
      await alert("Eroare la ștergere: " + e.message, { variant: "danger" });
    }
  };
  const handleMarkTrimis = async () => {
    if (!currentContractId) { await alert("Salvează contractul mai întâi.", { variant: "warning" }); return; }
    if (!(await confirm("Marchezi contractul ca trimis? Va dispărea din lista de drafturi."))) return;
    try {
      await markContractTrimis(currentContractId);
      await refreshDrafturi();
      await alert("Contract marcat ca trimis.", { variant: "success" });
    } catch (e) {
      await alert("Eroare: " + e.message, { variant: "danger" });
    }
  };

  return (
    <div className={`app-container no-print${menuOpen ? " menu-open" : ""}`}>
      <div
        className="sidebar-backdrop"
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />
      {/* ============ SIDEBAR ============ */}
      <aside className="app-sidebar">
        <div
          className="brand"
          onClick={() => setStep("dashboard")}
          role="button"
          tabIndex={0}
          title="Mergi la Dashboard"
          style={{ cursor: "pointer" }}
        >
          <img src="/LOGO1.png" alt="Ioana Apostol" className="brand-logo" draggable="false" />
          <div className="brand-name">Aluma</div>
          <div className="brand-sub">v{__APP_VERSION__}</div>
        </div>

        <div className="nav-section-label">Panou</div>
        <button
          className={`nav-item ${isDashboard ? "active" : ""}`}
          onClick={() => setStep("dashboard")}
        >
          <span><Icon name="home" /> Dashboard</span>
        </button>
        <button
          className={`nav-item ${isRapoarte ? "active" : ""}`}
          onClick={() => setStep("rapoarte")}
        >
          <span><Icon name="chart" /> Rapoarte</span>
        </button>

        <div
          className={`nav-section-label clickable ${isHubFlux ? "active" : ""}`}
          onClick={() => setStep("hub-flux")}
          role="button"
          tabIndex={0}
        >Flux contract</div>

        <button
          className={`nav-item ${isClient || isAnnex ? "active" : ""}`}
          onClick={() => setStep("client")}
        >
          <span><Icon name="folder" /> Editor contract</span>
          {anexe.length > 0 && <span className="nav-meta">{anexe.length}</span>}
        </button>
        <button className="nav-item" onClick={handleNewContract}>
          <span><Icon name="plus" /> Contract nou</span>
        </button>

        <div
          className={`nav-section-label clickable ${isHubBiblioteca ? "active" : ""}`}
          onClick={() => setStep("hub-biblioteca")}
          role="button"
          tabIndex={0}
        >Bibliotecă</div>
        <button
          className={`nav-item ${step === "biblioteca-contracte" || step === "salvate" ? "active" : ""}`}
          onClick={() => setStep("biblioteca-contracte")}
        >
          <span><Icon name="folder" /> Contracte</span>
        </button>
        <button
          className={`nav-item ${step === "biblioteca-clienti" ? "active" : ""}`}
          onClick={() => setStep("biblioteca-clienti")}
        >
          <span><Icon name="users" /> Clienți</span>
        </button>
        <button
          className={`nav-item ${step === "biblioteca-modele" ? "active" : ""}`}
          onClick={() => setStep("biblioteca-modele")}
        >
          <span><Icon name="ruler" /> Modele</span>
        </button>

        <div
          className={`nav-section-label clickable ${isHubSistem ? "active" : ""}`}
          onClick={() => setStep("hub-sistem")}
          role="button"
          tabIndex={0}
        >Sistem</div>
        <button className="nav-item" onClick={onExport}>
          <span><Icon name="download" /> Export JSON</span>
        </button>
        <button className="nav-item" onClick={() => fileRef.current?.click()}>
          <span><Icon name="upload" /> Import JSON</span>
        </button>
        <input ref={fileRef} type="file" accept="application/json" style={{ display: "none" }} onChange={onImport} />
        <button className="nav-item" onClick={handleExportBackup}>
          <span><Icon name="download" /> Backup DB</span>
        </button>
        <button className="nav-item" onClick={() => backupFileRef.current?.click()}>
          <span><Icon name="upload" /> Restaurează backup</span>
        </button>
        <input ref={backupFileRef} type="file" accept="application/json" style={{ display: "none" }} onChange={handleImportBackup} />
        <button className="nav-item" onClick={() => docFileRef.current?.click()}>
          <span><Icon name="inbox-down" /> Import .docx / PDF</span>
        </button>
        <input ref={docFileRef} type="file" accept=".docx,.pdf" style={{ display: "none" }} onChange={handleImportDocx} />
        <button
          className={`nav-item ${isCont ? "active" : ""}`}
          onClick={() => setStep("cont")}
        >
          <span><Icon name="user" /> Contul meu</span>
        </button>

        <div className="sidebar-bottom">
          <div className="user-chip">
            <div className="avatar">AL</div>
            <div className="user-meta">
              <div className="user-name">ALUMA S.R.L.</div>
              <div className="user-role">Editor contracte</div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* ============ MAIN ============ */}
      <main className="app-main">

        {/* Topbar */}
        <div className="topbar">
          <button
            type="button"
            className="hamburger"
            aria-label="Meniu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span /><span /><span />
          </button>
          <div className="topbar-search">
            <input
              type="text"
              placeholder="Caută client, contract, CUI…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); if (step !== "salvate") setStep("salvate"); }}
            />
            <span className="kbd-hint">⌘K</span>
          </div>
          <div className="top-actions"></div>
        </div>

        {/* Dashboard */}
        {isDashboard && (
          <Dashboard
            onNewContract={handleNewContract}
            onOpenContract={handleOpenFromFirestore}
            onGoLibrary={(t) => setStep(t === "clienti" ? "biblioteca-clienti" : "biblioteca-contracte")}
            onGoReports={() => setStep("rapoarte")}
            onShowBlankTemplate={handleShowBlankTemplate}
          />
        )}

        {/* Rapoarte */}
        {isRapoarte && (
          <Rapoarte
            onOpenContract={handleOpenFromFirestore}
            onNewContract={handleNewContract}
          />
        )}

        {/* Hub: Flux contract */}
        {isHubFlux && (
          <>
            <HubPage
              title="Flux contract"
              subtitle="Pași pentru contractul curent — beneficiar, anexe și adăugare anexă nouă."
              cards={[
                {
                  color: "#EF4444",
                  icon: "＋",
                  label: "Contract nou",
                  desc: "Pornește un contract gol",
                  onClick: handleNewContract,
                },
                {
                  color: "#6366F1",
                  icon: "1",
                  label: "Beneficiar",
                  desc: clientData.numeBeneficiar || "Date client",
                  onClick: () => setStep("client"),
                },
                ...anexe.map((a, i) => ({
                  color: "#34CAE8",
                  icon: String(i + 2),
                  label: `Anexa ${i + 1}${a.eventData.scop ? ` · ${a.eventData.scop.slice(0, 20)}` : ""}`,
                  desc: `${fmt(sumBudget(a.budgetData))} LEI`,
                  onClick: () => setStep(`anexa-${i}`),
                })),
                {
                  color: "#10B981",
                  icon: <Icon name="plus" />,
                  label: "Adaugă anexă",
                  desc: "Anexă nouă la contract",
                  onClick: () => { addAnexa(); },
                },
                {
                  color: "#A3A3A3",
                  icon: <Icon name="check" />,
                  label: "Marchează trimis",
                  desc: currentContractId ? "Scoate contractul din drafturi" : "Salvează contractul mai întâi",
                  onClick: handleMarkTrimis,
                  disabled: !currentContractId,
                },
              ]}
            />
            <div className="dash" style={{ paddingTop: 0 }}>
              <div className="section-cap">Drafturi ({drafturi.length})</div>
              {drafturi.length === 0 ? (
                <div style={{ padding: "16px 0", color: "#737373", fontSize: 13 }}>
                  Niciun draft. Contractele salvate apar aici până le marchezi ca trimise.
                </div>
              ) : (
                <div className="qa-grid">
                  {drafturi.map((d) => (
                    <div
                      key={d.id}
                      className="qa"
                      style={{ "--qa-color": "#F59E0B", cursor: "default" }}
                    >
                      <div className="qa-icon"><Icon name="edit-doc" /></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="qa-label">
                          {d.numeBeneficiar || "(fără beneficiar)"} · #{d.numarContract || "—"}
                        </div>
                        <div className="qa-desc">
                          {fmt(d.total || 0)} LEI · {(d.updatedAt || "").slice(0, 10)}
                        </div>
                        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                          <button
                            type="button"
                            className="pill"
                            onClick={(e) => { e.stopPropagation(); handleOpenDraft(d.id); }}
                          >Deschide</button>
                          <button
                            type="button"
                            className="pill warn"
                            onClick={(e) => { e.stopPropagation(); handleDeleteDraft(d.id); }}
                          >Șterge</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Hub: Bibliotecă */}
        {isHubBiblioteca && (
          <HubPage
            title="Bibliotecă"
            subtitle="Răsfoiește contractele salvate și istoricul beneficiarilor."
            cards={[
              {
                color: "#F59E0B",
                icon: <Icon name="folder" />,
                label: "Contracte",
                desc: "Contractele salvate",
                onClick: () => setStep("biblioteca-contracte"),
              },
              {
                color: "#8B5CF6",
                icon: <Icon name="users" />,
                label: "Clienți",
                desc: "Istoricul beneficiarilor",
                onClick: () => setStep("biblioteca-clienti"),
              },
              {
                color: "#0EA5E9",
                icon: <Icon name="ruler" />,
                label: "Modele",
                desc: "Modele de contract per client",
                onClick: () => setStep("biblioteca-modele"),
              },
            ]}
          />
        )}

        {/* Hub: Sistem */}
        {isHubSistem && (
          <HubPage
            title="Sistem"
            subtitle="Operațiuni asupra datelor — backup, import, export."
            cards={[
              { color: "#10B981", icon: <Icon name="download" />, label: "Export JSON", desc: "Exportă contractul curent", onClick: onExport },
              { color: "#1F7A3B", icon: <Icon name="download" />, label: "Export Excel", desc: "Workbook .xlsx — TOATE contractele, anexele și beneficiarii (fără filtre)", onClick: async () => {
                if (!(await confirm("Vei exporta TOATE contractele, anexele și beneficiarii (fără filtre). Continui?", { confirmLabel: "Exportă tot" }))) return;
                try {
                  const r = await exportAllExcel();
                  await alert(`Export complet: ${r.contracte} contracte, ${r.anexe} anexe, ${r.beneficiari} beneficiari.`, { variant: "success" });
                } catch (e) {
                  await alert("Eroare la export Excel: " + e.message, { variant: "danger" });
                }
              } },
              { color: "#34CAE8", icon: <Icon name="upload" />, label: "Import JSON", desc: "Încarcă contract din JSON", onClick: () => fileRef.current?.click() },
              { color: "#F59E0B", icon: <Icon name="download" />, label: "Backup DB", desc: "Backup integral baza locală", onClick: handleExportBackup },
              { color: "#EF4444", icon: <Icon name="upload" />, label: "Restaurează backup", desc: "Restaurează din backup", onClick: () => backupFileRef.current?.click() },
              { color: "#8B5CF6", icon: <Icon name="inbox-down" />, label: "Import .docx / PDF", desc: "Pre-populează din Word/PDF", onClick: () => docFileRef.current?.click() },
              { color: "#0EA5E9", icon: <Icon name="user" />, label: "Contul meu", desc: "Parolă, email, telefon", onClick: () => setStep("cont") },
            ]}
          />
        )}

        {/* Contul meu */}
        {isCont && <ContSetari />}

        {/* Content */}
        {!isDashboard && !isRapoarte && !isHub && !isCont && (
        <div className={`content ${isSaved ? "single" : ""}`}>

          {/* Flux tabs (sticky) */}
          {!isSaved && (isClient || isAnnex) && (() => {
            const N = anexe.length;
            const W = 5;
            let start, end;
            if (N <= W) { start = 0; end = N; }
            else if (anexaIdx == null) { start = N - W; end = N; }
            else {
              start = Math.max(0, Math.min(anexaIdx - 2, N - W));
              end = start + W;
            }
            const hiddenBefore = anexe.slice(0, start).map((a, i) => ({ a, i }));
            const hiddenAfter = anexe.slice(end).map((a, i) => ({ a, i: end + i }));
            const hidden = [...hiddenBefore, ...hiddenAfter];
            const canAddAnexa = !(clientData.tipContract === "unic" && anexe.length >= 1);
            return (
              <div className="flux-tabs">
                <button
                  type="button"
                  className={`flux-tab ${isClient ? "on" : ""}`}
                  onClick={() => setStep("client")}
                >Beneficiar</button>
                {anexe.slice(start, end).map((a, i) => {
                  const idx = start + i;
                  const active = step === `anexa-${idx}`;
                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`flux-tab ${active ? "on" : ""}`}
                      title={a.eventData.scop || `Anexa ${idx + 1}`}
                      onClick={() => setStep(`anexa-${idx}`)}
                    >
                      <span className="ft-mono">A{anexaNr(clientData.anexaStart, a.eventData.numarAnexa, idx)}</span>
                    </button>
                  );
                })}
                {hidden.length > 0 && (
                  <div className="flux-overflow">
                    <button
                      type="button"
                      className="flux-tab overflow-trigger"
                      aria-expanded={fluxOverflowOpen}
                      onClick={() => setFluxOverflowOpen((v) => !v)}
                      title="Toate anexele"
                    >
                      <span className="ft-count">{N}</span>
                      <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3 4.5l3 3 3-3" />
                      </svg>
                    </button>
                    {fluxOverflowOpen && (
                      <>
                        <div className="flux-overflow-backdrop" onClick={() => setFluxOverflowOpen(false)} />
                        <div className="flux-overflow-menu">
                          {anexe.map((a, i) => {
                            const visible = i >= start && i < end;
                            const active = step === `anexa-${i}`;
                            return (
                              <button
                                key={i}
                                type="button"
                                className={`flux-overflow-item ${visible ? "visible" : ""} ${active ? "active" : ""}`}
                                onClick={() => { setStep(`anexa-${i}`); setFluxOverflowOpen(false); }}
                              >
                                <span className="oi-num">A{anexaNr(clientData.anexaStart, a.eventData.numarAnexa, i)}</span>
                                <span className="oi-label">{a.eventData.scop || "—"}</span>
                                <span className="oi-val">{fmt(sumBudget(a.budgetData))}</span>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}
                {canAddAnexa && (
                  <button
                    type="button"
                    className="flux-tab add"
                    onClick={addAnexa}
                    title="Adaugă anexă"
                  >
                    <Icon name="plus" />
                    <span>Anexă</span>
                  </button>
                )}
                <div style={{ flex: 1 }} />
                {isAnnex && (
                  <>
                    {canAddAnexa && (
                      <button type="button" className="btn ghost btn-sm" onClick={() => duplicateAnexa(anexaIdx)}>Duplică</button>
                    )}
                    {anexe.length > 1 && (
                      <button type="button" className="btn ghost danger btn-sm" onClick={() => removeAnexa(anexaIdx)}>Șterge</button>
                    )}
                  </>
                )}
              </div>
            );
          })()}

          {/* Page head */}
          {!isSaved && (
            <div className="page-head">
              <div>
                <div className="eyebrow">
                  {clientData.tipContract === "unic" ? "Eveniment unic" : "Contract cadru"} · {anexe.length} {anexe.length === 1 ? "anexă" : "anexe"}
                </div>
                <h1>
                  {clientData.numeBeneficiar
                    ? <>Contract pentru <em>{clientData.numeBeneficiar}</em></>
                    : <em>Contract nou</em>}
                </h1>
                {clientData.numeBeneficiar && (
                  <div className="sub">
                    Servicii profesionale conform clauzelor contract-cadru și anexelor aferente.
                  </div>
                )}
              </div>
              <div className="page-head-right">
                <div className="ph-label">Data emitere</div>
                <label className="date-3up clickable" title="Schimbă data emiterii">
                  {(() => {
                    const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(clientData.dataContract || "");
                    return m
                      ? <><span>{m[1]}</span><i>·</i><span>{m[2]}</span><i>·</i><span>{m[3]}</span></>
                      : <span>—</span>;
                  })()}
                  <input
                    type="date"
                    value={(() => {
                      const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(clientData.dataContract || "");
                      return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
                    })()}
                    onChange={(e) => setClientData({ ...clientData, dataContract: normalizeDate(e.target.value) })}
                  />
                </label>
              </div>
            </div>
          )}

          {/* LEFT COLUMN */}
          <div className="left-col">

            {/* CLIENT STEP */}
            {isClient && (
              <section className="card">
                <div
                  className="card-strip"
                  style={{
                    borderTop: "none",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  <div className="strip-cell">
                    <div className="cell-label">Contract</div>
                    <div className="cell-value mono">{clientData.numarContract || "—"}</div>
                  </div>
                  <div className="strip-cell wide">
                    <div className="cell-label">Valabilitate</div>
                    <div className="cell-value">
                      Emitere <strong>{clientData.dataContract || "—"}</strong>
                      {clientData.tipContract === "unic" ? (
                        <> · Valabil până la predarea materialelor și încasarea integrală</>
                      ) : (
                        clientData.dataExpirare && <> · Valabil până la <strong>{clientData.dataExpirare}</strong></>
                      )}
                    </div>
                  </div>
                  <button type="button" className="strip-action" onClick={generateContractNumber}>
                    Generează nr.
                  </button>
                  <button type="button" className="strip-action" onClick={handleSetStartNumber} title="Setează numărul de pornire pentru numerotarea automată">
                    Start nr.
                  </button>
                  <button
                    type="button"
                    className="strip-action with-date"
                    onClick={(e) => {
                      const inp = e.currentTarget.querySelector('input[type="date"]');
                      if (inp?.showPicker) inp.showPicker();
                      else inp?.focus();
                    }}
                  >
                    <span><Icon name="calendar" /></span>
                    <span>Schimbă emiterea</span>
                    <input
                      type="date"
                      tabIndex={-1}
                      value={(() => {
                        const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(clientData.dataContract || "");
                        return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
                      })()}
                      onChange={(e) => setClientData({ ...clientData, dataContract: normalizeDate(e.target.value) })}
                    />
                  </button>
                  {clientData.tipContract === "cadru" && (
                    <button
                      type="button"
                      className="strip-action with-date"
                      onClick={(e) => {
                        const inp = e.currentTarget.querySelector('input[type="date"]');
                        if (inp?.showPicker) inp.showPicker();
                        else inp?.focus();
                      }}
                    >
                      <span><Icon name="calendar" /></span>
                      <span>Schimbă valabilitate</span>
                      <input
                        type="date"
                        tabIndex={-1}
                        value={(() => {
                          const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(clientData.dataExpirare || "");
                          return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
                        })()}
                        onChange={(e) => setClientData({ ...clientData, dataExpirare: normalizeDate(e.target.value) })}
                      />
                    </button>
                  )}
                </div>
                <div className="section">
                  <div className="section-head">
                    <span className="idx">01</span>
                    <h2>Beneficiar</h2>
                    <span className="helper">Datele se completează automat din ANAF după CUI.</span>
                  </div>

                  <div className="grid-2" style={{ marginBottom: 14 }}>
                    <div className="field">
                      <label>Tip contract</label>
                      <div className="segmented">
                        <button
                          type="button"
                          className={clientData.tipContract === "cadru" ? "on" : ""}
                          onClick={() => setClientData((prev) => ({
                            ...prev,
                            tipContract: "cadru",
                            dataExpirare: prev.dataExpirare || addMonths(prev.dataContract || todayDmy(), 12),
                          }))}
                        >Cadru · multiple anexe</button>
                        <button
                          type="button"
                          className={clientData.tipContract === "unic" ? "on" : ""}
                          onClick={async () => {
                            if (anexe.length > 1) {
                              const ok = await confirm(
                                `Tipul „Eveniment unic” permite o singură anexă. Vor fi șterse ${anexe.length - 1} anexe. Continui?`,
                                { variant: "danger", confirmLabel: "Schimbă tipul" }
                              );
                              if (!ok) return;
                              setAnexe((prev) => prev.slice(0, 1));
                            }
                            setClientData((prev) => ({ ...prev, tipContract: "unic", dataExpirare: "" }));
                          }}
                        >Eveniment unic</button>
                      </div>
                    </div>
                    <div className="field">
                      <label>Client salvat</label>
                      <select
                        value=""
                        onChange={(e) => {
                          const c = findClientByCui(e.target.value);
                          if (c) setClientData((prev) => ({ ...prev, ...c }));
                        }}
                      >
                        <option value="">— alege din istoric ({listClientHistory().length}) —</option>
                        {listClientHistory().map((c) => (
                          <option key={c.cui} value={c.cui}>
                            {c.numeBeneficiar} ({c.cui})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 14, cursor: "pointer", fontSize: 13 }}>
                    <input
                      type="checkbox"
                      checked={!!clientData.includeVideo}
                      onChange={(e) => setClientData((prev) => ({ ...prev, includeVideo: e.target.checked }))}
                    />
                    Include servicii videografice (la nivel de contract)
                  </label>

                  <div className="grid-2">
                    <div className="field">
                      <label>CUI / CNP <span className="req">●</span></label>
                      <div className="input-with-action">
                        <input
                          type="text"
                          name="cui"
                          value={clientData.cui}
                          onChange={handleClientChange}
                          onBlur={autoFetchAnaf}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") { e.preventDefault(); autoFetchAnaf(true); }
                          }}
                          style={{ borderColor: clientData.cui && !validateCUI(clientData.cui) ? "var(--danger)" : undefined }}
                        />
                        <button type="button" className="input-action" onClick={() => autoFetchAnaf(true)} title="Caută la ANAF">
                          ANAF <Icon name="refresh" />
                        </button>
                      </div>
                    </div>
                    <div className="field">
                      <label>Reg. Comerțului</label>
                      <input
                        type="text"
                        name="nrRegCom"
                        value={clientData.nrRegCom}
                        onChange={handleClientChange}
                      />
                    </div>

                    {[
                      ["numeBeneficiar", "Denumire beneficiar", true],
                      ["reprezentant", "Reprezentant legal", true],
                    ].map(([name, label, required]) => (
                      <div className="field" key={name}>
                        <label>{label} {required && <span className="req">●</span>}</label>
                        <input
                          type="text"
                          name={name}
                          value={clientData[name]}
                          onChange={handleClientChange}
                        />
                        {name === "numeBeneficiar" && anafSyncAt && (
                          <span className="hint sync-ok">
                            ✓ Sincronizat cu ANAF · {anafSyncAt.toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })}, {anafSyncAt.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </div>
                    ))}

                    <div className="field col-span-2">
                      <label>Sediu / Domiciliu</label>
                      <input
                        type="text"
                        name="sediu"
                        value={clientData.sediu}
                        onChange={handleClientChange}
                      />
                    </div>

                    {[
                      ["telefon", "Telefon"],
                      ["email", "Email"],
                      ["iban", "Cont bancar (IBAN)"],
                      ["banca", "Banca"],
                    ].map(([name, label]) => {
                      const span = 1;
                      const required = false;
                      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      const invalid =
                        (name === "iban" && clientData.iban && !validateIBAN(clientData.iban)) ||
                        (name === "email" && clientData.email && !emailRe.test(clientData.email));
                      const inputType = name === "email" ? "email" : name === "telefon" ? "tel" : "text";
                      const onKey =
                        name === "telefon"
                          ? (e) => {
                              if (e.key.length === 1 && !/[\d+\s\-()]/.test(e.key) && !e.ctrlKey && !e.metaKey)
                                e.preventDefault();
                            }
                          : undefined;
                      const onChange =
                        name === "telefon"
                          ? (e) => {
                              const v = e.target.value.replace(/[^\d+\s\-()]/g, "");
                              handleClientChange({ target: { name, value: v } });
                            }
                          : handleClientChange;
                      return (
                        <div className={`field ${span === 2 ? "col-span-2" : ""}`} key={name}>
                          <label>{label} {required && <span className="req">●</span>}</label>
                          <input
                            type={inputType}
                            name={name}
                            value={clientData[name]}
                            onChange={onChange}
                            onKeyDown={onKey}
                            inputMode={name === "telefon" ? "tel" : undefined}
                            style={{ borderColor: invalid ? "var(--danger)" : undefined }}
                          />
                          {invalid && <span className="hint" style={{ color: "var(--danger)" }}>Format invalid</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </section>
            )}

            {/* ANEXA STEP */}
            {isAnnex && (
              <section className="card">
                <div className="card-strip">
                  <div className="strip-cell">
                    <div className="cell-label">Contract</div>
                    <div className="cell-value mono">{clientData.numarContract || "—"}</div>
                  </div>
                  <div className="strip-cell">
                    <div className="cell-label">Anexă nr.</div>
                    <div className="cell-value">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={currentAnexa.eventData.numarAnexa}
                        placeholder={anexaNr(clientData.anexaStart, "", anexaIdx)}
                        onChange={(e) => updateAnexa(anexaIdx, "eventData", "numarAnexa", e.target.value)}
                        style={{
                          width: 48,
                          padding: 0,
                          border: "none",
                          background: "transparent",
                          font: "inherit",
                          fontWeight: 700,
                          color: "inherit",
                          outline: "none",
                        }}
                        title="Gol = numerotare automată în ordine"
                      />
                      {!currentAnexa.eventData.numarAnexa && (
                        <> <span style={{ color: "var(--muted)" }}>auto</span></>
                      )}
                    </div>
                  </div>
                  <div className="strip-cell wide">
                    <div className="cell-label">Emitere anexă</div>
                    <div className="cell-value">
                      <strong>{currentAnexa.eventData.dataEmitere || clientData.dataContract || "—"}</strong>
                      {!currentAnexa.eventData.dataEmitere && clientData.dataContract && (
                        <> · <span style={{ color: "var(--muted)" }}>preia data contractului</span></>
                      )}
                    </div>
                  </div>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
                  <button
                    type="button"
                    className="strip-action"
                    onClick={handleSetAnexaStart}
                    title="Numărul de la care încep anexele acestui contract"
                  >
                    Start nr. anexe
                  </button>
                  <button
                    type="button"
                    className="strip-action with-date"
                    onClick={(e) => {
                      const inp = e.currentTarget.querySelector('input[type="date"]');
                      if (inp?.showPicker) inp.showPicker();
                      else inp?.focus();
                    }}
                  >
                    <span><Icon name="calendar" /></span>
                    <span>Schimbă emiterea</span>
                    <input
                      type="date"
                      tabIndex={-1}
                      value={(() => {
                        const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(currentAnexa.eventData.dataEmitere || "");
                        return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
                      })()}
                      onChange={(e) => updateAnexa(anexaIdx, "eventData", "dataEmitere", normalizeDate(e.target.value))}
                    />
                  </button>
                  {currentAnexa.eventData.dataEmitere && (
                    <button
                      type="button"
                      className="strip-action"
                      onClick={() => updateAnexa(anexaIdx, "eventData", "dataEmitere", "")}
                      title="Revino la data contractului"
                    >
                      Reset
                    </button>
                  )}
                  </div>
                </div>

                <div className="section">
                  <div className="section-head">
                    <span className="idx">02 · A{anexaIdx + 1}</span>
                    <h2>Detalii eveniment</h2>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div className="field">
                      <label>Scop / nume eveniment <span className="req">●</span></label>
                      <input
                        type="text"
                        value={currentAnexa.eventData.scop}
                        onChange={(e) => updateAnexa(anexaIdx, "eventData", "scop", e.target.value)}
                      />
                    </div>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 8, cursor: "pointer", fontSize: 13 }}>
                      <input
                        type="checkbox"
                        checked={!!currentAnexa.eventData.includeVideo}
                        onChange={(e) => updateAnexa(anexaIdx, "eventData", "includeVideo", e.target.checked)}
                      />
                      Include servicii videografice
                    </label>
                  </div>

                  <div className="grid-3">
                    {dateField(
                      currentAnexa.eventData.dataEveniment,
                      (e) => updateAnexa(anexaIdx, "eventData", "dataEveniment", e.target.value),
                      "Data evenimentului"
                    )}

                    <div className="field col-span-2" style={{ position: "relative" }}>
                      <label>Locație <span className="req">●</span></label>
                      <input
                        type="text"
                        value={currentAnexa.eventData.locatie}
                        onChange={(e) => onLocationChange(anexaIdx, e.target.value)}
                        onBlur={(e) => {
                          saveLocation(e.target.value);
                          setTimeout(() => setLocationSuggestions([]), 200);
                        }}
                      />
                      {locationSuggestions.length > 0 && (
                        <ul className="suggest">
                          {locationSuggestions.map((l) => (
                            <li
                              key={l}
                              onMouseDown={() => {
                                updateAnexa(anexaIdx, "eventData", "locatie", l);
                                saveLocation(l);
                                setLocationSuggestions([]);
                              }}
                            >
                              {l}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="field">
                      <label>Zile până la predare</label>
                      <input
                        type="number"
                        value={currentAnexa.eventData.zilePredare}
                        onChange={(e) => updateAnexa(anexaIdx, "eventData", "zilePredare", e.target.value)}
                      />
                    </div>

                    <div className="field col-span-2">
                      <label>Data predare (calculat)</label>
                      <input
                        type="text"
                        readOnly
                        value={calcDataPredare(currentAnexa.eventData.dataEveniment, currentAnexa.eventData.zilePredare) || "—"}
                        style={{ background: "#efeae0", color: "var(--ink-2)" }}
                      />
                    </div>

                    <div className="field">
                      <label>Zile lucrătoare încasare</label>
                      <input
                        type="number"
                        value={currentAnexa.eventData.zileIncasare ?? "10"}
                        onChange={(e) => updateAnexa(anexaIdx, "eventData", "zileIncasare", e.target.value)}
                      />
                    </div>

                    <div className="field col-span-3">
                      <label>Observații / clauze particulare</label>
                      <textarea
                        rows={3}
                        value={currentAnexa.eventData.observatii || ""}
                        onChange={(e) => updateAnexa(anexaIdx, "eventData", "observatii", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="section">
                  <div className="section-head">
                    <span className="idx">03 · A{anexaIdx + 1}</span>
                    <h2>Buget</h2>
                    <span className="helper">Sumele se introduc în LEI, fără TVA.</span>
                  </div>

                  <div className="bnr-conv">
                    <div className="field" style={{ minWidth: 90 }}>
                      <label>Monedă sursă</label>
                      <select
                        value={bnrConv.currency}
                        onChange={(e) => setBnrConv((s) => ({ ...s, currency: e.target.value, rate: null, error: "" }))}
                      >
                        {["RON", "EUR", "USD", "GBP", "CHF"].map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <button
                      type="button"
                      className="btn"
                      disabled={bnrConv.loading}
                      onClick={async () => {
                        const refDate = currentAnexa.eventData.dataEveniment && isValidDmy(currentAnexa.eventData.dataEveniment)
                          ? currentAnexa.eventData.dataEveniment
                          : clientData.dataContract;
                        setBnrConv((s) => ({ ...s, loading: true, error: "" }));
                        try {
                          const r = await fetchBnrRate(bnrConv.currency, refDate);
                          setBnrConv((s) => ({ ...s, loading: false, rate: r.rate, date: r.date }));
                        } catch (e) {
                          setBnrConv((s) => ({ ...s, loading: false, error: e.message }));
                        }
                      }}
                    >
                      {bnrConv.loading ? "..." : `Adu curs BNR`}
                    </button>
                    {bnrConv.rate && (
                      <>
                        <span className="bnr-rate">
                          1 {bnrConv.currency} = <strong>{bnrConv.rate.toFixed(4)}</strong> RON
                          <span className="bnr-date"> · {bnrConv.date}</span>
                        </span>
                        <button
                          type="button"
                          className="btn"
                          onClick={async () => {
                            if (!(await confirm(`Multiplici toate valorile bugetului cu ${bnrConv.rate.toFixed(4)}?`))) return;
                            const fields = ["valoareServicii", "transport", "diurna", "cazare", "alteCheltuieli"];
                            setAnexe((prev) => prev.map((a, i) => {
                              if (i !== anexaIdx) return a;
                              const nb = { ...a.budgetData };
                              fields.forEach((f) => {
                                const v = Number(nb[f]);
                                if (v) nb[f] = String(Math.round(v * bnrConv.rate));
                              });
                              return { ...a, budgetData: nb };
                            }));
                          }}
                        >Aplică × curs</button>
                      </>
                    )}
                    {bnrConv.error && <span className="bnr-error">{bnrConv.error}</span>}
                  </div>

                  <div className="grid-2">
                    {[
                      ["valoareServicii", "Valoare servicii profesionale", true],
                      ["transport", "Cheltuieli transport"],
                      ["diurna", "Diurnă"],
                      ["cazare", "Cheltuieli cazare"],
                      ["alteCheltuieli", "Alte cheltuieli"],
                    ].map(([name, label, required]) => (
                      <div className="field" key={name}>
                        <label>{label} {required && <span className="req">●</span>}</label>
                        <input
                          type="number"
                          value={currentAnexa.budgetData[name]}
                          onChange={(e) => updateAnexa(anexaIdx, "budgetData", name, e.target.value)}
                          style={{ fontFamily: "Geist Mono, monospace", textAlign: "right" }}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="total-box">
                    <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--muted)" }}>
                      Total anexa nr. {anexaIdx + 1}
                    </div>
                    <h3>{fmt(sumBudget(currentAnexa.budgetData))} <span style={{ fontSize: 13, color: "var(--muted)", fontFamily: "Geist Mono, monospace" }}>LEI</span></h3>
                  </div>
                </div>
              </section>
            )}

            {/* BIBLIOTECĂ (Firestore) */}
            {isSaved && <Biblioteca
              onOpen={handleOpenFromFirestore}
              tab={bibliotecaTab}
              onTabChange={(t) => setStep(t === "clienti" ? "biblioteca-clienti" : t === "modele" ? "biblioteca-modele" : "biblioteca-contracte")}
              onOpenBlank={handleShowBlankTemplate}
              onUseModel={(m) => {
                handleNewContract();
                setClientData((prev) => ({
                  ...prev,
                  cui: m.cui || "",
                  numeBeneficiar: m.numeBeneficiar || "",
                  clauzeCustom: m.clauzeCustom || {},
                }));
                setAnexe((prev) => {
                  const next = [...prev];
                  if (next[0]) {
                    next[0] = {
                      eventData: { ...next[0].eventData, ...(m.defaultEvent || {}) },
                      budgetData: { ...next[0].budgetData, ...(m.defaultBudget || {}) },
                    };
                  }
                  return next;
                });
                setStep("client");
              }}
            />}

            {/* ERRORS */}
            {errors.length > 0 && (
              <div className="errors">
                <strong>Verifică:</strong>
                <ul>
                  {errors.map((e, i) => (<li key={i}>{e}</li>))}
                </ul>
              </div>
            )}

            {/* ACTION BAR */}
            {!isSaved && (
              <div className="actions">
                <button className="btn" onClick={resetAll}>Reset formular</button>
                <div style={{ flex: 1 }} />
                <button className="btn" onClick={handleSaveToDb}>
                  <Icon name="save" /> {currentContractId ? "Actualizează" : "Salvează"} în DB
                </button>
                {isClient && (
                  <button className="generate-btn" onClick={() => handleGenerate("contract")}>
                    Generează contract →
                  </button>
                )}
                {isAnnex && (
                  <button className="generate-btn" onClick={() => handleGenerate(anexaIdx)}>
                    Generează Anexa {anexaIdx + 1} →
                  </button>
                )}
                {anexe.length > 0 && (
                  <button className="generate-btn" onClick={() => handleGenerate("all")}>
                    Generează tot →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* RIGHT RAIL */}
          {!isSaved && (
            <aside className="rail">
              <div className="rail-card">
                <h3>Total general <span className="small">{anexe.length} {anexe.length === 1 ? "anexă" : "anexe"}</span></h3>
                <div className="summary-grand">
                  <div className="label">Valoare contract</div>
                  <div className="value">{fmt(totalGeneral)}<span className="ccy">LEI</span></div>
                </div>
                <div className="summary-line"><span>Servicii profesionale</span><span className="v">{fmt(totalsByLine.valoareServicii)}</span></div>
                <div className="summary-line"><span>Transport</span><span className="v">{fmt(totalsByLine.transport)}</span></div>
                <div className="summary-line"><span>Diurnă</span><span className="v">{fmt(totalsByLine.diurna)}</span></div>
                <div className="summary-line"><span>Cazare</span><span className="v">{fmt(totalsByLine.cazare)}</span></div>
                <div className="summary-line faint"><span>Alte cheltuieli</span><span className="v">{fmt(totalsByLine.alteCheltuieli)}</span></div>
                <div className="summary-line tva"><span>TVA (informativ)</span><span className="v muted">— neplătitor</span></div>
                <div className="summary-line invoice"><span>De facturat</span><span className="v"><strong>{fmt(totalGeneral)}</strong> LEI</span></div>
              </div>

              <div className="rail-card">
                <h3>Pregătire pentru semnare <span className="small">{doneCount} / {checklist.length}</span></h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  {checklist.map((c, i) => (
                    <li key={i} style={{ display: "flex", gap: 10, fontSize: 13, color: c.ok ? "var(--muted)" : "var(--ink-2)" }}>
                      <span style={{
                        width: 16, height: 16, borderRadius: 3,
                        border: c.ok ? "1px solid var(--accent)" : "1px solid var(--line-2)",
                        background: c.ok ? "var(--accent)" : "var(--paper)",
                        color: "#fff",
                        display: "grid", placeItems: "center",
                        fontSize: 10, flexShrink: 0, marginTop: 2,
                      }}>{c.ok ? "✓" : ""}</span>
                      <span style={{ textDecorationLine: c.ok ? "line-through" : "none", textDecorationColor: "var(--line-2)" }}>
                        {c.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rail-card">
                <h3>Export <span className="small">finalizare</span></h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button className="btn" style={{ justifyContent: "space-between", width: "100%" }} onClick={() => handleGenerate("all")}>
                    <span><Icon name="document" /> Preview & Print PDF</span>
                    <span style={{ color: "var(--muted)" }}>→</span>
                  </button>
                  <button className="btn" style={{ justifyContent: "space-between", width: "100%" }} onClick={onExport}>
                    <span><Icon name="download" /> Export JSON</span>
                    <span style={{ color: "var(--muted)" }}>→</span>
                  </button>
                  <button className="btn" style={{ justifyContent: "space-between", width: "100%" }} onClick={sendEmail}>
                    <span><Icon name="mail" /> Trimite email beneficiar</span>
                    <span style={{ color: "var(--muted)" }}>→</span>
                  </button>
                </div>
              </div>
            </aside>
          )}
        </div>
        )}
      </main>
    </div>
  );
}

export default App;
