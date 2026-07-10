import { useMemo, useState } from "react";
import { exportBeneficiariFilteredExcel } from "../shared/excelExport";

const fmt = (n) => new Intl.NumberFormat("ro-RO").format(Number(n) || 0);
const SortableHeader = ({ children, sortKey, sort, onSort }) => {
  const isActive = sort.key === sortKey;
  const icon = isActive ? (sort.dir === "asc" ? "▲" : "▼") : "";
  return (
    <th
      onClick={() => onSort(sortKey)}
      style={{ cursor: "pointer", userSelect: "none" }}
    >
      {children}
      {icon && <span style={{ fontSize: "0.8em", marginLeft: 4 }}>{icon}</span>}
    </th>
  );
};

export default function Clienti({
  users,
  evenimente,
  incasari,
  onOpen,
  sort,
  onSort,
}) {
  const [search, setSearch] = useState("");
  const [expandedCui, setExpandedCui] = useState(() => new Set());
  const [expandedContract, setExpandedContract] = useState(() => new Set());

  const grouped = useMemo(() => {
    const byCui = {};
    users.forEach((u) => {
      const key = u.cui || "—";
      if (!byCui[key]) {
        byCui[key] = {
          cui: key,
          numeBeneficiar: u.numeBeneficiar,
          sediu: u.sediu,
          email: u.email,
          telefon: u.telefon,
          contracte: [],
        };
      }
      byCui[key].contracte.push(u);
    });

    const evByContract = {};
    evenimente.forEach((e) => {
      const k = e.numarContract;
      if (!evByContract[k]) evByContract[k] = [];
      evByContract[k].push(e);
    });
    const incByContract = {};
    incasari.forEach((r) => {
      const k = r.numarContract;
      if (!incByContract[k]) incByContract[k] = [];
      incByContract[k].push(r);
    });

    return Object.values(byCui).map((g) => ({
      ...g,
      contracte: g.contracte.map((c) => {
        const nr = c.numarContract || c.id;
        const ev = (evByContract[nr] || [])
          .slice()
          .sort((a, b) => (a.anexaIndex || 0) - (b.anexaIndex || 0));
        const inc = (incByContract[nr] || [])
          .slice()
          .sort((a, b) => (a.anexaIndex || 0) - (b.anexaIndex || 0));
        const anexe = ev.map((e) => {
          const i = inc.find((x) => x.anexaIndex === e.anexaIndex) || {};
          return {
            eventData: e,
            budgetData: i,
            anexaIndex: e.anexaIndex,
            total: Number(i.total) || 0,
          };
        });
        const total = anexe.reduce((s, a) => s + a.total, 0);
        return { ...c, nr, anexe, total };
      }),
      nrContracte: g.contracte.length,
      totalValoare: g.contracte.reduce((s, c) => s + c.total, 0),
    }));
  }, [users, evenimente, incasari]); // Adăugăm incasari la dependințe

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = !q
      ? grouped
      : grouped.filter(
          (g) =>
            (g.numeBeneficiar || "").toLowerCase().includes(q) ||
            (g.cui || "").toLowerCase().includes(q),
        );

    return [...list].sort((a, b) => {
      const valA = a[sort.key];
      const valB = b[sort.key];
      const comparison =
        typeof valA === "number"
          ? valA - valB
          : String(valA || "").localeCompare(String(valB || ""), "ro");
      return sort.dir === "asc" ? comparison : -comparison;
    });
  }, [grouped, search, sort]);

  const toggle = (set, setter, key) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setter(next);
  };

  const [exportBusy, setExportBusy] = useState(false);
  const handleExportExcel = async () => {
    if (!filtered.length) return;
    setExportBusy(true);
    try {
      await exportBeneficiariFilteredExcel(
        filtered.map((g) => g.cui).filter(Boolean),
      );
    } catch (e) {
      console.error("Export Excel:", e);
    } finally {
      setExportBusy(false);
    }
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 12,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <div className="field" style={{ flex: "1 1 320px", maxWidth: 420 }}>
          <label>Caută client (nume sau CUI)</label>
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
            title="Descarcă beneficiarii filtrați ca .xlsx"
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3.5" width="14" height="13" rx="1.5" />
              <path d="M3 8h14M8 3.5v13" />
            </svg>
            <span>{exportBusy ? "Se exportă…" : "Export Excel"}</span>
          </button>
          <span
            style={{
              fontSize: 12,
              color: "var(--muted)",
              maxWidth: 280,
              textOverflow: "ellipsis",
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
          >
            {search.trim()
              ? `Filtru: «${search.trim()}»`
              : "Filtru: toți clienții"}
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>Niciun client.</p>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              padding: "0 14px",
              borderBottom: "1px solid var(--line-2)",
              height: 40,
              fontSize: 12,
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: ".05em",
            }}
          >
            <div style={{ width: 14 }}></div>
            <div style={{ flex: 1 }}>
              <SortableHeader sortKey="numeBeneficiar" sort={sort} onSort={onSort}>Beneficiar</SortableHeader>
            </div>
            <SortableHeader sortKey="totalValoare" sort={sort} onSort={onSort}>Valoare totală</SortableHeader>
            <div style={{ width: 10 /* for alignment */ }}></div>
          </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((g) => {
            const open = expandedCui.has(g.cui);
            const totalClient = g.totalValoare;
            return (
              <div
                key={g.cui}
                style={{ border: "1px solid var(--line-2)", borderRadius: 6 }}
              >
                <button
                  type="button"
                  onClick={() => toggle(expandedCui, setExpandedCui, g.cui)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "12px 14px",
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    background: "transparent",
                    border: 0,
                    cursor: "pointer",
                  }}
                >
                  <span style={{ width: 14, color: "var(--muted)" }}>
                    {open ? "▾" : "▸"}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>
                      {g.numeBeneficiar || "(fără nume)"}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>
                      CUI {g.cui} · {g.contracte.length}{" "}
                      {g.contracte.length === 1 ? "contract" : "contracte"}
                      {g.email && ` · ${g.email}`}
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: "Geist Mono, monospace",
                      fontSize: 13,
                    }}
                  >
                    {fmt(totalClient)} LEI
                  </div>
                </button>


                {open && (
                  <div
                    style={{
                      borderTop: "1px solid var(--line-2)",
                      padding: "10px 14px",
                    }}
                  >
                    {g.contracte.map((c) => {
                      const ck = `${g.cui}::${c.nr}`;
                      const copen = expandedContract.has(ck);
                      return (
                        <div
                          key={c.id}
                          style={{
                            padding: "8px 0",
                            borderBottom: "1px dashed var(--line-2)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              gap: 10,
                              alignItems: "center",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                toggle(
                                  expandedContract,
                                  setExpandedContract,
                                  ck,
                                )
                              }
                              style={{
                                background: "transparent",
                                border: 0,
                                cursor: "pointer",
                                color: "var(--muted)",
                              }}
                            >
                              {copen ? "▾" : "▸"}
                            </button>
                            <div style={{ flex: 1 }}>
                              <strong>Contract #{c.nr}</strong>
                              <span
                                style={{
                                  color: "var(--muted)",
                                  marginLeft: 8,
                                  fontSize: 12,
                                }}
                              >
                                {c.dataContract || "—"} · {c.anexe.length}{" "}
                                {c.anexe.length === 1 ? "anexă" : "anexe"}
                              </span>
                            </div>
                            <div
                              style={{
                                fontFamily: "Geist Mono, monospace",
                                fontSize: 13,
                              }}
                            >
                              {fmt(c.total)} LEI
                            </div>
                            <button
                              className="btn"
                              onClick={() => onOpen(c.nr)}
                            >
                              Deschide
                            </button>
                          </div>

                          {copen && (
                            <div
                              style={{
                                marginLeft: 28,
                                marginTop: 8,
                                display: "flex",
                                flexDirection: "column",
                                gap: 6,
                              }}
                            >
                              {c.anexe.length === 0 && (
                                <div
                                  style={{
                                    color: "var(--muted)",
                                    fontSize: 12,
                                  }}
                                >
                                  Fără anexe.
                                </div>
                              )}
                              {c.anexe.map((a) => (
                                <div
                                  key={a.anexaIndex}
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "60px 1fr 1fr 120px",
                                    gap: 10,
                                    padding: "6px 10px",
                                    background: "var(--paper-2, #faf7ef)",
                                    borderRadius: 4,
                                    fontSize: 13,
                                  }}
                                >
                                  <div style={{ fontWeight: 600 }}>
                                    A{a.anexaIndex}
                                  </div>
                                  <div>
                                    <div>{a.eventData.scop || "—"}</div>
                                    <div
                                      style={{
                                        fontSize: 11,
                                        color: "var(--muted)",
                                      }}
                                    >
                                      {a.eventData.dataEveniment || "—"} ·{" "}
                                      {a.eventData.locatie || "—"}
                                    </div>
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 11,
                                      color: "var(--muted)",
                                    }}
                                  >
                                    Servicii:{" "}
                                    {fmt(a.budgetData.valoareServicii)} ·
                                    Transport: {fmt(a.budgetData.transport)} ·
                                    Cazare: {fmt(a.budgetData.cazare)}
                                  </div>
                                  <div
                                    style={{
                                      textAlign: "right",
                                      fontFamily: "Geist Mono, monospace",
                                    }}
                                  >
                                    {fmt(a.total)} LEI
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        </>
      )}
    </>
  );
}
