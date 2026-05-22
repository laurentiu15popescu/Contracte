import { db as fdb } from "./firebase";
import {
  collection, getDocs, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, onSnapshot, writeBatch, serverTimestamp,
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

/* ============================================================================
   NOUA SCHEMĂ — colecții: contracte/{nr} + contracte/{nr}/anexe/{i} + beneficiari/{cui}
   Toate funcțiile noi au sufixul "V2" ca să coexiste cu cele vechi în tranziție.
   ============================================================================ */

// Sanitizare ID Firestore: nu poate conține "/" și max 1500B. Înlocuim "/" cu "-".
const fsId = (s) => String(s || "").trim().replace(/\//g, "-");
const lower = (s) => String(s || "").toLowerCase().trim();

// Document principal contract — ID = numarContract
export const saveContractV2 = async ({ clientData, anexe }) => {
  const nr = fsId(clientData?.numarContract);
  if (!nr) throw new Error("Contractul nu are număr.");
  const now = new Date().toISOString();
  const total = (anexe || []).reduce((s, a) => s + sumBudget(a.budgetData), 0);
  const totalIncasat = (anexe || []).reduce(
    (s, a) => s + (a.incasata ? (Number(a.sumaIncasata) || sumBudget(a.budgetData)) : 0),
    0
  );

  const cui = fsId(clientData?.cui);
  const numeBeneficiar = clientData?.numeBeneficiar || "";

  const contractRef = doc(fdb, "contracte", nr);
  const prevSnap = await getDoc(contractRef);
  const prev = prevSnap.exists() ? prevSnap.data() : null;

  const record = {
    numarContract: nr,
    dataContract: clientData?.dataContract || "",
    cui,
    numeBeneficiar,
    numeBeneficiarLower: lower(numeBeneficiar),
    total,
    totalIncasat,
    totalDatorat: Math.max(0, total - totalIncasat),
    nrAnexe: (anexe || []).length,
    clientData,
    status: prev?.status || "draft",
    dataTrimisLaSemnat: prev?.dataTrimisLaSemnat || null,
    dataSemnare: prev?.dataSemnare || null,
    createdAt: prev?.createdAt || now,
    updatedAt: now,
    deleted: prev?.deleted || false,
  };

  const batch = writeBatch(fdb);
  batch.set(contractRef, record);

  // Anexe ca subcolecție — ID = A1, A2, ... (păstrăm semantic-ul actual din evenimente/incasari)
  // Curăță anexele vechi care nu mai apar (rename/delete în UI)
  const oldAnexeSnap = await getDocs(collection(fdb, "contracte", nr, "anexe"));
  const keepIds = new Set((anexe || []).map((_, i) => `A${i + 1}`));
  oldAnexeSnap.docs.forEach((d) => {
    if (!keepIds.has(d.id)) batch.delete(d.ref);
  });

  (anexe || []).forEach((a, i) => {
    const anexaId = `A${i + 1}`;
    const anexaRef = doc(fdb, "contracte", nr, "anexe", anexaId);
    const sumaServicii = sumBudget(a.budgetData);
    batch.set(anexaRef, {
      anexaIndex: i + 1,
      eventData: a.eventData || {},
      budgetData: a.budgetData || {},
      sumaServicii,
      incasata: !!a.incasata,
      dataIncasare: a.dataIncasare || null,
      sumaIncasata: Number(a.sumaIncasata) || (a.incasata ? sumaServicii : 0),
      nrFactura: a.nrFactura || "",
      dataFactura: a.dataFactura || "",
      updatedAt: now,
    });
  });

  await batch.commit();

  // Actualizează agregatul pe beneficiar (best-effort, async după commit)
  if (cui) {
    try { await recomputeBeneficiarAggregates(cui); } catch (e) { console.warn("beneficiari agg:", e); }
  }
  return nr;
};

export const setContractFlowDateV2 = async (nr, field, value) => {
  if (!nr) return;
  const allowed = ["dataTrimisLaSemnat", "dataSemnare"];
  if (!allowed.includes(field)) throw new Error("Câmp neacceptat: " + field);
  await updateDoc(doc(fdb, "contracte", fsId(nr)), {
    [field]: value || null,
    updatedAt: new Date().toISOString(),
  });
};

export const setContractStatusV2 = async (nr, status) => {
  if (!nr) return;
  const now = new Date().toISOString();
  const patch = { status, updatedAt: now };
  if (status === "trimis") patch.dataTrimisLaSemnat = now;
  if (status === "semnat") patch.dataSemnare = now;
  await updateDoc(doc(fdb, "contracte", fsId(nr)), patch);
};

export const setAnexaIncasareV2 = async (nr, anexaIdx, payload) => {
  // payload: { incasata, dataIncasare, sumaIncasata, nrFactura, dataFactura }
  if (!nr) return;
  const ref = doc(fdb, "contracte", fsId(nr), "anexe", `A${anexaIdx}`);
  await updateDoc(ref, { ...payload, updatedAt: new Date().toISOString() });
  // Recomp agregate pe contract + beneficiar
  await recomputeContractTotals(nr);
  const snap = await getDoc(doc(fdb, "contracte", fsId(nr)));
  const cui = snap.exists() ? snap.data()?.cui : null;
  if (cui) await recomputeBeneficiarAggregates(cui);
};

const recomputeContractTotals = async (nr) => {
  const anexeSnap = await getDocs(collection(fdb, "contracte", fsId(nr), "anexe"));
  let total = 0, incasat = 0;
  anexeSnap.docs.forEach((d) => {
    const a = d.data();
    total += Number(a.sumaServicii) || 0;
    if (a.incasata) incasat += Number(a.sumaIncasata) || Number(a.sumaServicii) || 0;
  });
  await updateDoc(doc(fdb, "contracte", fsId(nr)), {
    total,
    totalIncasat: incasat,
    totalDatorat: Math.max(0, total - incasat),
    updatedAt: new Date().toISOString(),
  });
};

export const getContractV2 = async (nr) => {
  if (!nr) return undefined;
  const snap = await getDoc(doc(fdb, "contracte", fsId(nr)));
  if (!snap.exists()) return undefined;
  const data = { id: snap.id, ...snap.data() };
  const anexeSnap = await getDocs(collection(fdb, "contracte", fsId(nr), "anexe"));
  data.anexe = anexeSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.anexaIndex || 0) - (b.anexaIndex || 0));
  return data;
};

