import { useEffect, useState } from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  verifyBeforeUpdateEmail,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../shared/firebase";

const BRAND = "#6366F1";
const ACCENT2 = "#34CAE8";
const GRADIENT = `linear-gradient(90deg, ${BRAND}, ${ACCENT2})`;

const mapErr = (ex) => {
  const code = ex?.code || "";
  if (code === "auth/wrong-password" || code === "auth/invalid-credential")
    return "Parola curentă este greșită.";
  if (code === "auth/weak-password")
    return "Parola nouă e prea slabă (minim 6 caractere).";
  if (code === "auth/invalid-email") return "Adresă de email invalidă.";
  if (code === "auth/email-already-in-use")
    return "Acest email este deja folosit de alt cont.";
  if (code === "auth/requires-recent-login")
    return "Sesiune expirată. Deconectează-te și reautentifică-te.";
  return ex?.message || code || "Eroare necunoscută.";
};

const Icon = ({ d, color }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);
const LOCK = <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>;
const MAIL = <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></>;
const PHONE = <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />;

const Msg = ({ err, info }) =>
  err ? (
    <div style={{ color: "#EF4444", fontSize: 13, fontWeight: 600 }}>{err}</div>
  ) : info ? (
    <div style={{ color: "#10B981", fontSize: 13, fontWeight: 600 }}>{info}</div>
  ) : null;

