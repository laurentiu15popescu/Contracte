import { useEffect, useState, useCallback } from "react";
import { listModele, deleteModel } from "../shared/db";
import { useDialog } from "../shared/Dialog";
import "../Dashboard/Dashboard.css";

export default function Modele({ onUseModel, onOpenBlank }) {
  const { alert, confirm } = useDialog();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listModele();
      setItems(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleDelete = async (id, nume) => {
    if (!(await confirm(`Ștergi modelul${nume ? ` pentru ${nume}` : ""}?`, { variant: "danger", confirmLabel: "Șterge" }))) return;
    await deleteModel(id);
    refresh();
  };

  const handleUse = async (m) => {
    if (typeof onUseModel === "function") onUseModel(m);
    else await alert("Funcția de folosire model nu este conectată în acest context.", { variant: "warning" });
  };

  if (loading) return <div className="helper">Se încarcă modelele…</div>;

  return (
    <div className="modele-list">
      {onOpenBlank && (
        <div className="qa-grid" style={{ marginBottom: 18 }}>
          <button
            className="qa"
            style={{ "--qa-color": "#0EA5E9" }}
            onClick={onOpenBlank}
          >
            <div className="qa-icon">📄</div>
            <div>
              <div className="qa-label">Deschide model blank</div>
              <div className="qa-desc">Template gol — editează clauze și salvează ca model</div>
            </div>
          </button>
        </div>
      )}
      {items.length === 0 && (
        <div className="empty">Niciun model salvat încă. Click pe „Deschide model blank” → editează clauze → „Salvează ca model”.</div>
      )}
      {items.length > 0 && (
      <table className="rap-table" style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>Client</th>
            <th>CUI</th>
            <th>Hash</th>
            <th>Creat</th>
            <th>Actualizat</th>
            <th style={{ textAlign: "right" }}>Acțiuni</th>
          </tr>
        </thead>
        <tbody>
          {items.map((m) => (
            <tr key={m.id}>
              <td>{m.numeBeneficiar || "—"}</td>
              <td className="mono">{m.cui || "—"}</td>
              <td className="mono" style={{ fontSize: 11, color: "var(--ink-2)" }}>{m.hash}</td>
              <td>{m.createdAt?.slice(0, 10) || "—"}</td>
              <td>{m.updatedAt?.slice(0, 10) || "—"}</td>
              <td style={{ textAlign: "right" }}>
                <button className="btn ghost" onClick={() => handleUse(m)}>Folosește</button>
                <button className="btn ghost danger" onClick={() => handleDelete(m.id, m.numeBeneficiar)}>Șterge</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </div>
  );
}
