// Navegación común de toda la web (una sola fuente; cada página solo tiene `<nav class="menu"></nav>` y carga este
// script justo detrás, para que el menú salga sin parpadeo).
// - Escritorio (≥ 1024 px): barra principal con dos desplegables (Warhammer 40K y Juegos de especialista) que se abren
//   al pasar el ratón o al pulsar, con teclado (Enter/Espacio, flechas, Inicio/Fin, Escape) y ARIA; y, dentro de una
//   categoría, una barra secundaria con sus secciones.
// - Móvil y tablet (< 1024 px): cabecera compacta, barra inferior fija (Inicio, Calendario, 40K, Galería, Más) y un
//   menú lateral con acordeones, idioma y, para invitados, Inscripción y Entrar. Zonas táctiles de 48 px o más.
(function () {
  const menu = document.querySelector(".nav .menu");
  if (!menu || menu.dataset.listo) return;
  menu.dataset.listo = "1";
  const cab = menu.closest(".nav");

  // ----- Estructura -----
  const ITEMS = [
    { t: "Inicio", u: "/", ic: "inicio" },
    { t: "Calendario", u: "/calendario.html", ic: "calendario" },
    { t: "Warhammer 40K", id: "w40k", ic: "w40k", hijos: [
      { t: "Gran Liga", u: "/warhammer-40k/gran-liga", ic: "liga" },
      { t: "Ranking ELO", u: "/warhammer-40k/ranking-elo", ic: "elo" },
      { t: "Recursos", u: "/warhammer-40k/recursos", ic: "recursos" },
      { t: "Tutoriales", u: "/warhammer-40k/tutoriales", ic: "tutoriales" },
    ] },
    { t: "Juegos de especialista", id: "esp", ic: "esp", hijos: [
      { t: "Necromunda", u: "/juegos-de-especialista/necromunda", ic: "necromunda" },
      { t: "Blood Bowl", u: "/juegos-de-especialista/blood-bowl", ic: "bloodbowl" },
    ] },
    { t: "Galería", u: "/galeria.html", ic: "galeria" },
    { t: "Miembros", u: "/miembros.html", ic: "miembros" },
    { t: "Reglas y FAQ", u: "/faq.html", ic: "faq" },
  ];
  const BARRA = [
    { t: "Inicio", u: "/", ic: "inicio" },
    { t: "Calendario", u: "/calendario.html", ic: "calendario" },
    { t: "40K", u: "/warhammer-40k/gran-liga", ic: "w40k", cat: "w40k", et: "Warhammer 40K" },
    { t: "Galería", u: "/galeria.html", ic: "galeria" },
  ];

  // Página actual (con o sin «.html» y sin barra final); las direcciones antiguas cuentan como las nuevas.
  const limpia = (p) => (p.replace(/\.html$/, "").replace(/\/+$/, "") || "/").replace(/^\/index$/, "/");
  const ALIAS = { "/gran-liga": "/warhammer-40k/gran-liga", "/elo": "/warhammer-40k/ranking-elo" };
  const aqui = ((p) => ALIAS[p] || p)(limpia(location.pathname));
  const esActual = (u) => limpia(u) === aqui;
  const catActual = ITEMS.find((it) => it.hijos && it.hijos.some((h) => esActual(h.u)));

  // ----- Iconos (dibujo propio, trazo de 2 px, 24×24) -----
  const P = {
    inicio: "M3 11.5 12 4l9 7.5M5.5 10v9.5h5v-6h3v6h5V10",
    calendario: "M4 6.5h16v13.5H4zM4 10.5h16M8.5 3.5v5M15.5 3.5v5M8 14h2.5M13.5 14H16M8 17h2.5",
    w40k: "M12 3 5 6v5.5c0 4.3 3 7.6 7 9.5 4-1.9 7-5.2 7-9.5V6zM12 8v8M9 11h6",
    esp: "M4 8.5 12 4l8 4.5v7L12 20l-8-4.5zM4 8.5l8 4.5 8-4.5M12 13v7",
    galeria: "M3.5 5.5h17v13h-17zM3.5 15l5-4.5 4 3.5 3-2.5 5 4.5M15.5 9.2a1.2 1.2 0 1 0 0 .1",
    miembros: "M9 11a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 11zM3.5 19.5c.6-3.4 2.8-5.3 5.5-5.3s4.9 1.9 5.5 5.3M16 11a2.7 2.7 0 1 0 0-5.4M17.5 14.3c1.7.6 2.7 2.4 3 5.2",
    faq: "M5 4.5h11.5a2 2 0 0 1 2 2V20H7a2 2 0 0 1-2-2zM5 18a2 2 0 0 1 2-2h11.5M9 8.5h6M9 11.5h4",
    liga: "M8 4.5h8v4.5a4 4 0 0 1-8 0zM8 6.5H5a3 3 0 0 0 3 3.5M16 6.5h3a3 3 0 0 1-3 3.5M12 13v3.5M8.5 20h7M10 16.5h4V20h-4z",
    elo: "M4 19.5h16M6 16l4-5 3.5 3 5-7M15 7h3.5v3.5",
    recursos: "M6 3.5h8.5l3.5 3.5v13.5H6zM14.5 3.5V7H18M9 11.5h6M9 14.5h6M9 17.5h4",
    tutoriales: "M3.5 6h17v12h-17zM10 9.5v5l4.5-2.5z",
    necromunda: "M7 9.5c0-3 2.2-5 5-5s5 2 5 5v3.5l-2 1.5v3.5H9v-3.5L7 13zM10 11h.01M14 11h.01M10.5 17.5v2M13.5 17.5v2",
    bloodbowl: "M5 19C3.5 13 7 5 19 5c1.5 6-2 14-14 14zM8.5 15.5l7-7M10.5 11.5l2 2M12.5 9.5l2 2",
    mas: "M4 7h16M4 12h16M4 17h16",
    cerrar: "M6 6l12 12M18 6 6 18",
    flecha: "M6 9l6 6 6-6",
    insc: "M9 11a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 11zM3.5 19.5c.6-3.4 2.8-5.3 5.5-5.3 1.4 0 2.6.5 3.6 1.4M18 13v6M15 16h6",
    entrar: "M10 7V4.5h9.5v15H10V17M4 12h10M11 8.5 14.5 12 11 15.5",
  };
  const NS = "http://www.w3.org/2000/svg";
  const icono = (n, tam) => {
    const s = document.createElementNS(NS, "svg");
    s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("width", tam || 24); s.setAttribute("height", tam || 24);
    s.setAttribute("fill", "none"); s.setAttribute("stroke", "currentColor"); s.setAttribute("stroke-width", "2");
    s.setAttribute("stroke-linecap", "round"); s.setAttribute("stroke-linejoin", "round"); s.setAttribute("aria-hidden", "true");
    s.setAttribute("focusable", "false");
    const p = document.createElementNS(NS, "path"); p.setAttribute("d", P[n] || ""); s.appendChild(p);
    return s;
  };
  const el = (tag, cls, txt) => { const x = document.createElement(tag); if (cls) x.className = cls; if (txt != null) x.textContent = txt; return x; };
  const enlace = (it, cls) => {
    const a = el("a", cls || "");
    a.href = it.u;
    if (esActual(it.u)) { a.classList.add("on"); a.setAttribute("aria-current", "page"); }
    return a;
  };

  // ----- Estilos -----
  const css = el("style");
  css.textContent = [
    // Escritorio: fila 1 con escudo y usuario; fila 2, la barra principal; fila 3, la barra de la categoría.
    ".nav{flex-wrap:wrap;row-gap:0;padding:12px 0 0}",
    ".nav .brand{order:1}.nav #auth{order:2;margin-left:auto}.nav .nb-hamb{order:3}",
    ".nav nav.menu{order:4;flex-basis:100%;display:flex;flex-wrap:wrap;align-items:stretch;gap:4px 26px;margin-top:10px;font-size:16px}",
    ".nav nav.menu>a,.nav .nb-grp>button{display:inline-flex;align-items:center;gap:6px;min-height:48px;box-sizing:border-box;padding:0;color:#ECE7DC;text-decoration:none;font:500 16px Inter,system-ui,sans-serif;background:none;border:0;border-bottom:2px solid transparent;cursor:pointer}",
    ".nav nav.menu>a:hover,.nav .nb-grp>button:hover,.nav nav.menu>a.on,.nav .nb-grp>button.on{border-bottom-color:#D9B25A;color:#ECE7DC}",
    ".nav .nb-grp>button.on{color:#F0CE82}",
    ".nav .nb-grp>button svg{transition:transform .2s;color:#D9B25A}.nav .nb-grp>button[aria-expanded=true] svg{transform:rotate(180deg)}",
    ".nav nav.menu a:focus-visible,.nav .nb-grp>button:focus-visible,.nb-sub a:focus-visible{outline:2px solid #D9B25A;outline-offset:3px;border-radius:4px}",
    ".nb-grp{position:relative;display:inline-flex}",
    ".nb-pop{position:absolute;left:-14px;top:100%;min-width:250px;background:#1F2328;border:1px solid #6B6558;border-radius:12px;box-shadow:0 12px 32px rgba(0,0,0,.55);padding:8px;z-index:65;opacity:0;transform:translateY(-6px);visibility:hidden;transition:opacity .15s,transform .15s,visibility 0s .15s}",
    ".nb-pop.abierto{opacity:1;transform:none;visibility:visible;transition:opacity .15s,transform .15s}",
    ".nb-pop a{display:flex;align-items:center;gap:12px;min-height:48px;padding:0 12px;border-radius:8px;color:#ECE7DC;text-decoration:none;font-weight:500}",
    ".nb-pop a svg{color:#D9B25A;flex:none}",
    ".nb-pop a:hover,.nb-pop a:focus{background:#2A2F36;color:#F0CE82;outline:none}",
    ".nb-pop a.on{background:#2A2618;color:#F0CE82;box-shadow:inset 3px 0 0 #D9B25A}",
    ".nb-pop .nb-cab{display:block;padding:6px 12px 4px;font:600 12px Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#A8A293}",
    // Barra de la categoría
    ".nb-sub{order:5;flex-basis:100%;display:flex;align-items:center;gap:6px;overflow-x:auto;scrollbar-width:none;border-top:1px solid #2C3036;margin-top:0;padding:6px 0}",
    ".nb-sub::-webkit-scrollbar{display:none}",
    ".nb-sub .nb-cat{display:inline-flex;align-items:center;gap:8px;font:700 14px Cinzel,Georgia,serif;letter-spacing:.06em;color:#D9B25A;margin-right:10px;white-space:nowrap}",
    ".nb-sub a{display:inline-flex;align-items:center;gap:8px;min-height:40px;padding:0 14px;border-radius:999px;color:#CFC9BA;text-decoration:none;font-weight:500;font-size:15px;white-space:nowrap;border:1px solid transparent}",
    ".nb-sub a svg{width:20px;height:20px}",
    ".nb-sub a:hover{color:#F0CE82;border-color:#6B6558}",
    ".nb-sub a.on{background:#2A2618;color:#F0CE82;border-color:#D9B25A}",
    // Botón del menú lateral, barra inferior y menú lateral (solo móvil y tablet)
    ".nb-hamb,.nb-barra,.nb-cortina,.nb-cajon{display:none}",
    "@media (max-width:1023px){",
    "  html{scroll-padding-top:76px}",
    "  .nav{flex-wrap:wrap;gap:8px;padding:8px 0;min-height:60px;box-sizing:border-box}",
    "  .nav nav.menu{display:none}",
    "  .nav .brand{font-size:15px;line-height:1.15;letter-spacing:.04em;gap:10px;min-width:0;flex:0 1 auto;max-width:170px;margin-right:auto}",
    "  .nav #auth{margin-left:0}",
    "  .nav .brand .lg{height:40px}",
    "  .nav #auth{display:flex;align-items:center;gap:2px;min-width:0}",
    "  .nav #auth .lang{display:none}",
    "  .nav #auth .um-btn{padding:4px;gap:0;min-width:48px;min-height:48px;justify-content:center}",
    "  .nav #auth .um-btn>:not(img){position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}",
    "  .nav #auth .um-btn img{width:34px;height:34px}",
    "  .nav #auth>a[href='/auth/login']{display:none!important}",
    "  .nb-hamb{display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;flex:none;background:none;border:1px solid #2C3036;border-radius:12px;color:#ECE7DC;cursor:pointer}",
    "  .nb-hamb:focus-visible,.nb-barra a:focus-visible,.nb-barra button:focus-visible,.nb-cajon a:focus-visible,.nb-cajon button:focus-visible{outline:2px solid #D9B25A;outline-offset:2px}",
    "  .nb-sub{order:5;margin:4px 0 -8px;padding:6px 0 8px}",
    "  .nb-sub .nb-cat{display:none}",
    "  .nb-sub a{min-height:44px;font-size:14px;padding:0 14px}",
    "  body{padding-bottom:calc(76px + env(safe-area-inset-bottom))}",
    "  .nb-barra{display:grid;grid-template-columns:repeat(5,1fr);position:fixed;left:0;right:0;bottom:0;z-index:45;background:rgba(21,23,26,.97);border-top:1px solid #2C3036;padding:4px 4px calc(4px + env(safe-area-inset-bottom));box-shadow:0 -6px 18px rgba(0,0,0,.35)}",
    "  .nb-barra a,.nb-barra button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-height:60px;padding:4px 2px;border-radius:12px;color:#A8A293;text-decoration:none;font:500 12px/1.1 Inter,system-ui,sans-serif;background:none;border:0;cursor:pointer;-webkit-tap-highlight-color:transparent}",
    "  .nb-barra svg{width:26px;height:26px}",
    "  .nb-barra .on{color:#F0CE82}",
    "  .nb-barra .on svg{color:#D9B25A}",
    "  .nb-barra .on::after{content:'';width:18px;height:3px;border-radius:2px;background:#D9B25A;margin-top:1px}",
    "  .nb-barra a:active,.nb-barra button:active{background:#1F2328}",
    "  .nb-cortina{display:block;position:fixed;inset:0;z-index:70;background:rgba(0,0,0,.6);opacity:0;visibility:hidden;transition:opacity .25s,visibility 0s .25s}",
    "  .nb-cajon{display:flex;flex-direction:column;position:fixed;top:0;right:0;bottom:0;z-index:71;width:min(400px,88vw);background:#15171A;border-left:1px solid #2C3036;box-shadow:-12px 0 32px rgba(0,0,0,.5);transform:translateX(100%);visibility:hidden;transition:transform .28s cubic-bezier(.2,.8,.2,1),visibility 0s .28s}",
    "  .nb-abierto .nb-cortina{opacity:1;visibility:visible;transition:opacity .25s}",
    "  .nb-abierto .nb-cajon{transform:none;visibility:visible;transition:transform .28s cubic-bezier(.2,.8,.2,1)}",
    "  html.nb-abierto,html.nb-abierto body{overflow:hidden}",
    "}",
    "@media (min-width:1024px){.nb-cajon,.nb-cortina,.nb-barra{display:none!important}}",
    ".nb-cajon .nb-top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px 10px 20px;border-bottom:1px solid #2C3036}",
    ".nb-cajon .nb-top strong{font:700 18px Cinzel,Georgia,serif;letter-spacing:.06em;color:#ECE7DC}",
    ".nb-cajon .nb-x{display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:none;border:1px solid #2C3036;border-radius:12px;color:#ECE7DC;cursor:pointer}",
    ".nb-cajon .nb-lista{flex:1;overflow-y:auto;overscroll-behavior:contain;padding:10px 12px 24px}",
    ".nb-cajon .nb-lista>a,.nb-cajon .nb-acc>button{display:flex;align-items:center;gap:14px;width:100%;min-height:56px;padding:0 14px;box-sizing:border-box;border-radius:12px;color:#ECE7DC;text-decoration:none;font:500 17px Inter,system-ui,sans-serif;background:none;border:0;cursor:pointer;text-align:left}",
    ".nb-cajon svg{flex:none;color:#D9B25A}",
    ".nb-cajon .nb-lista>a+a,.nb-cajon .nb-lista>*+.nb-acc,.nb-cajon .nb-acc+a{margin-top:2px}",
    ".nb-cajon .nb-lista>a:active,.nb-cajon .nb-acc>button:active{background:#1F2328}",
    ".nb-cajon .nb-lista>a.on,.nb-cajon .nb-acc>button.on{background:#2A2618;color:#F0CE82}",
    ".nb-cajon .nb-acc>button .nb-fl{margin-left:auto;transition:transform .25s;color:#A8A293}",
    ".nb-cajon .nb-acc>button[aria-expanded=true] .nb-fl{transform:rotate(180deg)}",
    ".nb-cajon .nb-panel{display:grid;grid-template-rows:0fr;transition:grid-template-rows .25s ease}",
    ".nb-cajon .nb-panel.abierto{grid-template-rows:1fr}",
    ".nb-cajon .nb-panel>div{overflow:hidden;padding-left:22px}",
    ".nb-cajon .nb-panel a{display:flex;align-items:center;gap:12px;min-height:52px;margin:2px 0;padding:0 14px;border-radius:10px;border-left:2px solid #2C3036;color:#CFC9BA;text-decoration:none;font-size:16px}",
    ".nb-cajon .nb-panel a svg{width:22px;height:22px}",
    ".nb-cajon .nb-panel a.on{color:#F0CE82;background:#2A2618;border-left-color:#D9B25A}",
    ".nb-cajon .nb-pie{border-top:1px solid #2C3036;margin-top:12px;padding:14px 14px 0;display:flex;flex-direction:column;gap:12px}",
    ".nb-cajon .nb-pie .nb-et{font:600 12px Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#A8A293}",
    ".nb-cajon .nb-pie .lang{margin:0;gap:8px}.nb-cajon .nb-pie .lang button{min-width:56px;min-height:48px}",
    ".nb-cajon .nb-entrar{display:flex;align-items:center;justify-content:center;gap:10px;min-height:52px;border-radius:12px;background:#A3211B;color:#fff;font-weight:600;text-decoration:none}",
    ".nb-cajon .nb-entrar svg{color:#fff}",
    // Pie: zonas táctiles cómodas también en «Hecho por».
    ".ft a.hecho{display:inline-block;padding:12px 0}",
    "@media (prefers-reduced-motion:reduce){.nb-pop,.nb-cajon,.nb-cortina,.nb-panel,.nb-cajon .nb-fl,.nav .nb-grp>button svg{transition:none!important}}",
  ].join("\n");
  document.head.appendChild(css);

  // ----- Escritorio: barra principal con desplegables -----
  let abierto = null; // { btn, pop }
  const cierraPop = (enfoca) => {
    if (!abierto) return;
    const { btn, pop } = abierto;
    pop.classList.remove("abierto"); btn.setAttribute("aria-expanded", "false");
    abierto = null;
    if (enfoca) btn.focus();
  };
  const abrePop = (btn, pop) => {
    if (abierto && abierto.pop !== pop) cierraPop(false);
    pop.classList.add("abierto"); btn.setAttribute("aria-expanded", "true");
    abierto = { btn, pop };
  };
  const fino = matchMedia("(hover: hover) and (pointer: fine)");
  menu.textContent = "";
  menu.setAttribute("aria-label", "Navegación principal");
  ITEMS.forEach((it) => {
    if (!it.hijos) { const a = enlace(it); a.textContent = it.t; menu.appendChild(a); return; }
    const g = el("div", "nb-grp");
    const btn = el("button");
    btn.type = "button";
    btn.id = "nb-b-" + it.id;
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-haspopup", "true");
    btn.setAttribute("aria-controls", "nb-p-" + it.id);
    btn.append(it.t, icono("flecha", 16));
    if (catActual === it) btn.classList.add("on");
    const pop = el("div", "nb-pop");
    pop.id = "nb-p-" + it.id;
    pop.setAttribute("role", "group");
    pop.setAttribute("aria-labelledby", btn.id);
    pop.appendChild(el("span", "nb-cab", it.t));
    it.hijos.forEach((h) => { const a = enlace(h); a.append(icono(h.ic), h.t); pop.appendChild(a); });
    const links = () => [...pop.querySelectorAll("a")];
    btn.addEventListener("click", () => { if (abierto && abierto.pop === pop) cierraPop(false); else abrePop(btn, pop); });
    btn.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault(); abrePop(btn, pop);
        const ls = links(); (e.key === "ArrowDown" ? ls[0] : ls[ls.length - 1]).focus();
      }
    });
    pop.addEventListener("keydown", (e) => {
      const ls = links(), i = ls.indexOf(document.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); ls[(i + 1) % ls.length].focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); ls[(i - 1 + ls.length) % ls.length].focus(); }
      else if (e.key === "Home") { e.preventDefault(); ls[0].focus(); }
      else if (e.key === "End") { e.preventDefault(); ls[ls.length - 1].focus(); }
    });
    // Con ratón: se abre al pasar por encima (con un pequeño margen para no cerrarse al ir del botón a la lista).
    let t = null;
    g.addEventListener("mouseenter", () => { if (!fino.matches) return; clearTimeout(t); abrePop(btn, pop); });
    g.addEventListener("mouseleave", () => { if (!fino.matches) return; clearTimeout(t); t = setTimeout(() => { if (abierto && abierto.pop === pop) cierraPop(false); }, 180); });
    g.addEventListener("focusout", (e) => { if (!g.contains(e.relatedTarget) && abierto && abierto.pop === pop) cierraPop(false); });
    g.append(btn, pop);
    menu.appendChild(g);
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && abierto) { e.preventDefault(); cierraPop(true); } });
  document.addEventListener("click", (e) => { if (abierto && !abierto.btn.parentNode.contains(e.target)) cierraPop(false); });

  // Barra de la categoría en la que se está (Gran Liga · Ranking ELO · Recursos · Tutoriales, etc.).
  if (catActual) {
    const sub = el("nav", "nb-sub");
    sub.setAttribute("aria-label", catActual.t);
    const c = el("span", "nb-cat"); c.append(icono(catActual.ic, 20), catActual.t); sub.appendChild(c);
    catActual.hijos.forEach((h) => { const a = enlace(h); a.append(icono(h.ic), h.t); sub.appendChild(a); });
    cab.appendChild(sub);
    requestAnimationFrame(() => { const on = sub.querySelector("a.on"); if (on && sub.scrollWidth > sub.clientWidth) sub.scrollLeft = on.offsetLeft - 16; });
  }

  // ----- Móvil y tablet: botón del menú, barra inferior y menú lateral -----
  const hamb = el("button", "nb-hamb");
  hamb.type = "button";
  hamb.setAttribute("aria-label", "Abrir el menú");
  hamb.setAttribute("aria-expanded", "false");
  hamb.setAttribute("aria-controls", "nb-cajon");
  hamb.appendChild(icono("mas", 26));
  cab.appendChild(hamb);

  const barra = el("nav", "nb-barra");
  barra.setAttribute("aria-label", "Accesos rápidos");
  BARRA.forEach((b) => {
    const a = enlace(b);
    if (b.cat && catActual && catActual.id === b.cat) { a.classList.add("on"); if (!a.hasAttribute("aria-current")) a.setAttribute("aria-current", "true"); }
    if (b.et) a.setAttribute("aria-label", b.et);
    a.append(icono(b.ic, 26), el("span", "", b.t));
    barra.appendChild(a);
  });
  const mas = el("button");
  mas.type = "button";
  mas.setAttribute("aria-expanded", "false");
  mas.setAttribute("aria-controls", "nb-cajon");
  mas.append(icono("mas", 26), el("span", "", "Más"));
  // «Más» se marca cuando la página actual no está en la barra (Miembros, FAQ, especialista…).
  const enBarra = BARRA.some((b) => esActual(b.u) || (b.cat && catActual && catActual.id === b.cat));
  if (!enBarra && aqui !== "/") mas.classList.add("on");
  barra.appendChild(mas);

  const cortina = el("div", "nb-cortina");
  const cajon = el("div", "nb-cajon");
  cajon.id = "nb-cajon";
  cajon.setAttribute("role", "dialog");
  cajon.setAttribute("aria-modal", "true");
  cajon.setAttribute("aria-labelledby", "nb-cajon-t");
  const top = el("div", "nb-top");
  const tt = el("strong", "", "Menú"); tt.id = "nb-cajon-t";
  const x = el("button", "nb-x"); x.type = "button"; x.setAttribute("aria-label", "Cerrar el menú"); x.appendChild(icono("cerrar", 24));
  top.append(tt, x);
  const lista = el("nav", "nb-lista");
  lista.setAttribute("aria-label", "Navegación principal");
  ITEMS.forEach((it) => {
    if (!it.hijos) { const a = enlace(it); a.append(icono(it.ic, 26), it.t); lista.appendChild(a); return; }
    const acc = el("div", "nb-acc");
    const b = el("button");
    b.type = "button";
    b.id = "nb-a-" + it.id;
    b.setAttribute("aria-controls", "nb-ap-" + it.id);
    const abre = catActual === it;
    b.setAttribute("aria-expanded", String(abre));
    if (abre) b.classList.add("on");
    const fl = icono("flecha", 22); fl.classList.add("nb-fl");
    b.append(icono(it.ic, 26), it.t, fl);
    const panel = el("div", "nb-panel" + (abre ? " abierto" : ""));
    panel.id = "nb-ap-" + it.id;
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-labelledby", b.id);
    const dentro = el("div");
    it.hijos.forEach((h) => { const a = enlace(h); a.append(icono(h.ic), h.t); if (!abre) a.tabIndex = -1; dentro.appendChild(a); });
    panel.appendChild(dentro);
    b.onclick = () => {
      const si = b.getAttribute("aria-expanded") !== "true";
      b.setAttribute("aria-expanded", String(si));
      panel.classList.toggle("abierto", si);
      dentro.querySelectorAll("a").forEach((a) => { a.tabIndex = si ? 0 : -1; });
    };
    acc.append(b, panel);
    lista.appendChild(acc);
  });
  // Invitados: Inscripción y Entrar con Discord (en la cabecera del móvil no caben).
  const insc = el("a"); insc.href = "/inscripcion.html"; insc.append(icono("insc", 26), "Inscripción"); insc.hidden = true;
  if (/^\/inscripcion$/.test(aqui)) { insc.classList.add("on"); insc.setAttribute("aria-current", "page"); }
  lista.appendChild(insc);
  const pie = el("div", "nb-pie");
  const entrar = el("a", "nb-entrar"); entrar.href = "/auth/login"; entrar.append(icono("entrar", 22), "Entrar con Discord"); entrar.hidden = true;
  const idioma = el("div"); idioma.append(el("span", "nb-et", "Idioma"));
  pie.append(entrar, idioma);
  lista.appendChild(pie);
  cajon.append(top, lista);
  document.body.append(barra, cortina, cajon);

  let antes = null;
  const raiz = document.documentElement;
  const enfocables = () => [...cajon.querySelectorAll("a[href],button")].filter((e) => !e.hidden && e.tabIndex !== -1 && e.offsetParent !== null);
  function abreCajon() {
    // El selector de idioma se crea al abrir (i18n.js se carga después de este script).
    if (window.abI18n && !idioma.querySelector(".lang")) idioma.appendChild(window.abI18n.selector());
    antes = document.activeElement;
    raiz.classList.add("nb-abierto");
    hamb.setAttribute("aria-expanded", "true"); mas.setAttribute("aria-expanded", "true");
    setTimeout(() => x.focus(), 30);
  }
  function cierraCajon(volver) {
    if (!raiz.classList.contains("nb-abierto")) return;
    raiz.classList.remove("nb-abierto");
    hamb.setAttribute("aria-expanded", "false"); mas.setAttribute("aria-expanded", "false");
    if (volver && antes && antes.focus) antes.focus();
  }
  hamb.onclick = abreCajon;
  mas.onclick = abreCajon;
  x.onclick = () => cierraCajon(true);
  cortina.onclick = () => cierraCajon(true);
  // Al elegir una sección se cierra (también si es la misma página).
  cajon.addEventListener("click", (e) => { if (e.target.closest("a[href]")) cierraCajon(false); });
  cajon.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { e.preventDefault(); cierraCajon(true); return; }
    if (e.key !== "Tab") return;
    const f = enfocables(); if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  });
  // Si se pasa a escritorio con el menú abierto, se cierra; al volver atrás en el historial, también.
  matchMedia("(min-width:1024px)").addEventListener("change", (e) => { if (e.matches) cierraCajon(false); });
  window.addEventListener("pageshow", () => cierraCajon(false));

  // Para auth.js: invitados (Inscripción y Entrar en el menú lateral).
  window.abNav = {
    invitado(si) { insc.hidden = !si; entrar.hidden = !si; },
    abre: abreCajon, cierra: cierraCajon, icono,
  };
})();
