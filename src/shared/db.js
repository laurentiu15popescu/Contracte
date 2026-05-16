import Dexie from "dexie";
import { db as fdb } from "./firebase";
import {
  collection, getDocs, doc, getDoc, setDoc, deleteDoc,
  query, where, orderBy,
} from "firebase/firestore";

export const db = new Dexie("AlumaContracte");

db.version(1).stores({
  contracte: "++id, numarContract, dataContract, cui, numeBeneficiar, updatedAt",
});
db.version(2).stores({
  contracte: "++id, numarContract, dataContract, cui, numeBeneficiar, updatedAt, status",
}).upgrade((tx) =>
  tx.table("contracte").toCollection().modify((c) => {
    if (!c.status) c.status = "draft";
  })
);
db.version(3).stores({
  contracte: "++id, numarContract, dataContract, cui, numeBeneficiar, updatedAt, status",
  modele: "++id, cui, hash, updatedAt",
});

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

// ---- Modele: stocate în Firestore (colecția "modele"), nu se pierd la schimbarea device-ului.
// Cheia documentului = hash-ul clauzelor → deduplicare naturală.
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
  const snap = await getDocs(query(collection(fdb, "modele"), orderBy("updatedAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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
    await db.contracte.update(id, record);
    return id;
  }
  return await db.contracte.add({ ...record, createdAt: now, status: "draft" });
};

// Statusul "trimis" se scrie și în cloud (după numărul contractului), nu doar local.
export const markContractTrimis = async (id) => {
  const now = new Date().toISOString();
  const rec = await db.contracte.get(id);
  await db.contracte.update(id, { status: "trimis", updatedAt: now });
  if (rec?.numarContract) {
    await setDoc(
      doc(fdb, "statusContracte", String(rec.numarContract)),
      { status: "trimis", updatedAt: now },
      { merge: true }
    );
  }
};

export const listDrafturi = () =>
  db.contracte.where("status").equals("draft").reverse().sortBy("updatedAt");

export const STATUS_STEPS = ["draft", "trimis", "semnat", "finalizat"];

// Sursa de adevăr pentru status = Firestore ("statusContracte/{numarContract}").
// Scrie și local (best-effort) pentru a păstra coerentă lista de drafturi.
export const setContractStatusByNumar = async (numarContract, status) => {
  if (!numarContract) return 0;
  const now = new Date().toISOString();
  await setDoc(
    doc(fdb, "statusContracte", String(numarContract)),
    { status, updatedAt: now },
    { merge: true }
  );
  try {
    await db.contracte
      .where("numarContract").equals(numarContract)
      .modify({ status, updatedAt: now });
  } catch {
    /* local opțional */
  }
  return 1;
};

export const getStatusMapByNumar = async () => {
  const out = {};
  // 1) local (legacy / drafturi offline)
  try {
    const all = await db.contracte.toArray();
    for (const c of all) {
      if (c.numarContract) out[c.numarContract] = c.status || "draft";
    }
  } catch {
    /* ignoră erorile locale */
  }
  // 2) cloud — autoritar, suprascrie localul
  try {
    const snap = await getDocs(collection(fdb, "statusContracte"));
    snap.docs.forEach((d) => {
      const s = d.data()?.status;
      if (s) out[d.id] = s;
    });
  } catch {
    /* dacă cloud-ul pică, rămâne fallback-ul local */
  }
  return out;
};

export const listContracte = async (search = "") => {
  const all = await db.contracte.orderBy("updatedAt").reverse().toArray();
  if (!search) return all;
  const q = search.toLowerCase();
  return all.filter(
    (c) =>
      (c.numeBeneficiar || "").toLowerCase().includes(q) ||
      (c.numarContract || "").toLowerCase().includes(q) ||
      (c.cui || "").toLowerCase().includes(q)
  );
};

export const getContract = (id) => db.contracte.get(id);

export const getContractByNumar = (nr) =>
  db.contracte.where("numarContract").equals(nr).first();

export const deleteContract = (id) => db.contracte.delete(id);

export const exportAll = async () => {
  const all = await db.contracte.toArray();
  return { version: 1, exportedAt: new Date().toISOString(), contracte: all };
};

export const importAll = async (data) => {
  if (!data || !Array.isArray(data.contracte)) throw new Error("Format invalid");
  let count = 0;
  for (const c of data.contracte) {
    // eslint-disable-next-line no-unused-vars
    const { id, ...rest } = c;
    await db.contracte.add({ ...rest, updatedAt: rest.updatedAt || new Date().toISOString() });
    count++;
  }
  return count;
};
