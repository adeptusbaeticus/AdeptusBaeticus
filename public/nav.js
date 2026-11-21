// Navegación común de toda la web (una sola fuente; cada página solo tiene `<nav class="menu"></nav>` y carga este
// script justo detrás, para que el menú salga sin parpadeo).
// - Escritorio (ordenador, ratón y teclado): barra principal con dos desplegables (Warhammer 40K y Juegos de especialista) que se abren
//   al pasar el ratón o al pulsar, con teclado (Enter/Espacio, flechas, Inicio/Fin, Escape) y ARIA; y, dentro de una
//   categoría, una barra secundaria con sus secciones.
// - Móvil y tablet (pantalla táctil): cabecera compacta, barra inferior fija (Inicio, Calendario, 40K, Galería, Más) y un
//   menú lateral con acordeones, idioma y, para invitados, Inscripción y Entrar. Zonas táctiles de 48 px o más.
(function () {
  // Vista según el dispositivo (no según el ancho): pantallas táctiles (móvil y tablet) → vista móvil (cabecera compacta,
  // barra inferior y menú lateral); ratón y teclado (ordenador) → vista de escritorio (barra con desplegables).
  // Clase en <html>: «ab-movil» o «ab-escritorio» (y window.abDispositivo), para que las páginas la usen también.
  const tactil = matchMedia("(hover: none) and (pointer: coarse)").matches ||
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
  window.abDispositivo = tactil ? "movil" : "escritorio";
  document.documentElement.classList.add(tactil ? "ab-movil" : "ab-escritorio");
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
    { t: "Logros", u: "/logros.html", ic: "logros" },
    { t: "Reglas y FAQ", u: "/faq.html", ic: "faq" },
    { t: "Sugerencias", u: "/sugerencias.html", ic: "sugerencias" },
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
  // ----- Medallones (dibujo propio, estilo de bronce y oro: rueda dentada, disco oscuro y emblema en relieve) -----
  // Sin águilas, marines ni otros motivos de Games Workshop. Un solo «sprite» oculto con los degradados y cada emblema
  // como <symbol>; cada icono es un <svg><use></svg> (ligero y nítido a cualquier tamaño).
  const EMBLEMAS = {
    // [trazos dorados], [rellenos dorados], [rellenos oscuros (huecos)]
    inicio: [["M18.5 46.5h27", "M20 46.5V18.5h24v28", "M24.5 46.5V34c-2.4-2.2-3-5.4-1.6-8.4 1.5-3.2 5-5.1 9.1-5.1s7.6 1.9 9.1 5.1c1.4 3 .8 6.2-1.6 8.4v12.5", "M32 46.5V35"], ["M30.6 20.6h2.8v2.6h-2.8z"], ["M29.4 41.2h1.2v1.2h-1.2zM33.4 41.2h1.2v1.2h-1.2z"]],
    calendario: [["M21 18.5h19a4 4 0 0 1 4 4V45H25a4 4 0 0 1-4-4z", "M21 41a4 4 0 0 1 4-4h19"], ["M27 23h12v10H27z"], ["M28.6 24.6h3v2.8h-3zM34.4 24.6h3v2.8h-3zM28.6 29h3v2.8h-3zM34.4 29h3v2.8h-3z"]],
    // (4.º y 5.º: rellenos que van encima, separados por un contorno oscuro, y sus huecos)
    w40k: [[], ["M16.5 16.5l4.6 1.3 20 20-3.3 3.3-20-20zM47.5 16.5l-1.3 4.6-20 20-3.3-3.3 20-20zM34.4 42.6l8.2-8.2 2 2-8.2 8.2zM29.6 42.6l-8.2-8.2-2 2 8.2 8.2zM40.4 39.6l5 5-1.8 1.8-5-5zM23.6 39.6l-5 5 1.8 1.8 5-5zM46.6 45a2 2 0 1 0 0 4 2 2 0 1 0 0-4zM17.4 45a2 2 0 1 0 0 4 2 2 0 1 0 0-4z"], [],
      ["M32 19.5c-5.6 0-9.2 3.6-9.2 8.4 0 3 1.5 5 3.4 6v4.6h11.6v-4.6c1.9-1 3.4-3 3.4-6 0-4.8-3.6-8.4-9.2-8.4z"],
      ["M28.3 25.9a2.5 2.5 0 1 0 0 5 2.5 2.5 0 1 0 0-5zM35.7 25.9a2.5 2.5 0 1 0 0 5 2.5 2.5 0 1 0 0-5zM31 32.2h2l-1 2.2zM29.3 36h1v2.4h-1zM31.5 36h1v2.4h-1zM33.7 36h1v2.4h-1z"]],
    liga: [["M32 32v6.5", "M25 21.5c-4.2-1.4-7.5-.4-8.7 3 3 .1 5.2 1.2 7.2 3.4", "M39 21.5c4.2-1.4 7.5-.4 8.7 3-3 .1-5.2 1.2-7.2 3.4"],
      ["M24.5 18.5h15v5.2a7.5 7.5 0 0 1-15 0zM26.5 45.5h11l-1.8-6.2h-7.4z"], []],
    elo: [["M19 29.5l8-6.5 6 4.5 10-9", "M38 18.5h5.5V24"], ["M19 46V37h6v9zM29 46V32h6v14zM39 46V27h6v19z"], []],
    recursos: [["M19 31c0-5 3-8.5 6.5-8.5h13c3.5 0 6.5 3.5 6.5 8.5", "M19 31h26v14H19z", "M19 37h26"], ["M29.5 34h5v6.5h-5z"], ["M31.3 36.2h1.4v2.6h-1.4z"]],
    tutoriales: [["M18 19.5h28v19H18z", "M32 38.5V44M27 45h10"], ["M29 24.2v10l8.6-5z"], []],
    esp: [[], ["M18.5 31.5h12v12h-12zM33.5 31.5h12v12h-12zM26 18h12v12H26z"],
      ["M22.4 35.4a1.4 1.4 0 1 0 0 .1zM26.6 39.6a1.4 1.4 0 1 0 0 .1zM39.5 37.5a1.5 1.5 0 1 0 0 .1zM36.6 34.6a1.3 1.3 0 1 0 0 .1zM42.4 40.4a1.3 1.3 0 1 0 0 .1zM29.4 21.4a1.3 1.3 0 1 0 0 .1zM34.6 21.4a1.3 1.3 0 1 0 0 .1zM29.4 26.6a1.3 1.3 0 1 0 0 .1zM34.6 26.6a1.3 1.3 0 1 0 0 .1z"]],
    necromunda: [["M22.5 34c0-8.5 4.3-14 9.5-14s9.5 5.5 9.5 14", "M21 39.5h22"], ["M27.5 26.5a4.6 4.6 0 1 0 0 9.2 4.6 4.6 0 1 0 0-9.2zM36.5 26.5a4.6 4.6 0 1 0 0 9.2 4.6 4.6 0 1 0 0-9.2zM28.5 36.5h7l-.8 8h-5.4zM18 38a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 1 0 0-7.2zM46 38a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 1 0 0-7.2z"], ["M27.5 28.6a2.5 2.5 0 1 0 0 5 2.5 2.5 0 1 0 0-5zM36.5 28.6a2.5 2.5 0 1 0 0 5 2.5 2.5 0 1 0 0-5zM30.2 39h3.6v1.1h-3.6zM30.2 41.2h3.6v1.1h-3.6zM18 40.3a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 1 0 0-2.6zM46 40.3a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 1 0 0-2.6z"]],
    bloodbowl: [["M45 19l3.5-3.5M19 45l-3.5 3.5"],
      ["M19.5 44.5c-2.4-12 7-24.5 25-25 1 12-8.5 23.5-25 25z"],
      ["M26.2 38.8l11.6-11.6-1-1-11.6 11.6zM29 33l2 2 .9-.9-2-2zM32 30l2 2 .9-.9-2-2zM26 36l2 2 .9-.9-2-2z"]],
    galeria: [["M18 25h28v18H18z", "M26 25l2.2-4.5h7.6L38 25"], ["M32 27.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 1 0 0-13z"], ["M32 30.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 1 0 0-7z"]],
    miembros: [["M17.5 44c.4-5 3-8 6.5-8 1.6 0 3 .6 4.1 1.7", "M46.5 44c-.4-5-3-8-6.5-8-1.6 0-3 .6-4.1 1.7"],
      ["M24 26.5a3.3 3.3 0 1 0 0 6.6 3.3 3.3 0 1 0 0-6.6zM40 26.5a3.3 3.3 0 1 0 0 6.6 3.3 3.3 0 1 0 0-6.6zM32 20.5a4 4 0 1 0 0 8 4 4 0 1 0 0-8zM24.5 45c.4-6.5 3.4-10.5 7.5-10.5s7.1 4 7.5 10.5z"], []],
    faq: [["M21 18.5h19.5a3.5 3.5 0 0 1 3.5 3.5v23.5H24.5A3.5 3.5 0 0 1 21 42z", "M21 42a3.5 3.5 0 0 1 3.5-3.5H44", "M28.6 26.4a3.6 3.6 0 1 1 5.2 3.2c-1.2.7-1.8 1.4-1.8 2.8"],
      ["M32 34.2a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 1 0 0-2.8z"], []],
    // Más: tres barras gruesas (rellenas, para que se lean bien también en pequeño y apagadas).
    mas: [[], ["M20.5 21.5h23a2 2 0 0 1 0 4h-23a2 2 0 0 1 0-4zM20.5 30h23a2 2 0 0 1 0 4h-23a2 2 0 0 1 0-4zM20.5 38.5h23a2 2 0 0 1 0 4h-23a2 2 0 0 1 0-4z"], []],
    // Sugerencias: pergamino con renglones y pluma.
    sugerencias: [["M18.5 21h17v25h-17z", "M22.5 27h9M22.5 32h9M22.5 37h6"], ["M47 15.5c-6.5 1-12.5 6-15.5 14.5l-1.3 4.6 4-2.8c7-3.2 11.3-9.3 12.8-16.3z", "M30.4 34.2l-2.6 4.6 1.2.6 2.6-4.4z"], []],
    // Logros: medalla con cinta y estrella.
    logros: [[], ["M23.5 14.5h6.5l4 10-5 2.6zM40.5 14.5H34l-4 10 5 2.6z", "M32 25a10.8 10.8 0 1 0 0 21.6 10.8 10.8 0 1 0 0-21.6z"], ["M32.00 29.60L33.59 33.82L38.09 34.02L34.57 36.83L35.76 41.18L32.00 38.70L28.24 41.18L29.43 36.83L25.91 34.02L30.41 33.82Z"]],
    // Tipos de evento del calendario: quedada (estandarte), torneo (corona de laurel con espada), partida (espadas).
    quedada: [["M23 16.5v30", "M18.5 46.5h9"], ["M24.5 18h19l-4.2 6.2 4.2 6.3h-19z", "M23 14.6a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 1 0 0-3.8z"], ["M31.2 21.4a2.8 2.8 0 1 0 0 .1zM29.6 25.6h3.2v1.4h-3.2z"]],
    torneo: [["M22.5 41c-4.6-4.6-5.4-12.4-1-18.5", "M41.5 41c4.6-4.6 5.4-12.4 1-18.5"],
      ["M32 14.5l1.5 3h-3zM30.7 17.5h2.6v15.5h-2.6zM26.5 33h11v2.6h-11zM31 35.6h2v5h-2zM32 40.6a2 2 0 1 0 0 4 2 2 0 1 0 0-4zM17.6 36.4c-1.9-1.4-2.4-3.6-1.5-5.3 1.8.9 2.6 3 1.5 5.3zM16.6 29.4c-1.4-1.9-1.2-4.1.3-5.4 1.3 1.5 1.3 3.8-.3 5.4zM19.6 22.6c-.6-2.3.4-4.3 2.3-4.9.5 1.9-.4 4-2.3 4.9zM46.4 36.4c1.9-1.4 2.4-3.6 1.5-5.3-1.8.9-2.6 3-1.5 5.3zM47.4 29.4c1.4-1.9 1.2-4.1-.3-5.4-1.3 1.5-1.3 3.8.3 5.4zM44.4 22.6c.6-2.3-.4-4.3-2.3-4.9-.5 1.9.4 4 2.3 4.9zM21.5 42.6c-2.3.4-4.3-.6-4.8-2.5 1.9-.5 4 .5 4.8 2.5zM42.5 42.6c2.3.4 4.3-.6 4.8-2.5-1.9-.5-4 .5-4.8 2.5z"], []],
    partida: [[], ["M16.5 16.5l4.6 1.3 20 20-3.3 3.3-20-20zM47.5 16.5l-1.3 4.6-20 20-3.3-3.3 20-20zM34.4 42.6l8.2-8.2 2 2-8.2 8.2zM29.6 42.6l-8.2-8.2-2 2 8.2 8.2zM40.4 39.6l5 5-1.8 1.8-5-5zM23.6 39.6l-5 5 1.8 1.8 5-5zM46.6 45a2 2 0 1 0 0 4 2 2 0 1 0 0-4zM17.4 45a2 2 0 1 0 0 4 2 2 0 1 0 0-4z"], []],
    insc: [["M17.5 45c.5-6 3.8-9.5 8.5-9.5 2.4 0 4.4.9 5.9 2.6", "M41 31v12M35 37h12"], ["M26 22.5a5 5 0 1 0 0 10 5 5 0 1 0 0-10z"], []],
  };
  let spriteListo = false;
  function sprite() {
    if (spriteListo) return;
    spriteListo = true;
    const s = document.createElementNS(NS, "svg");
    s.setAttribute("aria-hidden", "true"); s.setAttribute("focusable", "false");
    s.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
    const defs = document.createElementNS(NS, "defs");
    const grad = (id, tipo, attrs, paradas) => {
      const g = document.createElementNS(NS, tipo); g.id = id;
      Object.entries(attrs).forEach(([k, v]) => g.setAttribute(k, v));
      paradas.forEach(([o, c]) => { const st = document.createElementNS(NS, "stop"); st.setAttribute("offset", o); st.setAttribute("stop-color", c); g.appendChild(st); });
      defs.appendChild(g);
    };
    grad("abi-oro", "linearGradient", { x1: "0", y1: "0", x2: "0", y2: "1" }, [["0", "#FBF6E8"], ["0.45", "#DCD8C2"], ["1", "#8F8A76"]]); // emblema en hueso
    grad("abi-bronce", "linearGradient", { x1: "0", y1: "0", x2: "1", y2: "1" }, [["0", "#C9A256"], ["0.5", "#7A5A26"], ["1", "#4A3515"]]);
    grad("abi-disco", "radialGradient", { cx: "0.5", cy: "0.4", r: "0.65" }, [["0", "#3A3A33"], ["1", "#141518"]]);
    s.appendChild(defs);
    // Rueda dentada (12 dientes) como marco común.
    let rueda = "";
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2, d = Math.PI / 12;
      const p = (r, t) => (32 + r * Math.cos(t)).toFixed(2) + " " + (32 + r * Math.sin(t)).toFixed(2);
      rueda += (i ? "L" : "M") + p(27.5, a - d * 0.75) + "L" + p(31, a - d * 0.45) + "L" + p(31, a + d * 0.45) + "L" + p(27.5, a + d * 0.75);
    }
    rueda += "Z";
    const nuevo = (tag, attrs) => { const x = document.createElementNS(NS, tag); Object.entries(attrs).forEach(([k, v]) => x.setAttribute(k, v)); return x; };
    Object.entries(EMBLEMAS).forEach(([n, [trazos, rellenos, huecos, encima, huecos2]]) => {
      const sym = nuevo("symbol", { id: "abi-" + n, viewBox: "0 0 64 64" });
      sym.appendChild(nuevo("path", { d: rueda, fill: "url(#abi-bronce)", stroke: "#2A1E0C", "stroke-width": "1.2", "stroke-linejoin": "round" }));
      sym.appendChild(nuevo("circle", { cx: 32, cy: 32, r: 25.5, fill: "none", stroke: "#B08A45", "stroke-width": "1.2", opacity: ".8" }));
      sym.appendChild(nuevo("circle", { cx: 32, cy: 32, r: 24, fill: "url(#abi-disco)", stroke: "#2A1E0C", "stroke-width": "1" }));
      // Relieve: sombra oscura desplazada y, encima, el oro.
      const capa = (dy, color, op) => {
        const g = nuevo("g", { transform: "translate(0 " + dy + ")", opacity: op });
        trazos.forEach((d) => g.appendChild(nuevo("path", { d, fill: "none", stroke: color, "stroke-width": "3", "stroke-linecap": "round", "stroke-linejoin": "round" })));
        rellenos.forEach((d) => g.appendChild(nuevo("path", { d, fill: color, stroke: color === "#000" ? "#000" : "#4A473C", "stroke-width": "0.8", "stroke-linejoin": "round" })));
        return g;
      };
      sym.appendChild(capa(1.4, "#000", ".6"));
      sym.appendChild(capa(0, "url(#abi-oro)", "1"));
      huecos.forEach((d) => sym.appendChild(nuevo("path", { d, fill: "#17171A" })));
      if (encima) {
        encima.forEach((d) => sym.appendChild(nuevo("path", { d, fill: "#17171A", stroke: "#17171A", "stroke-width": "3.2", "stroke-linejoin": "round" })));
        const g = nuevo("g", {});
        encima.forEach((d) => { g.appendChild(nuevo("path", { d, fill: "#000", opacity: ".6", transform: "translate(0 1.2)" })); g.appendChild(nuevo("path", { d, fill: "url(#abi-oro)", stroke: "#4A473C", "stroke-width": "0.8", "stroke-linejoin": "round" })); });
        sym.appendChild(g);
        (huecos2 || []).forEach((d) => sym.appendChild(nuevo("path", { d, fill: "#17171A" })));
      }
      s.appendChild(sym);
    });
    (document.body || document.documentElement).appendChild(s);
  }
  const medalla = (n, tam) => {
    sprite();
    const s = document.createElementNS(NS, "svg");
    s.setAttribute("viewBox", "0 0 64 64"); s.setAttribute("width", tam || 32); s.setAttribute("height", tam || 32);
    s.setAttribute("aria-hidden", "true"); s.setAttribute("focusable", "false"); s.setAttribute("class", "md");
    const u = document.createElementNS(NS, "use"); u.setAttribute("href", "#abi-" + (EMBLEMAS[n] ? n : "mas"));
    s.appendChild(u);
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
    ".nav .brand{order:1}.nav #auth{order:2;margin-left:auto}",
    ".nav nav.menu{order:4;flex-basis:100%;display:flex;flex-wrap:wrap;align-items:stretch;gap:4px 26px;margin-top:10px;font-size:16px}",
    ".nav nav.menu>a,.nav .nb-grp>button{display:inline-flex;align-items:center;gap:6px;min-height:48px;box-sizing:border-box;padding:0;color:#ECE7DC;text-decoration:none;font:500 16px Inter,system-ui,sans-serif;background:none;border:0;border-bottom:2px solid transparent;cursor:pointer}",
    ".nav nav.menu>a:hover,.nav .nb-grp>button:hover,.nav nav.menu>a.on,.nav .nb-grp>button.on{border-bottom-color:#D9B25A;color:#ECE7DC}",
    ".nav .nb-grp>button.on{color:#F0CE82}",
    ".nav .nb-grp>button svg{transition:transform .2s;color:#DCD8C2}.nav .nb-grp>button[aria-expanded=true] svg{transform:rotate(180deg)}",
    ".nav nav.menu a:focus-visible,.nav .nb-grp>button:focus-visible,.nb-sub a:focus-visible{outline:2px solid #D9B25A;outline-offset:3px;border-radius:4px}",
    ".nb-grp{position:relative;display:inline-flex}",
    ".nb-pop{position:absolute;left:-14px;top:100%;min-width:250px;background:#1F2328;border:1px solid #6B6558;border-radius:12px;box-shadow:0 12px 32px rgba(0,0,0,.55);padding:8px;z-index:65;opacity:0;transform:translateY(-6px);visibility:hidden;transition:opacity .15s,transform .15s,visibility 0s .15s}",
    ".nb-pop.abierto{opacity:1;transform:none;visibility:visible;transition:opacity .15s,transform .15s}",
    ".nb-pop a{display:flex;align-items:center;gap:12px;min-height:52px;padding:0 12px;border-radius:8px;color:#ECE7DC;text-decoration:none;font-weight:500}",
    ".nb-pop a svg{color:#D9B25A;flex:none}",
    ".nb-pop a:hover,.nb-pop a:focus{background:#2A2F36;color:#F0CE82;outline:none}",
    ".nb-pop a.on{background:#2A2618;color:#F0CE82;box-shadow:inset 3px 0 0 #D9B25A}",
    ".nb-pop .nb-cab{display:block;padding:6px 12px 4px;font:600 12px Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#A8A293}",
    // Barra de la categoría
    ".nb-sub{order:5;flex-basis:100%;display:flex;align-items:center;gap:6px;overflow-x:auto;scrollbar-width:none;border-top:1px solid #2C3036;margin-top:0;padding:6px 0}",
    ".nb-sub::-webkit-scrollbar{display:none}",
    ".nb-sub .nb-cat{display:inline-flex;align-items:center;gap:8px;font:700 14px Cinzel,Georgia,serif;letter-spacing:.06em;color:#D9B25A;margin-right:10px;white-space:nowrap}",
    ".nb-sub a{display:inline-flex;align-items:center;gap:8px;min-height:40px;padding:0 14px;border-radius:999px;color:#CFC9BA;text-decoration:none;font-weight:500;font-size:15px;white-space:nowrap;border:1px solid transparent}",
    ".nb-sub a svg.md{width:26px;height:26px;margin-left:-8px}",
    ".nb-sub a:hover{color:#F0CE82;border-color:#6B6558}",
    ".nb-sub a.on{background:#2A2618;color:#F0CE82;border-color:#D9B25A}",
    // Botón del menú lateral, barra inferior y menú lateral (solo móvil y tablet)
    ".nb-barra,.nb-cortina,.nb-cajon{display:none}",
    "html.ab-movil{scroll-padding-top:76px}",
    "html.ab-movil .nav{flex-wrap:wrap;gap:8px;padding:8px 0;min-height:60px;box-sizing:border-box}",
    "html.ab-movil .nav nav.menu{display:none}",
    "html.ab-movil .nav .brand{font-size:15px;line-height:1.15;letter-spacing:.04em;gap:10px;min-width:0;flex:0 1 auto;max-width:170px;margin-right:auto}",
    "html.ab-movil .nav #auth{margin-left:0}",
    "html.ab-movil .nav .brand .lg{height:40px}",
    "html.ab-movil .nav #auth{display:flex;align-items:center;gap:2px;min-width:0}",
    "html.ab-movil .nav #auth .lang{display:none}",
    "html.ab-movil .nav #auth .um-btn{padding:4px;gap:0;min-width:48px;min-height:48px;justify-content:center}",
    "html.ab-movil .nav #auth .um-btn>:not(img){position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}",
    "html.ab-movil .nav #auth .um-btn img{width:34px;height:34px}",
    "html.ab-movil .nav #auth>a[href='/auth/login']{display:none!important}",
    "html.ab-movil .nb-barra a:focus-visible,html.ab-movil .nb-barra button:focus-visible,html.ab-movil .nb-cajon a:focus-visible,html.ab-movil .nb-cajon button:focus-visible{outline:2px solid #D9B25A;outline-offset:2px}",
    "html.ab-movil .nb-sub{order:5;margin:4px 0 -8px;padding:6px 0 8px}",
    "html.ab-movil .nb-sub .nb-cat{display:none}",
    "html.ab-movil .nb-sub a{min-height:44px;font-size:14px;padding:0 14px}",
    "html.ab-movil body{padding-bottom:calc(76px + env(safe-area-inset-bottom))}",
    "html.ab-movil .nb-barra{display:grid;grid-template-columns:repeat(5,1fr);position:fixed;left:0;right:0;bottom:0;z-index:45;background:rgba(21,23,26,.97);border-top:1px solid #2C3036;padding:4px 4px calc(4px + env(safe-area-inset-bottom));box-shadow:0 -6px 18px rgba(0,0,0,.35)}",
    "html.ab-movil .nb-barra a,html.ab-movil .nb-barra button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-height:60px;padding:4px 2px;border-radius:12px;color:#A8A293;text-decoration:none;font:500 12px/1.1 Inter,system-ui,sans-serif;background:none;border:0;cursor:pointer;-webkit-tap-highlight-color:transparent}",
    "html.ab-movil .nb-barra svg{width:34px;height:34px;transition:filter .2s,opacity .2s}",
    "html.ab-movil .nb-barra a:not(.on) svg,html.ab-movil .nb-barra button:not(.on) svg{filter:saturate(.7) brightness(.95)}",
    "html.ab-movil .nb-barra .on{color:#F0CE82}",
    "html.ab-movil .nb-barra .on svg{color:#D9B25A}",
    "html.ab-movil .nb-barra .on::after{content:'';width:18px;height:3px;border-radius:2px;background:#D9B25A;margin-top:1px}",
    "html.ab-movil .nb-barra a:active,html.ab-movil .nb-barra button:active{background:#1F2328}",
    "html.ab-movil .nb-cortina{display:block;position:fixed;inset:0;z-index:70;background:rgba(0,0,0,.6);opacity:0;visibility:hidden;transition:opacity .25s,visibility 0s .25s}",
    "html.ab-movil .nb-cajon{display:flex;flex-direction:column;position:fixed;top:0;right:0;bottom:0;z-index:71;width:min(400px,88vw);background:#15171A;border-left:1px solid #2C3036;box-shadow:-12px 0 32px rgba(0,0,0,.5);transform:translateX(100%);visibility:hidden;transition:transform .28s cubic-bezier(.2,.8,.2,1),visibility 0s .28s}",
    "html.ab-movil.nb-abierto .nb-cortina{opacity:1;visibility:visible;transition:opacity .25s}",
    "html.ab-movil.nb-abierto .nb-cajon{transform:none;visibility:visible;transition:transform .28s cubic-bezier(.2,.8,.2,1)}",
    "html.ab-movil.nb-abierto,html.ab-movil.nb-abierto body{overflow:hidden}",
    "html.ab-escritorio .nb-cajon,html.ab-escritorio .nb-cortina,html.ab-escritorio .nb-barra{display:none!important}",
    ".nb-cajon .nb-top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px 10px 20px;border-bottom:1px solid #2C3036}",
    ".nb-cajon .nb-top strong{font:700 18px Cinzel,Georgia,serif;letter-spacing:.06em;color:#ECE7DC}",
    ".nb-cajon .nb-x{display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:none;border:1px solid #2C3036;border-radius:12px;color:#ECE7DC;cursor:pointer}",
    ".nb-cajon .nb-lista{flex:1;overflow-y:auto;overscroll-behavior:contain;padding:10px 12px 24px}",
    ".nb-cajon .nb-lista>a,.nb-cajon .nb-acc>button{display:flex;align-items:center;gap:14px;width:100%;min-height:56px;padding:0 14px;box-sizing:border-box;border-radius:12px;color:#ECE7DC;text-decoration:none;font:500 17px Inter,system-ui,sans-serif;background:none;border:0;cursor:pointer;text-align:left}",
    ".nb-cajon svg{flex:none;color:#D9B25A}",
    ".nb-cajon .nb-lista>a+a,.nb-cajon .nb-lista>*+.nb-acc,.nb-cajon .nb-acc+a{margin-top:2px}",
    ".nb-cajon .nb-lista>a:active,.nb-cajon .nb-acc>button:active{background:#1F2328}",
    ".nb-cajon .nb-lista>a.on,.nb-cajon .nb-acc>button.on{background:#2A2618;color:#F0CE82}",
    ".nb-cajon .nb-acc>button .nb-fl{margin-left:auto;transition:transform .25s;color:#DCD8C2}",
    ".nb-cajon .nb-acc>button[aria-expanded=true] .nb-fl{transform:rotate(180deg)}",
    ".nb-cajon .nb-panel{display:grid;grid-template-rows:0fr;transition:grid-template-rows .25s ease}",
    ".nb-cajon .nb-panel.abierto{grid-template-rows:1fr}",
    ".nb-cajon .nb-panel>div{overflow:hidden;padding-left:22px}",
    ".nb-cajon .nb-panel a{display:flex;align-items:center;gap:12px;min-height:52px;margin:2px 0;padding:0 14px;border-radius:10px;border-left:2px solid #2C3036;color:#CFC9BA;text-decoration:none;font-size:16px}",
    ".nb-cajon .nb-panel a svg{width:34px;height:34px}",
    ".nb-cajon .nb-lista>a,.nb-cajon .nb-acc>button{min-height:60px}",
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
    it.hijos.forEach((h) => { const a = enlace(h); a.append(medalla(h.ic, 34), h.t); pop.appendChild(a); });
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
    const c = el("span", "nb-cat"); c.append(medalla(catActual.ic, 28), catActual.t); sub.appendChild(c);
    catActual.hijos.forEach((h) => { const a = enlace(h); a.append(medalla(h.ic, 26), h.t); sub.appendChild(a); });
    cab.appendChild(sub);
    requestAnimationFrame(() => { const on = sub.querySelector("a.on"); if (on && sub.scrollWidth > sub.clientWidth) sub.scrollLeft = on.offsetLeft - 16; });
  }

  // ----- Móvil y tablet: botón del menú, barra inferior y menú lateral -----


  const barra = el("nav", "nb-barra");
  barra.setAttribute("aria-label", "Accesos rápidos");
  BARRA.forEach((b) => {
    const a = enlace(b);
    if (b.cat && catActual && catActual.id === b.cat) { a.classList.add("on"); if (!a.hasAttribute("aria-current")) a.setAttribute("aria-current", "true"); }
    if (b.et) a.setAttribute("aria-label", b.et);
    a.append(medalla(b.ic, 34), el("span", "", b.t));
    barra.appendChild(a);
  });
  const mas = el("button");
  mas.type = "button";
  mas.setAttribute("aria-expanded", "false");
  mas.setAttribute("aria-controls", "nb-cajon");
  mas.append(medalla("mas", 34), el("span", "", "Más"));
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
    if (!it.hijos) { const a = enlace(it); a.append(medalla(it.ic, 40), it.t); lista.appendChild(a); return; }
    const acc = el("div", "nb-acc");
    const b = el("button");
    b.type = "button";
    b.id = "nb-a-" + it.id;
    b.setAttribute("aria-controls", "nb-ap-" + it.id);
    const abre = catActual === it;
    b.setAttribute("aria-expanded", String(abre));
    if (abre) b.classList.add("on");
    const fl = icono("flecha", 22); fl.classList.add("nb-fl");
    b.append(medalla(it.ic, 40), it.t, fl);
    const panel = el("div", "nb-panel" + (abre ? " abierto" : ""));
    panel.id = "nb-ap-" + it.id;
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-labelledby", b.id);
    const dentro = el("div");
    it.hijos.forEach((h) => { const a = enlace(h); a.append(medalla(h.ic, 34), h.t); if (!abre) a.tabIndex = -1; dentro.appendChild(a); });
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
  const insc = el("a"); insc.href = "/inscripcion.html"; insc.append(medalla("insc", 40), "Inscripción"); insc.hidden = true;
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
    mas.setAttribute("aria-expanded", "true");
    setTimeout(() => x.focus(), 30);
  }
  function cierraCajon(volver) {
    if (!raiz.classList.contains("nb-abierto")) return;
    raiz.classList.remove("nb-abierto");
    mas.setAttribute("aria-expanded", "false");
    if (volver && antes && antes.focus) antes.focus();
  }
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
    window.addEventListener("pageshow", () => cierraCajon(false));

  // Para auth.js: invitados (Inscripción y Entrar en el menú lateral).
  window.abNav = {
    invitado(si) { insc.hidden = !si; entrar.hidden = !si; },
    abre: abreCajon, cierra: cierraCajon, icono, medalla,
  };
})();
