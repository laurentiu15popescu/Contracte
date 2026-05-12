import { Fragment, useEffect, useRef, useState } from "react";

/* Aplică override-uri peste un array de secțiuni → returnează lista finală
   și un index id→număr ("3.4"). */
export function aplicaOverrides(sectiuni, custom = {}) {
  const modificate = custom.modificate || {};
  const adaugate = custom.adaugate || [];
  const sterse = new Set(custom.sterse || []);

  const sectiuniFinale = sectiuni.map((sec, sIdx) => {
    let lista = sec.clauze.filter((c) => !sterse.has(c.id));

    adaugate.forEach((ad) => {
      if (sterse.has(ad.id)) return;
      const dupaIdx = lista.findIndex((c) => c.id === ad.dupaId);
      if (dupaIdx >= 0) {
        lista = [
          ...lista.slice(0, dupaIdx + 1),
          { id: ad.id, text: ad.text, _custom: true },
          ...lista.slice(dupaIdx + 1),
        ];
      } else if (ad.dupaId === `sec:${sec.id}`) {
        lista = [...lista, { id: ad.id, text: ad.text, _custom: true }];
      }
    });

    lista = lista.map((c) => {
      if (modificate[c.id] != null) {
        return { id: c.id, text: modificate[c.id], _modificat: true, _custom: c._custom };
      }
      return c;
    });

    return { ...sec, clauzeFinale: lista, numar: sIdx + 1 };
  });

  const idMap = {};
  sectiuniFinale.forEach((sec) => {
    sec.clauzeFinale.forEach((c, j) => {
      if (!c.noNum && !sec.fara_numerotare) {
        idMap[c.id] = `${sec.numar}.${j + 1}`;
      }
    });
  });

  return { sectiuniFinale, idMap };
}

/* Render text cu **bold** și <ref:id/>. */
export function renderText(text, idMap) {
  if (text == null) return null;
  const parts = [];
  let i = 0;
  let key = 0;
  const re = /\*\*([^*]+)\*\*|<ref:([a-z0-9-]+)\/>/gi;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > i) parts.push(text.slice(i, m.index));
    if (m[1] != null) parts.push(<strong key={key++}>{m[1]}</strong>);
    else if (m[2] != null) parts.push(<Fragment key={key++}>art. {idMap[m[2]] || "?"}</Fragment>);
    i = m.index + m[0].length;
  }
  if (i < text.length) parts.push(text.slice(i));
  return parts;
}

/* Extrage text plain dintr-un React node (recursiv, inclusiv prin componente funcție) */
export function reactToText(n) {
  if (n == null || typeof n === "boolean") return "";
  if (typeof n === "string" || typeof n === "number") return String(n);
  if (Array.isArray(n)) return n.map(reactToText).join("");
  if (n.type && typeof n.type === "function") {
    try { return reactToText(n.type(n.props)); } catch { return ""; }
  }
  if (n.props) return reactToText(n.props.children);
  return "";
}

