const FEED = "https://adeptus-baeticus.blogspot.com/feeds/posts/default?alt=json&max-results=6";
const COOKIE = "ab_session";
const MAX_AGE = 3 * 24 * 3600;
const enc = new TextEncoder();

const b64u = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const toB64 = (s) => b64u(enc.encode(s));
const fromB64 = (s) =>
  new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)));

async function hmac(secret, data) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64u(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

async function makeSession(env, user) {
  const body = toB64(JSON.stringify({ ...user, exp: Math.floor(Date.now() / 1000) + MAX_AGE }));
  return body + "." + (await hmac(env.SESSION_SECRET, body));
}

async function readSession(env, request) {
  const m = (request.headers.get("cookie") || "").match(new RegExp(COOKIE + "=([^;]+)"));
  if (!m) return null;
  const [body, sig] = m[1].split(".");
  if (!body || !sig || sig !== (await hmac(env.SESSION_SECRET, body))) return null;
  try {
    const u = JSON.parse(fromB64(body));
    return u.exp > Date.now() / 1000 ? u : null;
  } catch (e) {
    return null;
  }
}

function roleOf(env, roles) {
  if (roles.includes(env.ROLE_ADMIN)) return "admin";
  if (roles.includes(env.ROLE_VETERANO)) return "veterano";
  if (roles.includes(env.ROLE_MIEMBRO)) return "miembro";
  if (roles.includes(env.ROLE_ASPIRANTE)) return "aspirante";
  return null;
}

// Hora actual en Madrid con el mismo formato que events.starts_at ("YYYY-MM-DDTHH:MM").
function nowLocal() {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date()).map((x) => [x.type, x.value])
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

// Mismo origen para peticiones que modifican datos (además de SameSite=Lax).
const sameOrigin = (request, url) => {
  const o = request.headers.get("origin");
  return !o || o === url.origin;
};

const noStore = { "cache-control": "no-store" };

// Pasa a 'inscrito' a los primeros de la lista de espera mientras queden plazas
// (todos si no hay límite). Solo en quedadas publicadas.
const PROMOTE_SQL = `UPDATE registrations SET status='inscrito' WHERE id IN (
  SELECT id FROM registrations WHERE event_id=?1 AND status='espera' ORDER BY id
  LIMIT (SELECT CASE
    WHEN e.status<>'publicado' OR e.type<>'quedada' THEN 0
    WHEN e.capacity IS NULL THEN -1
    ELSE MAX(0, e.capacity - (SELECT COUNT(*) FROM registrations r WHERE r.event_id=e.id AND r.status='inscrito'))
  END FROM events e WHERE e.id=?1))`;

// Recuentos del evento y estado del usuario (status null si no está inscrito).
function regState(env, eventId, uid) {
  return env.DB.prepare(
    `SELECT
      (SELECT COUNT(*) FROM registrations WHERE event_id=?1 AND status='inscrito') AS inscritos,
      (SELECT COUNT(*) FROM registrations WHERE event_id=?1 AND status='espera') AS en_espera,
      r.status AS status,
      CASE WHEN r.status='espera' THEN
        (SELECT COUNT(*) FROM registrations w WHERE w.event_id=?1 AND w.status='espera' AND w.id<=r.id)
      END AS posicion
    FROM (SELECT 1) LEFT JOIN registrations r ON r.event_id=?1 AND r.discord_id=?2`
  ).bind(eventId, uid).first();
}

// Celda CSV: neutraliza fórmulas de Excel y escapa comillas.
function csvCell(v) {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}

const ESTADOS = { inscrito: "Inscrito", espera: "Lista de espera" };

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const back = (q) => Response.redirect(url.origin + "/?login=" + q, 302);

    if (path === "/auth/login") {
      const state = crypto.randomUUID();
      const p = new URLSearchParams({
        client_id: env.DISCORD_CLIENT_ID,
        response_type: "code",
        scope: "identify guilds.members.read",
        redirect_uri: url.origin + "/auth/callback",
        state,
      });
      return new Response(null, {
        status: 302,
        headers: {
          location: "https://discord.com/oauth2/authorize?" + p,
          "set-cookie": `ab_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
        },
      });
    }

    if (path === "/auth/callback") {
      const st = ((request.headers.get("cookie") || "").match(/ab_state=([^;]+)/) || [])[1];
      const code = url.searchParams.get("code");
      if (!st || st !== url.searchParams.get("state") || !code) return back("e_state");
      const tok = await fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: env.DISCORD_CLIENT_ID,
          client_secret: env.DISCORD_CLIENT_SECRET,
          grant_type: "authorization_code",
          code,
          redirect_uri: url.origin + "/auth/callback",
        }),
      });
      if (!tok.ok) return back("e_token_" + tok.status + "_" + encodeURIComponent((await tok.text()).slice(0, 80)));
      const { access_token } = await tok.json();
      const mr = await fetch(`https://discord.com/api/users/@me/guilds/${env.GUILD_ID}/member`, {
        headers: { authorization: "Bearer " + access_token },
      });
      if (!mr.ok) return back("nomember");
      const mem = await mr.json();
      const role = roleOf(env, mem.roles || []);
      if (!role) return back("norole");
      const u = mem.user;
      const name = mem.nick || u.global_name || u.username;
      await env.DB.prepare(
        "INSERT INTO users (discord_id,name,avatar,role) VALUES (?1,?2,?3,?4) ON CONFLICT(discord_id) DO UPDATE SET name=excluded.name, avatar=excluded.avatar, role=excluded.role"
      ).bind(u.id, name, u.avatar, role).run();
      const cookie = await makeSession(env, { id: u.id, name, avatar: u.avatar, role });
      const h = new Headers({ location: url.origin + "/" });
      h.append("set-cookie", `${COOKIE}=${cookie}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`);
      h.append("set-cookie", "ab_state=; Path=/; Max-Age=0");
      return new Response(null, { status: 302, headers: h });
    }

    if (path === "/auth/logout") {
      return new Response(null, {
        status: 302,
        headers: { location: "/", "set-cookie": `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0` },
      });
    }

    if (path === "/api/me") {
      const s = await readSession(env, request);
      let nr = null;
      if (s) {
        const row = await env.DB.prepare("SELECT nr_username FROM users WHERE discord_id=?1").bind(s.id).first();
        nr = row ? row.nr_username : null;
      }
      return Response.json(
        s ? { id: s.id, name: s.name, avatar: s.avatar, role: s.role, nr_username: nr } : null,
        { headers: { "cache-control": "no-store" } }
      );
    }

    if (path === "/api/profile" && request.method === "POST") {
      const s = await readSession(env, request);
      if (!s) return new Response("No autorizado", { status: 401 });
      let nr = "";
      try { nr = String((await request.json()).nr_username || "").trim(); } catch (e) {}
      if (!/^[\p{L}\p{N} ._@-]{2,40}$/u.test(nr)) {
        return Response.json({ error: "Usuario no válido" }, { status: 400 });
      }
      await env.DB.prepare("UPDATE users SET nr_username=?1 WHERE discord_id=?2").bind(nr, s.id).run();
      return Response.json({ ok: true, nr_username: nr });
    }

    const regm = path.match(/^\/api\/events\/(\d+)\/register$/);
    if (regm) {
      if (request.method !== "POST" && request.method !== "DELETE") {
        return new Response("Método no permitido", { status: 405, headers: { allow: "POST, DELETE" } });
      }
      const s = await readSession(env, request);
      if (!s) return Response.json({ error: "Inicia sesión con Discord" }, { status: 401, headers: noStore });
      if (!sameOrigin(request, url)) return new Response("Prohibido", { status: 403 });
      const eventId = Number(regm[1]);
      const now = nowLocal();

      if (request.method === "POST") {
        // El estado se decide dentro del propio INSERT: D1 ejecuta cada sentencia de forma
        // atómica, así que dos peticiones simultáneas no pueden ocupar la misma última plaza.
        const r = await env.DB.prepare(
          `INSERT INTO registrations (event_id, discord_id, status, created_at)
           SELECT e.id, ?2,
             CASE WHEN e.capacity IS NULL
               OR (SELECT COUNT(*) FROM registrations x WHERE x.event_id=e.id AND x.status='inscrito') < e.capacity
             THEN 'inscrito' ELSE 'espera' END,
             datetime('now')
           FROM events e
           WHERE e.id=?1 AND e.type='quedada' AND e.status='publicado' AND e.starts_at>?3
           ON CONFLICT(event_id, discord_id) DO NOTHING`
        ).bind(eventId, s.id, now).run();
        if (!r.meta.changes) {
          const e = await env.DB.prepare("SELECT type,status,starts_at FROM events WHERE id=?1").bind(eventId).first();
          if (!e || e.type !== "quedada" || e.status !== "publicado") {
            return Response.json({ error: "Evento no disponible" }, { status: 404, headers: noStore });
          }
          if (e.starts_at <= now) {
            return Response.json({ error: "La inscripción está cerrada" }, { status: 409, headers: noStore });
          }
          // Ya estaba inscrito: se devuelve su estado actual (petición idempotente).
        }
        return Response.json(await regState(env, eventId, s.id), { headers: noStore });
      }

      const e = await env.DB.prepare("SELECT starts_at FROM events WHERE id=?1").bind(eventId).first();
      if (!e) return Response.json({ error: "Evento no disponible" }, { status: 404, headers: noStore });
      if (e.starts_at <= now) {
        return Response.json({ error: "El evento ya ha empezado" }, { status: 409, headers: noStore });
      }
      const [del] = await env.DB.batch([
        env.DB.prepare("DELETE FROM registrations WHERE event_id=?1 AND discord_id=?2").bind(eventId, s.id),
        env.DB.prepare(PROMOTE_SQL).bind(eventId),
      ]);
      if (!del.meta.changes) return Response.json({ error: "No estabas inscrito" }, { status: 404, headers: noStore });
      return Response.json(await regState(env, eventId, s.id), { headers: noStore });
    }

    if (path === "/api/my-registrations" && request.method === "GET") {
      const s = await readSession(env, request);
      if (!s) return Response.json({ error: "Inicia sesión con Discord" }, { status: 401, headers: noStore });
      const { results } = await env.DB.prepare(
        `SELECT e.id, e.title, e.starts_at, e.location, e.capacity, e.status AS event_status,
           r.status, r.created_at,
           CASE WHEN r.status='espera' THEN
             (SELECT COUNT(*) FROM registrations w WHERE w.event_id=r.event_id AND w.status='espera' AND w.id<=r.id)
           END AS posicion
         FROM registrations r JOIN events e ON e.id=r.event_id
         WHERE r.discord_id=?1 AND e.status IN ('publicado','cancelado')
         ORDER BY e.starts_at`
      ).bind(s.id).all();
      return Response.json(results, { headers: { ...noStore, vary: "cookie" } });
    }

    if (path.startsWith("/api/admin/")) {
      const s = await readSession(env, request);
      if (!s) return new Response("No autorizado", { status: 401 });
      if (s.role !== "admin") return new Response("Prohibido", { status: 403 });

      if (path === "/api/admin/events" && request.method === "GET") {
        const { results } = await env.DB.prepare("SELECT * FROM events ORDER BY starts_at DESC").all();
        return Response.json(results, { headers: { "cache-control": "no-store" } });
      }

      const idm = path.match(/^\/api\/admin\/events\/(\d+)$/);
      const isCreate = path === "/api/admin/events" && request.method === "POST";
      const isUpdate = idm && request.method === "PUT";
      if (isCreate || isUpdate) {
        if (!(request.headers.get("content-type") || "").includes("application/json")) {
          return new Response("Tipo no válido", { status: 415 });
        }
        let b;
        try { b = await request.json(); } catch (e) { return Response.json({ error: "JSON no válido" }, { status: 400 }); }
        const clean = (v, n) => (v == null || String(v).trim() === "" ? null : String(v).trim().slice(0, n));
        const ev = {
          type: b.type,
          title: clean(b.title, 120),
          starts_at: b.starts_at,
          location: clean(b.location, 160),
          description: clean(b.description, 1000),
          capacity: b.capacity === "" || b.capacity == null ? null : parseInt(b.capacity, 10),
          nr: clean(b.nr_tournament_id, 80),
          status: b.status || "publicado",
        };
        const okCap = ev.capacity === null || (ev.capacity > 0 && ev.capacity <= 1000);
        if (
          !["quedada", "torneo"].includes(ev.type) || !ev.title ||
          !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(ev.starts_at || "") ||
          !["publicado", "borrador", "cancelado"].includes(ev.status) || !okCap
        ) {
          return Response.json({ error: "Datos no válidos" }, { status: 400 });
        }
        if (isCreate) {
          const r = await env.DB.prepare(
            "INSERT INTO events (type,title,starts_at,location,description,capacity,nr_tournament_id,status) VALUES (?1,?2,?3,?4,?5,?6,?7,?8)"
          ).bind(ev.type, ev.title, ev.starts_at, ev.location, ev.description, ev.capacity, ev.nr, ev.status).run();
          return Response.json({ ok: true, id: r.meta.last_row_id });
        }
        await env.DB.batch([
          env.DB.prepare(
            "UPDATE events SET type=?1,title=?2,starts_at=?3,location=?4,description=?5,capacity=?6,nr_tournament_id=?7,status=?8 WHERE id=?9"
          ).bind(ev.type, ev.title, ev.starts_at, ev.location, ev.description, ev.capacity, ev.nr, ev.status, Number(idm[1])),
          // Si se han ampliado las plazas, entra gente de la lista de espera.
          env.DB.prepare(PROMOTE_SQL).bind(Number(idm[1])),
        ]);
        return Response.json({ ok: true });
      }

      const rgm = path.match(/^\/api\/admin\/events\/(\d+)\/registrations(\.csv)?$/);
      if (rgm && request.method === "GET") {
        const eventId = Number(rgm[1]);
        const e = await env.DB.prepare("SELECT id,title FROM events WHERE id=?1").bind(eventId).first();
        if (!e) return new Response("No encontrado", { status: 404 });
        const { results } = await env.DB.prepare(
          `SELECT u.name, u.nr_username, r.status, r.created_at
           FROM registrations r LEFT JOIN users u ON u.discord_id=r.discord_id
           WHERE r.event_id=?1
           ORDER BY CASE r.status WHEN 'inscrito' THEN 0 ELSE 1 END, r.id`
        ).bind(eventId).all();
        if (!rgm[2]) return Response.json(results, { headers: noStore });
        const lines = [["Nombre", "Usuario New Recruit", "Estado", "Fecha de inscripción (UTC)"]]
          .concat(results.map((x) => [x.name, x.nr_username, ESTADOS[x.status] || x.status, x.created_at]))
          .map((row) => row.map(csvCell).join(";"));
        return new Response("﻿" + lines.join("\r\n") + "\r\n", {
          headers: {
            ...noStore,
            "content-type": "text/csv; charset=utf-8",
            "content-disposition": `attachment; filename="inscritos-evento-${eventId}.csv"`,
          },
        });
      }
      return new Response("No encontrado", { status: 404 });
    }
    
    if (path === "/api/events") {
      const { results } = await env.DB.prepare(
        `SELECT e.id,e.type,e.title,e.starts_at,e.location,e.description,e.capacity,
           (SELECT COUNT(*) FROM registrations r WHERE r.event_id=e.id AND r.status='inscrito') AS inscritos,
           (SELECT COUNT(*) FROM registrations r WHERE r.event_id=e.id AND r.status='espera') AS en_espera
         FROM events e WHERE e.status='publicado' ORDER BY e.starts_at`
      ).all();
      return Response.json(results, { headers: { "cache-control": "public, max-age=60" } });
    }

    if (path === "/api/blog") {
      const cache = caches.default;
      const key = new Request(url.origin + "/api/blog");
      const hit = await cache.match(key);
      if (hit) return hit;
      try {
        const r = await fetch(FEED);
        const j = await r.json();
        const posts = (j.feed.entry || []).map((e) => {
          const html = (e.content && e.content.$t) || "";
          const text = html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
          const img = (html.match(/<img[^>]+src="([^"]+)"/) || [])[1] || null;
          const link = (e.link.find((l) => l.rel === "alternate") || {}).href;
          return {
            title: e.title.$t,
            url: link,
            date: e.published.$t,
            tag: ((e.category || [])[0] || {}).term || "",
            excerpt: text.slice(0, 160),
            image: img,
          };
        });
        const res = new Response(JSON.stringify(posts), {
          headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=600" },
        });
        ctx.waitUntil(cache.put(key, res.clone()));
        return res;
      } catch (err) {
        return new Response("[]", { status: 502, headers: { "content-type": "application/json" } });
      }
    }

    return env.ASSETS.fetch(request);
  },
};
