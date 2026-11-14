// --- App instalable: service worker y enlace «Instalar app» en el pie ---
(() => {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => { navigator.serviceWorker.register("/sw.js").catch(() => {}); });
  }
  const instalada = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  if (instalada) return;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  // Firefox para Android permite instalar desde su menú, pero no avisa a la página: se muestran los pasos.
  const firefoxAndroid = /android/i.test(navigator.userAgent) && /firefox/i.test(navigator.userAgent);
  const conPasos = ios || firefoxAndroid;
  let aviso = null; // evento de instalación del navegador (Chrome, Edge, Android)
  const enlace = () => {
    let a = document.getElementById("instalar-app");
    if (a) return a;
    const nav = document.querySelector(".ftl");
    if (!nav) return null;
    a = document.createElement("a");
    a.id = "instalar-app";
    a.href = "#";
    a.textContent = "Instalar app";
    a.addEventListener("click", async (e) => {
      e.preventDefault();
      if (aviso) { aviso.prompt(); try { await aviso.userChoice; } catch (x) {} aviso = null; a.remove(); return; }
      if (conPasos) instrucciones();
    });
    nav.prepend(a);
    return a;
  };
  function instrucciones() {
    const ov = document.createElement("div");
    ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-labelledby", "ia-t");
    ov.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:flex-end;justify-content:center;padding:16px;z-index:60";
    const c = document.createElement("div");
    c.style.cssText = "background:#1F2328;border:1px solid #2C3036;border-radius:12px;padding:20px;max-width:420px;width:100%;box-sizing:border-box;color:#ECE7DC;font:400 16px/1.5 Inter,system-ui,sans-serif";
    const h = document.createElement("h3");
    h.id = "ia-t"; h.textContent = "Instalar la app";
    h.style.cssText = "margin:0 0 10px;font:700 20px Cinzel,Georgia,serif;color:#F0CE82";
    const ol = document.createElement("ol");
    ol.style.cssText = "margin:0 0 16px;padding-left:20px";
    (firefoxAndroid
      ? ["Pulsa el menú de Firefox (los tres puntos ⋮).", "Elige «Instalar» o «Añadir a pantalla de inicio».", "Confirma: el icono del club aparecerá con el resto de tus apps."]
      : ["Pulsa el botón Compartir de Safari (el cuadrado con la flecha hacia arriba).", "Elige «Añadir a pantalla de inicio».", "Pulsa «Añadir»: el icono del club aparecerá con el resto de tus apps."])
      .forEach((t) => { const li = document.createElement("li"); li.textContent = t; li.style.margin = "4px 0"; ol.appendChild(li); });
    const b = document.createElement("button");
    b.type = "button"; b.textContent = "Entendido";
    b.style.cssText = "background:#A3211B;color:#fff;border:0;border-radius:8px;padding:10px 18px;min-height:44px;font:600 15px Inter,sans-serif;cursor:pointer";
    const fuera = () => ov.remove();
    b.onclick = fuera;
    ov.addEventListener("click", (e) => { if (e.target === ov) fuera(); });
    c.append(h, ol, b); ov.appendChild(c); document.body.appendChild(ov); b.focus();
  }
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); aviso = e; enlace(); });
  window.addEventListener("appinstalled", () => { const a = document.getElementById("instalar-app"); if (a) a.remove(); });
  if (conPasos) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", enlace); else enlace();
  }
})();

