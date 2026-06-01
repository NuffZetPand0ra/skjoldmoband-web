/* Skjoldmø — public site (Natteskov direction), responsive, config-driven. */
function upsertMetaByName(name, content) {
  let el = document.head.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content || "");
}

function upsertMetaByProperty(property, content) {
  let el = document.head.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content || "");
}

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href || "");
}

function upsertJsonLd(id, graph) {
  let el = document.head.querySelector(`script#${id}`);
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(graph);
}

function toAbsoluteUrl(value) {
  if (!value) return "";
  try {
    return new URL(value, window.location.origin).toString();
  } catch (e) {
    return value;
  }
}

function applySeo(cfg, lang, t) {
  const seo = cfg.seo || {};
  const siteName = seo.site_name || "Skjoldmø";
  const title = t(seo.title, lang) || siteName;
  const description = t(seo.description, lang) || "";
  const keywords = t(seo.keywords, lang) || "";
  const canonical = toAbsoluteUrl(seo.canonical_url || window.location.href);
  const imageUrl = toAbsoluteUrl(seo.og_image || "");
  const ogType = seo.og_type || "website";
  const twitterCard = seo.twitter_card || "summary_large_image";
  const robots = seo.robots || "index,follow,max-image-preview:large";
  const themeColor = seo.theme_color || "#221c16";
  const locale = lang === "en" ? "en_US" : "da_DK";
  const altLocale = lang === "en" ? "da_DK" : "en_US";

  document.title = title;
  document.documentElement.setAttribute("lang", lang);

  upsertMetaByName("description", description);
  upsertMetaByName("keywords", keywords);
  upsertMetaByName("robots", robots);
  upsertMetaByName("theme-color", themeColor);

  upsertMetaByProperty("og:site_name", siteName);
  upsertMetaByProperty("og:type", ogType);
  upsertMetaByProperty("og:title", title);
  upsertMetaByProperty("og:description", description);
  upsertMetaByProperty("og:url", canonical);
  upsertMetaByProperty("og:locale", locale);
  upsertMetaByProperty("og:locale:alternate", altLocale);
  upsertMetaByProperty("og:image", imageUrl);

  upsertMetaByName("twitter:card", twitterCard);
  upsertMetaByName("twitter:title", title);
  upsertMetaByName("twitter:description", description);
  upsertMetaByName("twitter:site", seo.twitter_site || "");
  upsertMetaByName("twitter:creator", seo.twitter_creator || "");
  upsertMetaByName("twitter:image", imageUrl);

  upsertLink("canonical", canonical);

  const sameAs = (cfg.links ? Object.values(cfg.links) : []).filter(Boolean);
  upsertJsonLd("sk-seo-ld", {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: siteName,
        url: canonical,
        inLanguage: lang,
      },
      {
        "@type": "MusicGroup",
        name: siteName,
        description,
        url: canonical,
        email: cfg.email || undefined,
        image: imageUrl || undefined,
        sameAs,
      },
    ],
  });
}

