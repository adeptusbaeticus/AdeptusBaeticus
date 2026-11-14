// Efectos de Navidad (los activa y quita el admin en Admin; iguales para todos):
// - nieve ligera cayendo (un lienzo fijo que no recibe clics; se para con la pestaña oculta y no sale con «reducir
//   movimiento»);
// - nieve acumulada encima de las tarjetas (entradas del blog, publicaciones de la galería, fichas de miembros…);
// - una tira de luces bajo el menú principal en los colores del Emperador (dorado) y de los cuatro dioses del Caos;
// - del 1 al 7 de enero (hora de Madrid, desde la medianoche de Nochevieja), un cartel «¡Feliz año AAAA!» colgado de
//   las luces (se comprueba cada minuto, así que aparece solo a medianoche aunque la página esté abierta).
// Todo es decorativo: aria-hidden y sin eventos de ratón. Uso: window.abNavidad.aplica(true | false).
(function () {
  if (window.abNavidad) return;
  const NS = "http://www.w3.org/2000/svg";
  // Tarjetas con nieve encima: blog, galería, miembros, tarjetas, encuestas de Inicio, rondas de la liga, eventos del
  // calendario (lista y agenda; los del mes, con una capa fina), desplegables de la FAQ y el reglamento.
  const TARJETAS = ".slide, .marco, .mb, .card, .enc-i, details.ronda, .li, .ag-i, .e, details.q, .reg";
  const FINAS = ".e";
  // Dorado del Emperador y los cuatro dioses del Caos (rojo, verde, azul y morado: excepción a «nunca azul»).
  const LUCES = ["#F2C14E", "#E0352B", "#6DBE3A", "#4C7DF0", "#B04ADF"];
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  let activo = false, cv = null, raf = 0, copos = [], ultimo = 0, mo = null, ro = null, tira = null, pend = 0;

  const css = document.createElement("style");
  css.textContent =
    ".abn-nieve{position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:35}" +
    ".abn-cap{position:absolute;left:-4px;right:-4px;top:-11px;height:20px;pointer-events:none;z-index:3;line-height:0}" +
    ".marco>.abn-cap{z-index:1;left:1px;right:1px}" + // galería: bajo los sellos (z-index 2), sin sobresalir
    ".abn-cap.fina{left:-2px;right:-2px;top:-5px;height:9px}" +
    ".abn-cap svg{display:block;width:100%;height:100%;filter:drop-shadow(0 2px 2px rgba(0,0,0,.35))}" +
    ".abn-luces{position:absolute;left:0;right:0;bottom:-11px;height:24px;pointer-events:none;z-index:1;line-height:0}" +
    ".abn-luces svg{display:block;width:100%;height:100%;overflow:visible}" +
    ".abn-b{animation:abn-brillo 2.8s ease-in-out infinite}" +
    "@keyframes abn-brillo{0%,100%{opacity:1}50%{opacity:.4}}" +
    "@media (prefers-reduced-motion:reduce){.abn-b{animation:none}}" +
    ".abn-feliz{position:absolute;left:50%;bottom:-24px;transform:translateX(-50%);z-index:2;pointer-events:none;white-space:nowrap;" +
    "padding:5px 16px 6px;border-radius:999px;border:1px solid #D9B25A;background:linear-gradient(#2A2418,#15171A);color:#F0CE82;" +
    "font:700 15px/1.2 Cinzel,Georgia,serif;letter-spacing:.04em;box-shadow:0 0 14px rgba(217,178,90,.45),0 4px 10px rgba(0,0,0,.6);" +
    "text-shadow:0 0 8px rgba(240,206,130,.6);animation:abn-feliz 3s ease-in-out infinite}" +
    "@keyframes abn-feliz{0%,100%{box-shadow:0 0 10px rgba(217,178,90,.35),0 4px 10px rgba(0,0,0,.6)}50%{box-shadow:0 0 22px rgba(217,178,90,.7),0 4px 10px rgba(0,0,0,.6)}}" +
    "@media (max-width:600px){.abn-feliz{font-size:13px;bottom:-22px}}" +
    "@media (prefers-reduced-motion:reduce){.abn-feliz{animation:none}}";

  const svg = (w, h, attrs) => {
    const s = document.createElementNS(NS, "svg");
    s.setAttribute("viewBox", "0 0 " + w + " " + h);
    s.setAttribute("aria-hidden", "true");
    for (const k in attrs || {}) s.setAttribute(k, attrs[k]);
    return s;
  };
  const add = (padre, tag, at) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); padre.appendChild(e); return e; };
  const uid = () => "n" + Math.random().toString(36).slice(2, 8);

  // ===== Nieve cayendo =====
  function nuevoCopo(w, h, arriba) {
    const r = 0.8 + Math.random() * 1.9;
    return { x: Math.random() * w, y: arriba ? -5 - Math.random() * 40 : Math.random() * h, r, vy: 14 + r * 11 + Math.random() * 8,
      f: Math.random() * 6.28, a: 6 + Math.random() * 14, vf: 0.4 + Math.random() * 0.7, o: 0.35 + Math.random() * 0.5 };
  }
  function ajustaLienzo() {
    if (!cv) return;
    const d = Math.min(window.devicePixelRatio || 1, 2), w = innerWidth, h = innerHeight;
    cv.width = Math.round(w * d); cv.height = Math.round(h * d);
    cv.getContext("2d").setTransform(d, 0, 0, d, 0, 0);
    const n = Math.max(18, Math.min(70, Math.round((w * h) / 24000)));
    while (copos.length < n) copos.push(nuevoCopo(w, h, false));
    copos.length = n;
  }
  function paso(t) {
    raf = 0;
    if (!cv || document.hidden) return;
    const dt = Math.min(0.05, ultimo ? (t - ultimo) / 1000 : 0.016);
    ultimo = t;
    const c = cv.getContext("2d"), w = innerWidth, h = innerHeight;
    c.clearRect(0, 0, w, h);
    for (const k of copos) {
      k.y += k.vy * dt; k.f += k.vf * dt;
      if (k.y > h + 5) Object.assign(k, nuevoCopo(w, h, true));
      const x = k.x + Math.sin(k.f) * k.a;
      c.globalAlpha = k.o;
      c.fillStyle = "#FFFFFF";
      c.beginPath(); c.arc(x, k.y, k.r, 0, 6.2832); c.fill();
    }
    raf = requestAnimationFrame(paso);
  }
  const sigue = () => { if (cv && !raf && !document.hidden) { ultimo = 0; raf = requestAnimationFrame(paso); } };
  function nieve(si) {
    if (si && !cv && !reduce.matches) {
      cv = document.createElement("canvas");
      cv.className = "abn-nieve";
      cv.setAttribute("aria-hidden", "true");
      document.body.appendChild(cv);
      ajustaLienzo();
      sigue();
    } else if (!si && cv) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0; cv.remove(); cv = null; copos = [];
    }
  }

  // ===== Nieve acumulada encima de las tarjetas =====
  function capa() {
    const s = svg(200, 20, { preserveAspectRatio: "none" });
    const g = uid();
    const gr = add(add(s, "defs", {}), "linearGradient", { id: g, x1: "0", y1: "0", x2: "0", y2: "1" });
    add(gr, "stop", { offset: "0", "stop-color": "#FFFFFF" });
    add(gr, "stop", { offset: ".7", "stop-color": "#F1EFEA" });
    add(gr, "stop", { offset: "1", "stop-color": "#D6D3CB" });
    // Borde de arriba: montoncitos irregulares; borde de abajo: casi recto, con algún goterón.
    let d = "M0 13", x = 0;
    while (x < 200) {
      const a = 9 + Math.random() * 16, nx = Math.min(200, x + a), y = 1 + Math.random() * 6;
      d += " Q" + (x + a / 2).toFixed(1) + " " + y.toFixed(1) + " " + nx.toFixed(1) + " " + (7 + Math.random() * 3).toFixed(1);
      x = nx;
    }
    d += " L200 14";
    x = 200;
    while (x > 0) {
      const a = 8 + Math.random() * 22, nx = Math.max(0, x - a);
      d += Math.random() < 0.35
        ? " Q" + (x - a / 2).toFixed(1) + " " + (16 + Math.random() * 4).toFixed(1) + " " + nx.toFixed(1) + " 14"
        : " L" + nx.toFixed(1) + " " + (13.5 + Math.random()).toFixed(1);
      x = nx;
    }
    add(s, "path", { d: d + " Z", fill: "url(#" + g + ")" });
    const w = document.createElement("span");
    w.className = "abn-cap";
    w.setAttribute("aria-hidden", "true");
    w.appendChild(s);
    return w;
  }
  function nevar() {
    pend = 0;
    if (!activo) return;
    document.querySelectorAll(TARJETAS).forEach((t) => {
      if (t.closest("dialog, .abf, [hidden]")) return;
      // En un desplegable la nieve va en su cabecera (lo de dentro se oculta al cerrarlo).
      const el = t.tagName === "DETAILS" ? t.querySelector(":scope > summary") : t;
      if (!el || el.querySelector(":scope > .abn-cap")) return;
      if (getComputedStyle(el).position === "static") { el.style.position = "relative"; el.dataset.abnPos = "1"; }
      const c = capa();
      if (t.matches(FINAS)) c.classList.add("fina");
      el.appendChild(c);
    });
  }
  const programa = () => { if (!pend) pend = requestAnimationFrame(nevar); };
  function quitaNieveTarjetas() {
    document.querySelectorAll(".abn-cap").forEach((c) => c.remove());
    document.querySelectorAll("[data-abn-pos]").forEach((el) => { el.style.position = ""; delete el.dataset.abnPos; });
  }

  // ===== Luces bajo el menú principal =====
  function pintaLuces() {
    if (!tira) return;
    const W = Math.max(100, Math.round(tira.clientWidth)), H = 24, s = svg(W, H);
    const defs = add(s, "defs", {});
    const ids = LUCES.map((c) => {
      const id = uid(), g = add(defs, "radialGradient", { id, cx: "50%", cy: "45%", r: "50%" });
      add(g, "stop", { offset: "0", "stop-color": c, "stop-opacity": ".75" });
      add(g, "stop", { offset: "1", "stop-color": c, "stop-opacity": "0" });
      return id;
    });
    // Cable con comba entre ganchos; dos bombillas por tramo.
    const tramo = W < 600 ? 70 : 96, n = Math.max(2, Math.round(W / tramo)), paso = W / n;
    let d = "M0 3", k = 0;
    const bombillas = [];
    for (let i = 0; i < n; i++) {
      const x0 = i * paso, x1 = x0 + paso, cx = x0 + paso / 2, cy = 15;
      d += " Q" + cx.toFixed(1) + " " + cy + " " + x1.toFixed(1) + " 3";
      for (const t of [0.3, 0.7]) {
        const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1, y = (1 - t) * (1 - t) * 3 + 2 * (1 - t) * t * cy + t * t * 3;
        bombillas.push([x, y, k++ % LUCES.length]);
      }
    }
    add(s, "path", { d, fill: "none", stroke: "#0E1012", "stroke-width": "1.4" });
    for (const [x, y, c] of bombillas) {
      const g = add(s, "g", {});
      add(g, "rect", { x: (x - 1.6).toFixed(1), y: (y - 0.5).toFixed(1), width: "3.2", height: "3", rx: ".6", fill: "#2B2E33" });
      const luz = add(g, "g", { class: "abn-b", style: "animation-delay:-" + (Math.random() * 2.8).toFixed(2) + "s" });
      add(luz, "circle", { cx: x.toFixed(1), cy: (y + 6).toFixed(1), r: "8", fill: "url(#" + ids[c] + ")" });
      add(luz, "ellipse", { cx: x.toFixed(1), cy: (y + 5.6).toFixed(1), rx: "2.6", ry: "3.7", fill: LUCES[c] });
      add(luz, "ellipse", { cx: (x - 0.8).toFixed(1), cy: (y + 4.5).toFixed(1), rx: ".7", ry: "1.2", fill: "#FFFFFF", opacity: ".7" });
    }
    tira.textContent = "";
    tira.appendChild(s);
  }
  function luces(si) {
    const nav = document.querySelector(".nav");
    if (si && nav && !tira) {
      if (getComputedStyle(nav).position === "static") { nav.style.position = "relative"; nav.dataset.abnPos = "1"; }
      tira = document.createElement("span");
      tira.className = "abn-luces";
      tira.setAttribute("aria-hidden", "true");
      nav.appendChild(tira);
      pintaLuces();
    } else if (!si && tira) { tira.remove(); tira = null; }
  }

  // ===== Año nuevo: del 1 al 7 de enero en Madrid =====
  let feliz = null, relojAnio = 0;
  function anioNuevo() {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", year: "numeric", month: "numeric", day: "numeric" })
      .formatToParts(new Date()).map((x) => [x.type, x.value]));
    const toca = activo && +p.month === 1 && +p.day <= 7, nav = document.querySelector(".nav");
    if (toca && nav && !feliz) {
      if (getComputedStyle(nav).position === "static") { nav.style.position = "relative"; nav.dataset.abnPos = "1"; }
      feliz = document.createElement("span");
      feliz.className = "abn-feliz";
      feliz.setAttribute("role", "status");
      nav.appendChild(feliz);
    }
    // Solo se escribe al cambiar el año (así no pisa la traducción al inglés).
    if (toca && feliz && feliz.dataset.anio !== p.year) { feliz.dataset.anio = p.year; feliz.textContent = "¡Feliz año " + p.year + "!"; }
    if (!toca && feliz) { feliz.remove(); feliz = null; }
  }

  let espera = 0;
  const alCambiarTamano = () => { clearTimeout(espera); espera = setTimeout(() => { ajustaLienzo(); pintaLuces(); }, 150); };

  function aplica(si) {
    si = !!si;
    if (si === activo) return;
    activo = si;
    if (si) {
      if (!css.isConnected) document.head.appendChild(css);
      nieve(true); luces(true); nevar(); anioNuevo();
      relojAnio = setInterval(anioNuevo, 60000);
      mo = new MutationObserver((ms) => { if (ms.some((m) => [...m.addedNodes].some((n) => n.nodeType === 1 && !n.classList.contains("abn-cap")))) programa(); });
      mo.observe(document.body, { childList: true, subtree: true });
      window.addEventListener("resize", alCambiarTamano);
      document.addEventListener("visibilitychange", sigue);
    } else {
      if (mo) mo.disconnect();
      mo = null;
      window.removeEventListener("resize", alCambiarTamano);
      document.removeEventListener("visibilitychange", sigue);
      clearInterval(relojAnio);
      nieve(false); luces(false); quitaNieveTarjetas(); anioNuevo();
    }
  }
  // Con «reducir movimiento» no cae nieve (la acumulada y las luces quietas sí se quedan).
  reduce.addEventListener && reduce.addEventListener("change", () => { if (activo) { nieve(false); nieve(true); } });
  window.abNavidad = { aplica };
})();