/* Modal centrat pentru editare clauză */
export function ClauzaModal({ titlu, initial = "", onSave, onClose, idMap = {}, currentId }) {
  const [val, setVal] = useState(initial);
  const taRef = useRef(null);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const insertRef = (id) => {
    if (!id) return;
    const ta = taRef.current;
    const token = `<ref:${id}/>`;
    if (!ta) { setVal((v) => v + token); return; }
    const s = ta.selectionStart ?? val.length;
    const e = ta.selectionEnd ?? val.length;
    const next = val.slice(0, s) + token + val.slice(e);
    setVal(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = s + token.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  const refOptions = Object.entries(idMap)
    .filter(([id]) => id !== currentId)
    .sort((a, b) => a[1].localeCompare(b[1], undefined, { numeric: true }));

  const overlay = {
    position: "fixed", inset: 0, background: "rgba(20,15,5,0.45)",
    display: "grid", placeItems: "center", zIndex: 9999,
  };
  const box = {
    background: "#fffaf0", border: "1px solid #d4a72c", borderRadius: 8,
    padding: 20, width: "min(640px, 92vw)", boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    fontFamily: "system-ui, sans-serif",
  };
  const h = { margin: 0, fontSize: 15, color: "#6b4e16" };
  const ta = {
    width: "100%", minHeight: 140, marginTop: 12, padding: 10,
    fontFamily: "Georgia, serif", fontSize: 13, lineHeight: 1.5,
    border: "1px solid #d4a72c", borderRadius: 4, resize: "vertical", boxSizing: "border-box",
  };
  const hint = { fontSize: 11, color: "#8b6914", marginTop: 6 };
  const row = { display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 };
  const btn = {
    padding: "6px 14px", border: "1px solid #d4a72c", borderRadius: 4,
    background: "#fff", cursor: "pointer", fontSize: 13,
  };
  const btnPrimary = { ...btn, background: "#d4a72c", color: "#fff", fontWeight: 600 };

  return (
    <div className="no-print" contentEditable={false} style={overlay} onClick={onClose}>
      <div style={box} onClick={(e) => e.stopPropagation()}>
        <h3 style={h}>{titlu}</h3>
        <textarea
          ref={taRef}
          autoFocus
          style={ta}
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
        {refOptions.length > 0 && (
          <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ fontSize: 12, color: "#6b4e16" }}>Inserează referință:</label>
            <select
              value=""
              onChange={(e) => { insertRef(e.target.value); e.target.value = ""; }}
              style={{ flex: 1, padding: "4px 6px", border: "1px solid #d4a72c", borderRadius: 4, fontSize: 12 }}
            >
              <option value="">— alege o clauză —</option>
              {refOptions.map(([id, numar]) => (
                <option key={id} value={id}>art. {numar} — {id}</option>
              ))}
            </select>
          </div>
        )}
        <div style={hint}>
          <strong>**text**</strong> = bold &nbsp;·&nbsp; <code>&lt;ref:id/&gt;</code> = referință &nbsp;·&nbsp; gol = șterge clauza
        </div>
        <div style={row}>
          <button style={btn} onClick={onClose}>Anulează</button>
          <button style={btnPrimary} onClick={() => onSave(val)}>Salvează</button>
        </div>
      </div>
    </div>
  );
}

/* Confirm modal simplu */
function ConfirmModal({ mesaj, onYes, onClose }) {
  const overlay = {
    position: "fixed", inset: 0, background: "rgba(20,15,5,0.45)",
    display: "grid", placeItems: "center", zIndex: 9999,
  };
  const box = {
    background: "#fffaf0", border: "1px solid #d4a72c", borderRadius: 8,
    padding: 20, width: "min(420px, 92vw)", fontFamily: "system-ui, sans-serif",
  };
  const row = { display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 };
  const btn = { padding: "6px 14px", border: "1px solid #d4a72c", borderRadius: 4, background: "#fff", cursor: "pointer" };
  const btnPrimary = { ...btn, background: "#d4a72c", color: "#fff", fontWeight: 600 };
  return (
    <div className="no-print" contentEditable={false} style={overlay} onClick={onClose}>
      <div style={box} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 14 }}>{mesaj}</div>
        <div style={row}>
          <button style={btn} onClick={onClose}>Nu</button>
          <button style={btnPrimary} onClick={onYes}>Da</button>
        </div>
      </div>
    </div>
  );
}

