(async () => {
  const box = document.getElementById("auth");
  if (!box) return;
  const msgs = {
    nomember: "Tu cuenta de Discord no está en el servidor del club.",
    norole: "No tienes ninguno de los roles del club en Discord.",
    error: "No se pudo iniciar sesión. Inténtalo de nuevo.",
  };
  const q = new URLSearchParams(location.search).get("login");
  let me = null;
  try { me = await (await fetch("/api/me")).json(); } catch (e) {}
  box.textContent = "";

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

  if (me) {
    if (me.avatar) {
      const im = document.createElement("img");
      im.src = "https://cdn.discordapp.com/avatars/" + me.id + "/" + me.avatar + ".png?size=64";
      im.alt = "";
      im.style.cssText = "width:32px;height:32px;border-radius:50%;vertical-align:middle;margin-right:8px";
      box.appendChild(im);
    }
    box.appendChild(document.createTextNode(me.name));
    const link = (href, txt) => {
      const a = document.createElement("a");
      a.href = href;
      a.textContent = txt;
      box.append(" · ", a);
    };
    link("/mis-inscripciones.html", "Mis inscripciones");
    if (me.role === "admin") link("/admin.html", "Admin");
    link("/auth/logout", "Salir");
    if (!me.nr_username) askNr();
  } else {
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
})();
