/* Skjoldmø — admin. Edits the config the public site reads via the server API. */
function Admin() {
  const {
    STATUS,
    SOCIAL_ORDER,
    NAMES,
    clone,
    resolveConfig,
    saveConfig,
    getCurrentUser,
    login,
    logout,
    listUsers,
    createUser,
  } = window.SKCONF;

  const [authReady, setAuthReady] = React.useState(false);
  const [user, setUser] = React.useState(null);
  const [cfg, setCfg] = React.useState(null);
  const [baseline, setBaseline] = React.useState("");
  const [users, setUsers] = React.useState([]);
  const [flash, setFlash] = React.useState({ msg: "", ok: true });
  const [saving, setSaving] = React.useState(false);
  const [authBusy, setAuthBusy] = React.useState(false);
  const [loginForm, setLoginForm] = React.useState({ username: "", password: "" });
  const [userForm, setUserForm] = React.useState({ username: "", password: "" });

  const note = (msg, ok = true) => {
    setFlash({ msg, ok });
    clearTimeout(window.__skf);
    window.__skf = setTimeout(() => setFlash({ msg: "", ok: true }), 3000);
  };

  const set = (fn) => setCfg((prev) => { const n = clone(prev); fn(n); return n; });

  const loadEditorData = async () => {
    const [config, userRows] = await Promise.all([resolveConfig(), listUsers()]);
    setCfg(config);
    setBaseline(JSON.stringify(config));
    setUsers(userRows);
  };

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await getCurrentUser();
        if (!cancelled && me) {
          setUser(me);
          await loadEditorData();
        }
      } catch (err) {
        if (!cancelled) note("Could not load admin session.", false);
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthBusy(true);
    try {
      const me = await login(loginForm.username, loginForm.password);
      setUser(me);
      setLoginForm((prev) => ({ ...prev, password: "" }));
      await loadEditorData();
      note(`Signed in as ${me.username}.`);
    } catch (err) {
      note(err.message === "unauthorized" ? "Wrong username or password." : "Login failed — check the server.", false);
    } finally {
      setAuthBusy(false);
    }
  };

  const onLogout = async () => {
    setAuthBusy(true);
    try {
      await logout();
    } catch (err) {
      /* ignore logout transport errors */
    } finally {
      setUser(null);
      setCfg(null);
      setBaseline("");
      setUsers([]);
      setLoginForm((prev) => ({ ...prev, password: "" }));
      note("Signed out.");
      setAuthBusy(false);
    }
  };

  const onSave = async () => {
    if (!cfg) return;
    setSaving(true);
    try {
      await saveConfig(cfg);
      setBaseline(JSON.stringify(cfg));
      note("Saved — the site updates immediately.");
    } catch (err) {
      if (err.message === "unauthorized") {
        setUser(null);
        setCfg(null);
        setUsers([]);
        note("Session expired. Sign in again.", false);
      } else {
        note("Save failed — check the server.", false);
      }
    } finally {
      setSaving(false);
    }
  };

  const onCreateUser = async (e) => {
    e.preventDefault();
    setAuthBusy(true);
    try {
      const created = await createUser(userForm.username, userForm.password);
      setUsers((prev) => [...prev, created]);
      setUserForm({ username: "", password: "" });
      note(`Added ${created.username}.`);
    } catch (err) {
      note(err.message === "unauthorized" ? "Session expired. Sign in again." : err.message, false);
      if (err.message === "unauthorized") {
        setUser(null);
        setCfg(null);
        setUsers([]);
      }
    } finally {
      setAuthBusy(false);
    }
  };

  const dirty = cfg ? JSON.stringify(cfg) !== baseline : false;

  const addShow = () => set((n) => n.shows.push({ m: "JAN", d: "01", y: String(new Date().getFullYear() + 1), name: "", city: "", status: "tickets", ticket_url: "" }));
  const delShow = (i) => set((n) => n.shows.splice(i, 1));
  const moveShow = (i, d) => set((n) => { const j = i + d; if (j < 0 || j >= n.shows.length) return; const [x] = n.shows.splice(i, 1); n.shows.splice(j, 0, x); });
  const updShow = (i, k, v) => set((n) => { n.shows[i][k] = v; });

  if (!authReady) {
    return (
      <div className="admin">
        <style>{`
          .admin{min-height:100vh;display:flex;align-items:center;justify-content:center;color:var(--ink);font-family:'EB Garamond',Georgia,serif;background:radial-gradient(circle at top, oklch(0.18 0.016 64), oklch(0.11 0.01 64) 65%)}
        `}</style>
        <div style={{ color: "var(--ink-3)", fontFamily: "'Cinzel',serif", fontSize: 14, letterSpacing: ".1em" }}>Loading…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="admin authshell">
        <style>{`
          .admin{min-height:100vh;color:var(--ink);font-family:'EB Garamond',Georgia,serif;padding-bottom:80px;background:radial-gradient(circle at top, oklch(0.18 0.016 64), oklch(0.11 0.01 64) 65%)}
          .admin .authshell{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px}
          .admin .authcard{width:min(560px,100%);background:oklch(0.15 0.012 64 / .94);border:1px solid var(--line);border-radius:20px;padding:30px 30px 28px;box-shadow:0 28px 90px rgba(0,0,0,.35)}
          .admin .authlead{display:flex;flex-direction:column;gap:14px;margin-bottom:22px}
          .admin .authlead p{margin:0;color:var(--ink-2);font-size:16px;line-height:1.6}
          .admin .authmeta{font-size:13px;color:var(--ink-3);line-height:1.6}
          .admin .authgrid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
          .admin .authactions{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:8px}
          .admin .authnote{font-size:13px;color:var(--ink-3);margin-top:12px}
          .admin .btn{font-family:'Cinzel',serif;font-size:12px;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;border-radius:999px;padding:10px 18px;border:1px solid var(--line);background:transparent;color:var(--ink-2);transition:all .2s}
          .admin .btn:hover{border-color:var(--ink-2);color:var(--ink)}
          .admin .btn.primary{border-color:var(--gold);color:var(--bg);background:var(--gold-2)}
          .admin .btn.primary:hover{background:var(--gold)}
          .admin .btn.primary:disabled{opacity:.4;cursor:default;background:transparent;color:var(--ink-3);border-color:var(--line)}
          .admin .field{margin-bottom:16px}
          .admin label{display:block;font-family:'Cinzel',serif;font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-3);margin:0 0 7px}
          .admin input,.admin textarea,.admin select{width:100%;background:oklch(0.12 0.012 64);border:1px solid var(--line);border-radius:7px;color:var(--ink);font-family:'EB Garamond',serif;font-size:16px;padding:11px 13px;transition:border-color .2s,box-shadow .2s}
          .admin input:focus,.admin textarea:focus,.admin select:focus{outline:none;border-color:var(--gold);box-shadow:0 0 0 3px oklch(0.8 0.12 78 / .12)}
          .admin .flash-ok{font-size:14px;color:var(--gold-2)}
          .admin .flash-err{font-size:14px;color:#e88}
          @media(max-width:720px){.admin .authgrid{grid-template-columns:1fr}}
        `}</style>
        <div className="authcard">
          <div className="authlead">
            <div style={{ width: 220 }}><Logo width="100%" idSuffix="auth" /></div>
            <p>Sign in to edit the site and manage users.</p>
            <div className="authmeta">Passwords are salted per user and hashed with a server-side pepper before being stored.</div>
          </div>
          <form onSubmit={onLoginSubmit}>
            <div className="authgrid">
              <div className="field">
                <label>Username</label>
                <input value={loginForm.username} onChange={(e) => setLoginForm((prev) => ({ ...prev, username: e.target.value }))} autoComplete="username" autoFocus placeholder="admin" />
              </div>
              <div className="field">
                <label>Password</label>
                <input type="password" value={loginForm.password} onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))} autoComplete="current-password" placeholder="••••••••" />
              </div>
            </div>
            {flash.msg && !flash.ok && <div className="flash-err" style={{ marginBottom: 12 }}>{flash.msg}</div>}
            <div className="authactions">
              <button type="submit" className="btn primary" disabled={authBusy || !loginForm.username || !loginForm.password}>{authBusy ? "Signing in…" : "Sign in"}</button>
            </div>
          </form>
          <div className="authnote">The first account is seeded from <code>ADMIN_USERNAME</code> and <code>ADMIN_PASSWORD</code> when the database is empty.</div>
        </div>
      </div>
    );
  }

  if (!cfg) {
    return (
      <div className="admin">
        <style>{`
          .admin{min-height:100vh;display:flex;align-items:center;justify-content:center;color:var(--ink);font-family:'EB Garamond',Georgia,serif;background:radial-gradient(circle at top, oklch(0.18 0.016 64), oklch(0.11 0.01 64) 65%)}
        `}</style>
        <div style={{ color: "var(--ink-3)", fontFamily: "'Cinzel',serif", fontSize: 14, letterSpacing: ".1em" }}>Loading editor…</div>
      </div>
    );
  }

  return (
    <div className="admin">
      <style>{`
        .admin{min-height:100vh;color:var(--ink);font-family:'EB Garamond',Georgia,serif;padding-bottom:80px;background:radial-gradient(circle at top, oklch(0.18 0.016 64), oklch(0.11 0.01 64) 65%)}
        .admin .bar{position:sticky;top:0;z-index:20;display:flex;align-items:center;gap:18px;flex-wrap:wrap;padding:16px 28px;background:oklch(0.135 0.012 64 / .92);backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
        .admin .wrap{max-width:920px;margin:0 auto;padding:0 28px}
        .admin h1{font-family:'Cinzel',serif;font-weight:600;font-size:18px;letter-spacing:.04em;margin:0;color:var(--ink)}
        .admin .panel{background:var(--bg-2);border:1px solid var(--line);border-radius:10px;padding:26px 26px 28px;margin-top:22px}
        .admin .ph{display:flex;align-items:center;gap:12px;margin:0 0 20px}
        .admin .ph .eyebrow{font-family:'Cinzel',serif;font-size:12px;letter-spacing:.28em;text-transform:uppercase;color:var(--gold-2)}
        .admin .ph .hint{font-size:14px;color:var(--ink-3);margin-left:auto}
        .admin label{display:block;font-family:'Cinzel',serif;font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-3);margin:0 0 7px}
        .admin input,.admin textarea,.admin select{width:100%;background:oklch(0.12 0.012 64);border:1px solid var(--line);border-radius:7px;color:var(--ink);font-family:'EB Garamond',serif;font-size:16px;padding:11px 13px;transition:border-color .2s,box-shadow .2s}
        .admin textarea{min-height:78px;line-height:1.55;resize:vertical}
        .admin input:focus,.admin textarea:focus,.admin select:focus{outline:none;border-color:var(--gold);box-shadow:0 0 0 3px oklch(0.8 0.12 78 / .12)}
        .admin select{appearance:none;cursor:pointer}
        .admin .grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        .admin .field{margin-bottom:16px}
        .admin .sub{border:1px solid var(--line);border-radius:9px;padding:18px;margin-top:14px;background:oklch(0.135 0.012 64)}
        .admin .sub-h{display:flex;align-items:center;gap:10px;margin-bottom:14px;color:var(--gold-2);font-family:'Cinzel',serif;font-size:15px}
        .admin .showrow{display:grid;grid-template-columns:74px 56px 70px 1.2fr 1fr 1.3fr 118px auto;gap:10px;align-items:end;padding:14px;border:1px solid var(--line);border-radius:9px;margin-bottom:12px;background:oklch(0.135 0.012 64)}
        .admin .btn{font-family:'Cinzel',serif;font-size:12px;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;border-radius:999px;padding:10px 18px;border:1px solid var(--line);background:transparent;color:var(--ink-2);transition:all .2s}
        .admin .btn:hover{border-color:var(--ink-2);color:var(--ink)}
        .admin .btn.primary{border-color:var(--gold);color:var(--bg);background:var(--gold-2)}
        .admin .btn.primary:hover{background:var(--gold)}
        .admin .btn.primary:disabled{opacity:.4;cursor:default;background:transparent;color:var(--ink-3);border-color:var(--line)}
        .admin .btn.gold{border-color:var(--gold);color:var(--gold-2)}
        .admin .btn.gold:hover{background:var(--gold);color:var(--bg)}
        .admin .iconbtn{width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;border-radius:7px;border:1px solid var(--line);background:transparent;color:var(--ink-3);cursor:pointer;font-size:15px;transition:all .2s}
        .admin .iconbtn:hover{color:var(--ink);border-color:var(--ink-2)}
        .admin .iconbtn.danger:hover{color:#e88;border-color:#e88}
        .admin .flash-ok{font-size:14px;color:var(--gold-2)}
        .admin .flash-err{font-size:14px;color:#e88}
        .admin .dirty{font-size:13px;color:var(--ink-3);display:inline-flex;align-items:center;gap:7px}
        .admin .dot{width:7px;height:7px;border-radius:999px;background:var(--gold)}
        .admin a{color:var(--gold-2)}
        .admin .users{display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:10px;margin-top:8px}
        .admin .userpill{border:1px solid var(--line);border-radius:10px;padding:12px 14px;background:oklch(0.135 0.012 64);display:flex;flex-direction:column;gap:4px}
        .admin .userpill strong{font-family:'Cinzel',serif;font-size:13px;letter-spacing:.06em}
        .admin .userpill span{font-size:13px;color:var(--ink-3)}
        .admin .userpill.me{border-color:var(--gold)}
        .admin .toolbar-right{margin-left:auto;display:flex;gap:10px;flex-wrap:wrap;align-items:center}
        .admin .statusline{font-size:13px;color:var(--ink-3);line-height:1.5}
        @media(max-width:720px){.admin .grid2{grid-template-columns:1fr}.admin .showrow{grid-template-columns:1fr 1fr;gap:10px}}
      `}</style>

      <div className="bar">
        <div style={{ width: 132 }}><Logo width="100%" idSuffix="adm" /></div>
        <h1>Admin</h1>
        <span className="dirty">{dirty ? <><span className="dot"></span> Unsaved changes</> : "All saved"}</span>
        <div className="toolbar-right">
          <span className="statusline">Signed in as <strong style={{ color: "var(--ink)" }}>{user.username}</strong></span>
          {flash.msg && <span className={flash.ok ? "flash-ok" : "flash-err"}>{flash.msg}</span>}
          <a className="btn" href="/" target="_blank" rel="noopener">View site ↗</a>
          <button className="btn" onClick={onLogout} disabled={authBusy}>Log out</button>
          <button className="btn primary" onClick={onSave} disabled={!dirty || saving}>{saving ? "Saving…" : "Save"}</button>
        </div>
      </div>

      <div className="wrap">
        <div className="panel">
          <div className="ph"><span className="eyebrow">Contact</span></div>
          <div className="grid2">
            <div className="field"><label>Booking / contact email</label><input value={cfg.email} onChange={(e) => set((n) => { n.email = e.target.value; })} placeholder="info@skjoldmoband.com" /></div>
            <div className="field"><label>Press kit link (optional)</label><input value={cfg.presskit} onChange={(e) => set((n) => { n.presskit = e.target.value; })} placeholder="https://… (leave blank to hide the button)" /></div>
          </div>
        </div>

        <div className="panel">
          <div className="ph"><span className="eyebrow">Users</span><span className="hint">Passwords are stored as salted hashes with a server pepper</span></div>
          <div className="users">
            {users.map((entry) => (
              <div className={`userpill ${entry.username === user.username ? "me" : ""}`} key={entry.id}>
                <strong>{entry.username}</strong>
                <span>{entry.created_at}</span>
                {entry.username === user.username && <span>Current account</span>}
              </div>
            ))}
          </div>
          <form className="grid2" style={{ marginTop: 18 }} onSubmit={onCreateUser}>
            <div className="field"><label>New username</label><input value={userForm.username} onChange={(e) => setUserForm((prev) => ({ ...prev, username: e.target.value }))} autoComplete="off" placeholder="second-admin" /></div>
            <div className="field"><label>New password</label><input type="password" value={userForm.password} onChange={(e) => setUserForm((prev) => ({ ...prev, password: e.target.value }))} autoComplete="new-password" placeholder="••••••••" /></div>
            <div style={{ display: "flex", gap: 10, alignItems: "end", flexWrap: "wrap" }}>
              <button type="submit" className="btn gold" disabled={authBusy || !userForm.username || !userForm.password}>{authBusy ? "Working…" : "Add user"}</button>
            </div>
          </form>
        </div>

        <div className="panel">
          <div className="ph"><span className="eyebrow">Feeds & social</span><span className="hint">URLs the hub cards link to</span></div>
          {SOCIAL_ORDER.map((key) => {
            const Ico = ICONS[key];
            return (
              <div className="sub" key={key}>
                <div className="sub-h"><Ico s={18} /> {NAMES[key]}</div>
                <div className="grid2">
                  <div className="field"><label>Profile URL</label><input value={cfg.links[key]} onChange={(e) => set((n) => { n.links[key] = e.target.value; })} placeholder="https://…" /></div>
                  <div className="field"><label>Handle shown</label><input value={cfg.handles[key]} onChange={(e) => set((n) => { n.handles[key] = e.target.value; })} placeholder="@skjoldmoband" /></div>
                  <div className="field"><label>Description — Dansk</label><input value={cfg.desc[key].da} onChange={(e) => set((n) => { n.desc[key].da = e.target.value; })} /></div>
                  <div className="field"><label>Description — English</label><input value={cfg.desc[key].en} onChange={(e) => set((n) => { n.desc[key].en = e.target.value; })} /></div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="panel">
          <div className="ph"><span className="eyebrow">Shows</span><span className="hint">{cfg.shows.length} event{cfg.shows.length === 1 ? "" : "s"}</span></div>
          {cfg.shows.map((sh, i) => (
            <div className="showrow" key={i}>
              <div><label>Month</label><input value={sh.m} onChange={(e) => updShow(i, "m", e.target.value)} /></div>
              <div><label>Day</label><input value={sh.d} onChange={(e) => updShow(i, "d", e.target.value)} /></div>
              <div><label>Year</label><input value={sh.y} onChange={(e) => updShow(i, "y", e.target.value)} /></div>
              <div><label>Venue / event</label><input value={sh.name} onChange={(e) => updShow(i, "name", e.target.value)} /></div>
              <div><label>City</label><input value={sh.city} onChange={(e) => updShow(i, "city", e.target.value)} /></div>
              <div><label>Ticket / show URL</label><input value={sh.ticket_url || ""} onChange={(e) => updShow(i, "ticket_url", e.target.value)} placeholder="https://…" /></div>
              <div><label>Status</label><select value={sh.status} onChange={(e) => updShow(i, "status", e.target.value)}><option value="tickets">Tickets</option><option value="soldout">Sold out</option><option value="free">Free</option></select></div>
              <div style={{ display: "flex", gap: 5 }}>
                <button className="iconbtn" title="Move up" onClick={() => moveShow(i, -1)}>↑</button>
                <button className="iconbtn" title="Move down" onClick={() => moveShow(i, 1)}>↓</button>
                <button className="iconbtn danger" title="Delete" onClick={() => delShow(i)}>✕</button>
              </div>
            </div>
          ))}
          <button className="btn gold" style={{ marginTop: 6 }} onClick={addShow}>+ Add show</button>
        </div>

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

        <div className="panel">
          <div className="ph"><span className="eyebrow">SEO</span><span className="hint">Search snippet · Open Graph · Twitter cards · robots</span></div>
          <div className="field"><label>Site name</label><input value={cfg.seo.site_name} onChange={(e) => set((n) => { n.seo.site_name = e.target.value; })} placeholder="Skjoldmø" /></div>

          <div className="field"><label>Meta title (recommended under ~60 chars)</label>
            <div className="grid2">
              <input value={cfg.seo.title.da} onChange={(e) => set((n) => { n.seo.title.da = e.target.value; })} placeholder="Dansk side-title" />
              <input value={cfg.seo.title.en} onChange={(e) => set((n) => { n.seo.title.en = e.target.value; })} placeholder="English page title" />
            </div></div>

          <div className="field"><label>Meta description (recommended under ~160 chars)</label>
            <div className="grid2">
              <textarea value={cfg.seo.description.da} onChange={(e) => set((n) => { n.seo.description.da = e.target.value; })} placeholder="Dansk meta description" />
              <textarea value={cfg.seo.description.en} onChange={(e) => set((n) => { n.seo.description.en = e.target.value; })} placeholder="English meta description" />
            </div></div>

          <div className="field"><label>Meta keywords (comma-separated)</label>
            <div className="grid2">
              <input value={cfg.seo.keywords.da} onChange={(e) => set((n) => { n.seo.keywords.da = e.target.value; })} placeholder="dansk keyword, keyword" />
              <input value={cfg.seo.keywords.en} onChange={(e) => set((n) => { n.seo.keywords.en = e.target.value; })} placeholder="english keyword, keyword" />
            </div></div>

          <div className="grid2">
            <div className="field"><label>Canonical URL (optional)</label><input value={cfg.seo.canonical_url} onChange={(e) => set((n) => { n.seo.canonical_url = e.target.value; })} placeholder="https://example.com/" /></div>
            <div className="field"><label>Theme color</label><input value={cfg.seo.theme_color} onChange={(e) => set((n) => { n.seo.theme_color = e.target.value; })} placeholder="#221c16" /></div>
          </div>

          <div className="grid2">
            <div className="field"><label>Robots</label><input value={cfg.seo.robots} onChange={(e) => set((n) => { n.seo.robots = e.target.value; })} placeholder="index,follow,max-image-preview:large" /></div>
            <div className="field"><label>Open Graph image URL (optional)</label><input value={cfg.seo.og_image} onChange={(e) => set((n) => { n.seo.og_image = e.target.value; })} placeholder="https://…/share-image.jpg" /></div>
          </div>

          <div className="grid2">
            <div className="field"><label>Open Graph type</label>
              <select value={cfg.seo.og_type} onChange={(e) => set((n) => { n.seo.og_type = e.target.value; })}>
                <option value="website">website</option>
                <option value="music.group">music.group</option>
                <option value="profile">profile</option>
              </select>
            </div>
            <div className="field"><label>Twitter card type</label>
              <select value={cfg.seo.twitter_card} onChange={(e) => set((n) => { n.seo.twitter_card = e.target.value; })}>
                <option value="summary_large_image">summary_large_image</option>
                <option value="summary">summary</option>
              </select>
            </div>
          </div>

          <div className="grid2">
            <div className="field"><label>Twitter @site (optional)</label><input value={cfg.seo.twitter_site} onChange={(e) => set((n) => { n.seo.twitter_site = e.target.value; })} placeholder="@skjoldmoband" /></div>
            <div className="field"><label>Twitter @creator (optional)</label><input value={cfg.seo.twitter_creator} onChange={(e) => set((n) => { n.seo.twitter_creator = e.target.value; })} placeholder="@artist" /></div>
          </div>
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
