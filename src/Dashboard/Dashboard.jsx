import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../shared/firebase";
import "./Dashboard.css";

const fmt = (n) => new Intl.NumberFormat("ro-RO").format(Math.round(Number(n) || 0));

const parseDmy = (s) => {
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(s || "");
  return m ? new Date(`${m[3]}-${m[2]}-${m[1]}`) : null;
};

const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const addBusinessDays = (d, n) => {
  const x = new Date(d);
  let added = 0;
  while (added < n) {
    x.setDate(x.getDate() + 1);
    const wd = x.getDay();
    if (wd !== 0 && wd !== 6) added++;
  }
  return x;
};
const toDmy = (d) => `${String(d.getDate()).padStart(2,"0")}-${String(d.getMonth()+1).padStart(2,"0")}-${d.getFullYear()}`;
const daysUntil = (d, today) => Math.round((d - today) / 86400000);
const monthLabel = (d) =>
  d.toLocaleDateString("ro-RO", { month: "short" }).replace(".", "");

const initials = (s) =>
  (s || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";

const greetingByHour = () => {
  const h = new Date().getHours();
  if (h < 11) return "Bună dimineața";
  if (h < 18) return "Bună ziua";
  return "Bună seara";
};

export default function Dashboard({ onNewContract, onOpenContract, onGoLibrary, onGoReports }) {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [evenimente, setEvenimente] = useState([]);
  const [incasari, setIncasari] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [u, e, i] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "evenimente")),
          getDocs(collection(db, "incasari")),
        ]);
        if (!alive) return;
        setUsers(u.docs.map((d) => ({ id: d.id, ...d.data() })));
        setEvenimente(e.docs.map((d) => ({ id: d.id, ...d.data() })));
        setIncasari(i.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Dashboard load:", err);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = monthKey(now);
    const totalValue = incasari.reduce((s, i) => s + (Number(i.total) || 0), 0);

    let monthValue = 0;
    let monthCount = 0;
    incasari.forEach((i) => {
      const ev = evenimente.find(
        (e) => e.numarContract === i.numarContract && e.anexaIndex === i.anexaIndex
      );
      const d = parseDmy(ev?.dataEveniment);
      if (d && monthKey(d) === thisMonth) {
        monthValue += Number(i.total) || 0;
        monthCount += 1;
      }
    });

    const upcoming = evenimente
      .map((e) => ({ ...e, _d: parseDmy(e.dataEveniment) }))
      .filter((e) => e._d && e._d >= new Date(now.toDateString()))
      .sort((a, b) => a._d - b._d);

    return {
      contracts: users.length,
      annexes: evenimente.length,
      clients: new Set(users.map((u) => u.cui).filter(Boolean)).size,
      totalValue,
      monthValue,
      monthCount,
      upcomingCount: upcoming.length,
      upcoming: upcoming.slice(0, 5),
    };
  }, [users, evenimente, incasari]);

  // Recent contracts (sorted by updatedAt desc, fallback to id)
  const recent = useMemo(() => {
    const totalByNr = new Map();
    incasari.forEach((i) => {
      totalByNr.set(i.numarContract, (totalByNr.get(i.numarContract) || 0) + (Number(i.total) || 0));
    });
    return [...users]
      .sort((a, b) => {
        const ta = a.updatedAt?.seconds || 0;
        const tb = b.updatedAt?.seconds || 0;
        return tb - ta;
      })
      .slice(0, 6)
      .map((u) => ({ ...u, _total: totalByNr.get(u.id) || 0 }));
  }, [users, incasari]);

  // Memento: termene predare + încasare în următoarele 30 zile
  const termene = useMemo(() => {
    const today = new Date(new Date().toDateString());
    const horizon = addDays(today, 30);
    const usersById = new Map(users.map((u) => [u.id, u]));
    const items = [];
    evenimente.forEach((e) => {
      const d = parseDmy(e.dataEveniment);
      if (!d) return;
      const zilePred = Number(e.zilePredare) || 0;
      const zileInc = Number(e.zileIncasare) || 10;
      const dPredare = addDays(d, 1 + zilePred);
      const dIncasare = addBusinessDays(dPredare, zileInc);
      const u = usersById.get(e.numarContract) || {};
      const client = u.numeBeneficiar || "—";
      const inc = incasari.find((x) => x.numarContract === e.numarContract && x.anexaIndex === e.anexaIndex) || {};
      const platit = inc.status === "incasat";
      if (dPredare >= today && dPredare <= horizon) {
        items.push({ kind: "predare", date: dPredare, daysLeft: daysUntil(dPredare, today), client, nr: e.numarContract, anexaIndex: e.anexaIndex, scop: e.scop || "" });
      }
      if (!platit && dIncasare >= today && dIncasare <= horizon) {
        items.push({ kind: "incasare", date: dIncasare, daysLeft: daysUntil(dIncasare, today), client, nr: e.numarContract, anexaIndex: e.anexaIndex, total: Number(inc.total) || 0 });
      }
    });
    return items.sort((a, b) => a.date - b.date).slice(0, 8);
  }, [evenimente, incasari, users]);

  // Bar chart: last 6 months revenue
  const chart = useMemo(() => {
    const months = [];
    const base = new Date();
    base.setDate(1);
    for (let i = 5; i >= 0; i--) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
      months.push({ key: monthKey(d), label: monthLabel(d), value: 0 });
    }
    incasari.forEach((inc) => {
      const ev = evenimente.find(
        (e) => e.numarContract === inc.numarContract && e.anexaIndex === inc.anexaIndex
      );
      const d = parseDmy(ev?.dataEveniment);
      if (!d) return;
      const k = monthKey(d);
      const slot = months.find((m) => m.key === k);
      if (slot) slot.value += Number(inc.total) || 0;
    });
    const max = Math.max(1, ...months.map((m) => m.value));
    return { months, max };
  }, [evenimente, incasari]);

  return (
    <div className="dash">
      {/* HERO */}
      <div className="dash-hero">
        <div className="dash-hero-inner">
          <div>
            <div className="dash-hero-eyebrow">Aluma · Panou de control</div>
            <h1>{greetingByHour()}, ALUMA</h1>
            <p>
              {loading
                ? "Se sincronizează datele din cloud…"
                : `Ai ${stats.contracts} contracte active și ${stats.upcomingCount} evenimente programate. Continuă acolo unde ai rămas.`}
            </p>
          </div>
          <button className="dash-hero-cta" onClick={onNewContract}>
            ＋ Contract nou
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="dash-kpis">
        <Kpi
          color="#6366F1"
          icon="📄"
          title="Contracte totale"
          value={fmt(stats.contracts)}
          sub={`${stats.annexes} anexe emise`}
          trend={{ kind: "flat", text: "cumulat" }}
        />
        <Kpi
          color="#10B981"
          icon="💰"
          title="Valoare totală"
          value={fmt(stats.totalValue)}
          sub="LEI · toate contractele"
          trend={{ kind: "up", text: "+ activ" }}
        />
        <Kpi
          color="#34CAE8"
          icon="📅"
          title="Luna curentă"
          value={fmt(stats.monthValue)}
          sub={`${stats.monthCount} evenimente · LEI`}
          trend={{ kind: stats.monthValue > 0 ? "up" : "flat", text: stats.monthValue > 0 ? "în derulare" : "—" }}
        />
        <Kpi
          color="#F59E0B"
          icon="👥"
          title="Clienți unici"
          value={fmt(stats.clients)}
          sub="după CUI / CNP"
          trend={{ kind: "flat", text: "portofoliu" }}
        />
      </div>

      {/* Quick actions */}
      <div className="section-cap">Acțiuni Rapide</div>
      <div className="qa-grid">
        <QA color="#6366F1" icon="＋" label="Contract nou" desc="Pornește un contract gol" onClick={onNewContract} />
        <QA color="#34CAE8" icon="📁" label="Bibliotecă" desc="Răsfoiește contractele salvate" onClick={() => onGoLibrary?.("contracte")} />
        <QA color="#10B981" icon="👥" label="Clienți" desc="Vezi istoricul beneficiarilor" onClick={() => onGoLibrary?.("clienti")} />
        <QA color="#F59E0B" icon="📊" label="Rapoarte" desc="Analiză venituri lunare" onClick={() => onGoReports?.()} />
      </div>

      {/* Main grid */}
      <div className="dash-grid">
        {/* Recent contracts */}
        <section className="panel">
          <div className="panel-head">
            <h2>Contracte Recente</h2>
            <span className="small">{recent.length} afișate</span>
          </div>
          {loading ? (
            <div className="empty">Se încarcă…</div>
          ) : recent.length === 0 ? (
            <div className="empty">Niciun contract încă. Apasă „Contract nou" ca să începi.</div>
          ) : (
            recent.map((c) => (
              <div key={c.id} className="row" onClick={() => onOpenContract?.(c.id)}>
                <div className="row-avatar">{initials(c.numeBeneficiar)}</div>
                <div className="row-main">
                  <div className="row-title">{c.numeBeneficiar || "—"}</div>
                  <div className="row-sub">
                    Nr. {c.id} · {c.tipContract === "unic" ? "Eveniment unic" : "Contract cadru"}
                    {c.dataContract ? ` · ${c.dataContract}` : ""}
                  </div>
                </div>
                <span className={`badge ${c._total > 0 ? "success" : "neutral"}`}>
                  {c._total > 0 ? "Activ" : "Draft"}
                </span>
                <div className="row-amount">
                  {fmt(c._total)} <span className="ccy">LEI</span>
                </div>
              </div>
            ))
          )}
        </section>

        {/* Side column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Chart */}
          <section className="panel">
            <div className="panel-head">
              <h2>Venituri · 6 luni</h2>
              <span className="small">LEI</span>
            </div>
            <div className="bars-wrap">
              <div className="bars">
                {chart.months.map((m) => {
                  const h = Math.max(4, (m.value / chart.max) * 100);
                  return (
                    <div
                      key={m.key}
                      className={`bar ${m.value === 0 ? "bar-empty" : ""}`}
                      style={{ height: `${h}%` }}
                      title={`${m.label}: ${fmt(m.value)} LEI`}
                    >
                      <span className="bar-label">{m.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Memento termene */}
          <section className="panel">
            <div className="panel-head">
              <h2>Memento · Termene 30 zile</h2>
              <span className="small">{termene.length}</span>
            </div>
            {loading ? (
              <div className="empty">Se încarcă…</div>
            ) : termene.length === 0 ? (
              <div className="empty">Niciun termen în următoarele 30 zile.</div>
            ) : (
              termene.map((t, i) => {
                const urgent = t.daysLeft <= 3;
                const isPred = t.kind === "predare";
                return (
                  <div key={i} className="row" onClick={() => onOpenContract?.(t.nr)} style={{ cursor: "pointer" }}>
                    <div className="row-avatar" style={{
                      background: isPred
                        ? "linear-gradient(135deg,#F59E0B,#EAB308)"
                        : "linear-gradient(135deg,#EF4444,#F59E0B)",
                      fontSize: 14,
                    }}>
                      {isPred ? "📤" : "💰"}
                    </div>
                    <div className="row-main">
                      <div className="row-title">
                        {isPred ? "Predare materiale" : "Termen încasare"} · {t.client}
                      </div>
                      <div className="row-sub">
                        {toDmy(t.date)} · #{t.nr}/A{t.anexaIndex}
                        {isPred && t.scop ? ` · ${t.scop}` : ""}
                        {!isPred && t.total ? ` · ${new Intl.NumberFormat("ro-RO").format(t.total)} LEI` : ""}
                      </div>
                    </div>
                    <span className={`badge ${urgent ? "danger" : isPred ? "info" : "warning"}`}>
                      {t.daysLeft === 0 ? "azi" : t.daysLeft === 1 ? "mâine" : `${t.daysLeft} zile`}
                    </span>
                  </div>
                );
              })
            )}
          </section>

          {/* Upcoming */}
          <section className="panel">
            <div className="panel-head">
              <h2>Evenimente Următoare</h2>
              <span className="small">{stats.upcoming.length}</span>
            </div>
            {loading ? (
              <div className="empty">Se încarcă…</div>
            ) : stats.upcoming.length === 0 ? (
              <div className="empty">Niciun eveniment programat.</div>
            ) : (
              stats.upcoming.map((e) => (
                <div key={`${e.numarContract}-${e.anexaIndex}`} className="row" onClick={() => onOpenContract?.(e.numarContract)}>
                  <div className="row-avatar" style={{ background: "linear-gradient(135deg,#34CAE8,#6366F1)" }}>
                    {String(e._d.getDate()).padStart(2, "0")}
                  </div>
                  <div className="row-main">
                    <div className="row-title">{e.scop || `Anexa ${e.anexaIndex}`}</div>
                    <div className="row-sub">
                      {e.dataEveniment} · {e.locatie || "—"}
                    </div>
                  </div>
                  <span className="badge info">A{e.anexaIndex}</span>
                  <div className="row-amount" style={{ fontSize: 11, color: "var(--d-sub)" }}>
                    #{e.numarContract}
                  </div>
                </div>
              ))
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Kpi({ color, icon, title, value, sub, trend }) {
  return (
    <div className="kpi" style={{ "--kpi-color": color }}>
      <div className="kpi-icon">{icon}</div>
      <div className="kpi-title">{title}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-sub">{sub}</div>
      {trend && <span className={`kpi-trend ${trend.kind}`}>{trend.text}</span>}
    </div>
  );
}

function QA({ color, icon, label, desc, onClick }) {
  return (
    <button className="qa" style={{ "--qa-color": color }} onClick={onClick}>
      <div className="qa-icon">{icon}</div>
      <div>
        <div className="qa-label">{label}</div>
        <div className="qa-desc">{desc}</div>
      </div>
    </button>
  );
}
