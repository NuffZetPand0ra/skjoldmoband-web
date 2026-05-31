/* Skjoldmø — admin. Edits the config the public site reads via the server API. */
function Admin() {
  const { DEFAULTS, STATUS, SOCIAL_ORDER, NAMES, clone, resolveConfig, saveConfig } = window.SKCONF;
  const [cfg, setCfg] = React.useState(null);
  const [baseline, setBaseline] = React.useState("");
  const [flash, setFlash] = React.useState({ msg: "", ok: true });
  const [password, setPassword] = React.useState(() => sessionStorage.getItem("sk-admin-pw") || "");
  const [showLogin, setShowLogin] = React.useState(false);
  const [pwInput, setPwInput] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    resolveConfig().then((c) => { setCfg(c); setBaseline(JSON.stringify(c)); });
  }, []);

  if (!cfg) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-3)", fontFamily: "'Cinzel',serif", fontSize: 14, letterSpacing: ".1em" }}>
      Loading…
    </div>
  );

  const dirty = JSON.stringify(cfg) !== baseline;

  const set = (fn) => setCfg((prev) => { const n = clone(prev); fn(n); return n; });

  const note = (msg, ok = true) => {
    setFlash({ msg, ok });
    clearTimeout(window.__skf);
    window.__skf = setTimeout(() => setFlash({ msg: "", ok: true }), 3000);
  };

  const attemptSave = async (pw) => {
    if (!pw) { setShowLogin(true); return; }
    setSaving(true);
    try {
      await saveConfig(cfg, pw);
      sessionStorage.setItem("sk-admin-pw", pw);
      setPassword(pw);
      setBaseline(JSON.stringify(cfg));
      note("Saved — the site updates immediately.");
      setShowLogin(false);
    } catch (err) {
      if (err.message === "unauthorized") {
        sessionStorage.removeItem("sk-admin-pw");
        setPassword("");
        setPwInput("");
        setShowLogin(true);
        note("Wrong password.", false);
      } else {
        note("Save failed — check the server.", false);
      }
    } finally {
      setSaving(false);
    }
  };

  const onSave = () => attemptSave(password);

  const onLoginSubmit = (e) => {
    e.preventDefault();
    attemptSave(pwInput);
  };

  // shows ops
  const addShow = () => set((n) => n.shows.push({ m: "JAN", d: "01", y: String(new Date().getFullYear() + 1), name: "", city: "", status: "tickets" }));
  const delShow = (i) => set((n) => n.shows.splice(i, 1));
  const moveShow = (i, d) => set((n) => { const j = i + d; if (j < 0 || j >= n.shows.length) return; const [x] = n.shows.splice(i, 1); n.shows.splice(j, 0, x); });
  const updShow = (i, k, v) => set((n) => { n.shows[i][k] = v; });

  return (
    <div className="admin">
      <style>{`
        .admin{min-height:100vh;color:var(--ink);font-family:'EB Garamond',Georgia,serif;padding-bottom:80px}
        .admin .bar{position:sticky;top:0;z-index:20;display:flex;align-items:center;gap:18px;flex-wrap:wrap;
          padding:16px 28px;background:oklch(0.135 0.012 64 / .92);backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
        .admin .wrap{max-width:920px;margin:0 auto;padding:0 28px}
        .admin h1{font-family:'Cinzel',serif;font-weight:600;font-size:18px;letter-spacing:.04em;margin:0;color:var(--ink)}
        .admin .panel{background:var(--bg-2);border:1px solid var(--line);border-radius:10px;padding:26px 26px 28px;margin-top:22px}
        .admin .ph{display:flex;align-items:center;gap:12px;margin:0 0 20px}
        .admin .ph .eyebrow{font-family:'Cinzel',serif;font-size:12px;letter-spacing:.28em;text-transform:uppercase;color:var(--gold-2)}
        .admin .ph .hint{font-size:14px;color:var(--ink-3);margin-left:auto}
        .admin label{display:block;font-family:'Cinzel',serif;font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-3);margin:0 0 7px}
        .admin input,.admin textarea,.admin select{width:100%;background:oklch(0.12 0.012 64);border:1px solid var(--line);border-radius:7px;
          color:var(--ink);font-family:'EB Garamond',serif;font-size:16px;padding:11px 13px;transition:border-color .2s,box-shadow .2s}
        .admin textarea{min-height:78px;line-height:1.55;resize:vertical}
        .admin input:focus,.admin textarea:focus,.admin select:focus{outline:none;border-color:var(--gold);box-shadow:0 0 0 3px oklch(0.8 0.12 78 / .12)}
        .admin select{appearance:none;cursor:pointer}
        .admin .grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        .admin .field{margin-bottom:16px}
        .admin .sub{border:1px solid var(--line);border-radius:9px;padding:18px;margin-top:14px;background:oklch(0.135 0.012 64)}
        .admin .sub-h{display:flex;align-items:center;gap:10px;margin-bottom:14px;color:var(--gold-2);font-family:'Cinzel',serif;font-size:15px}
        .admin .showrow{display:grid;grid-template-columns:74px 56px 70px 1.4fr 1.1fr 118px auto;gap:10px;align-items:end;
          padding:14px;border:1px solid var(--line);border-radius:9px;margin-bottom:12px;background:oklch(0.135 0.012 64)}
        .admin .btn{font-family:'Cinzel',serif;font-size:12px;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;
          border-radius:999px;padding:10px 18px;border:1px solid var(--line);background:transparent;color:var(--ink-2);transition:all .2s}
        .admin .btn:hover{border-color:var(--ink-2);color:var(--ink)}
        .admin .btn.primary{border-color:var(--gold);color:var(--bg);background:var(--gold-2)}
        .admin .btn.primary:hover{background:var(--gold)}
        .admin .btn.primary:disabled{opacity:.4;cursor:default;background:transparent;color:var(--ink-3);border-color:var(--line)}
        .admin .btn.gold{border-color:var(--gold);color:var(--gold-2)}
        .admin .btn.gold:hover{background:var(--gold);color:var(--bg)}
        .admin .iconbtn{width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;border-radius:7px;border:1px solid var(--line);
          background:transparent;color:var(--ink-3);cursor:pointer;font-size:15px;transition:all .2s}
        .admin .iconbtn:hover{color:var(--ink);border-color:var(--ink-2)}
        .admin .iconbtn.danger:hover{color:#e88;border-color:#e88}
        .admin .flash-ok{font-size:14px;color:var(--gold-2)}
        .admin .flash-err{font-size:14px;color:#e88}
        .admin .dirty{font-size:13px;color:var(--ink-3);display:inline-flex;align-items:center;gap:7px}
        .admin .dot{width:7px;height:7px;border-radius:999px;background:var(--gold)}
        .admin a{color:var(--gold-2)}
        .admin .modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(4px);z-index:100;display:flex;align-items:center;justify-content:center}
        .admin .modal{background:oklch(0.185 0.014 64);border:1px solid var(--line);border-radius:14px;padding:34px 36px;width:min(380px,90vw)}
        .admin .modal h2{font-family:'Cinzel',serif;font-size:16px;letter-spacing:.06em;margin:0 0 6px;color:var(--ink)}
        .admin .modal p{font-size:15px;color:var(--ink-3);margin:0 0 22px;line-height:1.5}
        @media(max-width:720px){.admin .grid2{grid-template-columns:1fr}.admin .showrow{grid-template-columns:1fr 1fr;gap:10px}}
      `}</style>

      {/* password modal */}
      {showLogin && (
        <div className="modal-backdrop" onClick={() => setShowLogin(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Admin password</h2>
            <p>Enter the admin password to save changes to the database.</p>
            <form onSubmit={onLoginSubmit}>
              <div className="field">
                <label>Password</label>
                <input type="password" value={pwInput} onChange={(e) => setPwInput(e.target.value)} autoFocus placeholder="••••••••" />
              </div>
              {flash.msg && !flash.ok && <div className="flash-err" style={{ marginBottom: 14 }}>{flash.msg}</div>}
              <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                <button type="submit" className="btn primary" disabled={saving || !pwInput}>{saving ? "Saving…" : "Save"}</button>
                <button type="button" className="btn" onClick={() => setShowLogin(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* toolbar */}
      <div className="bar">
        <div style={{ width: 132 }}><Logo width="100%" idSuffix="adm" /></div>
        <h1>Admin</h1>
        <span className="dirty">{dirty ? <><span className="dot"></span> Unsaved changes</> : "All saved"}</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {flash.msg && <span className={flash.ok ? "flash-ok" : "flash-err"}>{flash.msg}</span>}
          <a className="btn" href="/" target="_blank" rel="noopener">View site ↗</a>
          <button className="btn primary" onClick={onSave} disabled={!dirty || saving}>{saving ? "Saving…" : "Save"}</button>
        </div>
      </div>

      <div className="wrap">
        {/* contact */}
        <div className="panel">
          <div className="ph"><span className="eyebrow">Contact</span></div>
          <div className="grid2">
            <div className="field"><label>Booking / contact email</label>
              <input value={cfg.email} onChange={(e) => set((n) => { n.email = e.target.value; })} placeholder="info@skjoldmoband.com" /></div>
            <div className="field"><label>Press kit link (optional)</label>
              <input value={cfg.presskit} onChange={(e) => set((n) => { n.presskit = e.target.value; })} placeholder="https://… (leave blank to hide the button)" /></div>
          </div>
        </div>

        {/* feeds */}
        <div className="panel">
          <div className="ph"><span className="eyebrow">Feeds & social</span><span className="hint">URLs the hub cards link to</span></div>
          {SOCIAL_ORDER.map((key) => {
            const Ico = ICONS[key];
            return (
              <div className="sub" key={key}>
                <div className="sub-h"><Ico s={18} /> {NAMES[key]}</div>
                <div className="grid2">
                  <div className="field"><label>Profile URL</label>
                    <input value={cfg.links[key]} onChange={(e) => set((n) => { n.links[key] = e.target.value; })} placeholder="https://…" /></div>
                  <div className="field"><label>Handle shown</label>
                    <input value={cfg.handles[key]} onChange={(e) => set((n) => { n.handles[key] = e.target.value; })} placeholder="@skjoldmoband" /></div>
                  <div className="field"><label>Description — Dansk</label>
                    <input value={cfg.desc[key].da} onChange={(e) => set((n) => { n.desc[key].da = e.target.value; })} /></div>
                  <div className="field"><label>Description — English</label>
                    <input value={cfg.desc[key].en} onChange={(e) => set((n) => { n.desc[key].en = e.target.value; })} /></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* shows */}
        <div className="panel">
          <div className="ph"><span className="eyebrow">Shows</span><span className="hint">{cfg.shows.length} event{cfg.shows.length === 1 ? "" : "s"}</span></div>
          {cfg.shows.map((sh, i) => (
            <div className="showrow" key={i}>
              <div><label>Month</label><input value={sh.m} onChange={(e) => updShow(i, "m", e.target.value)} /></div>
              <div><label>Day</label><input value={sh.d} onChange={(e) => updShow(i, "d", e.target.value)} /></div>
              <div><label>Year</label><input value={sh.y} onChange={(e) => updShow(i, "y", e.target.value)} /></div>
              <div><label>Venue / event</label><input value={sh.name} onChange={(e) => updShow(i, "name", e.target.value)} /></div>
              <div><label>City</label><input value={sh.city} onChange={(e) => updShow(i, "city", e.target.value)} /></div>
              <div><label>Status</label>
                <select value={sh.status} onChange={(e) => updShow(i, "status", e.target.value)}>
                  <option value="tickets">Tickets</option>
                  <option value="soldout">Sold out</option>
                  <option value="free">Free</option>
                </select></div>
              <div style={{ display: "flex", gap: 5 }}>
                <button className="iconbtn" title="Move up" onClick={() => moveShow(i, -1)}>↑</button>
                <button className="iconbtn" title="Move down" onClick={() => moveShow(i, 1)}>↓</button>
                <button className="iconbtn danger" title="Delete" onClick={() => delShow(i)}>✕</button>
              </div>
            </div>
          ))}
          <button className="btn gold" style={{ marginTop: 6 }} onClick={addShow}>+ Add show</button>
        </div>

        {/* texts */}
        <div className="panel">
          <div className="ph"><span className="eyebrow">Wording</span><span className="hint">Dansk · English</span></div>
          <div className="field"><label>Tagline</label>
            <div className="grid2">
              <textarea value={cfg.text.tagline.da} onChange={(e) => set((n) => { n.text.tagline.da = e.target.value; })} />
              <textarea value={cfg.text.tagline.en} onChange={(e) => set((n) => { n.text.tagline.en = e.target.value; })} />
            </div></div>
          <div className="field"><label>"Find us" intro</label>
            <div className="grid2">
              <textarea value={cfg.text.connect_intro.da} onChange={(e) => set((n) => { n.text.connect_intro.da = e.target.value; })} />
              <textarea value={cfg.text.connect_intro.en} onChange={(e) => set((n) => { n.text.connect_intro.en = e.target.value; })} />
            </div></div>
          <div className="field"><label>About the band</label>
            <div className="grid2">
              <textarea style={{ minHeight: 120 }} value={cfg.text.about.da} onChange={(e) => set((n) => { n.text.about.da = e.target.value; })} />
              <textarea style={{ minHeight: 120 }} value={cfg.text.about.en} onChange={(e) => set((n) => { n.text.about.en = e.target.value; })} />
            </div></div>
        </div>

        <div style={{ fontSize: 14.5, color: "var(--ink-2)", lineHeight: 1.65, background: "oklch(0.135 0.012 64)", border: "1px solid var(--line)", borderLeft: "2px solid var(--gold)", borderRadius: 8, padding: "16px 18px", marginTop: 22 }}>
          <strong style={{ color: "var(--ink)", fontFamily: "'Cinzel',serif", fontSize: 13, letterSpacing: ".06em" }}>How publishing works</strong><br />
          Changes saved here are written directly to the database and appear on the <a href="/" target="_blank" rel="noopener">live site</a> immediately for all visitors. No file exports needed.
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Admin });
