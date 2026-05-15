import { useEffect, useRef, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "./firebase";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut(auth)}
      title="Deconectare"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        background: "#EF4444",
        color: "#fff",
        border: "none",
        borderRadius: 10,
        padding: "8px 14px",
        fontSize: 13,
        fontWeight: 800,
        letterSpacing: 0.3,
        cursor: "pointer",
        boxShadow: "0px 4px 12px rgba(239,68,68,0.35)",
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="m16 17 5-5-5-5" />
        <path d="M21 12H9" />
      </svg>
      Ieșire
    </button>
  );
}

export default function AuthGate({ children }) {
  const [user, setUser] = useState(undefined);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [mode, setMode] = useState("login"); // "login" | "reset"
  const [info, setInfo] = useState("");
  const [reveal, setReveal] = useState(false); // arată ultimul caracter tastat
  const revealTimer = useRef(null);

  const SKEY = "auth_session_exp";
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const RKEY = "auth_remember";
  const readRemembered = () => {
    try {
      return JSON.parse(localStorage.getItem(RKEY) || "null");
    } catch {
      return null;
    }
  };
  const [remember, setRemember] = useState(() => !!readRemembered());

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        if (u) {
          let exp = 0;
          try {
            exp = Number(localStorage.getItem(SKEY) || 0);
          } catch {
            /* localStorage indisponibil */
          }
          if (exp && Date.now() > exp) {
            // sesiunea a depășit 7 zile → delogare automată
            try {
              localStorage.removeItem(SKEY);
            } catch {
              /* noop */
            }
            signOut(auth);
            return; // onAuthStateChanged va reveni cu null
          }
          if (!exp) {
            try {
              localStorage.setItem(SKEY, String(Date.now() + WEEK_MS));
            } catch {
              /* noop */
            }
          }
        }
        setUser(u);
      }),
    []
  );

  // la delogare / revenire pe ecranul de login, resetează starea sensibilă
  useEffect(() => {
    if (!user) {
      setShowPass(false);
      setReveal(false);
      setErr("");
      setInfo("");
      const saved = readRemembered();
      if (saved) {
        setEmail(saved.email || "");
        setPass(saved.pass || "");
      } else {
        setPass("");
      }
    }
  }, [user]);

  const onPassChange = (e) => {
    const disp = e.target.value;
    // reconstituie valoarea reală (introducere/ștergere la final)
    const next =
      disp.length >= pass.length
        ? pass + disp.slice(pass.length)
        : pass.slice(0, disp.length);
    setPass(next);
    const added = disp.length > pass.length;
    setReveal(added && !showPass);
    clearTimeout(revealTimer.current);
    if (added) revealTimer.current = setTimeout(() => setReveal(false), 900);
  };

  const passDisplay = showPass
    ? pass
    : pass
    ? (reveal ? "•".repeat(pass.length - 1) + pass.slice(-1) : "•".repeat(pass.length))
    : "";

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setInfo("");
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
      try {
        localStorage.setItem(SKEY, String(Date.now() + WEEK_MS));
      } catch {
        /* noop */
      }
      try {
        if (remember)
          localStorage.setItem(RKEY, JSON.stringify({ email: email.trim(), pass }));
        else localStorage.removeItem(RKEY);
      } catch {
        /* localStorage indisponibil */
      }
    } catch (ex) {
      const code = ex?.code || "";
      setErr(
        code === "auth/invalid-credential" ||
          code === "auth/wrong-password" ||
          code === "auth/user-not-found"
          ? "Email sau parolă greșite."
          : "Autentificare eșuată: " + (ex?.message || code)
      );
    } finally {
      setBusy(false);
    }
  };

  const sendReset = async (e) => {
    e.preventDefault();
    setErr("");
    setInfo("");
    if (!email.trim()) {
      setErr("Introdu adresa de email mai întâi.");
      return;
    }
    setBusy(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfo(
        "Ți-am trimis un email cu un link de resetare a parolei. Verifică inboxul (și folderul Spam)."
      );
    } catch (ex) {
      const code = ex?.code || "";
      setErr(
        code === "auth/user-not-found"
          ? "Nu există niciun cont cu acest email."
          : code === "auth/invalid-email"
          ? "Adresă de email invalidă."
          : "Trimiterea a eșuat: " + (ex?.message || code)
      );
    } finally {
      setBusy(false);
    }
  };

  if (user === undefined) {
    return (
      <div style={{ display: "grid", placeItems: "center", height: "100vh", color: "var(--text)" }}>
        Se încarcă…
      </div>
    );
  }

  if (user) return children;

  const card = {
    width: "100%",
    maxWidth: 380,
    display: "flex",
    flexDirection: "column",
    gap: 16,
    background: "#fff",
    border: "1px solid var(--border)",
    borderRadius: 18,
    padding: "32px 28px",
    boxShadow: "var(--shadow)",
  };
  const inputBox = {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid var(--border)",
    background: "#fff",
    color: "#08060d",
    fontSize: 15,
    outline: "none",
  };
  const labelStyle = {
    fontSize: 13,
    fontWeight: 600,
    color: "#6b6375",
    marginBottom: 6,
    display: "block",
  };
  const linkBtn = {
    background: "none",
    border: "none",
    color: "var(--accent)",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    padding: 0,
  };

  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: "100vh",
        padding: 20,
        background:
          "radial-gradient(circle at 50% 0%, var(--accent-bg), transparent 60%)",
      }}
    >
      <form onSubmit={mode === "login" ? submit : sendReset} style={card}>
        <img
          src="/LOGO1.png"
          alt="Ioana Apostol"
          style={{ width: 150, height: "auto", margin: "0 auto 4px", display: "block" }}
        />

        <h2 style={{ margin: 0, fontSize: 19, textAlign: "center", color: "#08060d" }}>
          {mode === "login" ? "Autentificare" : "Resetare parolă"}
        </h2>

        {mode === "reset" && (
          <p style={{ margin: 0, fontSize: 13, textAlign: "center", color: "#6b6375" }}>
            Introdu emailul contului. Îți trimitem un link de resetare pe email.
          </p>
        )}

        <div>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputBox}
          />
        </div>

        {mode === "login" && (
          <div>
            <label style={labelStyle}>Parolă</label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                value={passDisplay}
                onChange={onPassChange}
                required
                style={{ ...inputBox, paddingRight: 64 }}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                style={{
                  ...linkBtn,
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
                tabIndex={-1}
              >
                {showPass ? "Ascunde" : "Arată"}
              </button>
            </div>
          </div>
        )}

        {mode === "login" && (
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              color: "#6b6375",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => {
                const on = e.target.checked;
                setRemember(on);
                if (!on) {
                  try {
                    localStorage.removeItem(RKEY);
                  } catch {
                    /* noop */
                  }
                }
              }}
            />
            Ține-mă minte pe acest dispozitiv
          </label>
        )}

        {err && (
          <div style={{ color: "#d33", fontSize: 13, textAlign: "center" }}>{err}</div>
        )}
        {info && (
          <div style={{ color: "#1a8a4a", fontSize: 13, textAlign: "center" }}>{info}</div>
        )}

        <button
          className="btn"
          type="submit"
          disabled={busy}
          style={{
            background: "var(--accent)",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "12px 16px",
            fontSize: 15,
            fontWeight: 600,
            cursor: busy ? "default" : "pointer",
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy
            ? mode === "login"
              ? "Se conectează…"
              : "Se trimite…"
            : mode === "login"
            ? "Intră"
            : "Trimite link de resetare"}
        </button>

        <div style={{ textAlign: "center" }}>
          {mode === "login" ? (
            <button
              type="button"
              style={linkBtn}
              onClick={() => {
                setMode("reset");
                setErr("");
                setInfo("");
              }}
            >
              Ai uitat parola?
            </button>
          ) : (
            <button
              type="button"
              style={linkBtn}
              onClick={() => {
                setMode("login");
                setErr("");
                setInfo("");
              }}
            >
              ← Înapoi la autentificare
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
