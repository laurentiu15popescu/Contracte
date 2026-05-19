/* =====================================================================
   Icon — set unic de iconuri SVG (stroke, currentColor, 1.5).
   Înlocuiește emoji-urile pictografice pentru randare consistentă
   pe orice OS/browser. Dimensiune implicită 1em → scalează cu
   font-size-ul containerului (drop-in peste vechile emoji).
   ===================================================================== */

const P = {
  document: <><path d="M14 3v5h5" /><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M8 13h8M8 17h8M8 9h2" /></>,
  contract: <><path d="M14 3v5h5" /><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M8 13h8M8 17h5" /><path d="m15.5 16.5 1.5 1.5 3-3" /></>,
  money: <><circle cx="12" cy="12" r="8" /><path d="M14.5 9.5a2.5 2 0 0 0-2.5-1.5c-1.7 0-2.5.9-2.5 2s.8 1.7 2.5 2 2.5.9 2.5 2-1 2-2.5 2a2.5 2 0 0 1-2.5-1.5" /><path d="M12 6.5v1.5M12 16v1.5" /></>,
  calendar: <><rect x="3" y="4.5" width="18" height="16" rx="2" /><path d="M3 9h18M8 2.5v4M16 2.5v4" /></>,
  users: <><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><path d="M16 6.2a3 3 0 0 1 0 5.6M17 19a5.5 5.5 0 0 0-3-4.9" /></>,
  user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
  chart: <><path d="M4 4v15a1 1 0 0 0 1 1h15" /><path d="M8 16v-4M13 16V8M18 16v-6" /></>,
  "trend-up": <><path d="M3 17 10 10l4 4 7-7" /><path d="M15 7h6v6" /></>,
  "trend-down": <><path d="M3 7 10 14l4-4 7 7" /><path d="M15 17h6v-6" /></>,
  repeat: <><path d="M4 9a5 5 0 0 1 5-5h8l-2.5-2.5M20 15a5 5 0 0 1-5 5H7l2.5 2.5" /><path d="M17 4 14.5 6.5M7 20 9.5 17.5" /></>,
  building: <><rect x="5" y="3" width="14" height="18" rx="1.5" /><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2" /><path d="M10 21v-3h4v3" /></>,
  paperclip: <><path d="M19 11.5 12 18.5a4 4 0 0 1-5.7-5.7l7.8-7.8a2.6 2.6 0 0 1 3.7 3.7l-7.8 7.8a1.2 1.2 0 0 1-1.7-1.7l7-7" /></>,
  ruler: <><rect x="3" y="8" width="18" height="8" rx="1.5" transform="rotate(-45 12 12)" /><path d="M9 9.5 10.5 11M12 6.5 13.5 8M6 12.5 7.5 14" /></>,
  warning: <><path d="M12 3 2.5 20h19z" /><path d="M12 9v5M12 17v.5" /></>,
  clock: <><circle cx="12" cy="12.5" r="8" /><path d="M12 8v4.5l3 2M9 2.5 5 5M15 2.5 19 5" /></>,
  cake: <><path d="M4 20h16v-7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2z" /><path d="M4 15c2 0 2 1.5 4 1.5S10 15 12 15s2 1.5 4 1.5 2-1.5 4-1.5" /><path d="M12 8V5M9 8V6M15 8V6" /></>,
  printer: <><path d="M6 9V3h12v6" /><rect x="4" y="9" width="16" height="8" rx="1.5" /><path d="M7 17h10v4H7z" /><circle cx="17" cy="12" r=".6" /></>,
  save: <><path d="M5 3h11l3 3v15H5z" /><path d="M8 3v5h7V3M8 21v-7h8v7" /></>,
  "edit-doc": <><path d="M13 3v5h5" /><path d="M19 12V8l-5-5H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6" /><path d="M16 21 21 16l-2-2-5 5v2z" /></>,
  folder: <><path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></>,
  "inbox-down": <><path d="M4 13v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5h-5l-2 2.5-2-2.5z" /><path d="M12 3v8M9 8.5l3 3 3-3" /></>,
  "outbox-up": <><path d="M4 13v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5h-5l-2 2.5-2-2.5z" /><path d="M12 11V3M9 5.5l3-3 3 3" /></>,
  home: <><path d="M4 11 12 4l8 7" /><path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" /><path d="M10 20v-5h4v5" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  check: <><path d="m5 12.5 4.5 4.5L19 7" /></>,
  download: <><path d="M12 3v12M8 11l4 4 4-4" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></>,
  upload: <><path d="M12 21V9M8 13l4-4 4 4" /><path d="M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
  refresh: <><path d="M20 11a8 8 0 0 0-14-4.5L4 9" /><path d="M4 4v5h5" /><path d="M4 13a8 8 0 0 0 14 4.5L20 15" /><path d="M20 20v-5h-5" /></>,
};

export default function Icon({ name, size, className = "", style }) {
  const d = P[name];
  if (!d) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="color-mix(in srgb, currentColor 15%, transparent)"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size || "1em"}
      height={size || "1em"}
      className={className}
      style={{ flexShrink: 0, verticalAlign: "-0.125em", ...style }}
      aria-hidden="true"
      focusable="false"
    >
      {d}
    </svg>
  );
}
