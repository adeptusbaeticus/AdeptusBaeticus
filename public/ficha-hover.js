// Ficha rápida de un socio al pasar el ratón por su nombre (Galería, Gran Liga…): avatar, rol, facciones, puesto en
// la liga, ELO y trofeos, con un enlace a su ficha completa en Miembros. En el móvil se abre al tocar el nombre.
// Uso: window.abFicha(elemento, discordId). Los datos salen de /api/miembros (una petición, guardada 5 minutos).
// Si el jugador no tiene cuenta en la web (discordId vacío) o ya no está en Miembros, sale una ficha «REDACTED» con un
// sello inquisitorial (dibujo propio: columna en «I» con calavera, sobre lacre).
(function () {
  const ROL = { admin: "Admin", miembro: "Miembro", aspirante: "Aspirante" };
  const CLAVE = "ab_fichas";
  let datos = null, pidiendo = null;
  const el = (tag, cls, txt) => { const x = document.createElement(tag); if (cls) x.className = cls; if (txt != null) x.textContent = txt; return x; };

  const css = el("style");
  css.textContent = `
.abf-n{cursor:pointer;text-decoration:underline dotted rgba(217,178,90,.6);text-underline-offset:3px}
.abf-n:focus-visible{outline:2px solid #D9B25A;outline-offset:2px;border-radius:3px}
.abf{position:absolute;z-index:60;width:300px;max-width:calc(100vw - 24px);box-sizing:border-box;background:#1F2328;border:1px solid #6B5A2E;border-radius:12px;padding:14px;color:#ECE7DC;font:400 14px/1.4 Inter,system-ui,sans-serif;box-shadow:0 12px 32px rgba(0,0,0,.5);text-align:left}
.abf-cab{display:flex;gap:12px;align-items:center}
.abf-lau{position:relative;display:inline-flex;flex:none;margin:8px}
.abf-lau .laurel{position:absolute;left:-17%;top:-17%;width:134%;height:134%;pointer-events:none;overflow:visible}
.abf-cab>div:nth-child(2){flex:1;min-width:0}
.abf-tro{display:flex;flex-wrap:wrap;gap:6px 12px;margin-left:auto;justify-content:flex-end;align-items:flex-end}
.abf-tro .pila{position:relative;display:inline-block;flex:none}
.abf-tro .pila .copa{position:absolute}
.abf-tro .copa{width:28px;height:32px}
.abf-tro .copa.p1{color:#E8C25A}.abf-tro .copa.p2{color:#C9CED6}.abf-tro .copa.p3{color:#C98A4B}
.abf-tro b{position:absolute;right:-6px;bottom:-2px;font:700 10px Inter,sans-serif;color:#ECE7DC;background:#15171A;border:1px solid #2C3036;border-radius:999px;padding:0 3px}
.abf-av{width:52px;height:52px;border-radius:999px;object-fit:cover;background:#2A2F36;display:flex;align-items:center;justify-content:center;font:700 22px Cinzel,serif;color:#D9B25A;flex:none}
.abf-nom{font:700 17px Cinzel,Georgia,serif;margin:0 0 4px;word-break:break-word}
.abf-rol{display:inline-block;font:600 10px Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#D9B25A;border:1px solid #6B5A2E;border-radius:999px;padding:1px 8px;margin-right:4px}
.abf-rol.off{color:#A8A293;border-color:#4A4F57}
.abf-fc{display:flex;flex-wrap:wrap;gap:4px;margin-top:10px}
.abf-fc span{background:#15171A;border:1px solid #2C3036;border-radius:999px;padding:1px 8px;font-size:12px}
.abf-dat{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;margin-top:10px;font-size:13px;color:#CFC9BA}
.abf-dat b{color:#F0CE82}
.abf a.abf-ver{display:inline-block;margin-top:12px;color:#D9B25A;font-weight:600;text-decoration:none}
.abf a.abf-ver:hover{text-decoration:underline}
.abf .abf-m{color:#A8A293}
.abf .abf-ant{margin:4px 0 0;font-size:12px}
.abf.red{background:linear-gradient(#1B1816,#121011);border-color:#6E1712;box-shadow:0 12px 32px rgba(0,0,0,.6),inset 0 0 40px rgba(110,23,18,.18)}
.abf.red .abf-cab{align-items:center}
.abf-sello{width:84px;height:84px;flex:none;filter:drop-shadow(0 3px 4px rgba(0,0,0,.7))}
.abf-sello+div{flex:1;min-width:0}
.abf-sello-tx{display:inline-block;transform:rotate(-7deg);border:3px double #B3261E;color:#C8352B;padding:2px 10px;font:900 22px/1.1 "Courier New",monospace;letter-spacing:.14em;opacity:.92;text-shadow:0 0 1px rgba(200,53,43,.6)}
.abf-tacha{display:flex;flex-direction:column;gap:5px;margin-top:10px}
.abf-tacha i{display:block;height:9px;background:#050505;border-radius:1px}
.abf.red p{margin:10px 0 0;font-size:12px;color:#B8B09E}`;
  document.head.appendChild(css);

  // Sello inquisitorial (dibujo propio): lacre oscuro con borde irregular, columna en «I» roja con filo dorado,
  // travesaños dorados y una calavera en un medallón.
  function sello() {
    const ns = "http://www.w3.org/2000/svg", s = document.createElementNS(ns, "svg");
    const add = (tag, at, padre) => { const e = document.createElementNS(ns, tag); for (const k in at) e.setAttribute(k, at[k]); (padre || s).appendChild(e); return e; };
    s.setAttribute("viewBox", "0 0 100 100"); s.setAttribute("class", "abf-sello"); s.setAttribute("aria-hidden", "true");
    const id = "si" + Math.random().toString(36).slice(2, 7), defs = add("defs", {});
    const g1 = add("radialGradient", { id: id + "c", cx: "40%", cy: "35%", r: "70%" }, defs);
    add("stop", { offset: "0", "stop-color": "#4A0D0A" }, g1); add("stop", { offset: ".7", "stop-color": "#240605" }, g1); add("stop", { offset: "1", "stop-color": "#120302" }, g1);
    const g2 = add("linearGradient", { id: id + "r", x1: "0", y1: "0", x2: "0", y2: "1" }, defs);
    add("stop", { offset: "0", "stop-color": "#A3211B" }, g2); add("stop", { offset: ".5", "stop-color": "#7A1712" }, g2); add("stop", { offset: "1", "stop-color": "#5A100C" }, g2);
    const g3 = add("radialGradient", { id: id + "h", cx: "40%", cy: "35%", r: "70%" }, defs);
    add("stop", { offset: "0", "stop-color": "#F3EAD2" }, g3); add("stop", { offset: "1", "stop-color": "#B9A982" }, g3);
    // Lacre con el borde irregular.
    let d = "";
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2, r = 47 + ((i * 7) % 5) * 0.6 - (i % 3) * 0.9;
      d += (i ? "L" : "M") + (50 + r * Math.cos(a)).toFixed(1) + " " + (50 + r * Math.sin(a)).toFixed(1);
    }
    add("path", { d: d + "Z", fill: `url(#${id}c)`, stroke: "#0B0201", "stroke-width": "1" });
    add("circle", { cx: "50", cy: "50", r: "40", fill: "none", stroke: "#6E5420", "stroke-width": "1.2", opacity: ".8" });
    // Travesaños dorados detrás.
    for (const [y, x0, x1] of [[40, 16, 84], [46, 20, 80], [55, 20, 80], [61, 16, 84]])
      add("path", { d: `M${x0} ${y}H${x1}`, stroke: y === 40 ? "#E6DDC8" : "#C9A24E", "stroke-width": y === 40 ? "1.6" : "1.2", "stroke-linecap": "round" });
    // Columna en «I».
    add("path", { d: "M30 13H70V23H59V77H70V87H30V77H41V23H30Z", fill: `url(#${id}r)`, stroke: "#D9B25A", "stroke-width": "1.8", "stroke-linejoin": "round" });
    add("path", { d: "M33 16H67V20H56V80H67V84H33V80H44V20H33Z", fill: "none", stroke: "#3A0805", "stroke-width": "1", opacity: ".7" });
    // Medallón con la calavera.
    add("ellipse", { cx: "50", cy: "50", rx: "15", ry: "17", fill: "#0E0C0C", stroke: "#D9B25A", "stroke-width": "1.8" });
    add("path", { d: "M41.5 49a8.5 8.5 0 1 1 17 0c0 3-1.2 4.6-2.6 5.6v3.6H44.1v-3.6c-1.4-1-2.6-2.6-2.6-5.6z", fill: `url(#${id}h)` });
    add("ellipse", { cx: "46.3", cy: "49.6", rx: "2.6", ry: "2.9", fill: "#140E0C" });
    add("ellipse", { cx: "53.7", cy: "49.6", rx: "2.6", ry: "2.9", fill: "#140E0C" });
    add("path", { d: "M50 52.6l-1.3 2.6h2.6z", fill: "#140E0C" });
    for (const x of [46.6, 48.9, 51.1, 53.4]) add("path", { d: `M${x} 56.2v2`, stroke: "#5A4A38", "stroke-width": ".7" });
    return s;
  }
  // Ficha de quien no tiene (o ya no tiene) cuenta en la web.
  function redactada() {
    const c = el("div", "abf red");
    c.setAttribute("role", "dialog");
    c.setAttribute("aria-label", "REDACTED");
    const cab = el("div", "abf-cab");
    const tx = el("div");
    const st = el("span", "abf-sello-tx", "REDACTED");
    st.setAttribute("translate", "no");
    const ta = el("div", "abf-tacha");
    ["92%", "70%", "84%"].forEach((w) => { const i = el("i"); i.style.width = w; ta.appendChild(i); });
    tx.append(st, ta);
    cab.append(sello(), tx);
    c.append(cab, el("p", "", "Expediente sellado por la Inquisición."), el("p", "", "Ya no forma parte del club."));
    c.lastChild.style.marginTop = "2px";
    return c;
  }

  async function carga() {
    if (datos) return datos;
    try { const c = JSON.parse(sessionStorage.getItem(CLAVE) || "null"); if (c && Date.now() - c.t < 300000) return (datos = new Map(c.d)); } catch (e) {}
    if (!pidiendo) pidiendo = fetch("/api/miembros").then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (!d) return null;
      datos = new Map(d.miembros.map((m) => [m.id, m]));
      try { sessionStorage.setItem(CLAVE, JSON.stringify({ t: Date.now(), d: [...datos] })); } catch (e) {}
      return datos;
    }).catch(() => null);
    const r = await pidiendo;
    if (!r) pidiendo = null;
    return r;
  }

  function tarjeta(m) {
    const c = el("div", "abf");
    c.setAttribute("role", "tooltip");
    const cab = el("div", "abf-cab");
    let av;
    if (m.avatar) { av = el("img", "abf-av"); av.src = "https://cdn.discordapp.com/avatars/" + m.id + "/" + m.avatar + ".png?size=128"; av.alt = ""; }
    else av = el("span", "abf-av", (m.name || "?").trim().charAt(0).toUpperCase());
    // Corona de laurel del rol (verde: miembro; roja: admin).
    // Un par de hojas doradas por cada año en el club.
    const lau = window.abLaurel && window.abLaurel(m.role, m.alta);
    if (lau) { const w = el("span", "abf-lau"); const t = window.abAniosClub && window.abAniosClub(m.alta); if (t) w.title = t; w.append(av, lau); av = w; }
    const tx = el("div");
    const n = el("p", "abf-nom", m.name); n.setAttribute("translate", "no");
    tx.append(n, el("span", "abf-rol", ROL[m.role] || m.role));
    if (m.desconectado) tx.appendChild(el("span", "abf-rol off", "Desconectado"));
    if (m.alta && window.abAntiguedad) tx.appendChild(el("p", "abf-m abf-ant", "En el club: " + window.abAntiguedad(m.alta)));
    cab.append(av, tx);
    c.appendChild(cab);
    const fac = m.facciones || [];
    if (fac.length) {
      const w = el("div", "abf-fc"); w.setAttribute("translate", "no");
      fac.slice(0, 6).forEach((f) => w.appendChild(el("span", "", f)));
      if (fac.length > 6) w.appendChild(el("span", "", "+" + (fac.length - 6)));
      c.appendChild(w);
    } else c.appendChild(el("p", "abf-m", "Todavía no ha indicado sus facciones."));
    const dat = el("div", "abf-dat");
    const dato = (b, t) => { const s = el("span"); s.append(el("b", "", b), " " + t); dat.appendChild(s); };
    if (m.liga) dato("#" + m.liga.pos, "Liga");
    if (m.elo && m.elo.clasificando) dato("Clasificando", "ELO");
    else if (m.elo) dato(m.elo.titulo + " " + m.elo.elo, "ELO");
    // Trofeos abajo a la derecha, en iconos (iguales que en Miembros): uno por puesto y tipo, con «×N» si se repite.
    if (m.trofeos && m.trofeos.length && window.abCopa) {
      const PUESTO = { 1: "1.º puesto", 2: "2.º puesto", 3: "3.º puesto" };
      const MOD = { individual: "Individual", parejas: "Parejas", equipo: "Equipo", pintura: "Pintura" };
      const ORD = { individual: 0, parejas: 1, equipo: 2, pintura: 3 };
      const grupos = new Map();
      [...m.trofeos].sort((a, b) => a.puesto - b.puesto || ORD[a.modalidad] - ORD[b.modalidad]).forEach((t) => {
        const k = t.puesto + "-" + t.modalidad; if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(t);
      });
      const w = el("div", "abf-tro");
      // Trofeos iguales en cascada (hasta 4 copias, como en Miembros); «×N» solo si hay más de 4.
      [...grupos.values()].slice(0, 6).forEach((l) => {
        const t = l[0], n = l.length, capas = Math.min(n, 4), s = el("span", "pila");
        s.style.width = 28 + (capas - 1) * 6 + "px";
        s.style.height = 32 + (capas - 1) * 3 + "px";
        for (let i = capas - 1; i >= 0; i--) {
          const c = window.abCopa(t.puesto, t.modalidad);
          c.style.left = i * 6 + "px"; c.style.top = (capas - 1 - i) * 3 + "px"; c.style.opacity = String(1 - i * 0.22);
          s.appendChild(c);
        }
        if (n > 4) s.appendChild(el("b", "", "×" + n));
        s.title = l.map((x) => x.nombre).join(" · ") + " — " + PUESTO[t.puesto] + " · " + MOD[t.modalidad];
        w.appendChild(s);
      });
      dat.appendChild(w);
    }
    if (dat.childNodes.length) c.appendChild(dat);
    const ver = el("a", "abf-ver", "Ver ficha completa →"); ver.href = "/miembros.html#m" + m.id;
    c.appendChild(ver);
    return c;
  }

  let abierta = null, timerAbre = 0, timerCierra = 0, pedida = null;
  let ultimoToque = 0;
  document.addEventListener("touchstart", () => { ultimoToque = Date.now(); }, { capture: true, passive: true });
  const cierra = () => { clearTimeout(timerAbre); if (abierta) { abierta.c.remove(); abierta.n.setAttribute("aria-expanded", "false"); abierta = null; } };
  async function abre(n, id) {
    if ((abierta && abierta.n === n) || pedida === n) return;
    pedida = n; // el foco, el ratón y el toque pueden llegar a la vez: una sola apertura
    const d = await carga();
    if (pedida !== n) return;
    pedida = null;
    // Sin cuenta, o con una cuenta que ya no está en Miembros: «REDACTED» (si no se pudo cargar la lista, nada).
    const m = id && d && d.get(id);
    if (!m && id && !d) return;
    cierra();
    const c = m ? tarjeta(m) : redactada();
    c.id = "abf-" + (id || "x" + Math.random().toString(36).slice(2, 7));
    document.body.appendChild(c);
    // Debajo del nombre (o encima si no cabe), sin salirse de la pantalla.
    const r = n.getBoundingClientRect(), w = c.offsetWidth, h = c.offsetHeight;
    let x = r.left + window.scrollX, y = r.bottom + window.scrollY + 6;
    x = Math.max(window.scrollX + 12, Math.min(x, window.scrollX + document.documentElement.clientWidth - w - 12));
    if (r.bottom + h + 12 > window.innerHeight && r.top - h - 6 > 0) y = r.top + window.scrollY - h - 6;
    c.style.left = x + "px"; c.style.top = y + "px";
    c.addEventListener("mouseenter", () => clearTimeout(timerCierra));
    c.addEventListener("mouseleave", () => { timerCierra = setTimeout(cierra, 200); });
    n.setAttribute("aria-expanded", "true");
    n.setAttribute("aria-describedby", c.id);
    abierta = { n, c, t: Date.now() };
  }
  document.addEventListener("click", (e) => { if (abierta && !abierta.c.contains(e.target) && !abierta.n.contains(e.target)) cierra(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && abierta) { const n = abierta.n; cierra(); n.focus(); } });
  // Al desplazarse se cierra (salvo justo al abrirla, que el propio toque o el foco pueden mover la página).
  window.addEventListener("scroll", () => { if (abierta && Date.now() - abierta.t > 600 && !abierta.c.matches(":hover")) cierra(); }, { passive: true });

  window.abFicha = function (n, id) {
    if (!n) return n;
    id = id || null; // sin cuenta en la web: ficha «REDACTED»
    n.classList.add("abf-n");
    n.tabIndex = 0;
    n.setAttribute("role", "button");
    n.setAttribute("aria-expanded", "false");
    n.setAttribute("aria-label", "Ver la ficha de " + n.textContent.trim());
    // Con el dedo, el navegador también simula el ratón y el foco: tras un toque solo cuenta el clic.
    const tocando = () => Date.now() - ultimoToque < 1000;
    n.addEventListener("mouseenter", () => { if (tocando()) return; clearTimeout(timerCierra); clearTimeout(timerAbre); timerAbre = setTimeout(() => abre(n, id), 250); });
    n.addEventListener("mouseleave", () => { if (tocando()) return; clearTimeout(timerAbre); timerCierra = setTimeout(cierra, 250); });
    n.addEventListener("focus", () => { if (!tocando()) abre(n, id); });
    n.addEventListener("blur", () => { if (tocando()) return; timerCierra = setTimeout(() => { if (abierta && !abierta.c.contains(document.activeElement)) cierra(); }, 150); });
    // Tocar (móvil) o pulsar: abre o cierra; no deja que el clic llegue a la tarjeta o fila de debajo.
    n.addEventListener("click", (e) => { e.stopPropagation(); e.preventDefault(); if (abierta && abierta.n === n) { if (Date.now() - abierta.t > 600) cierra(); } else abre(n, id); });
    n.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (abierta && abierta.n === n) cierra(); else abre(n, id); } });
    return n;
  };
})();
