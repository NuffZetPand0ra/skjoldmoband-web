/* Skjoldmø — config model. Reads from the server API; falls back to defaults. */
(function () {
  const DEFAULTS = {
    email: "info@skjoldmoband.com",
    presskit: "",
    links: {
      facebook: "https://facebook.com/skjoldmoband",
      instagram: "https://instagram.com/skjoldmoband",
      tiktok: "https://tiktok.com/@skjoldmoband",
    },
    handles: { facebook: "@skjoldmoband", instagram: "@skjoldmoband", tiktok: "@skjoldmoband" },
    desc: {
      facebook: { da: "Koncertdatoer & nyt fra bandet", en: "Concert dates & news" },
      instagram: { da: "Billeder fra vejen & scenen", en: "Photos from the road & stage" },
      tiktok: { da: "Sange & små øjeblikke", en: "Songs & small moments" },
    },
    shows: [
      { m: "JUN", d: "14", y: "2026", name: "Skovtårnet Sessions", city: "Gisselfeld · DK", status: "tickets", ticket_url: "" },
      { m: "JUL", d: "26", y: "2026", name: "Tønder Folk · Aftenscenen", city: "Tønder · DK", status: "tickets", ticket_url: "" },
      { m: "AUG", d: "08", y: "2026", name: "Smukfest — Bøgescenen", city: "Skanderborg · DK", status: "soldout", ticket_url: "" },
      { m: "SEP", d: "19", y: "2026", name: "Huset", city: "Aarhus · DK", status: "tickets", ticket_url: "" },
      { m: "OKT", d: "31", y: "2026", name: "Samhain — Allehelgensnat", city: "København · DK", status: "free", ticket_url: "" },
    ],
    text: {
      tagline: {
        da: "Nordisk folkemusik fra de dybe skove",
        en: "Nordic folk from the deep woods",
      },
      connect_intro: {
        da: "Følg med på de platforme, hvor vi deler nye sange, billeder og nyt om, hvor vi spiller næste gang.",
        en: "Follow along on the platforms where we share new songs, photos and word of where we play next.",
      },
      about: {
        da: "Skjoldmø er et nordisk folkeband, der væver gamle ballader, dronestrenge og skovmørke harmonier. Guitar, cello og stemme — rodfæstet i skandinavisk tradition og skovens stilhed.",
        en: "Skjoldmø is a Nordic folk band weaving old ballads, drone strings and forest-dark harmonies. Guitar, cello and voice — rooted in Scandinavian tradition and the quiet of the woods.",
      },
    },
    seo: {
      site_name: "Skjoldmø",
      title: {
        da: "Skjoldmø | Nordisk folkemusik fra de dybe skove",
        en: "Skjoldmø | Nordic folk from the deep woods",
      },
      description: {
        da: "Skjoldmø er et nordisk folkeband med guitar, cello og stemme. Hør ny musik, se kommende koncerter og find bookinginfo.",
        en: "Skjoldmø is a Nordic folk band with guitar, cello and voice. Discover new music, upcoming shows, and booking details.",
      },
      keywords: {
        da: "Skjoldmø, nordisk folk, dansk folk, live koncert, skandinavisk musik",
        en: "Skjoldmø, nordic folk, danish folk, live music, scandinavian music",
      },
      canonical_url: "",
      og_image: "",
      og_type: "website",
      twitter_card: "summary_large_image",
      twitter_site: "",
      twitter_creator: "",
      robots: "index,follow,max-image-preview:large",
      theme_color: "#221c16",
    },
  };

  const UI = {
    nordisk: { da: "Nordisk folk", en: "Nordic folk" },
    connect_eyebrow: { da: "Find os", en: "Find us" },
    connect_follow: { da: "Følg", en: "Follow" },
    shows_title: { da: "Kommende koncerter", en: "Upcoming shows" },
    about_eyebrow: { da: "Bandet", en: "The band" },
    press_eyebrow: { da: "Booking & presse", en: "Booking & press" },
    press_title: { da: "Få os på jeres scene", en: "Bring us to your stage" },
    press_kit: { da: "Pressekit", en: "Press kit" },
    foot_illus: { da: "Illustration", en: "Illustration" },
    foot_rights: { da: "Alle rettigheder forbeholdes", en: "All rights reserved" },
  };

  const STATUS = {
    tickets: { da: "Billetter", en: "Tickets" },
    soldout: { da: "Udsolgt", en: "Sold out" },
    free: { da: "Gratis", en: "Free" },
  };

  const SOCIAL_ORDER = ["facebook", "instagram", "tiktok"];
  const NAMES = { facebook: "Facebook", instagram: "Instagram", tiktok: "TikTok" };

  function t(obj, lang) { return obj && (obj[lang] != null ? obj[lang] : obj.da); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  async function apiFetch(path, options = {}) {
    const response = await fetch(path, {
      cache: "no-store",
      credentials: "same-origin",
      ...options,
      headers: { ...(options.headers || {}) },
    });
    let body = null;
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        body = await response.json();
      } catch (e) {
        body = null;
      }
    }
    return { response, body };
  }

  async function resolveConfig() {
    try {
      const r = await fetch("/api/config", { cache: "no-store" });
      if (r.ok) return await r.json();
    } catch (e) { /* server not reachable — fall back to defaults */ }
    return clone(DEFAULTS);
  }

  async function getCurrentUser() {
    try {
      const { response, body } = await apiFetch("/api/auth/me");
      if (response.ok && body && body.authenticated) return body.user;
    } catch (e) { /* session lookup failed */ }
    return null;
  }

  async function login(username, password) {
    const { response, body } = await apiFetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (response.status === 401) throw new Error("unauthorized");
    if (!response.ok) throw new Error((body && body.error) || "login failed");
    return body.user;
  }

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
  }

  async function saveConfig(cfg) {
    const { response, body } = await apiFetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cfg),
    });
    if (response.status === 401) throw new Error("unauthorized");
    if (!response.ok) throw new Error((body && body.error) || "save failed");
    window.dispatchEvent(new CustomEvent("sk-config-updated"));
  }

  async function listUsers() {
    const { response, body } = await apiFetch("/api/users");
    if (response.status === 401) throw new Error("unauthorized");
    if (!response.ok) throw new Error((body && body.error) || "load users failed");
    return (body && body.users) || [];
  }

  async function createUser(username, password) {
    const { response, body } = await apiFetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (response.status === 401) throw new Error("unauthorized");
    if (!response.ok) throw new Error((body && body.error) || "create user failed");
    return body.user;
  }

  window.SKCONF = {
    DEFAULTS,
    UI,
    STATUS,
    SOCIAL_ORDER,
    NAMES,
    t,
    clone,
    resolveConfig,
    getCurrentUser,
    login,
    logout,
    saveConfig,
    listUsers,
    createUser,
    credit: "Astrid Leed Sørensen · 2024",
  };
})();
