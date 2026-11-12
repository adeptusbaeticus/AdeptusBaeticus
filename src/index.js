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
      return Response.json(s ? { id: s.id, name: s.name, avatar: s.avatar, role: s.role } : null, {
        headers: { "cache-control": "no-store" },
      });
    }

    if (path === "/api/events") {
      const { results } = await env.DB.prepare(
        "SELECT id,type,title,starts_at,location,description,capacity FROM events WHERE status='publicado' ORDER BY starts_at"
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
