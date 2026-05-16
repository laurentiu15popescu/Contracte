import { db as fdb } from "./firebase";
import {
  collection, getDocs, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, onSnapshot,
} from "firebase/firestore";

// FNV-1a 32-bit — hash stabil pentru deduplicare clauze
export const hashClauze = (clauzeCustom) => {
  const s = JSON.stringify(clauzeCustom || {});
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
};

// ---- Modele: Firestore ("modele"), cheia = hash-ul clauzelor (deduplicare).
export const saveModel = async ({ cui, numeBeneficiar, clauzeCustom, defaultEvent, defaultBudget }) => {
  const hash = hashClauze(clauzeCustom);
  const ref = doc(fdb, "modele", hash);
  const snap = await getDoc(ref);
  if (snap.exists()) return { id: hash, duplicate: true };
  const now = new Date().toISOString();
  await setDoc(ref, {
    cui: cui || "",
    numeBeneficiar: numeBeneficiar || "",
    clauzeCustom: clauzeCustom || {},
    defaultEvent: defaultEvent || {},
    defaultBudget: defaultBudget || {},
    hash,
    createdAt: now,
    updatedAt: now,
  });
  return { id: hash, duplicate: false };
};

export const listModele = async () => {
  const snap = await getDocs(collection(fdb, "modele"));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
};

export const getModeleByCui = async (cui) => {
  if (!cui) return [];
  const snap = await getDocs(query(collection(fdb, "modele"), where("cui", "==", cui)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getModel = async (id) => {
  const snap = await getDoc(doc(fdb, "modele", String(id)));
  return snap.exists() ? { id: snap.id, ...snap.data() } : undefined;
};

export const deleteModel = (id) => deleteDoc(doc(fdb, "modele", String(id)));

const sumBudget = (b) =>
  (Number(b?.valoareServicii) || 0) +
  (Number(b?.transport) || 0) +
  (Number(b?.diurna) || 0) +
  (Number(b?.cazare) || 0) +
  (Number(b?.alteCheltuieli) || 0);

// ---- Drafturi/contracte: Firestore ("drafturi") — accesibile de pe orice device.
export const saveContract = async ({ clientData, anexe, id }) => {
  const now = new Date().toISOString();
  const total = (anexe || []).reduce((s, a) => s + sumBudget(a.budgetData), 0);
  const record = {
    numarContract: clientData.numarContract || "",
    dataContract: clientData.dataContract || "",
    cui: clientData.cui || "",
    numeBeneficiar: clientData.numeBeneficiar || "",
    total,
    clientData,
    anexe,
    updatedAt: now,
  };
  if (id) {
    await updateDoc(doc(fdb, "drafturi", String(id)), record);
    return id;
  }
  const ref = await addDoc(collection(fdb, "drafturi"), {
    ...record,
    createdAt: now,
    status: "draft",
  });
  return ref.id;
};

// Statusul "trimis" se scrie pe draft și în "statusContracte/{numarContract}".
export const markContractTrimis = async (id) => {
  const now = new Date().toISOString();
  const ref = doc(fdb, "drafturi", String(id));
  const snap = await getDoc(ref);
  await updateDoc(ref, { status: "trimis", updatedAt: now });
  const nr = snap.exists() ? snap.data()?.numarContract : null;
  if (nr) {
    await setDoc(
      doc(fdb, "statusContracte", String(nr)),
      { status: "trimis", updatedAt: now },
      { merge: true }
    );
  }
};

export const listDrafturi = async () => {
  const snap = await getDocs(collection(fdb, "drafturi"));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((c) => !c.deleted && (c.status || "draft") === "draft")
    .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
};

// Abonare în timp real la lista de drafturi (returnează funcția de dezabonare)
export const subscribeDrafturi = (cb) =>
  onSnapshot(
    collection(fdb, "drafturi"),
    (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((c) => !c.deleted && (c.status || "draft") === "draft")
        .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
      cb(list);
    },
    () => {} // eroare/permisiuni: păstrează ultima listă cunoscută
  );

export const STATUS_STEPS = ["draft", "trimis", "semnat", "finalizat"];

// Sursa de adevăr pentru status = Firestore ("statusContracte/{numarContract}").
export const setContractStatusByNumar = async (numarContract, status) => {
  if (!numarContract) return 0;
  const now = new Date().toISOString();
  await setDoc(
    doc(fdb, "statusContracte", String(numarContract)),
    { status, updatedAt: now },
    { merge: true }
  );
  // reflectă statusul și pe draftul corespunzător (best-effort)
  try {
    const snap = await getDocs(query(collection(fdb, "drafturi"), where("numarContract", "==", numarContract)));
    await Promise.all(snap.docs.map((d) => updateDoc(d.ref, { status, updatedAt: now })));
  } catch {
    /* opțional */
  }
  return 1;
};

export const getStatusMapByNumar = async () => {
  const out = {};
  try {
    const snap = await getDocs(collection(fdb, "statusContracte"));
    snap.docs.forEach((d) => {
      const s = d.data()?.status;
      if (s) out[d.id] = s;
    });
  } catch {
    /* dacă pică, returnează ce s-a strâns */
  }
  return out;
};

export const listContracte = async (search = "") => {
  const snap = await getDocs(collection(fdb, "drafturi"));
  const all = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((c) => !c.deleted)
    .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  if (!search) return all;
  const q = search.toLowerCase();
  return all.filter(
    (c) =>
      (c.numeBeneficiar || "").toLowerCase().includes(q) ||
      (c.numarContract || "").toLowerCase().includes(q) ||
      (c.cui || "").toLowerCase().includes(q)
  );
};

export const getContract = async (id) => {
  const snap = await getDoc(doc(fdb, "drafturi", String(id)));
  return snap.exists() ? { id: snap.id, ...snap.data() } : undefined;
};

export const getContractByNumar = async (nr) => {
  const snap = await getDocs(query(collection(fdb, "drafturi"), where("numarContract", "==", nr)));
  if (snap.empty) return undefined;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
};

// soft-delete: marchează "deleted" (recuperabil), nu șterge definitiv
export const deleteContract = (id) =>
  updateDoc(doc(fdb, "drafturi", String(id)), {
    deleted: true,
    deletedAt: new Date().toISOString(),
  });

export const restoreContract = (id) =>
  updateDoc(doc(fdb, "drafturi", String(id)), { deleted: false, deletedAt: null });

// ștergere definitivă (folosită doar explicit, ex. golire coș)
export const purgeContract = (id) => deleteDoc(doc(fdb, "drafturi", String(id)));

export const exportAll = async () => {
  const snap = await getDocs(collection(fdb, "drafturi"));
  const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return { version: 1, exportedAt: new Date().toISOString(), contracte: all };
};

export const importAll = async (data) => {
  if (!data || !Array.isArray(data.contracte)) throw new Error("Format invalid");
  let count = 0;
  for (const c of data.contracte) {
    // eslint-disable-next-line no-unused-vars
    const { id, ...rest } = c;
    await addDoc(collection(fdb, "drafturi"), {
      ...rest,
      status: rest.status || "draft",
      updatedAt: rest.updatedAt || new Date().toISOString(),
    });
    count++;
  }
  return count;
};
