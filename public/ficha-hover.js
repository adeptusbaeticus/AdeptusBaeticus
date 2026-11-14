// Ficha rápida de un socio al pasar el ratón por su nombre (Galería, Gran Liga…): avatar, rol, facciones, puesto en
// la liga, ELO y trofeos, con un enlace a su ficha completa en Miembros. En el móvil se abre al tocar el nombre.
// Uso: window.abFicha(elemento, discordId). Los datos salen de /api/miembros (una petición, guardada 5 minutos).
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
.abf .abf-m{color:#A8A293}`;
  document.head.appendChild(css);

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
    const lau = window.abLaurel && window.abLaurel(m.role);
    if (lau) { const w = el("span", "abf-lau"); w.append(av, lau); av = w; }
    const tx = el("div");
    const n = el("p", "abf-nom", m.name); n.setAttribute("translate", "no");
    tx.append(n, el("span", "abf-rol", ROL[m.role] || m.role));
    if (m.desconectado) tx.appendChild(el("span", "abf-rol off", "Desconectado"));
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
    if (m.elo) dato(String(m.elo.elo), "ELO");
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
    const m = d && d.get(id);
    if (!m) return;
    cierra();
    const c = tarjeta(m);
    c.id = "abf-" + id;
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
    if (!n || !id) return n;
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
