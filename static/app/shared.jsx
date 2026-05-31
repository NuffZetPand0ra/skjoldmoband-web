/* Skjoldmø — shared React bits: Logo (SVG), platform icons, grain, lang hook. */

function useLang() {
  const [lang, set] = React.useState(() => localStorage.getItem("sk-lang") || "da");
  React.useEffect(() => {
    const h = (e) => set(e.detail);
    window.addEventListener("sk-lang", h);
    return () => window.removeEventListener("sk-lang", h);
  }, []);
  const setLang = (l) => {
    localStorage.setItem("sk-lang", l);
    window.dispatchEvent(new CustomEvent("sk-lang", { detail: l }));
  };
  return [lang, setLang];
}

function Logo({ width = 320, fill = "var(--ink)", glow = "var(--gold)", glowAmt = 0.0, style = {}, idSuffix = "" }) {
  const fid = "lg" + idSuffix;
  return (
    <svg viewBox="0 0 1000 190" width={width} role="img" aria-label="SKJOLDMØ"
      style={{ display: "block", overflow: "visible", ...style }}>
      <defs>
        <filter id={fid} x="-20%" y="-40%" width="140%" height="180%">
          <feGaussianBlur stdDeviation="9" result="b" />
        </filter>
      </defs>
      {glowAmt > 0 && (
        <text x="500" y="132" textAnchor="middle" textLength="940" lengthAdjust="spacingAndGlyphs"
          fontFamily="'Cinzel', serif" fontWeight="600" fontSize="132" letterSpacing="4"
          fill={glow} filter={`url(#${fid})`} opacity={glowAmt}>SKJOLDMØ</text>
      )}
      <text x="500" y="132" textAnchor="middle" textLength="940" lengthAdjust="spacingAndGlyphs"
        fontFamily="'Cinzel', serif" fontWeight="600" fontSize="132" letterSpacing="4"
        fill={fill}>SKJOLDMØ</text>
    </svg>
  );
}

function LangToggle({ lang, setLang, tone = "default" }) {
  const items = [["da", "DA"], ["en", "EN"]];
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 2, padding: 3,
      border: "1px solid var(--line)", borderRadius: 999,
      background: tone === "ghost" ? "transparent" : "rgba(0,0,0,.18)"
    }}>
      {items.map(([k, label]) => {
        const on = lang === k;
        return (
          <button key={k} onClick={() => setLang(k)}
            style={{
              border: "none", cursor: "pointer", fontFamily: "'Cinzel', serif",
              fontSize: 11.5, letterSpacing: "0.14em", padding: "5px 11px", borderRadius: 999,
              color: on ? "var(--bg)" : "var(--ink-2)",
              background: on ? "var(--gold-2)" : "transparent",
              transition: "all .2s ease",
            }}>{label}</button>
        );
      })}
    </div>
  );
}

function IcoFacebook({ s = 22, c = "currentColor" }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M14.2 21v-7.2h2.4l.4-2.9h-2.8V9.05c0-.84.24-1.41 1.45-1.41H17V5.05c-.27-.04-1.2-.12-2.27-.12-2.25 0-3.79 1.37-3.79 3.89v2.17H8.5v2.9h2.44V21" stroke={c} strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  );
}
function IcoInstagram({ s = 22, c = "currentColor" }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke={c} strokeWidth="1.4"/>
      <circle cx="12" cy="12" r="4" stroke={c} strokeWidth="1.4"/>
      <circle cx="17" cy="7" r="1.1" fill={c}/>
    </svg>
  );
}
function IcoTiktok({ s = 22, c = "currentColor" }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M14 4c.3 2.2 1.8 3.9 4 4.2v2.6c-1.5 0-2.9-.5-4-1.3v5.6c0 2.9-2.3 5.2-5.2 5.2S3.6 18 3.6 15.1c0-2.7 2-4.9 4.7-5.2v2.7c-1.2.2-2 1.2-2 2.5 0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5V4H14Z" stroke={c} strokeWidth="1.3" strokeLinejoin="round"/>
    </svg>
  );
}
const ICONS = { facebook: IcoFacebook, instagram: IcoInstagram, tiktok: IcoTiktok };

function IcoArrow({ s = 16, c = "currentColor" }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M6 12h12M13 7l5 5-5 5" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function Grain({ opacity = 0.06 }) {
  const svg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";
  return <div aria-hidden="true" style={{
    position: "absolute", inset: 0, pointerEvents: "none", zIndex: 5,
    backgroundImage: `url("${svg}")`, backgroundSize: "200px 200px",
    opacity, mixBlendMode: "overlay"
  }} />;
}

function RuneRule({ color = "var(--line)", dot = "var(--gold)", width = 220 }) {
  return (
    <div aria-hidden="true" style={{ display: "flex", alignItems: "center", gap: 10, width }}>
      <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg,transparent,${color})` }} />
      <span style={{ width: 5, height: 5, transform: "rotate(45deg)", background: dot, opacity: .8 }} />
      <span style={{ width: 7, height: 7, transform: "rotate(45deg)", border: `1px solid ${dot}`, opacity: .7 }} />
      <span style={{ width: 5, height: 5, transform: "rotate(45deg)", background: dot, opacity: .8 }} />
      <span style={{ flex: 1, height: 1, background: `linear-gradient(270deg,transparent,${color})` }} />
    </div>
  );
}

Object.assign(window, { useLang, Logo, LangToggle, ICONS, IcoArrow, IcoFacebook, IcoInstagram, IcoTiktok, Grain, RuneRule });
