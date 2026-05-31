/* Skjoldmø — config model. Reads from the server API; falls back to defaults. */
(function () {
  const DEFAULTS = {
    email: "info@skjoldmoband.com",
    presskit: "",
    links: {
      facebook:  "https://facebook.com/skjoldmoband",
      instagram: "https://instagram.com/skjoldmoband",
      tiktok:    "https://tiktok.com/@skjoldmoband",
    },
    handles: { facebook: "@skjoldmoband", instagram: "@skjoldmoband", tiktok: "@skjoldmoband" },
    desc: {
      facebook:  { da: "Koncertdatoer & nyt fra bandet", en: "Concert dates & news" },
      instagram: { da: "Billeder fra vejen & scenen",     en: "Photos from the road & stage" },
      tiktok:    { da: "Sange & små øjeblikke",           en: "Songs & small moments" },
    },
    shows: [
      { m: "JUN", d: "14", y: "2026", name: "Skovtårnet Sessions",       city: "Gisselfeld · DK",  status: "tickets" },
      { m: "JUL", d: "26", y: "2026", name: "Tønder Folk · Aftenscenen", city: "Tønder · DK",      status: "tickets" },
      { m: "AUG", d: "08", y: "2026", name: "Smukfest — Bøgescenen",      city: "Skanderborg · DK", status: "soldout" },
      { m: "SEP", d: "19", y: "2026", name: "Huset",                      city: "Aarhus · DK",      status: "tickets" },
      { m: "OKT", d: "31", y: "2026", name: "Samhain — Allehelgensnat",   city: "København · DK",   status: "free" },
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
  };

  const UI = {
    nordisk:         { da: "Nordisk folk", en: "Nordic folk" },
    connect_eyebrow: { da: "Find os", en: "Find us" },
    connect_follow:  { da: "Følg", en: "Follow" },
    shows_title:     { da: "Kommende koncerter", en: "Upcoming shows" },
    about_eyebrow:   { da: "Bandet", en: "The band" },
    press_eyebrow:   { da: "Booking & presse", en: "Booking & press" },
    press_title:     { da: "Få os på jeres scene", en: "Bring us to your stage" },
    press_kit:       { da: "Pressekit", en: "Press kit" },
    foot_illus:      { da: "Illustration", en: "Illustration" },
    foot_rights:     { da: "Alle rettigheder forbeholdes", en: "All rights reserved" },
  };

  const STATUS = {
    tickets: { da: "Billetter", en: "Tickets" },
    soldout: { da: "Udsolgt",   en: "Sold out" },
    free:    { da: "Gratis",    en: "Free" },
  };

  const SOCIAL_ORDER = ["facebook", "instagram", "tiktok"];
  const NAMES = { facebook: "Facebook", instagram: "Instagram", tiktok: "TikTok" };

  function t(obj, lang) { return obj && (obj[lang] != null ? obj[lang] : obj.da); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  async function resolveConfig() {
    try {
      const r = await fetch("/api/config", { cache: "no-store" });
      if (r.ok) return await r.json();
    } catch (e) { /* server not reachable — fall back to defaults */ }
    return clone(DEFAULTS);
  }

  async function saveConfig(cfg, password) {
    const r = await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Password": password },
      body: JSON.stringify(cfg),
    });
    if (r.status === 401) throw new Error("unauthorized");
    if (!r.ok) throw new Error("save failed");
    window.dispatchEvent(new CustomEvent("sk-config-updated"));
  }

  window.SKCONF = {
    DEFAULTS, UI, STATUS, SOCIAL_ORDER, NAMES,
    t, clone, resolveConfig, saveConfig,
    credit: "Astrid Leed Sørensen · 2024",
  };
})();