/* Controale per-clauză */
export function ClauzaControls({ clauza, custom, onChange, isCustom, fallbackText = "", idMap = {} }) {
  const [mode, setMode] = useState(null); // "edit" | "add" | "reset" | null

  const initialEdit =
    custom?.modificate?.[clauza.id] ??
    (typeof clauza.text === "string" ? clauza.text : fallbackText);

  const saveEdit = (nou) => {
    setMode(null);
    const next = { ...(custom || {}) };
    next.modificate = { ...(next.modificate || {}) };
    next.sterse = [...(next.sterse || [])];
    next.adaugate = [...(next.adaugate || [])];

    if (nou.trim() === "") {
      if (isCustom) {
        next.adaugate = next.adaugate.filter((a) => a.id !== clauza.id);
        delete next.modificate[clauza.id];
      } else {
        if (!next.sterse.includes(clauza.id)) next.sterse.push(clauza.id);
        delete next.modificate[clauza.id];
      }
    } else {
      if (isCustom) {
        const inAd = next.adaugate.some((a) => a.id === clauza.id);
        if (inAd) {
          next.adaugate = next.adaugate.map((a) => (a.id === clauza.id ? { ...a, text: nou } : a));
        } else {
          next.modificate[clauza.id] = nou;
        }
      } else {
        next.modificate[clauza.id] = nou;
      }
    }
    onChange(next);
  };

  const saveAdd = (txt) => {
    setMode(null);
    if (!txt.trim()) return;
    const next = { ...(custom || {}) };
    next.adaugate = [
      ...(next.adaugate || []),
      { id: `custom-${Date.now()}`, dupaId: clauza.id, text: txt },
    ];
    onChange(next);
  };

  const doReset = () => {
    setMode(null);
    const next = { ...(custom || {}) };
    next.modificate = { ...(next.modificate || {}) };
    delete next.modificate[clauza.id];
    next.sterse = (next.sterse || []).filter((id) => id !== clauza.id);
    if (isCustom) next.adaugate = (next.adaugate || []).filter((a) => a.id !== clauza.id);
    onChange(next);
  };

  const btn = {
    marginLeft: 4, border: "1px solid #d4a72c", background: "#fff8e1",
    cursor: "pointer", padding: "0 6px", fontSize: 11, borderRadius: 3,
  };

  return (
    <>
      <span className="no-print" contentEditable={false} style={{ userSelect: "none" }}>
        <button type="button" title="Editează" style={btn} onClick={() => setMode("edit")}>✎</button>
        <button type="button" title="Adaugă clauză după" style={btn} onClick={() => setMode("add")}>+</button>
        {(clauza._modificat || isCustom) && (
          <button type="button" title="Resetează" style={btn} onClick={() => setMode("reset")}>↺</button>
        )}
      </span>
      {mode === "edit" && (
        <ClauzaModal
          titlu={`Editează clauza ${clauza.id}`}
          initial={initialEdit}
          onSave={saveEdit}
          onClose={() => setMode(null)}
          idMap={idMap}
          currentId={clauza.id}
        />
      )}
      {mode === "add" && (
        <ClauzaModal
          titlu={`Adaugă clauză după ${clauza.id}`}
          initial=""
          onSave={saveAdd}
          onClose={() => setMode(null)}
          idMap={idMap}
        />
      )}
      {mode === "reset" && (
        <ConfirmModal
          mesaj={isCustom ? "Ștergi clauza adăugată?" : "Resetezi clauza la textul original?"}
          onYes={doReset}
          onClose={() => setMode(null)}
        />
      )}
    </>
  );
}

/* Buton "+ adaugă la finalul secțiunii" */
export function AdaugaLaFinal({ sectiuneId, custom, onChange, idMap = {} }) {
  const [open, setOpen] = useState(false);

  const save = (txt) => {
    setOpen(false);
    if (!txt.trim()) return;
    const next = { ...(custom || {}) };
    next.adaugate = [
      ...(next.adaugate || []),
      { id: `custom-${Date.now()}`, dupaId: `sec:${sectiuneId}`, text: txt },
    ];
    onChange(next);
  };

  return (
    <>
      <p className="no-print" contentEditable={false} style={{ textAlign: "center" }}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            border: "1px dashed #d4a72c", background: "transparent",
            padding: "4px 12px", cursor: "pointer", fontSize: 12, color: "#8b6914",
          }}
        >+ adaugă clauză în această secțiune</button>
      </p>
      {open && (
        <ClauzaModal
          titlu="Adaugă clauză nouă"
          initial=""
          onSave={save}
          onClose={() => setOpen(false)}
          idMap={idMap}
        />
      )}
    </>
  );
}