export default function ContSetari() {
  const user = auth.currentUser;

  const [curPass, setCurPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [pBusy, setPBusy] = useState(false);
  const [pErr, setPErr] = useState("");
  const [pInfo, setPInfo] = useState("");

  const [curPassE, setCurPassE] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [eBusy, setEBusy] = useState(false);
  const [eErr, setEErr] = useState("");
  const [eInfo, setEInfo] = useState("");

  const [phone, setPhone] = useState("");
  const [phBusy, setPhBusy] = useState(false);
  const [phErr, setPhErr] = useState("");
  const [phInfo, setPhInfo] = useState("");

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid))
      .then((snap) => {
        if (snap.exists()) setPhone(snap.data().phone || "");
      })
      .catch(() => {});
  }, [user]);

  if (!user) {
    return (
      <div className="dash">
        <div style={{ color: "#737373", fontSize: 14 }}>
          Trebuie să fii autentificat pentru a accesa setările contului.
        </div>
      </div>
    );
  }

  const reauth = async (password) => {
    const cred = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, cred);
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPErr(""); setPInfo("");
    if (newPass.length < 6) {
      setPErr("Parola nouă trebuie să aibă minim 6 caractere.");
      return;
    }
    setPBusy(true);
    try {
      await reauth(curPass);
      await updatePassword(user, newPass);
      setPInfo("Parola a fost schimbată cu succes.");
      setCurPass(""); setNewPass("");
    } catch (ex) {
      setPErr(mapErr(ex));
    } finally {
      setPBusy(false);
    }
  };

  const changeEmail = async (e) => {
    e.preventDefault();
    setEErr(""); setEInfo("");
    setEBusy(true);
    try {
      await reauth(curPassE);
      await verifyBeforeUpdateEmail(user, newEmail.trim());
      setEInfo(
        "Ți-am trimis un email de confirmare la noua adresă. Emailul de logare se schimbă după ce confirmi din acel mesaj."
      );
      setCurPassE(""); setNewEmail("");
    } catch (ex) {
      setEErr(mapErr(ex));
    } finally {
      setEBusy(false);
    }
  };

  const savePhone = async (e) => {
    e.preventDefault();
    setPhErr(""); setPhInfo("");
    setPhBusy(true);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        { phone: phone.trim(), email: user.email, updatedAt: serverTimestamp() },
        { merge: true }
      );
      setPhInfo("Numărul de telefon a fost salvat.");
    } catch (ex) {
      setPhErr(mapErr(ex));
    } finally {
      setPhBusy(false);
    }
  };

  const card = {
    background: "var(--bg)",
    border: "1px solid var(--border)",
    borderRadius: 22,
    padding: 26,
    flex: "1 1 320px",
    maxWidth: 440,
    display: "flex",
    flexDirection: "column",
    gap: 16,
    boxShadow: "var(--shadow)",
  };
  const iconCircle = (c) => ({
    width: 44,
    height: 44,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    background: `${c}1F`,
    flexShrink: 0,
  });
  const label = {
    fontSize: 10,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "var(--text)",
    marginBottom: 7,
    display: "block",
  };
  const input = {
    width: "100%",
    boxSizing: "border-box",
    height: 52,
    padding: "0 14px",
    borderRadius: 12,
    border: "1px solid var(--border)",
    background: "var(--bg)",
    color: "var(--text-h)",
    fontSize: 15,
    outline: "none",
  };
  const primaryBtn = (busy) => ({
    background: GRADIENT,
    color: "#fff",
    border: "none",
    borderRadius: 16,
    height: 52,
    padding: "0 20px",
    fontSize: 14,
    fontWeight: 800,
    letterSpacing: 0.2,
    cursor: busy ? "default" : "pointer",
    opacity: busy ? 0.65 : 1,
    alignSelf: "stretch",
    marginTop: "auto",
    boxShadow: "0px 6px 18px rgba(99,102,241,0.30)",
  });
  const head = (c, dpath, title) => (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={iconCircle(c)}>
        <Icon d={dpath} color={c} />
      </div>
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--text-h)" }}>
        {title}
      </h3>
    </div>
  );

  return (
    <div className="dash">
      <div className="page-head">
        <div className="eyebrow">ALUMA · SISTEM</div>
        <h1>Contul Meu</h1>
        <div className="sub">
          Gestionează datele de acces — parolă, email de logare și telefon de contact.
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 22, paddingTop: 10 }}>
        {/* Parolă */}
        <form onSubmit={changePassword} style={card}>
          {head(BRAND, LOCK, "Schimbă Parola")}
          <div>
            <label style={label}>Parola curentă</label>
            <input
              type={showPass ? "text" : "password"}
              autoComplete="current-password"
              value={curPass}
              onChange={(e) => setCurPass(e.target.value)}
              required
              style={input}
            />
          </div>
          <div>
            <label style={label}>Parola nouă</label>
            <input
              type={showPass ? "text" : "password"}
              autoComplete="new-password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              required
              style={input}
            />
          </div>
          <label
            style={{ fontSize: 13, color: "var(--text)", display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}
          >
            <input
              type="checkbox"
              checked={showPass}
              onChange={(e) => setShowPass(e.target.checked)}
            />
            Arată parolele
          </label>
          <Msg err={pErr} info={pInfo} />
          <button type="submit" disabled={pBusy} style={primaryBtn(pBusy)}>
            {pBusy ? "Se salvează…" : "Salvează Parola"}
          </button>
        </form>

        {/* Email */}
        <form onSubmit={changeEmail} style={card}>
          {head(ACCENT2, MAIL, "Email de Logare")}
          <div
            style={{
              fontSize: 13,
              color: "var(--text)",
              background: "var(--code-bg)",
              borderRadius: 12,
              padding: "10px 14px",
            }}
          >
            Email curent: <strong style={{ color: "var(--text-h)" }}>{user.email}</strong>
          </div>
          <div>
            <label style={label}>Parola curentă</label>
            <input
              type="password"
              autoComplete="current-password"
              value={curPassE}
              onChange={(e) => setCurPassE(e.target.value)}
              required
              style={input}
            />
          </div>
          <div>
            <label style={label}>Email nou</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              style={input}
            />
          </div>
          <Msg err={eErr} info={eInfo} />
          <button type="submit" disabled={eBusy} style={primaryBtn(eBusy)}>
            {eBusy ? "Se trimite…" : "Schimbă Emailul"}
          </button>
        </form>

        {/* Telefon */}
        <form onSubmit={savePhone} style={card}>
          {head("#10B981", PHONE, "Număr de Telefon")}
          <div style={{ fontSize: 13, color: "var(--text)" }}>
            Salvat ca date de contact ale contului.
          </div>
          <div>
            <label style={label}>Telefon</label>
            <input
              type="tel"
              placeholder="07xx xxx xxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={input}
            />
          </div>
          <Msg err={phErr} info={phInfo} />
          <button type="submit" disabled={phBusy} style={primaryBtn(phBusy)}>
            {phBusy ? "Se salvează…" : "Salvează Telefonul"}
          </button>
        </form>
      </div>
    </div>
  );
}
