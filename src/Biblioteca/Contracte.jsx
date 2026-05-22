import { useMemo, useState } from "react";
import { exportContracteFilteredExcel } from "../shared/excelExport";

const fmt = (n) => new Intl.NumberFormat("ro-RO").format(Number(n) || 0);

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
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

const DEFAULT_ZILE_INCASARE = 10;

const STATUS_STEPS = ["draft", "trimis", "semnat", "finalizat"];
const STATUS_COLORS = {
  draft: "#F59E0B",
  trimis: "#34CAE8",
  semnat: "#6366F1",
  finalizat: "#10B981",
};

export default function Contracte({ users, evenimente = [], incasari, onOpen, onDelete, statusMap = {}, onStatusChange }) {
  const [search, setSearch] = useState("");

  const totalByContract = useMemo(() => {
    const map = {};
    incasari.forEach((r) => {
      map[r.numarContract] = (map[r.numarContract] || 0) + (Number(r.total) || 0);
    });
    return map;
  }, [incasari]);

  // Pentru fiecare contract: anexa relevantă (următoarea ev., sau ultima dacă toate trecute)
  const datesByContract = useMemo(() => {
    const today = new Date(new Date().toDateString());
    const groups = new Map();
    evenimente.forEach((e) => {
      const d = parseDmy(e.dataEveniment);
      if (!d) return;
      if (!groups.has(e.numarContract)) groups.set(e.numarContract, []);
      groups.get(e.numarContract).push({ ...e, _d: d });
    });
    const out = {};
    groups.forEach((arr, nr) => {
      arr.sort((a, b) => a._d - b._d);
      const upcoming = arr.find((x) => x._d >= today);
      const pick = upcoming || arr[arr.length - 1];
      const dataPredare = addDays(pick._d, 1 + (Number(pick.zilePredare) || 0));
      const nrZileInc = Number(pick.zileIncasare) || DEFAULT_ZILE_INCASARE;
      out[nr] = {
        dataPredare: toDmy(dataPredare),
        zileIncasare: nrZileInc,
        anexaIndex: pick.anexaIndex,
        totalAnexe: arr.length,
        isUpcoming: !!upcoming,
      };
    });
    return out;
  }, [evenimente]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = users.map((u) => {
      const key = u.numarContract || u.id;
      return {
        ...u,
        total: totalByContract[key] || 0,
        dates: datesByContract[key] || null,
      };
    });
    if (!q) return list;
    return list.filter(
      (u) =>
        (u.numeBeneficiar || "").toLowerCase().includes(q) ||
        (u.cui || "").toLowerCase().includes(q) ||
        (u.numarContract || "").toLowerCase().includes(q)
    );
  }, [users, totalByContract, datesByContract, search]);

  const [exportBusy, setExportBusy] = useState(false);
  const handleExportExcel = async () => {
    if (!filtered.length) return;
    setExportBusy(true);
    try {
      const nrList = filtered.map((c) => c.numarContract || c.id);
      await exportContracteFilteredExcel(nrList);
    } catch (e) {
      console.error("Export Excel:", e);
    } finally {
      setExportBusy(false);
    }
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div className="field" style={{ flex: "1 1 320px", maxWidth: 420 }}>
          <label>Caută (nume, CUI, număr)</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ex: SC Exemplu SRL"
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            className="btn-excel"
            onClick={handleExportExcel}
            disabled={exportBusy || !filtered.length}
            title="Descarcă lista filtrată ca .xlsx (Contracte + Anexe)"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3.5" width="14" height="13" rx="1.5" />
              <path d="M3 8h14M8 3.5v13" />
            </svg>
            <span>{exportBusy ? "Se exportă…" : "Export Excel"}</span>
          </button>
          <span style={{ fontSize: 12, color: "var(--muted)", maxWidth: 280, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
            {search.trim() ? `Filtru: «${search.trim()}»` : "Filtru: toate contractele"}
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>Nicio înregistrare în Firestore.</p>
      ) : (
        <table className="table-saved">
          <thead>
            <tr>
              <th>Nr.</th>
              <th>Data</th>
              <th>Beneficiar</th>
              <th>CUI</th>
              <th>Predare materiale</th>
              <th>Termen plată (zile lucr.)</th>
              <th style={{ textAlign: "right" }}>Total</th>
              <th>Status</th>
              <th>Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const d = c.dates;
              const suffix = d && d.totalAnexe > 1
                ? <span style={{ color: "var(--muted)", fontSize: 11 }}> · A{d.anexaIndex}/{d.totalAnexe}</span>
                : null;
              return (
                <tr key={c.id}>
                  <td className="num">{c.numarContract || c.id}</td>
                  <td className="num">{c.dataContract || "—"}</td>
                  <td>{c.numeBeneficiar || "—"}</td>
                  <td className="num">{c.cui || "—"}</td>
                  <td className="num">
                    {d ? <>{d.dataPredare}{suffix}</> : "—"}
                  </td>
                  <td className="num">
                    {d ? `${d.zileIncasare} zile` : "—"}
                  </td>
                  <td className="num" style={{ textAlign: "right" }}>{fmt(c.total)} LEI</td>
                  <td>
                    {(() => {
                      const nr = c.numarContract || c.id;
                      const cur = statusMap[nr] || "draft";
                      return (
                        <select
                          value={cur}
                          onChange={(e) => onStatusChange && onStatusChange(nr, e.target.value)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: 6,
                            border: `1px solid ${STATUS_COLORS[cur] || "#ccc"}`,
                            color: STATUS_COLORS[cur] || "#333",
                            fontWeight: 600,
                            fontSize: 12,
                            background: "#fff",
                            cursor: "pointer",
                          }}
                        >
                          {STATUS_STEPS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      );
                    })()}
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn" onClick={() => onOpen(c.numarContract || c.id)}>Deschide</button>
                      <button className="btn danger" onClick={() => onDelete(c.numarContract || c.id)}>Șterge</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}
