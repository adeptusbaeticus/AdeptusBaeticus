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
  if (me) {
    if (me.avatar) {
      const im = document.createElement("img");
      im.src = "https://cdn.discordapp.com/avatars/" + me.id + "/" + me.avatar + ".png?size=64";
      im.alt = "";
      im.style.cssText = "width:32px;height:32px;border-radius:50%;vertical-align:middle;margin-right:8px";
      box.appendChild(im);
    }
    box.appendChild(document.createTextNode(me.name + " · "));
    const out = document.createElement("a");
    out.href = "/auth/logout";
    out.textContent = "Salir";
    box.appendChild(out);
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
