(() => {
  const box = document.getElementById("auth");
  if (!box) return;
  const msgs = {
    nomember: "Tu cuenta de Discord no está en el servidor del club.",
    norole: "No tienes ninguno de los roles del club en Discord.",
    error: "No se pudo iniciar sesión. Inténtalo de nuevo.",
  };
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
    t.textContent = "Estás viendo la web como " + me.name + " (solo lectura).";
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

  function pinta(me) {
  box.textContent = "";
  if (window.abI18n) box.appendChild(window.abI18n.selector());
  if (me) {
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
    franjaVerComo(me);
  } else {
    franjaVerComo(null);
    const a = document.createElement("a");
    a.href = "/auth/login";
    a.textContent = "Entrar con Discord";
    a.style.cssText = "background:#A3211B;color:#fff;border-radius:8px;padding:12px 20px;font-weight:600;text-decoration:none;display:inline-block";
    box.appendChild(a);
    const txt = msgs[q] || (q ? "Detalle: " + decodeURIComponent(q) : "");
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
    if (me && !me.nr_username && !me.ver_como) askNr();
  });
})();