export const listContracteV2 = async ({ search = "", includeDeleted = false } = {}) => {
  const snap = await getDocs(collection(fdb, "contracte"));
  let all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (!includeDeleted) all = all.filter((c) => !c.deleted);
  all.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  if (!search) return all;
  const q = lower(search);
  return all.filter(
    (c) =>
      (c.numeBeneficiarLower || "").includes(q) ||
      lower(c.numarContract).includes(q) ||
      lower(c.cui).includes(q)
  );
};

export const subscribeContracteV2 = (cb, { onlyDrafts = false } = {}) =>
  onSnapshot(
    collection(fdb, "contracte"),
    (snap) => {
      let list = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((c) => !c.deleted);
      if (onlyDrafts) list = list.filter((c) => (c.status || "draft") === "draft");
      list.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
      cb(list);
    },
    () => {}
  );

export const deleteContractV2 = (nr) =>
  updateDoc(doc(fdb, "contracte", fsId(nr)), {
    deleted: true,
    deletedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

export const restoreContractV2 = (nr) =>
  updateDoc(doc(fdb, "contracte", fsId(nr)), {
    deleted: false,
    deletedAt: null,
    updatedAt: new Date().toISOString(),
  });

export const purgeContractV2 = async (nr) => {
  // hard-delete + curăță subcolecția anexe
  const id = fsId(nr);
  const anexeSnap = await getDocs(collection(fdb, "contracte", id, "anexe"));
  const batch = writeBatch(fdb);
  anexeSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(fdb, "contracte", id));
  await batch.commit();
};

/* ---- Beneficiari ---- */

export const upsertBeneficiar = async (clientData) => {
  const cui = fsId(clientData?.cui);
  if (!cui) return null;
  const now = new Date().toISOString();
  const ref = doc(fdb, "beneficiari", cui);
  const snap = await getDoc(ref);
  const payload = {
    cui,
    numeBeneficiar: clientData?.numeBeneficiar || "",
    numeBeneficiarLower: lower(clientData?.numeBeneficiar),
    sediu: clientData?.sediu || "",
    nrRegCom: clientData?.nrRegCom || "",
    reprezentant: clientData?.reprezentant || "",
    email: clientData?.email || "",
    telefon: clientData?.telefon || "",
    iban: clientData?.iban || "",
    banca: clientData?.banca || "",
    updatedAt: now,
  };
  if (snap.exists()) {
    await updateDoc(ref, payload);
  } else {
    await setDoc(ref, { ...payload, createdAt: now });
  }
  return cui;
};

const recomputeBeneficiarAggregates = async (cui) => {
  const cid = fsId(cui);
  if (!cid) return;
  const snap = await getDocs(query(collection(fdb, "contracte"), where("cui", "==", cid)));
  const lista = snap.docs.map((d) => d.data()).filter((c) => !c.deleted);
  let nr = 0, total = 0, incasat = 0;
  let primul = null, ultimul = null;
  lista.forEach((c) => {
    nr += 1;
    total += Number(c.total) || 0;
    incasat += Number(c.totalIncasat) || 0;
    if (!primul || String(c.createdAt) < String(primul.createdAt || "9999")) {
      primul = { nr: c.numarContract, data: c.dataContract, createdAt: c.createdAt };
    }
    if (!ultimul || String(c.updatedAt || "") > String(ultimul.updatedAt || "")) {
      ultimul = { nr: c.numarContract, data: c.dataContract, status: c.status, updatedAt: c.updatedAt };
    }
  });
  await updateDoc(doc(fdb, "beneficiari", cid), {
    nrContracte: nr,
    totalIncasat: incasat,
    totalDatorat: Math.max(0, total - incasat),
    totalServicii: total,
    primulContract: primul,
    ultimulContract: ultimul,
    updatedAt: new Date().toISOString(),
  }).catch(async (e) => {
    // Dacă documentul nu există încă (n-am rulat upsertBeneficiar), îl creează
    if (e?.code === "not-found") {
      await setDoc(doc(fdb, "beneficiari", cid), {
        cui: cid,
        nrContracte: nr,
        totalIncasat: incasat,
        totalDatorat: Math.max(0, total - incasat),
        totalServicii: total,
        primulContract: primul,
        ultimulContract: ultimul,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      throw e;
    }
  });
};

export const listBeneficiari = async (search = "") => {
  const snap = await getDocs(collection(fdb, "beneficiari"));
  let all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  all.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  if (!search) return all;
  const q = lower(search);
  return all.filter(
    (b) =>
      (b.numeBeneficiarLower || "").includes(q) ||
      lower(b.cui).includes(q)
  );
};

export const getBeneficiar = async (cui) => {
  const snap = await getDoc(doc(fdb, "beneficiari", fsId(cui)));
  return snap.exists() ? { id: snap.id, ...snap.data() } : undefined;
};

export const deleteBeneficiar = (cui) => deleteDoc(doc(fdb, "beneficiari", fsId(cui)));

// Re-export simbol util pentru migrare (script-ul îl folosește)
export { serverTimestamp };
