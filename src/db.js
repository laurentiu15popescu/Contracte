import Dexie from "dexie";

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

export const markContractTrimis = (id) =>
  db.contracte.update(id, { status: "trimis", updatedAt: new Date().toISOString() });

export const listDrafturi = () =>
  db.contracte.where("status").equals("draft").reverse().sortBy("updatedAt");

export const STATUS_STEPS = ["draft", "trimis", "semnat", "finalizat"];

export const setContractStatusByNumar = async (numarContract, status) => {
  if (!numarContract) return 0;
  return db.contracte
    .where("numarContract").equals(numarContract)
    .modify({ status, updatedAt: new Date().toISOString() });
};

export const getStatusMapByNumar = async () => {
  const all = await db.contracte.toArray();
  const out = {};
  for (const c of all) {
    if (c.numarContract) out[c.numarContract] = c.status || "draft";
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