(() => {
  const box = document.getElementById("auth");
  if (!box) return;
  const msgs = {
    nomember: "Tu cuenta de Discord no está en el servidor del club.",
    norole: "No tienes ninguno de los roles del club en Discord.",
    error: "No se pudo iniciar sesión. Inténtalo de nuevo.",
  };
  // --- Notificaciones en el móvil: activar en este dispositivo y elegir los avisos ---
  const TIPOS_AVISO = [["eventos", "Nuevas quedadas y torneos"], ["partidas", "Mis partidas (alguien se une o se completa)"],
    ["liga", "Gran Liga (tu partida de cada ronda y recordatorio)"], ["galeria", "Fotos nuevas en la galería"], ["encuestas", "Nuevas encuestas del club"]];
  const b64aBytes = (t) => Uint8Array.from(atob(t.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((t.length + 3) % 4)), (c) => c.charCodeAt(0));
  async function dialogoAvisos() {
    const ov = document.createElement("div");
    ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-labelledby", "av-t");
    ov.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:16px;z-index:60";
    const c = document.createElement("div");
    c.style.cssText = "background:#1F2328;border:1px solid #2C3036;border-radius:12px;padding:22px;max-width:440px;width:100%;box-sizing:border-box;color:#ECE7DC;font:400 15px/1.5 Inter,system-ui,sans-serif;max-height:calc(100vh - 32px);overflow:auto";
    const h = document.createElement("h3");
    h.id = "av-t"; h.textContent = "Notificaciones";
    h.style.cssText = "margin:0 0 6px;font:700 22px Cinzel,Georgia,serif;color:#F0CE82";
    const p = document.createElement("p");
    p.style.cssText = "margin:0 0 14px;color:#CFC9BA";
    const lista = document.createElement("div");
    lista.style.cssText = "display:grid;gap:6px;margin:0 0 16px";
    const msg = document.createElement("p");
    msg.setAttribute("role", "status");
    msg.style.cssText = "margin:0 0 12px;font-size:14px;color:#A8A293;min-height:20px";
    const acc = document.createElement("div");
    acc.style.cssText = "display:flex;gap:8px;flex-wrap:wrap";
    const boton = (txt, primario) => {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = txt;
      b.style.cssText = "min-height:44px;padding:10px 16px;border-radius:8px;font:600 15px Inter,sans-serif;cursor:pointer;" +
        (primario ? "background:#A3211B;color:#fff;border:1px solid #A3211B" : "background:#15171A;color:#ECE7DC;border:1px solid #6B6558");
      return b;
    };
    const fuera = () => { ov.remove(); document.removeEventListener("keydown", esc); };
    const esc = (e) => { if (e.key === "Escape") fuera(); };
    document.addEventListener("keydown", esc);
    ov.addEventListener("click", (e) => { if (e.target === ov) fuera(); });
    const cerrar = boton("Cerrar", false); cerrar.onclick = fuera;
    c.append(h, p, lista, msg, acc);
    ov.appendChild(c); document.body.appendChild(ov);

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const instalada = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      p.textContent = ios && !instalada
        ? "En iPhone y iPad las notificaciones solo funcionan con la web instalada como app: pulsa «Instalar app» al pie de la página y ábrela desde su icono."
        : "Este navegador no permite notificaciones.";
      acc.appendChild(cerrar); cerrar.focus();
      return;
    }
    p.textContent = "Elige qué avisos quieres recibir en este dispositivo. Puedes cambiarlo o desactivarlo cuando quieras.";
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    let estado = { suscrito: false, tipos: TIPOS_AVISO.map((t) => t[0]) };
    if (sub) { try { estado = await (await fetch("/api/push/estado", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) })).json(); } catch (e) {} }
    const checks = TIPOS_AVISO.map(([v, txt]) => {
      const l = document.createElement("label");
      l.style.cssText = "display:flex;gap:10px;align-items:center;min-height:36px;cursor:pointer";
      const i = document.createElement("input"); i.type = "checkbox"; i.value = v; i.checked = estado.tipos.includes(v);
      i.style.cssText = "width:18px;height:18px;accent-color:#D9B25A";
      l.append(i, txt); lista.appendChild(l);
      return i;
    });
    const tiposElegidos = () => checks.filter((i) => i.checked).map((i) => i.value);
    const guarda = async () => {
      const j = sub.toJSON();
      const r = await fetch("/api/push", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpoint: j.endpoint, keys: j.keys, tipos: tiposElegidos() }) });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "No se pudo guardar.");
    };
    const pinta = () => {
      acc.textContent = "";
      if (estado.suscrito) {
        msg.textContent = "Activadas en este dispositivo.";
        const prueba = boton("Enviar un aviso de prueba", false);
        prueba.onclick = async () => {
          prueba.disabled = true;
          try { const r = await fetch("/api/push/prueba", { method: "POST" }); msg.textContent = r.ok ? "Aviso de prueba enviado." : "No se pudo enviar el aviso de prueba."; }
          catch (e) { msg.textContent = "No se pudo enviar el aviso de prueba."; }
          prueba.disabled = false;
        };
        const off = boton("Desactivar en este dispositivo", false);
        off.onclick = async () => {
          off.disabled = true;
          try {
            await fetch("/api/push/baja", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
            await sub.unsubscribe(); sub = null; estado.suscrito = false; msg.textContent = "Desactivadas en este dispositivo.";
          } catch (e) { msg.textContent = "No se pudo desactivar."; }
          pinta();
        };
        acc.append(prueba, off, cerrar);
      } else {
        if (Notification.permission === "denied") msg.textContent = "Has bloqueado las notificaciones de esta web: permítelas en los ajustes del navegador.";
        else if (!estado.suscrito && !msg.textContent) msg.textContent = "Desactivadas en este dispositivo.";
        const on = boton("Activar en este dispositivo", true);
        on.disabled = Notification.permission === "denied";
        on.onclick = async () => {
          on.disabled = true; msg.textContent = "";
          try {
            if ((await Notification.requestPermission()) !== "granted") { msg.textContent = "Sin permiso para mostrar notificaciones."; on.disabled = false; return; }
            const { clave } = await (await fetch("/api/push")).json();
            sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64aBytes(clave) });
            await guarda();
            estado.suscrito = true; msg.textContent = "";
            pinta();
          } catch (e) { msg.textContent = e && e.message && !/^[A-Z][a-z]+Error/.test(e.name || "") ? e.message : "No se pudieron activar las notificaciones."; on.disabled = false; }
        };
        acc.append(on, cerrar);
      }
    };
    // Cambiar los avisos elegidos se guarda al momento (si ya están activadas).
    checks.forEach((i) => i.addEventListener("change", async () => {
      if (!estado.suscrito || !sub) return;
      try { await guarda(); msg.textContent = "Guardado."; } catch (e) { msg.textContent = e.message; }
    }));
    pinta();
    (acc.querySelector("button") || cerrar).focus();
  }

  // Quien entra con Discord sin ser del club: aviso claro con cómo unirse (página de inscripción).
  const FORM_REGISTRO = "/inscripcion.html";
  function avisoNoMiembro(tipo) {
    const ov = document.createElement("div");
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-modal", "true");
    ov.setAttribute("aria-labelledby", "nm-t");
    ov.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:16px;z-index:60";
    const card = document.createElement("div");
    card.style.cssText = "background:#1F2328;border:1px solid #2C3036;border-left:4px solid #A3211B;border-radius:12px;padding:24px;max-width:460px;width:100%;box-sizing:border-box;color:#ECE7DC;font:400 16px/1.5 Inter,system-ui,sans-serif";
    const h = document.createElement("h3");
    h.id = "nm-t";
    h.style.cssText = "margin:0 0 10px;font:700 22px/1.2 Cinzel,Georgia,serif;color:#F0CE82";
    const p1 = document.createElement("p");
    p1.style.cssText = "margin:0 0 10px;color:#DCD6C8";
    const p2 = document.createElement("p");
    p2.style.cssText = "margin:0 0 18px;color:#CFC9BA;font-size:15px";
    if (tipo === "norole") {
      h.textContent = "Aún no tienes acceso";
      p1.textContent = "Tu cuenta está en el servidor de Discord del club, pero todavía no tiene ningún rol del club.";
      p2.textContent = "Si ya enviaste tu inscripción, espera a que un admin la apruebe. Si no, rellénala.";
    } else {
      h.textContent = "Todavía no eres del club";
      p1.textContent = "Para entrar en la web tienes que formar parte del servidor de Discord de Adeptus Baeticus.";
      p2.textContent = "¿Quieres unirte? Rellena la inscripción: cuando un admin la apruebe, pasarás a Aspirante y podrás entrar en la web.";
    }
    const acc = document.createElement("div");
    acc.style.cssText = "display:flex;gap:10px;flex-wrap:wrap";
    const btn = (txt, primario) => {
      const b = document.createElement(primario ? "a" : "button");
      b.textContent = txt;
      b.style.cssText = "display:inline-flex;align-items:center;justify-content:center;min-height:44px;box-sizing:border-box;padding:10px 18px;border-radius:8px;font:600 15px Inter,sans-serif;text-decoration:none;cursor:pointer;" +
        (primario ? "background:#A3211B;color:#fff;border:1px solid #A3211B" : "background:#1F2328;color:#ECE7DC;border:1px solid #6B6558");
      acc.appendChild(b);
      return b;
    };
    const f = btn("Rellenar la inscripción", true);
    f.href = FORM_REGISTRO;
    const faq = btn("Ver las preguntas frecuentes", true);
    faq.href = "/faq.html";
    faq.style.background = "#1F2328"; faq.style.borderColor = "#6B6558"; faq.style.color = "#ECE7DC";
    const cerrar = btn("Cerrar", false);
    cerrar.type = "button";
    const fuera = () => { ov.remove(); document.removeEventListener("keydown", esc); };
    const esc = (e) => { if (e.key === "Escape") fuera(); };
    cerrar.onclick = fuera;
    ov.addEventListener("click", (e) => { if (e.target === ov) fuera(); });
    document.addEventListener("keydown", esc);
    card.append(h, p1, p2, acc);
    ov.appendChild(card);
    document.body.appendChild(ov);
    f.focus();
  }
  // Salir del modo «ver como» (vuelve a la cuenta del admin).
  async function salirVerComo(recarga) {
    try {
      const r = await fetch("/api/ver-como/salir", { method: "POST" });
      if (r.ok) { recarga(); return; }
    } catch (e) {}
    alert("No se pudo salir del modo «ver como».");
  }
  // Franja fija arriba mientras se ve la web como otro usuario.
  function franjaVerComo(me) {
    let f = document.getElementById("ver-como");
    if (!me || !me.ver_como) { if (f) f.remove(); return; }
    if (!f) {
      f = document.createElement("div");
      f.id = "ver-como";
      f.setAttribute("role", "status");
      document.body.prepend(f);
    }
    f.textContent = "";
    const t = document.createElement("span");
    t.textContent = me.invitado ? "Estás viendo la web como invitado (sin registrar)." : "Estás viendo la web como " + me.name + " (solo lectura).";
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = "Salir de «ver como»";
    b.onclick = () => salirVerComo(() => { try { sessionStorage.removeItem(KEY); } catch (e) {} location.reload(); });
    f.append(t, b);
  }

  const css = document.createElement("style");
  css.textContent = ".um{position:relative;display:inline-block;vertical-align:middle}" +
    ".um-btn{display:inline-flex;align-items:center;gap:8px;background:none;border:1px solid transparent;border-radius:999px;padding:4px 10px 4px 4px;min-height:44px;color:#ECE7DC;font:500 15px Inter,system-ui,sans-serif;cursor:pointer}" +
    ".um-btn:hover,.um-btn[aria-expanded=true]{border-color:#6B6558;background:#1F2328}" +
    ".um-btn img{width:32px;height:32px;border-radius:50%}" +
    ".um-fl{color:#D9B25A;font-size:12px}" +
    ".um-menu{position:absolute;right:0;top:calc(100% + 6px);min-width:200px;background:#1F2328;border:1px solid #6B6558;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.5);padding:6px;z-index:60;display:flex;flex-direction:column}" +
    ".um-menu[hidden]{display:none}" +
    ".um-menu a{display:flex;align-items:center;min-height:44px;padding:0 12px;border-radius:6px;color:#ECE7DC;text-decoration:none;font-weight:500}" +
    ".um-menu a:hover,.um-menu a:focus{background:#2A2F36;color:#F0CE82;outline:none}" +
    ".um-vc{border-top:1px solid #2C3036;margin-top:6px;padding:8px 6px 4px}" +
    ".um-vc label{display:block;font-size:13px;color:#A8A293;margin-bottom:4px}" +
    ".um-vc select{width:100%;min-height:40px;border-radius:6px;border:1px solid #6B6558;background:#15171A;color:#ECE7DC;font:inherit;padding:6px}" +
    ".ss{position:relative;display:inline-block;vertical-align:middle;margin-right:2px}" +
    ".ss-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;background:none;border:1px solid transparent;border-radius:999px;cursor:pointer;padding:0}" +
    ".ss-btn:hover,.ss-btn[aria-expanded=true]{border-color:#6B6558;background:#1F2328}" +
    ".ss-btn svg{width:34px;height:34px;display:block}" +
    ".ss-n{position:absolute;top:2px;right:0;min-width:18px;height:18px;box-sizing:border-box;padding:0 5px;border-radius:999px;background:#A3211B;color:#fff;font:700 11px/18px Inter,sans-serif;text-align:center;border:2px solid #15171A}" +
    ".ss-menu{position:absolute;right:0;top:calc(100% + 6px);width:min(300px,calc(100vw - 32px));background:#1F2328;border:1px solid #6B6558;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.5);padding:8px;z-index:60;font:400 14px/1.4 Inter,system-ui,sans-serif}" +
    ".ss-menu[hidden]{display:none}" +
    "@media (max-width:600px){.ss{position:static}.ss-menu{left:16px;right:16px;width:auto}}" +
    ".ss-t{font:700 15px Cinzel,Georgia,serif;color:#F0CE82;margin:4px 6px 8px}" +
    ".ss-menu a{display:block;padding:8px 10px;border-radius:6px;color:#ECE7DC;text-decoration:none}" +
    ".ss-menu a:hover,.ss-menu a:focus{background:#2A2F36;outline:none}" +
    ".ss-menu a strong{display:block;font-weight:600;overflow-wrap:anywhere}" +
    ".ss-menu a span{font-size:12px;color:#A8A293}.ss-menu a span.pend{color:#F0A39E}" +
    ".ss-menu a.todas{border-top:1px solid #2C3036;margin-top:6px;border-radius:0 0 6px 6px;color:#D9B25A;font-weight:600}" +
    "#ver-como{position:relative;z-index:70;display:flex;gap:12px;align-items:center;justify-content:center;flex-wrap:wrap;background:#A3211B;color:#fff;padding:8px 16px;font:600 14px Inter,system-ui,sans-serif}" +
    "#ver-como button{background:#fff;color:#A3211B;border:0;border-radius:999px;padding:6px 14px;min-height:36px;font:700 13px Inter,sans-serif;cursor:pointer}";
  document.head.appendChild(css);
  const q = new URLSearchParams(location.search).get("login");
  // La sesión se guarda durante la visita para pintar la cabecera al instante al cambiar de página
  // (sin parpadeo); después se confirma con el servidor y, si ha cambiado, se vuelve a pintar.
  const KEY = "ab_me";
  const leeCache = () => { try { const v = sessionStorage.getItem(KEY); return v === null ? undefined : JSON.parse(v); } catch (e) { return undefined; } };
  const guarda = (v) => { try { sessionStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} };

  function askNr() {
    const ov = document.createElement("div");
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-modal", "true");
    ov.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:16px;z-index:50";
    const card = document.createElement("form");
    card.style.cssText = "background:#1F2328;border:1px solid #2C3036;border-radius:12px;padding:24px;max-width:420px;width:100%;color:#ECE7DC;font:400 16px/1.5 Inter,system-ui,sans-serif";
    const h = document.createElement("h3");
    h.textContent = "Bienvenido al club";
    h.style.cssText = "margin:0 0 8px;font:700 22px Cinzel,Georgia,serif";
    const p = document.createElement("p");
    p.textContent = "Indica tu usuario de New Recruit para vincular tus resultados en los torneos.";
    p.style.cssText = "margin:0 0 16px;color:#CFC9BA";
    const lb = document.createElement("label");
    lb.textContent = "Usuario de New Recruit";
    lb.htmlFor = "nr";
    lb.style.cssText = "display:block;font-weight:600;margin-bottom:6px";
    const inp = document.createElement("input");
    inp.id = "nr";
    inp.required = true;
    inp.maxLength = 40;
    inp.autocomplete = "off";
    inp.style.cssText = "width:100%;box-sizing:border-box;padding:12px;border-radius:8px;border:1px solid #6B6558;background:#15171A;color:#ECE7DC;font:inherit";
    const err = document.createElement("div");
    err.style.cssText = "color:#F0A39E;font-size:14px;min-height:20px;margin-top:6px";
    const btn = document.createElement("button");
    btn.type = "submit";
    btn.textContent = "Guardar";
    btn.style.cssText = "margin-top:8px;background:#A3211B;color:#fff;border:0;border-radius:8px;padding:12px 20px;font:600 15px Inter,sans-serif;cursor:pointer;min-height:44px";
    card.append(h, p, lb, inp, err, btn);
    ov.appendChild(card);
    document.body.appendChild(ov);
    inp.focus();
    card.onsubmit = async (ev) => {
      ev.preventDefault();
      err.textContent = "";
      btn.disabled = true;
      try {
        const r = await fetch("/api/profile", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ nr_username: inp.value }),
        });
        if (r.ok) { ov.remove(); return; }
        err.textContent = "Usuario no válido (de 2 a 40 caracteres).";
      } catch (e) {
        err.textContent = "No se pudo guardar. Inténtalo de nuevo.";
      }
      btn.disabled = false;
    };
  }

  // Servocalavera con una papeleta: aparece junto al usuario si hay encuestas abiertas para él; al pulsarla
  // se despliega la lista (con las que le faltan por votar marcadas). Los datos se guardan 2 minutos.
  const SERVO = '<svg viewBox="0 0 32 32" aria-hidden="true">' +
    '<path d="M8.5 12.5a7.5 7.5 0 0 1 15 0v3.8c0 .9-.5 1.6-1.3 2l-.7.3v2.4h-11v-2.4l-.7-.3c-.8-.4-1.3-1.1-1.3-2z" fill="#D9B25A"/>' +
    '<rect x="6.2" y="11" width="3.2" height="6" rx="1" fill="#8A6416"/><circle cx="7.8" cy="14" r=".8" fill="#15171A"/>' +
    '<path d="M12 4.8l-1-2.3" stroke="#8A6416" stroke-width="1.4" fill="none" stroke-linecap="round"/>' +
    '<ellipse cx="12.6" cy="14.3" rx="2" ry="2.2" fill="#15171A"/>' +
    '<circle cx="19.2" cy="14.3" r="2.6" fill="#15171A"/><circle cx="19.2" cy="14.3" r="1.5" fill="#E0403A"/>' +
    '<path d="M15.9 16.6l-1 1.8h2z" fill="#15171A"/>' +
    '<path d="M12.5 19.2v2.2M14.5 19.2v2.2M16.5 19.2v2.2M18.5 19.2v2.2" stroke="#15171A" stroke-width="1"/>' +
    '<path d="M12 21v3.5M15.5 21v5M19 21v3" stroke="#8A6416" stroke-width="1.2" stroke-linecap="round"/>' +
    '<path d="M22.5 18.5l2.5 2" stroke="#8A6416" stroke-width="1.4" stroke-linecap="round"/>' +
    '<rect x="22" y="19.5" width="8.5" height="11" rx="1" fill="#ECE7DC" transform="rotate(8 26 25)"/>' +
    '<path d="M24 25.4l1.6 1.7 3-3.6" stroke="#A3211B" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="rotate(8 26 25)"/>' +
    '</svg>';
  const ENC_KEY = "ab_enc";
  let encDatos = null;
  function servocalavera(box, wrap) {
    const abiertas = encDatos ? encDatos.filter((e) => e.abierta) : [];
    if (!abiertas.length) return;
    const pend = abiertas.filter((e) => !e.mis_votos.length).length;
    const ss = document.createElement("span");
    ss.className = "ss";
    const b = document.createElement("button");
    b.type = "button";
    b.className = "ss-btn";
    b.setAttribute("aria-haspopup", "true");
    b.setAttribute("aria-expanded", "false");
    const etiqueta = pend ? (pend === 1 ? "1 encuesta sin votar" : pend + " encuestas sin votar") : "Encuestas abiertas";
    b.setAttribute("aria-label", etiqueta);
    b.title = etiqueta;
    // SVG fijo escrito aquí (sin datos de usuario).
    b.appendChild(new DOMParser().parseFromString(SERVO.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"'), "image/svg+xml").documentElement);
    if (pend) { const n = document.createElement("span"); n.className = "ss-n"; n.textContent = String(pend); n.setAttribute("aria-hidden", "true"); b.appendChild(n); }
    const m = document.createElement("div");
    m.className = "ss-menu";
    m.hidden = true;
    const t = document.createElement("div");
    t.className = "ss-t";
    t.textContent = "Encuestas abiertas";
    m.appendChild(t);
    abiertas.slice(0, 5).forEach((e) => {
      const a = document.createElement("a");
      a.href = "/encuestas.html#e" + e.id;
      const q = document.createElement("strong");
      q.textContent = e.pregunta;
      q.setAttribute("translate", "no");
      const st = document.createElement("span");
      st.textContent = e.mis_votos.length ? "Ya has votado" : "Pendiente de votar";
      if (!e.mis_votos.length) st.className = "pend";
      a.append(q, st);
      m.appendChild(a);
    });
    const todas = document.createElement("a");
    todas.href = "/encuestas.html";
    todas.className = "todas";
    todas.textContent = "Ver todas las encuestas";
    m.appendChild(todas);
    const abre = (si) => { m.hidden = !si; b.setAttribute("aria-expanded", String(si)); };
    b.onclick = () => abre(m.hidden);
    ss.addEventListener("keydown", (e) => { if (e.key === "Escape" && !m.hidden) { abre(false); b.focus(); } });
    document.addEventListener("click", (e) => { if (!ss.contains(e.target)) abre(false); });
    m.addEventListener("click", () => abre(false));
    ss.append(b, m);
    box.insertBefore(ss, wrap);
  }
  function cargaEncuestas(me) {
    if (!me || me.invitado) return;
    if (encDePagina) return pinta(me);
    // En Inicio y en Encuestas los datos llegan de la propia página (evento «ab-encuestas»).
    if (/^\/(index(\.html)?|encuestas(\.html)?)?$/.test(location.pathname) && document.getElementById(location.pathname.startsWith("/encuestas") ? "lista" : "enc")) return;
    try { const c = JSON.parse(sessionStorage.getItem(ENC_KEY) || "null"); if (c && c.id === me.id && Date.now() - c.t < 120000) { encDatos = c.e; return pinta(me); } } catch (e) {}
    fetch("/api/encuestas").then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (!d) return;
      encDatos = d.encuestas.map((e) => ({ id: e.id, pregunta: e.pregunta, abierta: e.abierta, mis_votos: e.mis_votos }));
      try { sessionStorage.setItem(ENC_KEY, JSON.stringify({ id: me.id, t: Date.now(), e: encDatos })); } catch (e) {}
      pinta(me);
    }).catch(() => {});
  }
  // La página de encuestas pasa sus datos al votar o editar para que el icono se actualice sin otra petición.
  // Inicio también las carga: así el icono no hace otra petición.
  let encDePagina = false;
  let ultimoMe = null;
  const recibeEncuestas = (lista) => {
    if (!lista) return;
    encDePagina = true;
    encDatos = lista.map((e) => ({ id: e.id, pregunta: e.pregunta, abierta: e.abierta, mis_votos: e.mis_votos }));
    if (!ultimoMe || ultimoMe.invitado) return;
    try { sessionStorage.setItem(ENC_KEY, JSON.stringify({ id: ultimoMe.id, t: Date.now(), e: encDatos })); } catch (e) {}
    pinta(ultimoMe);
  };
  window.addEventListener("ab-encuestas", (ev) => recibeEncuestas(ev.detail));
  // Si la página ya las había recibido antes de cargar este script.
  if (window.abEncuestas) recibeEncuestas(window.abEncuestas);

  // Pestaña «Inscripción» en el menú principal, solo para quien no ha entrado (invitados).
  function pestanaInscripcion(mostrar) {
    const menu = document.querySelector(".nav .menu");
    if (!menu) return;
    let a = menu.querySelector("a.insc");
    if (mostrar && !a) {
      a = document.createElement("a");
      a.className = "insc" + (/^\/inscripcion(\.html)?$/.test(location.pathname) ? " on" : "");
      a.href = "/inscripcion.html";
      a.textContent = "Inscripción";
      menu.appendChild(a);
    } else if (!mostrar && a) a.remove();
  }

  function pinta(me) {
  ultimoMe = me;
  pestanaInscripcion(!me || !!me.invitado);
  box.textContent = "";
  if (window.abI18n) box.appendChild(window.abI18n.selector());
  if (me && me.invitado) {
    // «Ver como invitado»: la web como un visitante sin sesión, con la franja para volver.
    franjaVerComo(me);
    const a = document.createElement("a");
    a.href = "/auth/login";
    a.textContent = "Entrar con Discord";
    a.style.cssText = "background:#A3211B;color:#fff;border-radius:8px;padding:12px 20px;font-weight:600;text-decoration:none;display:inline-block";
    box.appendChild(a);
  } else if (me) {
    // Menú de usuario desplegable: avatar y nombre; dentro, Mis inscripciones, Admin y Salir.
    const wrap = document.createElement("span");
    wrap.className = "um";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "um-btn";
    btn.setAttribute("aria-haspopup", "true");
    btn.setAttribute("aria-expanded", "false");
    if (me.avatar) {
      const im = document.createElement("img");
      im.src = "https://cdn.discordapp.com/avatars/" + me.id + "/" + me.avatar + ".png?size=64";
      im.alt = "";
      btn.appendChild(im);
    }
    const nm = document.createElement("span");
    nm.textContent = me.name;
    nm.setAttribute("translate", "no");
    btn.append(nm);
    const flecha = document.createElement("span");
    flecha.className = "um-fl";
    flecha.setAttribute("aria-hidden", "true");
    flecha.textContent = "▾";
    btn.appendChild(flecha);
    const menu = document.createElement("div");
    menu.className = "um-menu";
    menu.hidden = true;
    const item = (href, txt) => {
      const a = document.createElement("a");
      a.href = href;
      a.textContent = txt;
      menu.appendChild(a);
      return a;
    };
    item("/miembros.html#yo", "Mi ficha");
    item("/encuestas.html", "Encuestas");
    item("#", "Notificaciones").addEventListener("click", (e) => { e.preventDefault(); abre(false); dialogoAvisos(); });
    item("/mis-inscripciones.html", "Mis inscripciones");
    if (me.role === "admin") item("/admin.html", "Admin");
    const recarga = () => { try { sessionStorage.removeItem(KEY); } catch (e) {} location.reload(); };
    if (me.ver_como) {
      // Volver a la cuenta del admin.
      const sal = item("#", "Salir de «ver como»");
      sal.onclick = (e) => { e.preventDefault(); salirVerComo(recarga); };
    } else if (me.role === "admin") {
      // Ver la web como otro usuario (solo lectura).
      const vc = document.createElement("div");
      vc.className = "um-vc";
      const lb = document.createElement("label");
      lb.textContent = "Ver la web como";
      lb.htmlFor = "um-vc-sel";
      const sel = document.createElement("select");
      sel.id = "um-vc-sel";
      const op = (v, t) => { const o = document.createElement("option"); o.value = v; o.textContent = t; sel.appendChild(o); return o; };
      op("", "— Elige un usuario —");
      op("invitado", "Invitado (sin registrar)");
      let cargado = false;
      const carga = () => {
        if (cargado) return;
        cargado = true;
        fetch("/api/admin/usuarios").then((r) => (r.ok ? r.json() : [])).then((us) => {
          us.filter((u) => u.discord_id !== me.id).forEach((u) => op(u.discord_id, u.name).setAttribute("translate", "no"));
        }).catch(() => {});
      };
      sel.addEventListener("focus", carga);
      btn.addEventListener("click", carga);
      sel.onchange = async () => {
        if (!sel.value) return;
        sel.disabled = true;
        try {
          const r = await fetch("/api/admin/ver-como", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ discord_id: sel.value }) });
          if (r.ok) { recarga(); return; }
          const d = await r.json().catch(() => ({}));
          alert(d.error || "No se pudo cambiar de usuario.");
        } catch (e) { alert("No se pudo cambiar de usuario."); }
        sel.disabled = false;
        sel.value = "";
      };
      vc.append(lb, sel);
      menu.appendChild(vc);
    }
    // Al salir se olvida la sesión guardada.
    item("/auth/logout", "Salir").addEventListener("click", () => { try { sessionStorage.removeItem(KEY); } catch (e) {} });
    const abre = (si) => {
      menu.hidden = !si;
      btn.setAttribute("aria-expanded", String(si));
      if (si) menu.querySelector("a").focus();
    };
    btn.onclick = () => abre(menu.hidden);
    wrap.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !menu.hidden) { abre(false); btn.focus(); }
      if ((e.key === "ArrowDown" || e.key === "ArrowUp") && !menu.hidden) {
        const as = [...menu.querySelectorAll("a")];
        const k = as.indexOf(document.activeElement);
        as[(k + (e.key === "ArrowDown" ? 1 : as.length - 1)) % as.length].focus();
        e.preventDefault();
      }
    });
    document.addEventListener("click", (e) => { if (!wrap.contains(e.target)) abre(false); });
    wrap.addEventListener("focusout", (e) => { if (!wrap.contains(e.relatedTarget)) abre(false); });
    wrap.append(btn, menu);
    box.appendChild(wrap);
    servocalavera(box, wrap);
    franjaVerComo(me);
  } else {
    franjaVerComo(null);
    const a = document.createElement("a");
    a.href = "/auth/login";
    a.textContent = "Entrar con Discord";
    a.style.cssText = "background:#A3211B;color:#fff;border-radius:8px;padding:12px 20px;font-weight:600;text-decoration:none;display:inline-block";
    box.appendChild(a);
    const txt = q === "nomember" || q === "norole" ? "" : msgs[q] || (q ? "Detalle: " + decodeURIComponent(q) : "");
    if (txt) {
      const s = document.createElement("div");
      s.style.cssText = "color:#A8A293;font-size:14px;margin-top:6px";
      s.textContent = txt;
      box.appendChild(s);
    }
  }
  }

  const cache = leeCache();
  if (cache !== undefined && !q) pinta(cache);
  fetch("/api/me").then((r) => r.json()).catch(() => null).then((me) => {
    if (cache === undefined || q || JSON.stringify(me) !== JSON.stringify(cache)) pinta(me);
    guarda(me);
    if (!me && (q === "nomember" || q === "norole")) {
      avisoNoMiembro(q);
      // Se quita ?login= de la dirección para que el aviso no vuelva a salir al recargar.
      try { const u = new URL(location.href); u.searchParams.delete("login"); history.replaceState(null, "", u.pathname + u.search + u.hash); } catch (e) {}
    }
    // Socio sin sus datos de inscripción completos: tiene que rellenarlos antes de seguir.
    if (me && me.completar && !me.ver_como && !(location.pathname === "/inscripcion.html" && /[?&]completar/.test(location.search))) { location.replace("/inscripcion.html?completar=1"); return; }
    if (me && !me.nr_username && !me.ver_como && !me.completar) askNr();
    if (!(me && me.completar)) cargaEncuestas(me);
  });
})();

// La cabecera fija mide más en el móvil (menú en dos filas): los saltos a una parte de la página (#enlaces,
// fichas, rondas…) descuentan su altura real para que no quede nada tapado debajo de ella.
(function () {
  const nav = document.querySelector(".nav");
  if (!nav) return;
  const ajusta = () => {
    const fija = getComputedStyle(nav).position === "sticky";
    document.documentElement.style.scrollPaddingTop = (fija ? Math.ceil(nav.getBoundingClientRect().height) + 12 : 0) + "px";
  };
  ajusta();
  if (window.ResizeObserver) new ResizeObserver(ajusta).observe(nav);
  else window.addEventListener("resize", ajusta);
})();
