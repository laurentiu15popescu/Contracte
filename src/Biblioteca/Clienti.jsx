import { useMemo, useState } from "react";

const fmt = (n) => new Intl.NumberFormat("ro-RO").format(Number(n) || 0);

export default function Clienti({ users, evenimente, incasari, onOpen }) {
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
        const ev = (evByContract[nr] || []).slice().sort((a, b) => (a.anexaIndex || 0) - (b.anexaIndex || 0));
        const inc = (incByContract[nr] || []).slice().sort((a, b) => (a.anexaIndex || 0) - (b.anexaIndex || 0));
        const anexe = ev.map((e) => {
          const i = inc.find((x) => x.anexaIndex === e.anexaIndex) || {};
          return { eventData: e, budgetData: i, anexaIndex: e.anexaIndex, total: Number(i.total) || 0 };
        });
        const total = anexe.reduce((s, a) => s + a.total, 0);
        return { ...c, nr, anexe, total };
      }),
    }));
  }, [users, evenimente, incasari]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return grouped;
    return grouped.filter(
      (g) =>
        (g.numeBeneficiar || "").toLowerCase().includes(q) ||
        (g.cui || "").toLowerCase().includes(q)
    );
  }, [grouped, search]);

  const toggle = (set, setter, key) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key); else next.add(key);
    setter(next);
  };

  return (
    <>
      <div className="field" style={{ marginBottom: 16, maxWidth: 420 }}>
        <label>Caută client (nume sau CUI)</label>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ex: SC Exemplu SRL"
        />
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>Niciun client.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((g) => {
            const open = expandedCui.has(g.cui);
            const totalClient = g.contracte.reduce((s, c) => s + c.total, 0);
            return (
              <div key={g.cui} style={{ border: "1px solid var(--line-2)", borderRadius: 6 }}>
                <button
                  type="button"
                  onClick={() => toggle(expandedCui, setExpandedCui, g.cui)}
                  style={{
                    width: "100%", textAlign: "left", padding: "12px 14px",
                    display: "flex", gap: 12, alignItems: "center",
                    background: "transparent", border: 0, cursor: "pointer",
                  }}
                >
                  <span style={{ width: 14, color: "var(--muted)" }}>{open ? "▾" : "▸"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{g.numeBeneficiar || "(fără nume)"}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>
                      CUI {g.cui} · {g.contracte.length} {g.contracte.length === 1 ? "contract" : "contracte"}
                      {g.email && ` · ${g.email}`}
                    </div>
                  </div>
                  <div style={{ fontFamily: "Geist Mono, monospace", fontSize: 13 }}>
                    {fmt(totalClient)} LEI
                  </div>
                </button>

                {open && (
                  <div style={{ borderTop: "1px solid var(--line-2)", padding: "10px 14px" }}>
                    {g.contracte.map((c) => {
                      const ck = `${g.cui}::${c.nr}`;
                      const copen = expandedContract.has(ck);
                      return (
                        <div key={c.id} style={{ padding: "8px 0", borderBottom: "1px dashed var(--line-2)" }}>
                          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <button
                              type="button"
                              onClick={() => toggle(expandedContract, setExpandedContract, ck)}
                              style={{ background: "transparent", border: 0, cursor: "pointer", color: "var(--muted)" }}
                            >
                              {copen ? "▾" : "▸"}
                            </button>
                            <div style={{ flex: 1 }}>
                              <strong>Contract #{c.nr}</strong>
                              <span style={{ color: "var(--muted)", marginLeft: 8, fontSize: 12 }}>
                                {c.dataContract || "—"} · {c.anexe.length} {c.anexe.length === 1 ? "anexă" : "anexe"}
                              </span>
                            </div>
                            <div style={{ fontFamily: "Geist Mono, monospace", fontSize: 13 }}>
                              {fmt(c.total)} LEI
                            </div>
                            <button className="btn" onClick={() => onOpen(c.nr)}>Deschide</button>
                          </div>

                          {copen && (
                            <div style={{ marginLeft: 28, marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                              {c.anexe.length === 0 && (
                                <div style={{ color: "var(--muted)", fontSize: 12 }}>Fără anexe.</div>
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
                                  <div style={{ fontWeight: 600 }}>A{a.anexaIndex}</div>
                                  <div>
                                    <div>{a.eventData.scop || "—"}</div>
                                    <div style={{ fontSize: 11, color: "var(--muted)" }}>
                                      {a.eventData.dataEveniment || "—"} · {a.eventData.locatie || "—"}
                                    </div>
                                  </div>
                                  <div style={{ fontSize: 11, color: "var(--muted)" }}>
                                    Servicii: {fmt(a.budgetData.valoareServicii)} ·
                                    Transport: {fmt(a.budgetData.transport)} ·
                                    Cazare: {fmt(a.budgetData.cazare)}
                                  </div>
                                  <div style={{ textAlign: "right", fontFamily: "Geist Mono, monospace" }}>
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
      )}
    </>
  );
}
