/* Migrare ONE-SHOT din schema veche în schema nouă.
   Schema veche: drafturi/{randomId} + users/{nr|uid} + statusContracte/{nr}
   Schema nouă: contracte/{nr} + contracte/{nr}/anexe/{Ai} + beneficiari/{cui}

   Idempotentă: rerularea NU strică date — re-scrie cu cele mai recente versiuni.
   NU ȘTERGE colecțiile vechi — le lași tu manual după ce confirmi că noua schemă merge.
*/

import { db as fdb } from "./firebase";
import {
  collection, getDocs, doc, getDoc, setDoc, writeBatch, query, where,
} from "firebase/firestore";

const fsId = (s) => String(s || "").trim().replace(/\//g, "-");
const lower = (s) => String(s || "").toLowerCase().trim();

const sumBudget = (b) =>
  (Number(b?.valoareServicii) || 0) +
  (Number(b?.transport) || 0) +
  (Number(b?.diurna) || 0) +
  (Number(b?.cazare) || 0) +
  (Number(b?.alteCheltuieli) || 0);

// Heuristic: în colecția `users`, documentele cheie-nr-contract au structură clientData
// (au câmpuri cui/numeBeneficiar/numarContract). Documentele cheie-UID au câmp `phone`/`email`
// și NU au numarContract. Le distingem după prezența `numarContract` sau a unei chei
// numerice/scurte (UID-urile Firebase sunt lungi ~28 char).
const isClientSnapshotDoc = (id, data) => {
  if (!data) return false;
  if (data.numarContract || data.cui || data.numeBeneficiar) return true;
  // UID Firebase = 28 char alphanumeric. Numerele de contract sunt scurte (1-10 char).
  return id.length <= 10 && !/^[A-Za-z0-9]{20,}$/.test(id);
};

export const migrateToV2 = async ({ onLog = () => {}, dryRun = false } = {}) => {
  const stats = {
    contracteCreate: 0,
    contracteUpdate: 0,
    anexeWritten: 0,
    beneficiariUpsert: 0,
    skipDrafturiFaraNr: 0,
    erori: [],
  };

  onLog("→ Citesc colecțiile vechi…");
  const [drafturiSnap, statusSnap, usersSnap] = await Promise.all([
    getDocs(collection(fdb, "drafturi")),
    getDocs(collection(fdb, "statusContracte")).catch(() => ({ docs: [] })),
    getDocs(collection(fdb, "users")).catch(() => ({ docs: [] })),
  ]);

  onLog(`   drafturi: ${drafturiSnap.docs.length}`);
  onLog(`   statusContracte: ${statusSnap.docs.length}`);
  onLog(`   users (total docs): ${usersSnap.docs.length}`);

  // Map status pe nr contract
  const statusMap = {};
  statusSnap.docs.forEach((d) => {
    const s = d.data()?.status;
    if (s) statusMap[d.id] = s;
  });

  // Snapshot-uri client din users — folosim doar cele care PAR a fi snapshot-uri (nu UID profile)
  const clientSnapshots = {};
  usersSnap.docs.forEach((d) => {
    const data = d.data();
    if (isClientSnapshotDoc(d.id, data)) {
      clientSnapshots[d.id] = data;
    }
  });
  onLog(`   users identificate ca snapshot-uri client: ${Object.keys(clientSnapshots).length}`);

  // Grupare beneficiari (CUI -> client data din ultimul contract)
  const beneficiariMap = {};

  // Procesează drafturi → contracte
  for (const d of drafturiSnap.docs) {
    const draft = d.data();
    const nrRaw = (draft.numarContract || "").trim();
    if (!nrRaw) {
      stats.skipDrafturiFaraNr++;
      continue;
    }
    const nr = fsId(nrRaw);
    const cui = fsId(draft.cui);
    const now = new Date().toISOString();
    const status = statusMap[nrRaw] || draft.status || "draft";
    const clientData = draft.clientData || {
      numarContract: nrRaw,
      dataContract: draft.dataContract,
      cui: draft.cui,
      numeBeneficiar: draft.numeBeneficiar,
    };
    const anexe = Array.isArray(draft.anexe) ? draft.anexe : [];
    const total = anexe.reduce((s, a) => s + sumBudget(a.budgetData), 0);
    const totalIncasat = anexe.reduce(
      (s, a) => s + (a.incasata ? (Number(a.sumaIncasata) || sumBudget(a.budgetData)) : 0),
      0
    );

    const contractRef = doc(fdb, "contracte", nr);
    const existsSnap = await getDoc(contractRef);
    const wasNew = !existsSnap.exists();

    const payload = {
      numarContract: nrRaw,
      dataContract: draft.dataContract || clientData.dataContract || "",
      cui,
      numeBeneficiar: draft.numeBeneficiar || clientData.numeBeneficiar || "",
      numeBeneficiarLower: lower(draft.numeBeneficiar || clientData.numeBeneficiar),
      total,
      totalIncasat,
      totalDatorat: Math.max(0, total - totalIncasat),
      nrAnexe: anexe.length,
      clientData,
      status,
      dataTrimisLaSemnat: draft.dataTrimisLaSemnat || null,
      dataSemnare: draft.dataSemnare || null,
      createdAt: draft.createdAt || now,
      updatedAt: draft.updatedAt || now,
      deleted: !!draft.deleted,
      ...(draft.deletedAt ? { deletedAt: draft.deletedAt } : {}),
      _migratedFrom: { collection: "drafturi", id: d.id, at: now },
    };

    if (dryRun) {
      onLog(`   [dryRun] contracte/${nr} ← drafturi/${d.id} (${anexe.length} anexe)`);
    } else {
      const batch = writeBatch(fdb);
      batch.set(contractRef, payload);
      anexe.forEach((a, i) => {
        const anexaId = `A${i + 1}`;
        const sumaServicii = sumBudget(a.budgetData);
        batch.set(doc(fdb, "contracte", nr, "anexe", anexaId), {
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
        stats.anexeWritten++;
      });
      try {
        await batch.commit();
        if (wasNew) stats.contracteCreate++;
        else stats.contracteUpdate++;
      } catch (e) {
        stats.erori.push(`contracte/${nr}: ${e.message}`);
        continue;
      }
    }

    // Agregat beneficiar (din clientData curent al fiecărui contract)
    if (cui) {
      const prev = beneficiariMap[cui] || {
        cui,
        numeBeneficiar: "",
        sediu: "",
        nrRegCom: "",
        reprezentant: "",
        email: "",
        telefon: "",
        iban: "",
        banca: "",
        nrContracte: 0,
        totalServicii: 0,
        totalIncasat: 0,
        primulContract: null,
        ultimulContract: null,
      };
      prev.numeBeneficiar = clientData.numeBeneficiar || prev.numeBeneficiar;
      prev.sediu = clientData.sediu || prev.sediu;
      prev.nrRegCom = clientData.nrRegCom || prev.nrRegCom;
      prev.reprezentant = clientData.reprezentant || prev.reprezentant;
      prev.email = clientData.email || prev.email;
      prev.telefon = clientData.telefon || prev.telefon;
      prev.iban = clientData.iban || prev.iban;
      prev.banca = clientData.banca || prev.banca;
      prev.nrContracte += 1;
      prev.totalServicii += total;
      prev.totalIncasat += totalIncasat;
      const ca = String(draft.createdAt || draft.updatedAt || "");
      const ua = String(draft.updatedAt || draft.createdAt || "");
      if (!prev.primulContract || ca < (prev.primulContract.createdAt || "9999")) {
        prev.primulContract = { nr: nrRaw, data: draft.dataContract, createdAt: ca };
      }
      if (!prev.ultimulContract || ua > (prev.ultimulContract.updatedAt || "")) {
        prev.ultimulContract = { nr: nrRaw, data: draft.dataContract, status, updatedAt: ua };
      }
      beneficiariMap[cui] = prev;
    }
  }

  // Scrie beneficiari
  onLog(`→ Scriu ${Object.keys(beneficiariMap).length} beneficiari…`);
  for (const cui of Object.keys(beneficiariMap)) {
    const b = beneficiariMap[cui];
    const payload = {
      ...b,
      numeBeneficiarLower: lower(b.numeBeneficiar),
      totalDatorat: Math.max(0, b.totalServicii - b.totalIncasat),
      updatedAt: new Date().toISOString(),
    };
    if (dryRun) {
      onLog(`   [dryRun] beneficiari/${cui} (nrContracte=${b.nrContracte})`);
    } else {
      try {
        const ref = doc(fdb, "beneficiari", cui);
        const ex = await getDoc(ref);
        await setDoc(ref, ex.exists() ? payload : { ...payload, createdAt: new Date().toISOString() });
        stats.beneficiariUpsert++;
      } catch (e) {
        stats.erori.push(`beneficiari/${cui}: ${e.message}`);
      }
    }
  }

  onLog("→ Migrare terminată.");
  onLog(`   contracte create: ${stats.contracteCreate}`);
  onLog(`   contracte update: ${stats.contracteUpdate}`);
  onLog(`   anexe scrise: ${stats.anexeWritten}`);
  onLog(`   beneficiari upsert: ${stats.beneficiariUpsert}`);
  onLog(`   drafturi fără nr (skipped): ${stats.skipDrafturiFaraNr}`);
  onLog(`   erori: ${stats.erori.length}`);
  stats.erori.forEach((e) => onLog(`     ⚠ ${e}`));
  return stats;
};

// Verificare CONFORMITATE post-migrare: compară lista drafturi (vechi) cu contracte (nou).
export const verifyMigration = async ({ onLog = () => {} } = {}) => {
  const [drafturiSnap, contracteSnap] = await Promise.all([
    getDocs(collection(fdb, "drafturi")),
    getDocs(collection(fdb, "contracte")),
  ]);
  const drafturiWithNr = drafturiSnap.docs
    .map((d) => d.data())
    .filter((d) => (d.numarContract || "").trim());
  const contracteNr = new Set(contracteSnap.docs.map((d) => d.id));
  const missing = drafturiWithNr.filter((d) => !contracteNr.has(fsId(d.numarContract)));
  onLog(`drafturi cu nr: ${drafturiWithNr.length}`);
  onLog(`contracte (nouă): ${contracteSnap.docs.length}`);
  onLog(`lipsesc în contracte: ${missing.length}`);
  missing.forEach((d) => onLog(`   ⚠ nr ${d.numarContract} (${d.numeBeneficiar || "?"})`));
  return { totalDrafturi: drafturiWithNr.length, totalContracte: contracteSnap.docs.length, missing };
};
