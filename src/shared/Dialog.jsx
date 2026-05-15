import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const DialogCtx = createContext(null);

export function useDialog() {
  const ctx = useContext(DialogCtx);
  if (!ctx) throw new Error("useDialog must be used inside <DialogProvider>");
  return ctx;
}

export function DialogProvider({ children }) {
  const [state, setState] = useState(null);
  const resolverRef = useRef(null);
  const inputRef = useRef(null);

  const open = useCallback((opts) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setState(opts);
    });
  }, []);

  const close = useCallback((value) => {
    setState(null);
    const r = resolverRef.current;
    resolverRef.current = null;
    if (r) r(value);
  }, []);

  const api = {
    alert: (message, opts = {}) =>
      open({
        kind: "alert",
        title: opts.title || "Informare",
        message: String(message ?? ""),
        confirmLabel: opts.confirmLabel || "OK",
        variant: opts.variant || "info",
      }),
    confirm: (message, opts = {}) =>
      open({
        kind: "confirm",
        title: opts.title || "Confirmare",
        message: String(message ?? ""),
        confirmLabel: opts.confirmLabel || "Confirmă",
        cancelLabel: opts.cancelLabel || "Anulează",
        variant: opts.variant || "info",
      }),
    prompt: (message, defaultValue = "", opts = {}) =>
      open({
        kind: "prompt",
        title: opts.title || "Introdu valoarea",
        message: String(message ?? ""),
        defaultValue: String(defaultValue ?? ""),
        confirmLabel: opts.confirmLabel || "OK",
        cancelLabel: opts.cancelLabel || "Anulează",
        placeholder: opts.placeholder || "",
        variant: opts.variant || "info",
      }),
  };

  useEffect(() => {
    if (!state) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (state.kind === "alert") close(true);
        else if (state.kind === "confirm") close(false);
        else close(null);
      } else if (e.key === "Enter" && state.kind !== "prompt") {
        e.preventDefault();
        close(state.kind === "confirm" ? true : true);
      }
    };
    window.addEventListener("keydown", onKey);
    if (state.kind === "prompt") {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
    return () => window.removeEventListener("keydown", onKey);
  }, [state, close]);

  return (
    <DialogCtx.Provider value={api}>
      {children}
      {state && (
        <div className="alm-dialog-overlay" onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            if (state.kind === "alert") close(true);
            else if (state.kind === "confirm") close(false);
            else close(null);
          }
        }}>
          <div className={`alm-dialog alm-dialog-${state.variant}`} role="dialog" aria-modal="true">
            <div className="alm-dialog-header">{state.title}</div>
            <div className="alm-dialog-body">
              {state.message && <p className="alm-dialog-msg">{state.message}</p>}
              {state.kind === "prompt" && (
                <input
                  ref={inputRef}
                  className="alm-dialog-input"
                  defaultValue={state.defaultValue}
                  placeholder={state.placeholder}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); close(e.currentTarget.value); }
                  }}
                />
              )}
            </div>
            <div className="alm-dialog-actions">
              {state.kind !== "alert" && (
                <button
                  className="alm-dialog-btn alm-dialog-btn-ghost"
                  onClick={() => close(state.kind === "confirm" ? false : null)}
                >
                  {state.cancelLabel}
                </button>
              )}
              <button
                className={`alm-dialog-btn alm-dialog-btn-primary alm-dialog-btn-${state.variant}`}
                onClick={() => {
                  if (state.kind === "prompt") {
                    close(inputRef.current?.value ?? "");
                  } else if (state.kind === "confirm") {
                    close(true);
                  } else {
                    close(true);
                  }
                }}
              >
                {state.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogCtx.Provider>
  );
}
