// Service worker de la web del club: permite instalarla como app y verla sin conexión.
// Siempre se pide primero a la red (para no mostrar versiones viejas tras un despliegue);
// la copia guardada solo se usa si no hay conexión. /api, /auth, /discord y /cal nunca se guardan.
const CACHE = "ab-v1";
const BASE = ["/", "/index.html", "/calendario.html", "/galeria.html", "/gran-liga.html", "/miembros.html", "/faq.html",
  "/i18n.js", "/auth.js", "/Final_General.png", "/icon-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(BASE)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

const SIN_CONEXION = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sin conexión · Adeptus Baeticus</title><body style="margin:0;background:#15171A;color:#ECE7DC;font:16px/1.5 system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center;padding:24px">
<div><h1 style="font:700 28px Georgia,serif;color:#F0CE82">Sin conexión</h1><p>No hay conexión a internet. Vuelve a intentarlo en un momento.</p>
<p style="color:#A8A293">No internet connection. Please try again in a moment.</p>
<button onclick="location.reload()" style="background:#A3211B;color:#fff;border:0;border-radius:8px;padding:12px 20px;font:600 15px system-ui;min-height:44px">Reintentar · Retry</button></div></body></html>`;

self.addEventListener("fetch", (e) => {
  const r = e.request;
  const u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin) return;
  if (/^\/(api|auth|discord|cal)\//.test(u.pathname)) return;
  e.respondWith((async () => {
    try {
      const res = await fetch(r);
      if (res.ok && res.type === "basic") {
        const copia = res.clone();
        caches.open(CACHE).then((c) => c.put(r, copia)).catch(() => {});
      }
      return res;
    } catch (err) {
      const guardada = await caches.match(r, { ignoreSearch: r.mode === "navigate" });
      if (guardada) return guardada;
      if (r.mode === "navigate") return new Response(SIN_CONEXION, { headers: { "content-type": "text/html; charset=utf-8" } });
      throw err;
    }
  })());
});
