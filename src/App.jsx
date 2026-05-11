import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import Contract from "./Contract";
import Anexa from "./Anexa";
import {
  addDays,
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
  listClientHistory,
  saveLocation,
  searchRoLocations,
  loadLocal,
  saveClientHistory,
  saveLocal,
  todayDmy,
  validateCUI,
  validateIBAN,
} from "./utils";
import {
  saveContract,
  listContracte,
  getContract,
  deleteContract,
  exportAll,
  importAll,
} from "./db";

/* ---------- empty factories (neschimbate) ---------- */
const emptyClient = () => ({
  tipContract: "cadru",
  numarContract: "",
  dataContract: todayDmy(),
  dataExpirare: "",
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
  dataEveniment: "",
  locatie: "",
  zilePredare: "30",
  observatii: "",
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

const calcDataPredare = (dataEveniment, zilePredare) => {
  if (!isValidDmy(dataEveniment) || !zilePredare) return "";
  return addDays(dataEveniment, 1 + Number(zilePredare));
};

const fmt = (n) =>
  new Intl.NumberFormat("ro-RO").format(Number(n) || 0);

function App() {
  const stored = loadLocal();
  const [step, setStep] = useState("client");
  const [showPreview, setShowPreview] = useState(false);
  const [printSelection, setPrintSelection] = useState("all");
  const [clientData, setClientData] = useState(stored?.clientData || emptyClient());
  const [anexe, setAnexe] = useState(stored?.anexe || [emptyAnexa()]);
  const [errors, setErrors] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [anafSyncAt, setAnafSyncAt] = useState(null);
  const backupFileRef = useRef(null);
  const fileRef = useRef(null);
  const locationTimerRef = useRef(null);
  const [currentContractId, setCurrentContractId] = useState(stored?.currentContractId || null);
  const [savedContracts, setSavedContracts] = useState([]);
  const [search, setSearch] = useState("");
  const [bnrConv, setBnrConv] = useState({ currency: "EUR", rate: null, date: "", loading: false, error: "" });

  /* ---------- DB sync ---------- */
  const refreshSavedContracts = async () => {
    try {
      setSavedContracts(await listContracte(search));
    } catch (e) {
      console.warn("DB:", e.message);
    }
  };
  useEffect(() => {
    if (step === "salvate") refreshSavedContracts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, search]);

  useEffect(() => {
    saveLocal({ clientData, anexe });
  }, [clientData, anexe]);

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

  const handleSetStartNumber = () => {
    const next = peekNextContractNumber();
    const raw = prompt(
      `Introdu numărul de la care să continue numerotarea automată.\n` +
        `Următorul nr. ar fi: ${next}.\n` +
        `Ex.: dacă ai emis deja până la 42, introdu 43.`,
      String(next)
    );
    if (raw == null) return;
    const v = parseInt(raw, 10);
    if (!Number.isFinite(v) || v < 1) {
      alert("Număr invalid.");
      return;
    }
    const start = setContractCounterStart(v);
    const n = getNextContractNumber();
    setClientData((prev) => ({ ...prev, numarContract: n }));
    alert(`Numerotarea va continua de la ${start}.`);
  };

  /* ---------- Actions ---------- */
  const handleSaveToDb = async () => {
    try {
      const id = await saveContract({ clientData, anexe, id: currentContractId });
      setCurrentContractId(id);
      alert(currentContractId ? "Contract actualizat." : "Contract salvat în DB.");
    } catch (e) {
      alert("Eroare la salvare: " + e.message);
    }
  };
  const handleLoadContract = async (id) => {
    const c = await getContract(id);
    if (!c) return;
    setClientData({ ...emptyClient(), ...c.clientData });
    setAnexe(c.anexe?.length ? c.anexe : [emptyAnexa()]);
    setCurrentContractId(id);
    setStep("client");
  };
  const handleDuplicateContract = async (id) => {
    const c = await getContract(id);
    if (!c) return;
    setClientData({ ...emptyClient(), ...c.clientData, numarContract: "" });
    setAnexe(c.anexe?.length ? c.anexe : [emptyAnexa()]);
    setCurrentContractId(null);
    setStep("client");
  };
  const handleDeleteContract = async (id) => {
    if (!confirm("Ștergi acest contract?")) return;
    await deleteContract(id);
    if (currentContractId === id) setCurrentContractId(null);
    refreshSavedContracts();
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
      alert("Fișier invalid.");
    }
    e.target.value = "";
  };

  const handleNewContract = () => {
    if (!confirm("Începi un contract nou? Datele curente vor fi golite.")) return;
    const n = getNextContractNumber();
    setClientData({ ...emptyClient(), numarContract: n });
    setAnexe([emptyAnexa()]);
    setCurrentContractId(null);
    setStep("client");
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
      alert(`${n} contracte importate.`);
      refreshSavedContracts();
    } catch {
      alert("Backup invalid.");
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

  const autoFetchAnaf = async () => {
    if (!clientData.cui || !validateCUI(clientData.cui)) return;
    try {
      const d = await fetchAnaf(clientData.cui);
      setClientData((prev) => ({ ...prev, ...d }));
      setAnafSyncAt(new Date());
    } catch (e) {
      console.warn("ANAF:", e.message);
    }
  };

  const generateContractNumber = () => {
    const n = getNextContractNumber();
    setClientData((prev) => ({ ...prev, numarContract: n }));
  };

  const sendEmail = () => {
    if (!clientData.email) {
      alert("Adaugă email-ul beneficiarului.");
      return;
    }
    const subject = `Contract nr. ${clientData.numarContract || ""} - ALUMA S.R.L.`;
    const body = `Bună ziua,\n\nVă transmitem contractul nr. ${clientData.numarContract || ""} din ${clientData.dataContract} împreună cu anexele aferente.\n\nVă mulțumim.\n\nCu stimă,\nALUMA S.R.L.`;
    window.location.href = `mailto:${clientData.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const exportDocx = async () => {
    try {
      const mod = await import("docx");
      const { Document, Packer, Paragraph, TextRun } = mod;
      const html = document.querySelector(".preview-container")?.innerText || "";
      const doc = new Document({
        sections: [{ children: html.split("\n").map((line) => new Paragraph({ children: [new TextRun(line)] })) }],
      });
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contract-${clientData.numarContract || "draft"}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Pentru export Word: `npm install docx` și reîncearcă.");
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
    setAnexe((prev) => [...prev, emptyAnexa()]);
    setStep(`anexa-${anexe.length}`);
  };
  const duplicateAnexa = (idx) => {
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
  const resetAll = () => {
    if (!confirm("Ștergi toate datele?")) return;
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

  const handleGenerate = (selection = "all") => {
    const errs = validate();
    setErrors(errs);
    if (errs.length === 0) {
      saveClientHistory(clientData);
      setPrintSelection(selection);
      setShowPreview(true);
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
    items.push({ ok: !clientData.cui || validateCUI(clientData.cui), text: "CUI / CNP cu format corect" });
    items.push({ ok: !clientData.iban || validateIBAN(clientData.iban), text: "IBAN cu format corect" });
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
    const showContract = printSelection === "all" || printSelection === "contract";
    const visibleAnexe =
      printSelection === "all"
        ? anexe.map((a, i) => ({ ...a, idx: i }))
        : typeof printSelection === "number"
          ? [{ ...anexe[printSelection], idx: printSelection }]
          : [];

    return (
      <div className="preview-container">
        <div className="no-print print-controls">
          <button className="back-btn" onClick={() => setShowPreview(false)}>
            ← Înapoi la editare
          </button>
          <select
            value={printSelection}
            onChange={(e) => {
              const v = e.target.value;
              setPrintSelection(v === "all" || v === "contract" ? v : Number(v));
            }}
          >
            <option value="all">Contract + toate anexele</option>
            <option value="contract">Doar contract</option>
            {anexe.map((_, i) => (
              <option key={i} value={i}>Doar Anexa nr. {i + 1}</option>
            ))}
          </select>
          {printSelection === "all" && anexe.length > 1 && (
            <span style={{ alignSelf: "center", fontFamily: "Instrument Serif, serif", fontSize: 18 }}>
              Total general: {fmt(totalGeneral)} LEI
            </span>
          )}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button className="back-btn" onClick={() => setEditMode((v) => !v)}>
              {editMode ? "Ieși din editare" : "Editare inline"}
            </button>
            <button className="back-btn" onClick={exportDocx}>Export Word</button>
            <button className="back-btn" onClick={sendEmail}>Trimite email</button>
            <button className="print-btn" onClick={() => window.print()}>Printează / PDF</button>
          </div>
        </div>

        <div className="no-print print-note">
          <strong>Pentru PDF curat:</strong> în dialogul de print → „More settings" → debifează
          <em> „Headers and footers"</em> și setează <em>Margins: None</em>. Destinație:
          <em> Save as PDF</em>.
        </div>

        {showContract && <Contract clientData={clientData} editMode={editMode} />}
        {visibleAnexe.map((a) => (
          <Anexa
            key={a.idx}
            anexaNumber={a.idx + 1}
            clientData={clientData}
            eventData={{
              ...a.eventData,
              dataPredare: calcDataPredare(a.eventData.dataEveniment, a.eventData.zilePredare),
            }}
            budgetData={a.budgetData}
            calculeazaTotal={() => sumBudget(a.budgetData)}
            editMode={editMode}
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
              📅 Calendar
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
  const isSaved = step === "salvate";

  return (
    <div className="app-container no-print">
      {/* ============ SIDEBAR ============ */}
      <aside className="app-sidebar">
        <div className="brand">
          <div className="brand-mark">A</div>
          <div className="brand-name">Aluma</div>
          <div className="brand-sub">v2.6</div>
        </div>

        <div className="nav-section-label">Flux contract</div>

        <button
          className={`nav-item ${isClient ? "active" : ""}`}
          onClick={() => setStep("client")}
        >
          <span className="nav-num">1</span>
          <span>Beneficiar</span>
          {clientData.numeBeneficiar && <span className="nav-meta">✓</span>}
        </button>

        {anexe.map((a, i) => (
          <div
            key={i}
            className={`nav-item ${step === `anexa-${i}` ? "active" : ""}`}
            onClick={() => setStep(`anexa-${i}`)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setStep(`anexa-${i}`);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <span className="nav-num">{i + 2}</span>
            <span>Anexa {i + 1}{a.eventData.scop ? ` · ${a.eventData.scop.slice(0, 18)}` : ""}</span>
            <span className="nav-meta">{fmt(sumBudget(a.budgetData))}</span>
            <button
              type="button"
              className="nav-del"
              title={`Șterge Anexa ${i + 1}`}
              aria-label={`Șterge Anexa ${i + 1}`}
              onClick={(e) => {
                e.stopPropagation();
                if (!confirm(`Ștergi Anexa ${i + 1}?`)) return;
                setAnexe((prev) => prev.filter((_, j) => j !== i));
                setStep("client");
              }}
            >×</button>
          </div>
        ))}

        {!(clientData.tipContract === "unic" && anexe.length >= 1) && (
          <button className="nav-item" onClick={addAnexa}>
            <span className="nav-num">+</span>
            <span style={{ color: "#8b8478" }}>Adaugă anexă</span>
          </button>
        )}

        <div className="nav-section-label">Bibliotecă</div>
        <button
          className={`nav-item ${isSaved ? "active" : ""}`}
          onClick={() => setStep("salvate")}
        >
          <span>📁 Contracte salvate</span>
          {savedContracts.length > 0 && <span className="nav-meta">{savedContracts.length}</span>}
        </button>

        <div className="nav-section-label">Sistem</div>
        <button className="nav-item" onClick={handleNewContract}>
          <span>＋ Contract nou</span>
        </button>
        <button className="nav-item" onClick={onExport}>
          <span>↓ Export JSON</span>
        </button>
        <button className="nav-item" onClick={() => fileRef.current?.click()}>
          <span>↑ Import JSON</span>
        </button>
        <input ref={fileRef} type="file" accept="application/json" style={{ display: "none" }} onChange={onImport} />
        <button className="nav-item" onClick={handleExportBackup}>
          <span>↓ Backup DB</span>
        </button>
        <button className="nav-item" onClick={() => backupFileRef.current?.click()}>
          <span>↑ Restaurează backup</span>
        </button>
        <input ref={backupFileRef} type="file" accept="application/json" style={{ display: "none" }} onChange={handleImportBackup} />

        <div className="sidebar-bottom">
          <div className="user-chip">
            <div className="avatar">AL</div>
            <div className="user-meta">
              <div className="user-name">ALUMA S.R.L.</div>
              <div className="user-role">Editor contracte</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ============ MAIN ============ */}
      <main className="app-main">

        {/* Topbar */}
        <div className="topbar">
          <div className="crumbs">
            <span>Contracte</span>
            <span className="sep">/</span>
            <span>{clientData.tipContract === "unic" ? "Eveniment unic" : "Cadru"}</span>
            <span className="sep">/</span>
            <strong>{clientData.numarContract ? `Contract #${clientData.numarContract}` : "Contract nou"}</strong>
          </div>
          <div className="topbar-search">
            <input
              type="text"
              aria-label="Caută client, contract, CUI"
              placeholder="Caută client, contract, CUI…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); if (step !== "salvate") setStep("salvate"); }}
            />
            <span className="kbd-hint">⌘K</span>
          </div>
          <div className="top-actions">
            <span className="pill live">Auto-save</span>
            <span className="pill warn">{currentContractId ? `V${currentContractId} · DRAFT` : "DRAFT"}</span>
          </div>
        </div>

        {/* Content */}
        <div className={`content ${isSaved ? "single" : ""}`}>

          {/* Page head */}
          {!isSaved && (
            <div className="page-head">
              <div>
                <div className="eyebrow">
                  {clientData.tipContract === "unic" ? "Eveniment unic" : "Contract cadru"} · {anexe.length} {anexe.length === 1 ? "anexă" : "anexe"}
                </div>
                <h1>
                  {clientData.numeBeneficiar
                    ? <>Contract pentru<br /><em>{clientData.numeBeneficiar}</em></>
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
                          onClick={() => setClientData({ ...clientData, tipContract: "cadru" })}
                        >Cadru · multiple anexe</button>
                        <button
                          type="button"
                          className={clientData.tipContract === "unic" ? "on" : ""}
                          onClick={() => setClientData({ ...clientData, tipContract: "unic" })}
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
                            if (e.key === "Enter") { e.preventDefault(); autoFetchAnaf(); }
                          }}
                          style={{ borderColor: clientData.cui && !validateCUI(clientData.cui) ? "var(--danger)" : undefined }}
                        />
                        <button type="button" className="input-action" onClick={autoFetchAnaf} title="Caută la ANAF">
                          ANAF ↻
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

                {/* Strip: contract nr · valabilitate · acțiuni */}
                <div className="card-strip">
                  <div className="strip-cell">
                    <div className="cell-label">Contract</div>
                    <div className="cell-value mono">{clientData.numarContract || "—"}</div>
                  </div>
                  <div className="strip-cell wide">
                    <div className="cell-label">Valabilitate</div>
                    <div className="cell-value">
                      Emitere <strong>{clientData.dataContract || "—"}</strong>
                      {clientData.dataExpirare && <> · Valabil până la <strong>{clientData.dataExpirare}</strong></>}
                      {!clientData.dataExpirare && clientData.tipContract === "cadru" && <> · durată nedeterminată</>}
                    </div>
                  </div>
                  <button type="button" className="strip-action" onClick={generateContractNumber}>
                    Generează nr.
                  </button>
                  <button type="button" className="strip-action" onClick={handleSetStartNumber} title="Setează numărul de pornire pentru numerotarea automată">
                    Start nr.
                  </button>
                  <div className="strip-action with-date">
                    <span>📅</span>
                    <span>Schimbă valabilitate</span>
                    <input
                      type="date"
                      value={(() => {
                        const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(clientData.dataExpirare || "");
                        return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
                      })()}
                      onChange={(e) => setClientData({ ...clientData, dataExpirare: normalizeDate(e.target.value) })}
                    />
                  </div>
                </div>
              </section>
            )}

            {/* ANEXA STEP */}
            {isAnnex && (
              <section className="card">
                <div className="anexa-chips">
                  {anexe.map((a, i) => {
                    const active = step === `anexa-${i}`;
                    const label = a.eventData.scop || `Anexa ${i + 1}`;
                    return (
                      <button
                        key={i}
                        className={`chip ${active ? "on" : ""}`}
                        onClick={() => setStep(`anexa-${i}`)}
                      >
                        <span className="dot" />
                        <span>Anexa {i + 1}{a.eventData.scop ? ` · ${label}` : ""}</span>
                        <span className="chip-val">{fmt(sumBudget(a.budgetData))}</span>
                      </button>
                    );
                  })}
                  <button className="chip add" onClick={addAnexa}>+ Anexă nouă</button>
                  <div style={{ flex: 1 }} />
                  <button className="btn ghost" onClick={() => duplicateAnexa(anexaIdx)}>Duplică</button>
                  {anexe.length > 1 && (
                    <button className="btn ghost danger" onClick={() => removeAnexa(anexaIdx)}>Șterge</button>
                  )}
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
                          onClick={() => {
                            if (!confirm(`Multiplici toate valorile bugetului cu ${bnrConv.rate.toFixed(4)}?`)) return;
                            const fields = ["valoareServicii", "transport", "diurna", "cazare", "alteCheltuieli"];
                            setAnexe((prev) => prev.map((a, i) => {
                              if (i !== anexaIdx) return a;
                              const nb = { ...a.budgetData };
                              fields.forEach((f) => {
                                const v = Number(nb[f]);
                                if (v) nb[f] = String(Math.round(v * bnrConv.rate * 100) / 100);
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

            {/* SALVATE STEP */}
            {isSaved && (
              <section className="card">
                <div className="section">
                  <div className="section-head">
                    <span className="idx">⌗</span>
                    <h2>Contracte salvate</h2>
                    <span className="helper">{savedContracts.length} înregistrări locale</span>
                  </div>
                  <div className="field" style={{ marginBottom: 16, maxWidth: 420 }}>
                    <label>Caută (nume, CUI, număr)</label>
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="ex: SC Exemplu SRL"
                    />
                  </div>

                  {savedContracts.length === 0 ? (
                    <p style={{ color: "var(--muted)" }}>Niciun contract salvat. Completează formularul și apasă „Salvează în DB".</p>
                  ) : (
                    <table className="table-saved">
                      <thead>
                        <tr>
                          <th>Nr.</th>
                          <th>Data</th>
                          <th>Beneficiar</th>
                          <th>CUI</th>
                          <th style={{ textAlign: "right" }}>Total</th>
                          <th>Acțiuni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {savedContracts.map((c) => (
                          <tr key={c.id}>
                            <td className="num">{c.numarContract || "—"}</td>
                            <td className="num">{c.dataContract}</td>
                            <td>{c.numeBeneficiar}</td>
                            <td className="num">{c.cui}</td>
                            <td className="num" style={{ textAlign: "right" }}>{fmt(c.total)} LEI</td>
                            <td>
                              <div className="actions-cell">
                                <button className="btn" onClick={() => handleLoadContract(c.id)}>Deschide</button>
                                <button className="btn" onClick={() => handleDuplicateContract(c.id)}>Duplică</button>
                                <button className="btn danger" onClick={() => handleDeleteContract(c.id)}>Șterge</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>
            )}

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
                  💾 {currentContractId ? "Actualizează" : "Salvează"} în DB
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
                      <span style={{ textDecoration: c.ok ? "line-through" : "none", textDecorationColor: "var(--line-2)" }}>
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
                    <span>📄 Preview & Print PDF</span>
                    <span style={{ color: "var(--muted)" }}>→</span>
                  </button>
                  <button className="btn" style={{ justifyContent: "space-between", width: "100%" }} onClick={onExport}>
                    <span>↓ Export JSON</span>
                    <span style={{ color: "var(--muted)" }}>→</span>
                  </button>
                  <button className="btn" style={{ justifyContent: "space-between", width: "100%" }} onClick={sendEmail}>
                    <span>✉ Trimite email beneficiar</span>
                    <span style={{ color: "var(--muted)" }}>→</span>
                  </button>
                </div>
              </div>
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
