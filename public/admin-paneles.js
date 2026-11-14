// Paneles de administración dentro de las páginas (solo para el admin; el servidor también lo comprueba):
// - Calendario: «Administrar eventos» (crear, editar y cancelar quedadas y torneos, y ver sus inscritos).
// - Gran Liga: «Administrar jugadores» (vincular cada jugador de la liga con su cuenta de Discord).
// Todo con DOM (textContent), sin innerHTML.
(function () {
  const ES_CAL = /^\/calendario(\.html)?$/.test(location.pathname);
  const ES_LIGA = /^\/gran-liga(\.html)?$/.test(location.pathname);
  if (!ES_CAL && !ES_LIGA) return;

  const el = (tag, cls, txt) => { const x = document.createElement(tag); if (cls) x.className = cls; if (txt != null) x.textContent = txt; return x; };
  const chip = (txt, fn) => { const b = el("button", "apn-chip", txt); b.type = "button"; b.onclick = fn; return b; };

  const css = el("style");
  css.textContent = `
.top .apn-abre,.cab .apn-abre{margin-right:auto}
.apn-abre{background:#1F2328;color:#F0CE82;border:1px solid #D9B25A;border-radius:999px;padding:8px 14px;min-height:44px;font:600 14px Inter,sans-serif;cursor:pointer}
dialog.apn{width:min(980px,calc(100vw - 24px));max-height:calc(100vh - 24px);box-sizing:border-box;padding:0;border:1px solid #2C3036;border-radius:14px;background:#15171A;color:#ECE7DC}
dialog.apn::backdrop{background:rgba(0,0,0,.6)}
.apn-cab{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 18px;background:#1F2328;border-bottom:1px solid #2C3036}
.apn-cab h2{margin:0;font:700 22px Cinzel,Georgia,serif}
.apn-cuerpo{padding:18px}
.apn .card{background:#1F2328;border:1px solid #2C3036;border-radius:12px;padding:18px;margin-bottom:16px}
.apn .fg{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}
.apn label{display:block;font-weight:600;font-size:14px;margin-bottom:4px}
.apn input,.apn select,.apn textarea{width:100%;box-sizing:border-box;padding:10px 12px;border-radius:8px;border:1px solid #6B6558;background:#15171A;color:#ECE7DC;font:inherit;color-scheme:dark;min-height:44px}
.apn textarea{min-height:80px}
.apn .full{grid-column:1/-1}
.apn .m{color:#A8A293;font-size:14px}
.apn-btn{background:#A3211B;color:#fff;border:0;border-radius:8px;padding:12px 20px;font:600 15px Inter,sans-serif;cursor:pointer;min-height:44px}
.apn-chip{background:#1F2328;color:#ECE7DC;border:1px solid #6B6558;border-radius:999px;padding:8px 14px;min-height:44px;font:500 14px Inter,sans-serif;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;box-sizing:border-box}
.apn .acts{display:flex;gap:8px;flex-wrap:wrap}
.apn .fila{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
.apn .regs{flex-basis:100%;border-top:1px solid #2C3036;padding-top:12px}
.apn table{width:100%;border-collapse:collapse;font-size:14px}
.apn th,.apn td{text-align:left;padding:8px;border-bottom:1px solid #2C3036;white-space:nowrap}
.apn th{color:#D9B25A;font-weight:600}
.apn table select{min-width:220px}
.apn .sug{color:#F0CE82}
.apn td .acts{flex-wrap:nowrap}
.apn td select{min-width:160px}
@media (max-width:600px){.apn-cuerpo{padding:12px}.apn .card{padding:14px}}
@media (max-width:600px){.apn table.apil thead{display:none}.apn table.apil tr{display:grid;gap:6px;padding:10px 0;border-bottom:1px solid #2C3036}.apn table.apil td{display:block;border:0;padding:0;white-space:normal}.apn table.apil td select{width:100%;min-width:0}.apn table.apil td .acts{flex-wrap:wrap}}`;
  document.head.appendChild(css);

  // Ventana del panel: título, botón de cerrar y cuerpo.
  function ventana(titulo, alCerrar) {
    const d = el("dialog", "apn");
    d.setAttribute("aria-label", titulo);
    const cab = el("div", "apn-cab");
    const cerrar = chip("Cerrar", () => d.close());
    cab.append(el("h2", "", titulo), cerrar);
    const cuerpo = el("div", "apn-cuerpo");
    d.append(cab, cuerpo);
    d.addEventListener("click", (e) => { if (e.target === d) d.close(); });
    d.addEventListener("close", () => { if (alCerrar) alCerrar(); });
    document.body.appendChild(d);
    return { d, cuerpo };
  }

  // ---------- Calendario: eventos ----------
  function panelEventos() {
    let cambios = false, eventos = [], editando = null;
    const { d, cuerpo } = ventana("Administrar eventos", () => { if (cambios) location.reload(); });
    const f = el("form", "card"); f.noValidate = false;
    const fg = el("div", "fg");
    const campo = (id, et, nodo, full) => { const w = el("div", full ? "full" : ""); const l = el("label", "", et); l.htmlFor = id; nodo.id = id; w.append(l, nodo); fg.appendChild(w); return w; };
    const sel = (ops) => { const s = el("select"); ops.forEach(([v, t]) => { const o = el("option", "", t); o.value = v; s.appendChild(o); }); return s; };
    const inp = (tipo, max) => { const i = el("input"); i.type = tipo; if (max) i.maxLength = max; return i; };
    const tipo = sel([["quedada", "Quedada"], ["torneo", "Torneo"]]);
    const modo = sel([["fisico", "Físico"], ["online", "Online (TTS)"]]);
    const titulo = inp("text", 120); titulo.required = true;
    const fecha = inp("datetime-local"); fecha.required = true;
    const lugar = inp("text", 160);
    const plazas = inp("number"); plazas.min = "1"; plazas.max = "1000";
    const nr = inp("text", 80);
    const estado = sel([["publicado", "Publicado"], ["borrador", "Borrador"], ["cancelado", "Cancelado"]]);
    const desc = el("textarea"); desc.maxLength = 1000;
    campo("ae-tipo", "Tipo", tipo);
    const wModo = campo("ae-modo", "¿Dónde se juega?", modo);
    campo("ae-titulo", "Título", titulo);
    campo("ae-fecha", "Fecha y hora", fecha);
    campo("ae-lugar", "Lugar", lugar);
    campo("ae-plazas", "Plazas (opcional)", plazas);
    campo("ae-nr", "Enlace o ID de New Recruit (torneos)", nr);
    campo("ae-estado", "Estado", estado);
    campo("ae-desc", "Descripción", desc, true);
    const msg = el("p", "m"); msg.style.cssText = "min-height:20px;margin:12px 0 0"; msg.setAttribute("role", "status");
    const guardar = el("button", "apn-btn", "Crear evento"); guardar.type = "submit";
    const acts = el("div", "acts"); acts.style.marginTop = "8px";
    acts.append(guardar, chip("Limpiar", () => { limpia(); msg.textContent = ""; }));
    f.append(fg, msg, acts);
    const h = el("h3", "", "Eventos"); h.style.cssText = "font:700 20px Cinzel,Georgia,serif;margin:8px 0 12px";
    const lista = el("div");
    cuerpo.append(f, h, lista);

    // Las quedadas son siempre físicas: la modalidad solo sale en los torneos.
    const syncModo = () => { wModo.hidden = tipo.value !== "torneo"; if (tipo.value !== "torneo") modo.value = "fisico"; };
    tipo.onchange = syncModo; syncModo();
    const limpia = () => { editando = null; f.reset(); syncModo(); guardar.textContent = "Crear evento"; };

    const envia = async (id, datos) => {
      msg.textContent = "";
      const r = await fetch(id ? "/api/admin/events/" + id : "/api/admin/events", { method: id ? "PUT" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(datos) });
      if (!r.ok) { msg.textContent = "No se pudo guardar. Revisa los datos."; return false; }
      cambios = true;
      return true;
    };
    f.onsubmit = async (ev) => {
      ev.preventDefault();
      const ok = await envia(editando, { type: tipo.value, modo: modo.value, title: titulo.value, starts_at: fecha.value, location: lugar.value,
        description: desc.value, capacity: plazas.value, nr_tournament_id: nr.value, status: estado.value });
      if (ok) { limpia(); await carga(); msg.textContent = "Guardado."; }
    };
    const edita = (e) => {
      editando = e.id;
      tipo.value = e.type; modo.value = e.modo || "fisico"; syncModo();
      titulo.value = e.title; fecha.value = e.starts_at; lugar.value = e.location || ""; plazas.value = e.capacity || "";
      nr.value = e.nr_tournament_id || ""; estado.value = e.status; desc.value = e.description || "";
      guardar.textContent = "Guardar cambios";
      msg.textContent = "Editando: " + e.title;
      cuerpo.parentNode.scrollTo({ top: 0, behavior: "smooth" });
      titulo.focus({ preventScroll: true });
    };
    const ponEstado = async (e, st, pregunta) => {
      if (pregunta && !confirm(pregunta)) return;
      if (await envia(e.id, { ...e, status: st })) await carga();
    };
    async function inscritos(e, panel) {
      if (!panel.hidden) { panel.hidden = true; return; }
      panel.hidden = false; panel.textContent = "Cargando...";
      let l;
      try { const r = await fetch("/api/admin/events/" + e.id + "/registrations"); if (!r.ok) throw 0; l = await r.json(); }
      catch (x) { panel.textContent = "No se pudo cargar la lista de inscritos."; return; }
      panel.textContent = "";
      const ins = l.filter((x) => x.status === "inscrito").length;
      const cab = el("div", "fila"); cab.style.marginBottom = "8px";
      const csv = el("a", "apn-chip", "Descargar CSV"); csv.href = "/api/admin/events/" + e.id + "/registrations.csv";
      cab.append(el("span", "m", "Inscritos: " + ins + (e.capacity ? " de " + e.capacity + " · Libres: " + Math.max(0, e.capacity - ins) : "") + " · En espera: " + (l.length - ins)), csv);
      panel.appendChild(cab);
      if (!l.length) { panel.appendChild(el("p", "m", "Todavía no hay inscritos.")); return; }
      const t = el("table"); const tr = t.createTHead().insertRow();
      ["#", "Nombre", "Usuario New Recruit", "Estado", "Actividad", "Partida", "Inscrito por", "Fecha de inscripción"].forEach((x) => tr.appendChild(el("th", "", x)));
      const tb = t.createTBody();
      l.forEach((x, i) => {
        const r = tb.insertRow();
        const fch = x.created_at ? new Date(x.created_at.replace(" ", "T") + "Z").toLocaleString("es-ES") : "";
        [String(i + 1), x.name || "(sin nombre)", x.nr_username || "—", x.status === "inscrito" ? "Inscrito" : "Lista de espera", x.plan || "—", x.partida || "—", x.inscrito_por || "—", fch]
          .forEach((v, k) => { const c = r.insertCell(); c.textContent = v; if ([1, 2, 5, 6].includes(k)) c.setAttribute("translate", "no"); });
      });
      const w = el("div"); w.style.overflowX = "auto"; w.appendChild(t); panel.appendChild(w);
    }
    function pinta() {
      lista.textContent = "";
      if (!eventos.length) { lista.appendChild(el("p", "m", "No hay eventos.")); return; }
      eventos.forEach((e) => {
        const fila = el("div", "fila card");
        const info = el("div");
        const t = el("strong", "", e.title); t.setAttribute("translate", "no");
        info.append(t, el("div", "m", e.starts_at.replace("T", " ") + " · " + (e.type === "torneo" ? "Torneo" + (e.modo === "online" ? " online (TTS)" : "") : "Quedada") + " · " + e.status));
        const a = el("div", "acts");
        a.appendChild(chip("Editar", () => edita(e)));
        if (e.status !== "cancelado") a.appendChild(chip("Cancelar evento", () => ponEstado(e, "cancelado", "¿Cancelar este evento?")));
        else a.appendChild(chip("Publicar de nuevo", () => ponEstado(e, "publicado")));
        const panel = el("div", "regs"); panel.hidden = true;
        if (e.type === "quedada") a.appendChild(chip("Inscritos", () => inscritos(e, panel)));
        fila.append(info, a, panel);
        lista.appendChild(fila);
      });
    }
    async function carga() {
      try { const r = await fetch("/api/admin/events"); if (!r.ok) throw 0; eventos = await r.json(); pinta(); }
      catch (e) { lista.textContent = ""; lista.appendChild(el("p", "m", "No se pudieron cargar los eventos.")); }
    }
    carga();
    return d;
  }

  // ---------- Gran Liga: jugadores y cruces ----------
  function panelJugadores() {
    let cambios = false, datos = null;
    const { d, cuerpo } = ventana("Administrar jugadores", () => { if (cambios) location.reload(); });
    const msg = el("p", "m"); msg.style.cssText = "margin:0 0 12px;min-height:20px"; msg.setAttribute("role", "status");
    const pestanas = el("div", "acts"); pestanas.style.marginBottom = "12px";
    const tJug = chip("Jugadores", () => muestra("jug")), tCru = chip("Cruces", () => muestra("cru"));
    pestanas.append(tJug, tCru);
    const secJug = el("div"), secCru = el("div");
    cuerpo.append(pestanas, msg, secJug, secCru);
    const muestra = (q) => {
      secJug.hidden = q !== "jug"; secCru.hidden = q !== "cru";
      tJug.setAttribute("aria-pressed", String(q === "jug")); tCru.setAttribute("aria-pressed", String(q === "cru"));
      tJug.style.borderColor = q === "jug" ? "#D9B25A" : ""; tCru.style.borderColor = q === "cru" ? "#D9B25A" : "";
    };
    const pide = async (metodo, ruta, cuerpoJson) => {
      msg.textContent = "";
      const r = await fetch(ruta, { method: metodo, headers: { "content-type": "application/json" }, body: cuerpoJson ? JSON.stringify(cuerpoJson) : undefined });
      const y = await r.json().catch(() => ({}));
      if (!r.ok) { msg.textContent = y.error || "No se pudo guardar."; return null; }
      cambios = true; return y;
    };
    const selCuenta = (valor) => {
      const s = el("select");
      const o0 = el("option", "", "— Sin vincular —"); o0.value = ""; s.appendChild(o0);
      datos.usuarios.forEach((u) => { const o = el("option", "", u.name + (u.nr_username ? " · NR: " + u.nr_username : "")); o.value = u.discord_id; o.setAttribute("translate", "no"); s.appendChild(o); });
      s.value = valor || ""; s.setAttribute("aria-label", "Cuenta vinculada");
      return s;
    };
    // Formulario de jugador (añadir o reemplazar).
    const formJugador = (titulo, boton, alGuardar, alCancelar) => {
      const f = el("form", "card");
      f.appendChild(el("strong", "", titulo));
      const fg = el("div", "fg"); fg.style.marginTop = "10px";
      const campo = (et, nodo) => { const w = el("div"); const l = el("label", "", et); const id = "aj-" + Math.random().toString(36).slice(2, 8); l.htmlFor = id; nodo.id = id; w.append(l, nodo); fg.appendChild(w); return nodo; };
      const i = (max) => { const x = el("input"); x.type = "text"; x.maxLength = max; x.autocomplete = "off"; x.setAttribute("translate", "no"); return x; };
      const disc = campo("Nombre en Discord", i(60)), nom = campo("Nombre de pila (opcional)", i(60)), nr = campo("Usuario de New Recruit", i(60));
      const cta = campo("Cuenta de la web (vacío = emparejar automáticamente)", selCuenta(""));
      const acts = el("div", "acts"); acts.style.marginTop = "10px";
      const ok = el("button", "apn-btn", boton); ok.type = "submit"; acts.appendChild(ok);
      if (alCancelar) acts.appendChild(chip("Cancelar", alCancelar));
      f.append(fg, acts);
      f.onsubmit = async (ev) => { ev.preventDefault(); ok.disabled = true; const r = await alGuardar({ discord: disc.value, nombre: nom.value, nr_nombre: nr.value, discord_id: cta.value || null }); ok.disabled = false; if (r) f.reset(); };
      return f;
    };
    function pintaJugadores() {
      secJug.textContent = "";
      const top = el("div", "acts"); top.style.marginBottom = "12px";
      top.appendChild(chip("Emparejar automáticamente", async () => { const y = await pide("POST", "/api/admin/liga/emparejar"); if (y) { await carga(); msg.textContent = "Emparejados ahora: " + y.vinculados; } }));
      secJug.appendChild(top);
      secJug.appendChild(formJugador("Añadir jugador", "Añadir", async (b) => { const y = await pide("POST", "/api/admin/liga/jugador", b); if (y) { await carga(); msg.textContent = "Jugador añadido."; } return y; }));
      const card = el("div", "card");
      card.appendChild(el("p", "m", "Cuenta vinculada: con quién de la web es cada jugador. «Reemplazar»: otro jugador ocupa su sitio y se queda con sus partidas y resultados. «Quitar» solo si aún no tiene partidas."));
      const t = el("table", "apil"); const tr = t.createTHead().insertRow();
      ["Jugador", "New Recruit", "Cuenta vinculada", ""].forEach((x) => tr.appendChild(el("th", "", x)));
      const tb = t.createTBody();
      datos.jugadores.forEach((j) => {
        const fila = el("tr");
        const c1 = el("td", "", j.discord + (j.nombre ? " (" + j.nombre + ")" : "")); c1.setAttribute("translate", "no");
        const c2 = el("td", "", j.nr_nombre || "—"); c2.setAttribute("translate", "no");
        const c3 = el("td"); const s = selCuenta(j.discord_id);
        s.onchange = async () => { const y = await pide("POST", "/api/admin/liga/jugador/" + j.id, { discord_id: s.value || null }); if (y) { await carga(); msg.textContent = "Guardado."; } };
        c3.appendChild(s);
        const c4 = el("td"); const a = el("div", "acts");
        if (!j.discord_id && j.sugerido_id) a.append(el("span", "sug", "Sugerencia: " + j.sugerido + " "), chip("Confirmar", async () => { if (await pide("POST", "/api/admin/liga/jugador/" + j.id, { discord_id: j.sugerido_id })) carga(); }));
        a.appendChild(chip("Reemplazar", () => {
          const f = formJugador("Reemplazar a " + j.discord, "Reemplazar", async (b) => {
            if (!confirm("¿Reemplazar a " + j.discord + " por " + b.discord + "? El nuevo jugador se queda con sus partidas y resultados.")) return null;
            const y = await pide("POST", "/api/admin/liga/jugador/" + j.id + "/reemplazar", b); if (y) { await carga(); msg.textContent = "Jugador reemplazado."; } return y;
          }, () => f.remove());
          card.insertBefore(f, card.firstChild); f.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }));
        if (!j.partidas) a.appendChild(chip("Quitar", async () => { if (!confirm("¿Quitar a " + j.discord + " de la liga?")) return; if (await pide("DELETE", "/api/admin/liga/jugador/" + j.id)) { await carga(); msg.textContent = "Jugador quitado."; } }));
        c4.appendChild(a);
        fila.append(c1, c2, c3, c4); tb.appendChild(fila);
      });
      const w = el("div"); w.style.overflowX = "auto"; w.appendChild(t);
      card.appendChild(w); secJug.appendChild(card);
    }
    let rondaVista = 1;
    function pintaCruces(partidas) {
      secCru.textContent = "";
      const nombre = new Map(datos.jugadores.map((j) => [j.id, j.discord]));
      const cab = el("div", "fila card");
      const lr = el("label", "", "Ronda"); lr.htmlFor = "aj-ronda";
      const sr = el("select"); sr.id = "aj-ronda"; sr.style.maxWidth = "160px";
      for (let r = 1; r <= (datos.fase.rondas || 19); r++) { const o = el("option", "", "Ronda " + r); o.value = r; sr.appendChild(o); }
      sr.value = rondaVista; sr.onchange = () => { rondaVista = Number(sr.value); pintaCruces(partidas); };
      const wr = el("div"); wr.append(lr, sr);
      cab.append(wr, el("p", "m", "Solo se pueden cambiar las partidas sin resultado. Cada pareja se enfrenta una vez por fase."));
      secCru.appendChild(cab);
      const selJ = (v) => { const s = el("select"); const o0 = el("option", "", "—"); o0.value = ""; s.appendChild(o0); datos.jugadores.forEach((j) => { const o = el("option", "", j.discord); o.value = j.id; o.setAttribute("translate", "no"); s.appendChild(o); }); s.value = v || ""; return s; };
      const card = el("div", "card");
      const t = el("table", "apil"); const tr = t.createTHead().insertRow();
      ["Mesa", "Jugador A", "Jugador B", ""].forEach((x) => tr.appendChild(el("th", "", x)));
      const tb = t.createTBody();
      const deRonda = partidas.filter((p) => p.ronda === rondaVista);
      const enRonda = new Set(deRonda.flatMap((p) => [p.jugador_a, p.jugador_b]));
      deRonda.forEach((p) => {
        const fila = el("tr");
        fila.appendChild(el("td", "", String(p.mesa) + (p.aplazada ? " · aplazada" : "")));
        if (p.resultado) {
          [p.jugador_a, p.jugador_b].forEach((x) => { const c = el("td", "", nombre.get(x) || "—"); c.setAttribute("translate", "no"); fila.appendChild(c); });
          fila.appendChild(el("td", "m", "Con resultado"));
        } else {
          const a = selJ(p.jugador_a), b = selJ(p.jugador_b);
          const ca = el("td"); ca.appendChild(a); const cb = el("td"); cb.appendChild(b);
          const acc = el("td"); const ac = el("div", "acts");
          ac.appendChild(chip("Guardar", async () => { if (await pide("PUT", "/api/admin/liga/partida/" + p.id, { jugador_a: Number(a.value), jugador_b: Number(b.value) })) { await cargaCruces(); msg.textContent = "Cruce guardado."; } }));
          ac.appendChild(chip("Quitar", async () => { if (!confirm("¿Quitar la mesa " + p.mesa + " de la ronda " + p.ronda + "?")) return; if (await pide("DELETE", "/api/admin/liga/partida/" + p.id)) { await cargaCruces(); msg.textContent = "Cruce quitado."; } }));
          acc.appendChild(ac); fila.append(ca, cb, acc);
        }
        tb.appendChild(fila);
      });
      // Nueva mesa en la ronda.
      const nueva = el("tr");
      const na = selJ(""), nb = selJ("");
      nueva.appendChild(el("td", "m", "Nueva"));
      const c1 = el("td"); c1.appendChild(na); const c2 = el("td"); c2.appendChild(nb);
      const c3 = el("td"); c3.appendChild(chip("Añadir cruce", async () => { if (await pide("POST", "/api/admin/liga/partida", { ronda: rondaVista, jugador_a: Number(na.value), jugador_b: Number(nb.value) })) { await cargaCruces(); msg.textContent = "Cruce añadido."; } }));
      nueva.append(c1, c2, c3); tb.appendChild(nueva);
      const w = el("div"); w.style.overflowX = "auto"; w.appendChild(t); card.appendChild(w);
      const libres = datos.jugadores.filter((j) => !enRonda.has(j.id)).map((j) => j.discord);
      if (libres.length) { const l = el("p", "m", "Sin partida en esta ronda:"); const n = el("span", "", " " + libres.join(", ")); n.setAttribute("translate", "no"); l.appendChild(n); l.style.marginTop = "8px"; card.appendChild(l); }
      secCru.appendChild(card);
    }
    async function cargaCruces() {
      try { const x = await (await fetch("/api/admin/liga/partidas")).json(); pintaCruces(x.partidas || []); }
      catch (e) { secCru.textContent = ""; secCru.appendChild(el("p", "m", "No se pudo cargar.")); }
    }
    async function carga() {
      try { datos = await (await fetch("/api/admin/liga/jugadores")).json(); } catch (e) { msg.textContent = "No se pudo cargar."; return; }
      if (!datos.fase) { secJug.textContent = ""; msg.textContent = "Todavía no hay ninguna fase de la liga."; return; }
      pintaJugadores(); await cargaCruces();
    }
    muestra("jug");
    carga();
    return d;
  }

  // Botón para abrir el panel, solo si quien entra es admin.
  fetch("/api/me").then((r) => r.json()).catch(() => null).then((me) => {
    if (!me || me.role !== "admin" || me.ver_como) return;
    const sitio = ES_CAL ? document.querySelector(".top h1") : document.querySelector(".cab h1");
    if (!sitio) return;
    const b = el("button", "apn-abre", ES_CAL ? "Administrar eventos" : "Administrar jugadores");
    b.type = "button";
    let d = null;
    b.onclick = () => { if (!d) d = ES_CAL ? panelEventos() : panelJugadores(); d.showModal(); };
    sitio.insertAdjacentElement("afterend", b);
  });
})();
