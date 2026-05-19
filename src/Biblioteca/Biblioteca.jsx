import { useEffect, useState, useCallback } from "react";
import { collection, getDocs, deleteDoc, doc, query, where } from "firebase/firestore";
import { db } from "../shared/firebase";
import { getStatusMapByNumar, setContractStatusByNumar, listModele } from "../shared/db";
import Contracte from "./Contracte";
import Clienti from "./Clienti";
import Modele from "./Modele";
import { useDialog } from "../shared/Dialog";
import Icon from "../shared/Icon";
import "../Dashboard/Dashboard.css";

const TABS = [
  { id: "contracte", label: "Contracte", icon: "contract" },
  { id: "clienti", label: "Clienți", icon: "users" },
  { id: "modele", label: "Modele", icon: "folder" },
];

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
  const [modele, setModele] = useState([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [u, e, i, sm, md] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "evenimente")),
        getDocs(collection(db, "incasari")),
        getStatusMapByNumar(),
        listModele(),
      ]);
      setUsers(u.docs.map((d) => ({ id: d.id, ...d.data() })));
      setEvenimente(e.docs.map((d) => ({ id: d.id, ...d.data() })));
      setIncasari(i.docs.map((d) => ({ id: d.id, ...d.data() })));
      setStatusMap(sm);
      setModele(md || []);
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

  const active = TABS.find((t) => t.id === tab) || TABS[0];
  const nrClienti = new Set(users.map((u) => u.cui || "—")).size;
  const plural = (n, sg, pl) => `${n} ${n === 1 ? sg : pl}`;
  const subtitle = loading
    ? "Se încarcă din Firestore…"
    : tab === "clienti"
      ? `${plural(nrClienti, "client", "clienți")} · cloud`
      : tab === "modele"
        ? `${plural(modele.length, "model", "modele")} · cloud`
        : `${plural(users.length, "contract", "contracte")} · cloud`;

  return (
    <div className="dash">
      <div className="dash-hero">
        <div className="dash-hero-inner">
          <div>
            <h1>{active.label}</h1>
            <p>{subtitle}</p>
          </div>
          <button className="dash-hero-cta" onClick={refresh} disabled={loading}>
            <Icon name="refresh" /> Reîmprospătează
          </button>
        </div>
      </div>

      <div className="section">
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
    </div>
  );
}
