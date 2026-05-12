import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../shared/firebase";
import "../Dashboard/Dashboard.css";
import "./Rapoarte.css";

/* ---------- Helpers ---------- */
const fmt = (n) => new Intl.NumberFormat("ro-RO").format(Math.round(Number(n) || 0));
const fmt2 = (n) => new Intl.NumberFormat("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0);

const parseDmy = (s) => {
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(s || "");
  return m ? new Date(`${m[3]}-${m[2]}-${m[1]}`) : null;
};
const toDmy = (d) => {
  if (!d) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${d.getFullYear()}`;
};
const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const monthLabel = (d) => d.toLocaleDateString("ro-RO", { month: "short", year: "2-digit" }).replace(".", "");
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const daysBetween = (a, b) => Math.round((a - b) / 86400000);

/* ---------- Sub-tabs ---------- */
const TABS = [
  { id: "venituri", label: "Venituri", icon: "💰" },
  { id: "evenimente", label: "Evenimente", icon: "📅" },
  { id: "clienti", label: "Clienți", icon: "👥" },
  { id: "contracte", label: "Contracte", icon: "📄" },
  { id: "operational", label: "Operațional", icon: "📊" },
];

/* ---------- CSV export ---------- */
const downloadCsv = (rows, filename) => {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const esc = (v) => {
    const s = v == null ? "" : String(v);
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [cols.join(";"), ...rows.map((r) => cols.map((c) => esc(r[c])).join(";"))].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

export default function Rapoarte({ onOpenContract, onNewContract }) {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [evenimente, setEvenimente] = useState([]);
  const [incasari, setIncasari] = useState([]);
  const [tab, setTab] = useState("venituri");

  const today = useMemo(() => new Date(new Date().toDateString()), []);
  const defaultFrom = useMemo(() => {
    const d = new Date(today); d.setMonth(d.getMonth() - 11); d.setDate(1); return d;
  }, [today]);

  const [from, setFrom] = useState(defaultFrom.toISOString().slice(0, 10));
  const [to, setTo] = useState(today.toISOString().slice(0, 10));

  const load = async () => {
    setLoading(true);
    try {
      const [u, e, i] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "evenimente")),
        getDocs(collection(db, "incasari")),
      ]);
      setUsers(u.docs.map((d) => ({ id: d.id, ...d.data() })));
      setEvenimente(e.docs.map((d) => ({ id: d.id, ...d.data() })));
      setIncasari(i.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Rapoarte load:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  /* ---------- Join: build enriched rows (one per anexa) ---------- */
  const rows = useMemo(() => {
    const usersById = new Map(users.map((u) => [u.id, u]));
    return evenimente.map((ev) => {
      const inc = incasari.find((x) => x.numarContract === ev.numarContract && x.anexaIndex === ev.anexaIndex) || {};
      const u = usersById.get(ev.numarContract) || {};
      const d = parseDmy(ev.dataEveniment);
      const zile = Number(ev.zilePredare) || 0;
      const scadenta = d ? addDays(d, 1 + zile) : null;
      const status = inc.status || (d && d < today ? "neincasat" : "programat");
      return {
        nr: ev.numarContract,
        anexaIndex: ev.anexaIndex,
        scop: ev.scop || "",
        locatie: ev.locatie || "",
        dataEveniment: ev.dataEveniment || "",
        _d: d,
        scadenta,
        total: Number(inc.total) || 0,
        valoareServicii: Number(inc.valoareServicii) || 0,
        transport: Number(inc.transport) || 0,
        diurna: Number(inc.diurna) || 0,
        cazare: Number(inc.cazare) || 0,
        alteCheltuieli: Number(inc.alteCheltuieli) || 0,
        status,
        dataIncasare: inc.dataIncasare || "",
        client: u.numeBeneficiar || "—",
        cui: u.cui || "",
        tipContract: u.tipContract || "",
        _incId: inc.numarContract ? `${inc.numarContract}_A${inc.anexaIndex}` : null,
      };
    });
  }, [users, evenimente, incasari, today]);

  /* ---------- Date filter ---------- */
  const fromD = useMemo(() => from ? new Date(from) : null, [from]);
  const toD = useMemo(() => to ? new Date(to) : null, [to]);
  const filtered = useMemo(() => rows.filter((r) => {
    if (!r._d) return false;
    if (fromD && r._d < fromD) return false;
    if (toD && r._d > toD) return false;
    return true;
  }), [rows, fromD, toD]);

  /* ---------- Mark paid ---------- */
  const togglePaid = async (r) => {
    if (!r._incId) return;
    const nowPaid = r.status === "incasat";
    try {
      await updateDoc(doc(db, "incasari", r._incId), {
        status: nowPaid ? "neincasat" : "incasat",
        dataIncasare: nowPaid ? "" : toDmy(today),
        updatedAt: serverTimestamp(),
      });
      setIncasari((prev) => prev.map((i) =>
        i.numarContract === r.nr && i.anexaIndex === r.anexaIndex
          ? { ...i, status: nowPaid ? "neincasat" : "incasat", dataIncasare: nowPaid ? "" : toDmy(today) }
          : i
      ));
    } catch (e) {
      alert("Eroare actualizare status: " + e.message);
    }
  };

  return (
    <div className="dash rap">
      {/* HERO */}
      <div className="dash-hero">
        <div className="dash-hero-inner">
          <div>
            <div className="dash-hero-eyebrow">Aluma · Rapoarte & Analiză</div>
            <h1>Rapoarte</h1>
            <p>
              {loading
                ? "Se sincronizează datele…"
                : `${filtered.length} evenimente în intervalul selectat · ${fmt(filtered.reduce((s, r) => s + r.total, 0))} LEI total`}
            </p>
          </div>
          <button className="dash-hero-cta" onClick={load}>↻ Reîncarcă</button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="rap-filters">
        <div className="rap-filter">
          <label>De la</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="rap-filter">
          <label>Până la</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="rap-presets">
          <button onClick={() => { const d = new Date(today); d.setDate(1); setFrom(d.toISOString().slice(0,10)); setTo(today.toISOString().slice(0,10)); }}>Luna curentă</button>
          <button onClick={() => { const d = new Date(today.getFullYear(), 0, 1); setFrom(d.toISOString().slice(0,10)); setTo(today.toISOString().slice(0,10)); }}>An curent</button>
          <button onClick={() => { const d = new Date(today); d.setMonth(d.getMonth() - 11); d.setDate(1); setFrom(d.toISOString().slice(0,10)); setTo(today.toISOString().slice(0,10)); }}>Ultimele 12 luni</button>
          <button onClick={() => { setFrom("2000-01-01"); setTo("2099-12-31"); }}>Tot</button>
        </div>
        <button className="rap-print no-print" onClick={() => window.print()}>🖨 Print / PDF</button>
      </div>

      {/* Sub-tabs */}
      <div className="rap-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`rap-tab ${tab === t.id ? "on" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <span>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </div>

      {loading && <div className="empty">Se încarcă datele…</div>}

      {!loading && tab === "venituri" && <VenituriTab rows={filtered} fromD={fromD} toD={toD} allRows={rows} />}
      {!loading && tab === "evenimente" && <EvenimenteTab rows={filtered} allRows={rows} onOpenContract={onOpenContract} />}
      {!loading && tab === "clienti" && <ClientiTab rows={rows} today={today} onOpenContract={onOpenContract} />}
      {!loading && tab === "contracte" && <ContracteTab users={users} rows={rows} onOpenContract={onOpenContract} />}
      {!loading && tab === "operational" && <OperationalTab rows={rows} today={today} togglePaid={togglePaid} onOpenContract={onOpenContract} />}
    </div>
  );
}

/* ====================================================================
   1. VENITURI
   ==================================================================== */
function VenituriTab({ rows, fromD, toD, allRows }) {
  const byMonth = useMemo(() => {
    if (!fromD || !toD) return [];
    const map = new Map();
    let cursor = new Date(fromD.getFullYear(), fromD.getMonth(), 1);
    const end = new Date(toD.getFullYear(), toD.getMonth(), 1);
    while (cursor <= end) {
      map.set(monthKey(cursor), { key: monthKey(cursor), label: monthLabel(cursor), value: 0, count: 0 });
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      if (map.size > 60) break;
    }
    rows.forEach((r) => {
      if (!r._d) return;
      const k = monthKey(r._d);
      const slot = map.get(k);
      if (slot) { slot.value += r.total; slot.count += 1; }
    });
    return [...map.values()];
  }, [rows, fromD, toD]);

  const max = Math.max(1, ...byMonth.map((m) => m.value));
  const total = rows.reduce((s, r) => s + r.total, 0);
  const avg = rows.length ? total / rows.length : 0;

  /* Top clients */
  const topClients = useMemo(() => {
    const m = new Map();
    rows.forEach((r) => {
      const key = r.cui || r.client;
      if (!m.has(key)) m.set(key, { client: r.client, cui: r.cui, value: 0, count: 0 });
      const o = m.get(key); o.value += r.total; o.count += 1;
    });
    return [...m.values()].sort((a, b) => b.value - a.value).slice(0, 10);
  }, [rows]);

  /* YoY comparison: current year vs prev year on same months */
  const yoy = useMemo(() => {
    const cy = new Date().getFullYear();
    const py = cy - 1;
    const buckets = Array.from({ length: 12 }, (_, i) => ({
      label: monthLabel(new Date(cy, i, 1)).split(" ")[0],
      cur: 0, prev: 0,
    }));
    allRows.forEach((r) => {
      if (!r._d) return;
      const y = r._d.getFullYear();
      const m = r._d.getMonth();
      if (y === cy) buckets[m].cur += r.total;
      if (y === py) buckets[m].prev += r.total;
    });
    return buckets;
  }, [allRows]);
  const yoyMax = Math.max(1, ...yoy.flatMap((b) => [b.cur, b.prev]));
  const yoyTotalCur = yoy.reduce((s, b) => s + b.cur, 0);
  const yoyTotalPrev = yoy.reduce((s, b) => s + b.prev, 0);
  const yoyDelta = yoyTotalPrev ? ((yoyTotalCur - yoyTotalPrev) / yoyTotalPrev) * 100 : 0;

  return (
    <>
      <div className="dash-kpis">
        <Kpi color="#10B981" icon="💰" title="Total interval" value={fmt(total)} sub="LEI" />
        <Kpi color="#6366F1" icon="📅" title="Evenimente" value={fmt(rows.length)} sub="în interval" />
        <Kpi color="#34CAE8" icon="📊" title="Valoare medie" value={fmt(avg)} sub="LEI / eveniment" />
        <Kpi color={yoyDelta >= 0 ? "#10B981" : "#EF4444"} icon={yoyDelta >= 0 ? "📈" : "📉"} title="YoY (an curent vs anterior)" value={`${yoyDelta >= 0 ? "+" : ""}${yoyDelta.toFixed(1)}%`} sub={`${fmt(yoyTotalCur)} vs ${fmt(yoyTotalPrev)}`} />
      </div>

      <div className="dash-grid">
        <section className="panel">
          <div className="panel-head">
            <h2>Venituri pe lună</h2>
            <button className="rap-csv" onClick={() => downloadCsv(byMonth.map((m) => ({ luna: m.label, venituri: m.value, evenimente: m.count })), "venituri-luna.csv")}>↓ CSV</button>
          </div>
          <div className="bars-wrap">
            <div className="bars">
              {byMonth.map((m) => {
                const h = Math.max(4, (m.value / max) * 100);
                return (
                  <div key={m.key} className={`bar ${m.value === 0 ? "bar-empty" : ""}`} style={{ height: `${h}%` }} title={`${m.label}: ${fmt(m.value)} LEI (${m.count} ev.)`}>
                    <span className="bar-label">{m.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Top 10 clienți</h2>
            <button className="rap-csv" onClick={() => downloadCsv(topClients, "top-clienti.csv")}>↓ CSV</button>
          </div>
          {topClients.length === 0 ? <div className="empty">Niciun client în interval.</div> :
            topClients.map((c, i) => {
              const pct = (c.value / (topClients[0].value || 1)) * 100;
              return (
                <div key={i} className="rap-bar-row">
                  <div className="rap-bar-rank">{i + 1}</div>
                  <div className="rap-bar-main">
                    <div className="rap-bar-title">{c.client}</div>
                    <div className="rap-bar-track"><div className="rap-bar-fill" style={{ width: `${pct}%` }} /></div>
                  </div>
                  <div className="rap-bar-val">{fmt(c.value)} <span>LEI</span><div className="rap-bar-sub">{c.count} ev.</div></div>
                </div>
              );
            })
          }
        </section>
      </div>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-head">
          <h2>YoY · an curent vs anterior</h2>
          <span className="small">curent · anterior</span>
        </div>
        <div className="rap-yoy">
          {yoy.map((b, i) => (
            <div key={i} className="rap-yoy-col">
              <div className="rap-yoy-bars">
                <div className="rap-yoy-bar prev" style={{ height: `${(b.prev / yoyMax) * 100}%` }} title={`Anterior: ${fmt(b.prev)}`} />
                <div className="rap-yoy-bar cur" style={{ height: `${(b.cur / yoyMax) * 100}%` }} title={`Curent: ${fmt(b.cur)}`} />
              </div>
              <div className="rap-yoy-label">{b.label}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

/* ====================================================================
   2. EVENIMENTE
   ==================================================================== */
function EvenimenteTab({ rows, allRows, onOpenContract }) {
  /* Top locations */
  const byLoc = useMemo(() => {
    const m = new Map();
    rows.forEach((r) => {
      const k = r.locatie || "—";
      if (!m.has(k)) m.set(k, { locatie: k, count: 0, value: 0 });
      const o = m.get(k); o.count += 1; o.value += r.total;
    });
    return [...m.values()].sort((a, b) => b.count - a.count).slice(0, 10);
  }, [rows]);

  /* Distribution by scop (keyword frequency on first word) */
  const byScop = useMemo(() => {
    const m = new Map();
    rows.forEach((r) => {
      const k = (r.scop || "—").trim().toLowerCase().split(/\s+/).slice(0, 2).join(" ") || "—";
      if (!m.has(k)) m.set(k, { scop: k, count: 0, value: 0 });
      const o = m.get(k); o.count += 1; o.value += r.total;
    });
    return [...m.values()].sort((a, b) => b.count - a.count).slice(0, 10);
  }, [rows]);

  /* Seasonality: events per month-of-year (avg across years) */
  const seasonal = useMemo(() => {
    const buckets = Array.from({ length: 12 }, () => 0);
    allRows.forEach((r) => { if (r._d) buckets[r._d.getMonth()] += 1; });
    return buckets.map((v, i) => ({
      label: new Date(2000, i, 1).toLocaleDateString("ro-RO", { month: "short" }).replace(".", ""),
      value: v,
    }));
  }, [allRows]);
  const seasMax = Math.max(1, ...seasonal.map((s) => s.value));

  /* Upcoming 3 months */
  const today = new Date(new Date().toDateString());
  const horizon = new Date(today); horizon.setMonth(horizon.getMonth() + 3);
  const upcoming = useMemo(() =>
    allRows.filter((r) => r._d && r._d >= today && r._d <= horizon)
      .sort((a, b) => a._d - b._d),
    [allRows]
  );

  return (
    <>
      <div className="dash-grid">
        <section className="panel">
          <div className="panel-head">
            <h2>Top locații</h2>
            <button className="rap-csv" onClick={() => downloadCsv(byLoc, "locatii.csv")}>↓ CSV</button>
          </div>
          {byLoc.length === 0 ? <div className="empty">Niciun eveniment.</div> :
            byLoc.map((l, i) => {
              const pct = (l.count / byLoc[0].count) * 100;
              return (
                <div key={i} className="rap-bar-row">
                  <div className="rap-bar-rank">{i + 1}</div>
                  <div className="rap-bar-main">
                    <div className="rap-bar-title">{l.locatie}</div>
                    <div className="rap-bar-track"><div className="rap-bar-fill" style={{ width: `${pct}%` }} /></div>
                  </div>
                  <div className="rap-bar-val">{l.count} <span>ev.</span><div className="rap-bar-sub">{fmt(l.value)} LEI</div></div>
                </div>
              );
            })
          }
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Distribuție pe scop</h2>
            <button className="rap-csv" onClick={() => downloadCsv(byScop, "scop.csv")}>↓ CSV</button>
          </div>
          {byScop.length === 0 ? <div className="empty">—</div> :
            byScop.map((s, i) => {
              const pct = (s.count / byScop[0].count) * 100;
              return (
                <div key={i} className="rap-bar-row">
                  <div className="rap-bar-rank">{i + 1}</div>
                  <div className="rap-bar-main">
                    <div className="rap-bar-title" style={{ textTransform: "capitalize" }}>{s.scop}</div>
                    <div className="rap-bar-track"><div className="rap-bar-fill" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#34CAE8,#6366F1)" }} /></div>
                  </div>
                  <div className="rap-bar-val">{s.count} <span>ev.</span><div className="rap-bar-sub">{fmt(s.value)} LEI</div></div>
                </div>
              );
            })
          }
        </section>
      </div>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-head">
          <h2>Sezonalitate · evenimente per lună (cumulat toți anii)</h2>
        </div>
        <div className="bars-wrap">
          <div className="bars">
            {seasonal.map((s, i) => {
              const h = Math.max(4, (s.value / seasMax) * 100);
              return (
                <div key={i} className={`bar ${s.value === 0 ? "bar-empty" : ""}`} style={{ height: `${h}%` }} title={`${s.label}: ${s.value} ev.`}>
                  <span className="bar-label">{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-head">
          <h2>Pipeline · următoarele 3 luni</h2>
          <span className="small">{upcoming.length} ev. · {fmt(upcoming.reduce((s, r) => s + r.total, 0))} LEI</span>
        </div>
        {upcoming.length === 0 ? <div className="empty">Niciun eveniment programat.</div> : (
          <table className="rap-table">
            <thead><tr><th>Data</th><th>Contract</th><th>Client</th><th>Scop</th><th>Locație</th><th style={{ textAlign: "right" }}>Valoare</th></tr></thead>
            <tbody>
              {upcoming.map((r, i) => (
                <tr key={i} onClick={() => onOpenContract?.(r.nr)} style={{ cursor: "pointer" }}>
                  <td>{r.dataEveniment}</td>
                  <td>#{r.nr}_A{r.anexaIndex}</td>
                  <td>{r.client}</td>
                  <td>{r.scop}</td>
                  <td>{r.locatie}</td>
                  <td style={{ textAlign: "right" }}>{fmt(r.total)} LEI</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

/* ====================================================================
   3. CLIENȚI
   ==================================================================== */
function ClientiTab({ rows, today, onOpenContract }) {
  const byClient = useMemo(() => {
    const m = new Map();
    rows.forEach((r) => {
      const key = r.cui || r.client;
      if (!m.has(key)) m.set(key, { client: r.client, cui: r.cui, count: 0, value: 0, lastDate: null, isPJ: !!r.cui && /^\d+$/.test(String(r.cui).replace(/^RO/i, "")) });
      const o = m.get(key);
      o.count += 1; o.value += r.total;
      if (r._d && (!o.lastDate || r._d > o.lastDate)) o.lastDate = r._d;
    });
    return [...m.values()];
  }, [rows]);

  const active = byClient.filter((c) => c.count > 1).length;
  const oneShot = byClient.filter((c) => c.count === 1).length;
  const pj = byClient.filter((c) => c.isPJ).length;
  const pf = byClient.length - pj;

  const inactiv = useMemo(() => {
    const cutoff = new Date(today); cutoff.setMonth(cutoff.getMonth() - 12);
    return byClient.filter((c) => c.lastDate && c.lastDate < cutoff).sort((a, b) => b.value - a.value);
  }, [byClient, today]);

  return (
    <>
      <div className="dash-kpis">
        <Kpi color="#6366F1" icon="👥" title="Clienți totali" value={fmt(byClient.length)} sub="unici după CUI" />
        <Kpi color="#10B981" icon="🔁" title="Recurenți" value={fmt(active)} sub="≥ 2 evenimente" />
        <Kpi color="#F59E0B" icon="1️⃣" title="One-shot" value={fmt(oneShot)} sub="1 singur eveniment" />
        <Kpi color="#34CAE8" icon="🏢" title="PJ / PF" value={`${pj} / ${pf}`} sub="distribuție" />
      </div>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-head">
          <h2>Clienți inactivi · &gt; 12 luni (oportunități re-contact)</h2>
          <button className="rap-csv" onClick={() => downloadCsv(inactiv.map((c) => ({ client: c.client, cui: c.cui, ultimul_eveniment: toDmy(c.lastDate), valoare_istorica: c.value, evenimente: c.count })), "clienti-inactivi.csv")}>↓ CSV</button>
        </div>
        {inactiv.length === 0 ? <div className="empty">Niciun client inactiv. 🎉</div> : (
          <table className="rap-table">
            <thead><tr><th>Client</th><th>CUI</th><th>Ultimul eveniment</th><th>Zile</th><th>Evenimente</th><th style={{ textAlign: "right" }}>Valoare istorică</th></tr></thead>
            <tbody>
              {inactiv.map((c, i) => (
                <tr key={i}>
                  <td>{c.client}</td>
                  <td className="mono">{c.cui || "—"}</td>
                  <td>{toDmy(c.lastDate)}</td>
                  <td><span className="rap-pill warn">{daysBetween(today, c.lastDate)} zile</span></td>
                  <td>{c.count}</td>
                  <td style={{ textAlign: "right" }}>{fmt(c.value)} LEI</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

/* ====================================================================
   4. CONTRACTE
   ==================================================================== */
function ContracteTab({ users, rows, onOpenContract }) {
  const byContract = useMemo(() => {
    const m = new Map();
    users.forEach((u) => m.set(u.id, { nr: u.id, client: u.numeBeneficiar || "—", tip: u.tipContract || "cadru", anexe: 0, value: 0, hasEvent: false, hasIncasare: false }));
    rows.forEach((r) => {
      if (!m.has(r.nr)) m.set(r.nr, { nr: r.nr, client: r.client, tip: r.tipContract, anexe: 0, value: 0, hasEvent: false, hasIncasare: false });
      const o = m.get(r.nr); o.anexe += 1; o.value += r.total; o.hasEvent = true;
      if (r.total > 0) o.hasIncasare = true;
    });
    return [...m.values()];
  }, [users, rows]);

  const cadru = byContract.filter((c) => c.tip === "cadru");
  const unic = byContract.filter((c) => c.tip === "unic");
  const avgAnexeCadru = cadru.length ? cadru.reduce((s, c) => s + c.anexe, 0) / cadru.length : 0;
  const avgValCadru = cadru.length ? cadru.reduce((s, c) => s + c.value, 0) / cadru.length : 0;
  const avgValUnic = unic.length ? unic.reduce((s, c) => s + c.value, 0) / unic.length : 0;

  const fărăÎncasare = byContract.filter((c) => !c.hasIncasare);
  const fărăEveniment = byContract.filter((c) => !c.hasEvent);

  return (
    <>
      <div className="dash-kpis">
        <Kpi color="#6366F1" icon="📑" title="Contracte cadru" value={fmt(cadru.length)} sub={`val. medie ${fmt(avgValCadru)} LEI`} />
        <Kpi color="#34CAE8" icon="📄" title="Evenimente unice" value={fmt(unic.length)} sub={`val. medie ${fmt(avgValUnic)} LEI`} />
        <Kpi color="#10B981" icon="📎" title="Anexe / cadru" value={avgAnexeCadru.toFixed(1)} sub="medie" />
        <Kpi color="#EF4444" icon="⚠" title="Fără încasare" value={fmt(fărăÎncasare.length)} sub="draft / restanță" />
      </div>

      <div className="dash-grid">
        <section className="panel">
          <div className="panel-head">
            <h2>Contracte fără încasare</h2>
            <button className="rap-csv" onClick={() => downloadCsv(fărăÎncasare, "fara-incasare.csv")}>↓ CSV</button>
          </div>
          {fărăÎncasare.length === 0 ? <div className="empty">Toate contractele au încasări. 🎉</div> : (
            <table className="rap-table">
              <thead><tr><th>Nr.</th><th>Client</th><th>Tip</th><th>Anexe</th></tr></thead>
              <tbody>
                {fărăÎncasare.slice(0, 20).map((c) => (
                  <tr key={c.nr} onClick={() => onOpenContract?.(c.nr)} style={{ cursor: "pointer" }}>
                    <td className="mono">#{c.nr}</td>
                    <td>{c.client}</td>
                    <td>{c.tip}</td>
                    <td>{c.anexe}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Contracte fără eveniment</h2>
            <button className="rap-csv" onClick={() => downloadCsv(fărăEveniment, "fara-eveniment.csv")}>↓ CSV</button>
          </div>
          {fărăEveniment.length === 0 ? <div className="empty">Toate contractele au evenimente. 🎉</div> : (
            <table className="rap-table">
              <thead><tr><th>Nr.</th><th>Client</th><th>Tip</th></tr></thead>
              <tbody>
                {fărăEveniment.slice(0, 20).map((c) => (
                  <tr key={c.nr} onClick={() => onOpenContract?.(c.nr)} style={{ cursor: "pointer" }}>
                    <td className="mono">#{c.nr}</td>
                    <td>{c.client}</td>
                    <td>{c.tip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </>
  );
}

/* ====================================================================
   5. OPERATIONAL (pipeline, conversie, restanțe, aniversări)
   ==================================================================== */
function OperationalTab({ rows, today, togglePaid, onOpenContract }) {
  const next30 = new Date(today); next30.setDate(next30.getDate() + 30);

  /* Restanțe: scadență trecută, status != incasat */
  const restante = useMemo(() =>
    rows.filter((r) => r.scadenta && r.scadenta < today && r.status !== "incasat" && r.total > 0)
      .sort((a, b) => a.scadenta - b.scadenta),
    [rows, today]
  );

  /* Pipeline: evenimente următoarele 30 zile */
  const pipeline = useMemo(() =>
    rows.filter((r) => r._d && r._d >= today && r._d <= next30)
      .sort((a, b) => a._d - b._d),
    [rows, today, next30]
  );

  /* Conversie funnel */
  const total = rows.length;
  const cuEv = rows.filter((r) => r._d).length;
  const realizate = rows.filter((r) => r._d && r._d < today).length;
  const incasate = rows.filter((r) => r.status === "incasat" || (r.total > 0 && r._d && r._d < today && r.status !== "neincasat" && !r.scadenta)).length;
  const incasateStrict = rows.filter((r) => r.status === "incasat").length;

  /* Aniversări: eveniment în aceeași lună acum 1 an */
  const aniv = useMemo(() => {
    const ly = new Date(today); ly.setFullYear(ly.getFullYear() - 1);
    const month = today.getMonth();
    const year = ly.getFullYear();
    return rows.filter((r) => r._d && r._d.getFullYear() === year && r._d.getMonth() === month)
      .sort((a, b) => a._d - b._d);
  }, [rows, today]);

  return (
    <>
      <div className="dash-kpis">
        <Kpi color="#EF4444" icon="⏰" title="Restanțe" value={fmt(restante.length)} sub={`${fmt(restante.reduce((s, r) => s + r.total, 0))} LEI`} />
        <Kpi color="#F59E0B" icon="📆" title="Pipeline 30 zile" value={fmt(pipeline.length)} sub={`${fmt(pipeline.reduce((s, r) => s + r.total, 0))} LEI`} />
        <Kpi color="#10B981" icon="✓" title="Marcate încasate" value={fmt(incasateStrict)} sub={`din ${realizate} realizate`} />
        <Kpi color="#6366F1" icon="🎂" title="Aniversări lună" value={fmt(aniv.length)} sub="acum 1 an" />
      </div>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-head">
          <h2>Restanțe · scadență depășită, neîncasat</h2>
          <button className="rap-csv" onClick={() => downloadCsv(restante.map((r) => ({ contract: r.nr, anexa: r.anexaIndex, client: r.client, scadenta: toDmy(r.scadenta), zile_intarziere: daysBetween(today, r.scadenta), total: r.total })), "restante.csv")}>↓ CSV</button>
        </div>
        {restante.length === 0 ? <div className="empty">Nicio restanță. 🎉</div> : (
          <table className="rap-table">
            <thead><tr><th>Contract</th><th>Client</th><th>Scop</th><th>Scadență</th><th>Întârziere</th><th style={{ textAlign: "right" }}>Total</th><th></th></tr></thead>
            <tbody>
              {restante.map((r, i) => (
                <tr key={i}>
                  <td className="mono" onClick={() => onOpenContract?.(r.nr)} style={{ cursor: "pointer" }}>#{r.nr}_A{r.anexaIndex}</td>
                  <td>{r.client}</td>
                  <td>{r.scop}</td>
                  <td>{toDmy(r.scadenta)}</td>
                  <td><span className="rap-pill danger">{daysBetween(today, r.scadenta)} zile</span></td>
                  <td style={{ textAlign: "right" }}>{fmt(r.total)} LEI</td>
                  <td><button className="rap-mini-btn" onClick={() => togglePaid(r)}>Marchează încasat</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-head">
          <h2>Pipeline · următoarele 30 zile</h2>
          <button className="rap-csv" onClick={() => downloadCsv(pipeline.map((r) => ({ data: r.dataEveniment, contract: r.nr, anexa: r.anexaIndex, client: r.client, scop: r.scop, locatie: r.locatie, total: r.total })), "pipeline.csv")}>↓ CSV</button>
        </div>
        {pipeline.length === 0 ? <div className="empty">Niciun eveniment programat.</div> : (
          <table className="rap-table">
            <thead><tr><th>Data</th><th>Contract</th><th>Client</th><th>Scop</th><th>Locație</th><th style={{ textAlign: "right" }}>Total</th></tr></thead>
            <tbody>
              {pipeline.map((r, i) => (
                <tr key={i} onClick={() => onOpenContract?.(r.nr)} style={{ cursor: "pointer" }}>
                  <td>{r.dataEveniment}</td>
                  <td className="mono">#{r.nr}_A{r.anexaIndex}</td>
                  <td>{r.client}</td>
                  <td>{r.scop}</td>
                  <td>{r.locatie}</td>
                  <td style={{ textAlign: "right" }}>{fmt(r.total)} LEI</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-head">
          <h2>Conversie · funnel</h2>
        </div>
        <div className="rap-funnel">
          <FunnelStep label="Contracte / anexe" value={total} max={total} />
          <FunnelStep label="Cu dată eveniment" value={cuEv} max={total} />
          <FunnelStep label="Realizate (data trecută)" value={realizate} max={total} />
          <FunnelStep label="Marcate încasate" value={incasateStrict} max={total} />
        </div>
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-head">
          <h2>Aniversări · clienți cu eveniment acum 1 an în luna curentă</h2>
          <button className="rap-csv" onClick={() => downloadCsv(aniv.map((r) => ({ data_anul_trecut: r.dataEveniment, contract: r.nr, client: r.client, scop: r.scop, valoare: r.total })), "aniversari.csv")}>↓ CSV</button>
        </div>
        {aniv.length === 0 ? <div className="empty">Niciuna pentru luna curentă.</div> : (
          <table className="rap-table">
            <thead><tr><th>Data anul trecut</th><th>Client</th><th>Scop</th><th style={{ textAlign: "right" }}>Valoare</th></tr></thead>
            <tbody>
              {aniv.map((r, i) => (
                <tr key={i} onClick={() => onOpenContract?.(r.nr)} style={{ cursor: "pointer" }}>
                  <td>{r.dataEveniment}</td>
                  <td>{r.client}</td>
                  <td>{r.scop}</td>
                  <td style={{ textAlign: "right" }}>{fmt(r.total)} LEI</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

function FunnelStep({ label, value, max }) {
  const pct = max ? (value / max) * 100 : 0;
  return (
    <div className="rap-funnel-row">
      <div className="rap-funnel-label">{label}</div>
      <div className="rap-funnel-track"><div className="rap-funnel-fill" style={{ width: `${pct}%` }} /></div>
      <div className="rap-funnel-val">{fmt(value)} <span className="rap-funnel-pct">{pct.toFixed(0)}%</span></div>
    </div>
  );
}

function Kpi({ color, icon, title, value, sub }) {
  return (
    <div className="kpi" style={{ "--kpi-color": color }}>
      <div className="kpi-icon">{icon}</div>
      <div className="kpi-title">{title}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  );
}