function Site({ cfg }) {
  const [lang, setLang] = useLang();
  const { UI, STATUS, SOCIAL_ORDER, NAMES, t, credit } = window.SKCONF;

  const embers = React.useMemo(() =>
    Array.from({ length: 16 }, () => ({
      left: 5 + Math.random() * 90, size: 2 + Math.random() * 3,
      delay: -Math.random() * 16, dur: 11 + Math.random() * 12,
      drift: (Math.random() * 44 - 22).toFixed(0), o: 0.25 + Math.random() * 0.4,
    })), []);

  const mailto = "mailto:" + cfg.email;

  React.useEffect(() => {
    applySeo(cfg, lang, t);
  }, [cfg, lang, t]);

  return (
    <div className="site" style={{ background: "oklch(0.125 0.012 64)", color: "var(--ink)", position: "relative", overflow: "hidden", minHeight: "100vh", fontFamily: "'EB Garamond', Georgia, serif" }}>
      <style>{`
        .site a{color:inherit;text-decoration:none}
        .site .eyebrow{font-family:'Cinzel',serif;font-size:12px;letter-spacing:.36em;color:var(--gold-2);text-transform:uppercase}
        .site .inner{max-width:1180px;margin:0 auto;padding-left:40px;padding-right:40px}
        .site .hubcard{transition:transform .4s cubic-bezier(.2,.7,.3,1),box-shadow .4s,border-color .4s,background .4s}
        .site .hubcard:hover{transform:translateY(-8px);border-color:var(--gold);background:rgba(40,30,16,.55);box-shadow:0 30px 60px -30px #000,0 0 40px -10px oklch(0.8 0.12 78 / .35)}
        .site .hubcard:hover .hglow{opacity:1}
        .site .hubcard:hover .hgo{color:var(--gold-2);transform:translateX(5px)}
        .site .hgo{transition:transform .35s,color .35s}
        .site .showrow{transition:background .3s,padding-left .3s}
        .site .showrow:hover{background:rgba(0,0,0,.3);padding-left:14px}
        .site .showrow:hover .cname{color:var(--gold-2)}
        .site .cname{transition:color .3s}
        .site .btn{transition:all .3s ease}
        .site .btn-solid:hover{background:var(--gold);color:var(--bg);border-color:var(--gold)}
        .site .btn-ghost:hover{border-color:var(--ink-2);color:var(--ink)}
        .site .lt a{color:var(--ink-3);transition:color .25s}
        .site .lt a:hover{color:var(--gold-2)}
        @keyframes site-ember{0%{transform:translateY(0) translateX(0);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translateY(-460px) translateX(var(--dx));opacity:0}}
        @media (max-width:760px){
          .site .inner{padding-left:22px;padding-right:22px}
          .site .hub{grid-template-columns:1fr !important}
          .site .showrow{grid-template-columns:74px 1fr !important;row-gap:6px}
          .site .showrow .st{grid-column:2;justify-self:start !important}
          .site .hero-tag{font-size:21px !important}
          .site .booking-btns{flex-direction:column}
        }
      `}</style>

      {/* atmosphere */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, backgroundImage: "url('/assets/forest.png')", backgroundSize: "min(120%, 1300px) auto", backgroundPosition: "center -40px", backgroundRepeat: "no-repeat", opacity: 0.23, filter: "saturate(1.15) brightness(1.12) contrast(1.06)" }} />
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(90% 38% at 50% 4%, oklch(0.82 0.13 78 / 0.18), transparent 55%), radial-gradient(70% 50% at 50% 42%, oklch(0.7 0.11 70 / 0.1), transparent 60%), linear-gradient(180deg, oklch(0.125 0.012 64 / 0.3), oklch(0.125 0.012 64 / 0.86) 60%)" }} />
      <Grain opacity={0.06} />

      {/* embers */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, top: 0, height: 1100, pointerEvents: "none", zIndex: 4 }}>
        {embers.map((e, i) => (
          <span key={i} style={{ position: "absolute", bottom: 120, left: e.left + "%", width: e.size, height: e.size, borderRadius: 999,
            background: "var(--gold-2)", boxShadow: "0 0 6px 1px oklch(0.8 0.12 78 / .7)", opacity: e.o,
            ["--dx"]: e.drift + "px", animation: `site-ember ${e.dur}s linear ${e.delay}s infinite` }} />
        ))}
      </div>

      {/* top bar */}
      <header className="inner" style={{ position: "relative", zIndex: 6, display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 24, paddingBottom: 8 }}>
        <span style={{ fontFamily: "'Cinzel',serif", fontSize: 12, letterSpacing: ".3em", color: "var(--ink-3)", textTransform: "uppercase" }}>{t(UI.nordisk, lang)}</span>
        <LangToggle lang={lang} setLang={setLang} tone="ghost" />
      </header>

      {/* hero */}
      <section className="inner" style={{ position: "relative", zIndex: 6, paddingTop: 56, paddingBottom: 24, textAlign: "center" }}>
        <div style={{ width: "min(720px, 86vw)", margin: "0 auto" }}>
          <Logo width="100%" glow="var(--gold)" glowAmt={0.7} idSuffix="S" />
        </div>
        <p className="hero-tag" style={{ fontFamily: "'EB Garamond',serif", fontStyle: "italic", fontSize: 26, color: "var(--ink)", margin: "30px auto 0", maxWidth: 620 }}>{t(cfg.text.tagline, lang)}</p>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 28 }}><RuneRule width={300} /></div>
      </section>

      {/* hub */}
      <section className="inner" style={{ position: "relative", zIndex: 6, paddingTop: 46, paddingBottom: 70, textAlign: "center" }}>
        <div className="eyebrow">{t(UI.connect_eyebrow, lang)}</div>
        <p style={{ fontSize: 18.5, color: "var(--ink-2)", maxWidth: 600, margin: "16px auto 0", lineHeight: 1.6 }}>{t(cfg.text.connect_intro, lang)}</p>
        <div className="hub" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22, marginTop: 44, textAlign: "left" }}>
          {SOCIAL_ORDER.map((key) => {
            const Ico = ICONS[key];
            const url = cfg.links[key] || "#";
            return (
              <a key={key} className="hubcard" href={url} target="_blank" rel="noopener"
                style={{ position: "relative", display: "block", padding: "36px 30px 30px", borderRadius: 6, border: "1px solid var(--line)", background: "rgba(20,16,10,.5)", overflow: "hidden" }}>
                <div className="hglow" aria-hidden="true" style={{ position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)", width: 200, height: 140, opacity: 0, transition: "opacity .4s", background: "radial-gradient(circle, oklch(0.8 0.12 78 / .35), transparent 70%)", pointerEvents: "none" }} />
                <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ display: "inline-flex", width: 58, height: 58, alignItems: "center", justifyContent: "center", borderRadius: 999, border: "1px solid var(--gold)", color: "var(--gold-2)", background: "oklch(0.8 0.12 78 / 0.08)" }}><Ico s={27} /></span>
                  <span className="hgo" style={{ color: "var(--ink-3)" }}><IcoArrow s={22} /></span>
                </div>
                <div style={{ position: "relative", fontFamily: "'Cinzel',serif", fontSize: 25, color: "var(--ink)", marginTop: 26 }}>{NAMES[key]}</div>
                <div style={{ position: "relative", fontSize: 15.5, color: "var(--gold-2)", marginTop: 5 }}>{cfg.handles[key]}</div>
                <div style={{ position: "relative", fontSize: 16.5, color: "var(--ink-3)", marginTop: 14, lineHeight: 1.5 }}>{t(cfg.desc[key], lang)}</div>
                <div style={{ position: "relative", marginTop: 22, display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "'Cinzel',serif", fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--gold-2)" }}>{t(UI.connect_follow, lang)}</div>
              </a>
            );
          })}
        </div>
      </section>

      {/* shows */}
      {cfg.shows.length > 0 && (
        <section className="inner" style={{ position: "relative", zIndex: 6, paddingTop: 10, paddingBottom: 70 }}>
          <div style={{ maxWidth: 860, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 26 }}>
              <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
              <span className="eyebrow">{t(UI.shows_title, lang)}</span>
              <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
            </div>
            {cfg.shows.map((sh, i) => (
              <div key={i} className="showrow" style={{ display: "grid", gridTemplateColumns: "92px 1fr auto", alignItems: "center", gap: 22, padding: "16px 12px", borderBottom: "1px solid var(--line)" }}>
                <div style={{ fontFamily: "'Cinzel',serif", color: "var(--gold-2)", fontSize: 13, letterSpacing: ".08em" }}>{sh.m} {sh.d}</div>
                <div>
                  <span className="cname" style={{ fontSize: 19, color: "var(--ink)" }}>{sh.name}</span>
                  {sh.city ? <span style={{ fontSize: 14.5, color: "var(--ink-3)", marginLeft: 12 }}>{sh.city}</span> : null}
                </div>
                <span className="st" style={{ justifySelf: "end" }}>
                  {sh.ticket_url ? (
                    <a href={sh.ticket_url} target="_blank" rel="noopener" aria-label={`${sh.name} link`}>
                      <StatusPill status={sh.status} lang={lang} />
                    </a>
                  ) : (
                    <StatusPill status={sh.status} lang={lang} />
                  )}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* about */}
      <section className="inner" style={{ position: "relative", zIndex: 6, paddingTop: 10, paddingBottom: 64, textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div className="eyebrow">{t(UI.about_eyebrow, lang)}</div>
          <p style={{ fontSize: 21, color: "var(--ink-2)", lineHeight: 1.7, marginTop: 18 }}>{t(cfg.text.about, lang)}</p>
        </div>
      </section>

      {/* booking */}
      <section className="inner" style={{ position: "relative", zIndex: 6, paddingBottom: 84, textAlign: "center" }}>
        <div className="eyebrow">{t(UI.press_eyebrow, lang)}</div>
        <h2 style={{ fontFamily: "'Cinzel',serif", fontWeight: 600, fontSize: 30, color: "var(--ink)", margin: "12px 0 0" }}>{t(UI.press_title, lang)}</h2>
        <div className="booking-btns" style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 26 }}>
          <a className="btn btn-solid" href={mailto}
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, padding: "14px 28px", border: "1px solid var(--gold)", borderRadius: 999, color: "var(--gold-2)", fontFamily: "'Cinzel',serif", fontSize: 13, letterSpacing: ".1em", textTransform: "uppercase" }}>{cfg.email}</a>
          {cfg.presskit ? (
            <a className="btn btn-ghost" href={cfg.presskit} target="_blank" rel="noopener"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, padding: "14px 28px", border: "1px solid var(--line)", borderRadius: 999, color: "var(--ink-2)", fontFamily: "'Cinzel',serif", fontSize: 13, letterSpacing: ".1em", textTransform: "uppercase" }}>{t(UI.press_kit, lang)}</a>
          ) : null}
        </div>
      </section>

      {/* footer */}
      <footer className="inner" style={{ position: "relative", zIndex: 6, borderTop: "1px solid var(--line)", paddingTop: 40, paddingBottom: 46, textAlign: "center" }}>
        <div style={{ width: 170, margin: "0 auto" }}><Logo width="100%" idSuffix="SF" /></div>
        <div className="lt" style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 18 }}>
          {SOCIAL_ORDER.map((key) => {
            const Ico = ICONS[key];
            return (
              <a key={key} href={cfg.links[key] || "#"} target="_blank" rel="noopener" aria-label={NAMES[key]}
                style={{ display: "inline-flex", width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 999, border: "1px solid var(--line)" }}><Ico s={19} /></a>
            );
          })}
        </div>
        <div style={{ marginTop: 16, fontSize: 14.5 }}>
          <a href={mailto} style={{ color: "var(--gold-2)" }}>{cfg.email}</a>
        </div>
        <div style={{ marginTop: 12, fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.6 }}>
          {t(UI.foot_illus, lang)} © {credit}<br />Skjoldmø — {t(UI.foot_rights, lang)}
        </div>
      </footer>
    </div>
  );
}

function StatusPill({ status, lang }) {
  const { STATUS, t } = window.SKCONF;
  const map = {
    tickets: { color: "var(--gold-2)", border: "var(--gold)", bg: "oklch(0.8 0.12 78 / 0.08)" },
    free:    { color: "var(--moss)",   border: "oklch(0.74 0.1 138 / 0.6)", bg: "oklch(0.74 0.1 138 / 0.08)" },
    soldout: { color: "var(--ink-3)",  border: "var(--line)", bg: "transparent" },
  };
  const st = map[status] || map.tickets;
  return (
    <span style={{ fontFamily: "'Cinzel',serif", fontSize: 11.5, letterSpacing: ".12em", textTransform: "uppercase",
      color: st.color, border: "1px solid " + st.border, background: st.bg, padding: "7px 15px", borderRadius: 999, whiteSpace: "nowrap" }}>
      {t(STATUS[status], lang)}
    </span>
  );
}

Object.assign(window, { Site, StatusPill });
