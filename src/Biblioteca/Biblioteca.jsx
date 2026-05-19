import { useEffect, useState, useCallback } from "react";
import { collection, getDocs, deleteDoc, doc, query, where } from "firebase/firestore";
import { db } from "../shared/firebase";
import { getStatusMapByNumar, setContractStatusByNumar } from "../shared/db";
import Contracte from "./Contracte";
import Clienti from "./Clienti";
import Modele from "./Modele";
import { useDialog } from "../shared/Dialog";

export default function Biblioteca({ onOpen, tab: tabProp, onTabChange, onUseModel, onOpenBlank }) {
  const { alert, confirm } = useDialog();
  const [tabLocal, setTabLocal] = useState("contracte");
  const tab = tabProp ?? tabLocal;
  const setTab = onTabChange ?? setTabLocal;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [evenimente, setEvenimente] = useState([]);
  const [incasari, setIncasari] = useState([]);
  const [statusMap, setStatusMap] = useState({});

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [u, e, i, sm] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "evenimente")),
        getDocs(collection(db, "incasari")),
        getStatusMapByNumar(),
      ]);
      setUsers(u.docs.map((d) => ({ id: d.id, ...d.data() })));
      setEvenimente(e.docs.map((d) => ({ id: d.id, ...d.data() })));
      setIncasari(i.docs.map((d) => ({ id: d.id, ...d.data() })));
      setStatusMap(sm);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleDeleteContract = async (nr) => {
    if (!(await confirm(`Ștergi contractul nr. ${nr} și toate anexele lui din Firestore?`, { variant: "danger", confirmLabel: "Șterge" }))) return;
    try {
      await deleteDoc(doc(db, "users", nr));
      for (const col of ["evenimente", "incasari"]) {
        const snap = await getDocs(query(collection(db, col), where("numarContract", "==", nr)));
        await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, col, d.id))));
      }
      refresh();
    } catch (err) {
      await alert("Eroare la ștergere: " + err.message, { variant: "danger" });
    }
  };

  const handleStatusChange = async (nr, status) => {
    try {
      const n = await setContractStatusByNumar(nr, status);
      if (!n) {
        await alert("Contractul nu a putut fi actualizat. Deschide-l și salvează-l mai întâi.", { variant: "warning" });
        return;
      }
      setStatusMap((m) => ({ ...m, [nr]: status }));
    } catch (err) {
      await alert("Eroare la schimbarea statusului: " + err.message, { variant: "danger" });
    }
  };

  return (
    <section className="card">
      <div className="section">
        <div className="section-head">
          <span className="idx">⌗</span>
          <h2>Bibliotecă</h2>
          <span className="helper">
            {loading ? "Se încarcă din Firestore…" : `${users.length} contracte · cloud`}
          </span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button className="btn" onClick={refresh} disabled={loading}>↻ Reîmprospătează</button>
          </div>
        </div>

        {error && (
          <div className="errors"><strong>Eroare:</strong> {error}</div>
        )}

        {!loading && !error && tab === "contracte" && (
          <Contracte
            users={users}
            evenimente={evenimente}
            incasari={incasari}
            onOpen={onOpen}
            onDelete={handleDeleteContract}
            statusMap={statusMap}
            onStatusChange={handleStatusChange}
          />
        )}

        {!loading && !error && tab === "clienti" && (
          <Clienti
            users={users}
            evenimente={evenimente}
            incasari={incasari}
            onOpen={onOpen}
          />
        )}

        {tab === "modele" && <Modele onUseModel={onUseModel} onOpenBlank={onOpenBlank} />}
      </div>
    </section>
  );
}
