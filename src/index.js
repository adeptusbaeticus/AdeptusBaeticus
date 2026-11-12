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

// Qué va a hacer cada inscrito en una quedada.
const ACTIVIDADES = {
  ver: "Ir a ver",
  pintar: "Ir a pintar",
  combat_patrol: "Ir a jugar Combat Patrol",
  "40k_1000": "Ir a jugar 40k a 1k",
  "40k_2000": "Ir a jugar 40k a 2k",
  necromunda: "Ir a jugar Necromunda",
  bloodbowl: "Ir a jugar Blood Bowl",
};
const CON_FORMATO = ["combat_patrol", "40k_1000"];

// Valida el formulario de inscripción. Devuelve { error } o el plan con los huecos de
// compañeros (bando A) y rivales/participantes (bando B) que permite el formato.
function parsePlan(b, uid) {
  const activity = String(b.activity || "");
  if (!ACTIVIDADES[activity]) return { error: "Elige qué vas a hacer en la quedada" };
  const plan = { activity, format: null, players: null, team: [], rivals: [], looking: 0 };
  if (activity === "ver" || activity === "pintar") return plan;
  let team = 0, rivals = 1;
  if (CON_FORMATO.includes(activity)) {
    plan.format = b.format;
    if (plan.format === "1v2") {
      if (b.side === "solo") rivals = 2;
      else if (b.side === "pareja") team = 1;
      else return { error: "Indica si vas solo o en pareja en el 1vs2" };
    } else if (plan.format === "2v2") { team = 1; rivals = 2; }
    else if (plan.format !== "1v1") return { error: "Elige el formato de la partida" };
  } else if (activity === "necromunda") {
    plan.players = Number(b.players);
    if (!Number.isInteger(plan.players) || plan.players < 1 || plan.players > 9) {
      return { error: "El número de participantes debe estar entre 1 y 9" };
    }
    rivals = plan.players - 1;
  } else {
    plan.format = "1v1";
  }
  const ids = (v) => (Array.isArray(v) ? v : []).map((x) => String(x == null ? "" : x).trim()).filter(Boolean);
  plan.team = ids(b.teammates);
  plan.rivals = ids(b.rivals);
  if (plan.team.length > team || plan.rivals.length > rivals) return { error: "Hay más jugadores de los que permite el formato" };
  const all = [...plan.team, ...plan.rivals];
  if (all.some((x) => !/^\d{1,25}$/.test(x)) || all.includes(uid) || new Set(all).size !== all.length) {
    return { error: "La lista de jugadores no es válida" };
  }
  // Si quedan huecos sin rellenar, sigue buscando rival.
  plan.looking = all.length < team + rivals ? 1 : 0;
  return plan;
}

function planText(r) {
  if (!r.activity) return "";
  let t = ACTIVIDADES[r.activity] || r.activity;
  if (r.activity === "necromunda" && r.players) t += " · " + r.players + " participantes";
  else if (CON_FORMATO.includes(r.activity) && r.format) t += " · " + r.format.replace("v", "vs");
  return t;
}

// Añade a cada inscripción su plan en texto y los nombres de compañeros y rivales.
// `players` son filas { match_id, side, discord_id, name } de las partidas implicadas.
function withPartners(rows, players) {
  return rows.map((r) => {
    const others = r.match_id ? players.filter((p) => p.match_id === r.match_id && p.discord_id !== r.discord_id) : [];
    const necro = r.activity === "necromunda";
    return {
      ...r,
      plan: planText(r),
      companeros: necro ? [] : others.filter((p) => p.side === r.side).map((p) => p.name),
      rivales: (necro ? others : others.filter((p) => p.side !== r.side)).map((p) => p.name),
    };
  });
}

function partidaText(r) {
  const out = [];
  if (r.companeros.length) out.push("Compañero: " + r.companeros.join(", "));
  if (r.rivales.length) out.push((r.activity === "necromunda" ? "Participantes: " : "Rival: ") + r.rivales.join(", "));
  if (r.looking) out.push("Busca rival");
  return out.join(" · ");
}

// Jugadores de las partidas en las que aparecen estas inscripciones.
async function matchPlayers(env, where, ...args) {
  const { results } = await env.DB.prepare(
    `SELECT r.match_id, r.side, r.discord_id, u.name
     FROM registrations r LEFT JOIN users u ON u.discord_id=r.discord_id
     WHERE r.match_id IN (SELECT match_id FROM registrations WHERE match_id IS NOT NULL AND ${where})
     ORDER BY r.id`
  ).bind(...args).all();
  return results;
}

// Tamaños de los dos bandos que admite cada formato.
const SHAPES = { "1v1": [[1, 1]], "1v2": [[1, 2], [2, 1]], "2v2": [[2, 2]] };
const shapeFits = (fmt, a, b) => (SHAPES[fmt] || []).some(([x, y]) => a <= x && b <= y);
const shapeFull = (fmt, a, b) => (SHAPES[fmt] || []).some(([x, y]) => a === x && b === y);
const shapeFormat = (a, b) => ({ "1,1": "1v1", "1,2": "1v2", "2,2": "2v2" })[[a, b].sort().join()] || null;
const needed = (r) => (r.activity === "necromunda" ? r.players || 1 : { "1v1": 2, "1v2": 3, "2v2": 4 }[r.format] || 2);

// ¿Puede alguien que busca rival con `plan` unirse a la entrada `r`? 40k a 1k comparte todos
// sus formatos; Combat Patrol exige el mismo formato; el resto, el mismo juego.
const compatible = (plan, r) =>
  plan.activity === r.activity && (plan.activity !== "combat_patrol" || plan.format === r.format);

// Personas o partidas incompletas que buscan rival en una quedada, una entrada por partida.
async function openEntries(env, eventId) {
  const { results } = await env.DB.prepare(
    `SELECT r.discord_id, u.name, r.activity, r.format, r.players, r.match_id, r.side
     FROM registrations r JOIN users u ON u.discord_id=r.discord_id
     WHERE r.event_id=?1 AND r.looking=1 AND r.activity NOT IN ('ver','pintar')
     ORDER BY r.id`
  ).bind(eventId).all();
  const groups = new Map();
  for (const r of results) {
    const k = r.match_id || "solo:" + r.discord_id;
    if (!groups.has(k)) groups.set(k, { join: r.discord_id, activity: r.activity, format: r.format, players: r.players, names: [] });
    groups.get(k).names.push(r.name);
  }
  return [...groups.values()].map((g) => ({ ...g, plan: planText(g), faltan: Math.max(0, needed(g) - g.names.length) }));
}

// Plaza libre → 'inscrito'; si no, 'espera'. Se evalúa dentro de cada INSERT (alias e = events).
const STATE_SQL = `CASE WHEN e.capacity IS NULL
  OR (SELECT COUNT(*) FROM registrations x WHERE x.event_id=e.id AND x.status='inscrito') < e.capacity
  THEN 'inscrito' ELSE 'espera' END`;

// ===== Partidas: un socio busca partida y otros se unen =====

// Hoy y los 6 días siguientes (7 en total), "YYYY-MM-DD", hora de Madrid.
function weekDays(now) {
  const d = new Date(now.slice(0, 10) + "T00:00:00Z");
  const out = [];
  for (let i = 0; i < 7; i++) {
    const x = new Date(d);
    x.setUTCDate(d.getUTCDate() + i);
    out.push(x.toISOString().slice(0, 10));
  }
  return out;
}
const HORA = /^([01]\d|2[0-3]):00$/;

// Valida el formulario de "Buscar partida". Devuelve { error } o los datos a guardar.
function parsePartida(b, now) {
  const plan = parsePlan({ ...b, teammates: [], rivals: [] }, "");
  if (plan.error) return plan;
  if (plan.activity === "ver" || plan.activity === "pintar") return { error: "Elige una modalidad de juego" };
  let ta = 1, tb = 1;
  if (plan.activity === "necromunda") {
    if (plan.players < 2) return { error: "En Necromunda hacen falta al menos 2 participantes" };
    tb = plan.players - 1;
  } else if (plan.format === "2v2") { ta = 2; tb = 2; }
  else if (plan.format === "1v2") { if (b.side === "pareja") ta = 2; else tb = 2; }
  const days = weekDays(now), today = now.slice(0, 10), hour = now.slice(11);
  const seen = new Set(), availability = [];
  for (const x of Array.isArray(b.availability) ? b.availability : []) {
    const date = String((x && x.date) || ""), from = String((x && x.from) || ""), to = String((x && x.to) || "");
    if (!days.includes(date) || seen.has(date) || !HORA.test(from) || !HORA.test(to) || from >= to) {
      return { error: "Revisa los días y las horas" };
    }
    if (date === today && to <= hour) return { error: "Las horas que has marcado para hoy ya han pasado" };
    seen.add(date);
    availability.push({ date, from, to });
  }
  if (!availability.length) return { error: "Marca al menos un día con sus horas" };
  availability.sort((x, y) => (x.date < y.date ? -1 : 1));
  return { ...plan, team_a: ta, team_b: tb, availability };
}

const MAX_PARTIDAS = 14; // partidas abiertas por socio

// ¿Está `slot` ("YYYY-MM-DDTHH:MM") dentro de la disponibilidad?
const inAvailability = (av, slot) =>
  /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):00$/.test(slot) &&
  av.some((x) => x.date === slot.slice(0, 10) && slot.slice(11) >= x.from && slot.slice(11) < x.to);

// Primera mesa libre (1-5): ocupada si otra partida completa empieza a menos de 3 horas.
const MESA_SQL = `(SELECT n FROM (SELECT 1 AS n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5)
  WHERE n NOT IN (SELECT q.mesa FROM partidas q WHERE q.id<>partidas.id AND q.status='completa' AND q.mesa IS NOT NULL
    AND abs(julianday(q.starts_at) - julianday(partidas.starts_at)) * 24 < 3)
  ORDER BY n LIMIT 1)`;

// Partidas recientes (o una) con sus jugadores, vistas por el usuario `uid`.
async function listPartidas(env, uid, id) {
  const where = "p.status<>'cancelada' AND p.last_day>=date('now','-60 days')" + (id ? " AND p.id=?1" : "");
  const args = id ? [id] : [];
  const ps = await env.DB.prepare(
    `SELECT p.*, u.name AS organiza FROM partidas p JOIN users u ON u.discord_id=p.created_by WHERE ${where} ORDER BY p.id`
  ).bind(...args).all();
  const js = await env.DB.prepare(
    `SELECT j.partida_id, j.side, j.discord_id, u.name FROM partida_players j
     JOIN partidas p ON p.id=j.partida_id JOIN users u ON u.discord_id=j.discord_id
     WHERE ${where} ORDER BY j.created_at, j.rowid`
  ).bind(...args).all();
  return ps.results.map((p) => {
    const jug = js.results.filter((j) => j.partida_id === p.id);
    return {
      id: p.id, activity: p.activity, format: p.format, players: p.players, plan: planText(p),
      organiza: p.organiza, availability: JSON.parse(p.availability), starts_at: p.starts_at,
      last_day: p.last_day, mesa: p.mesa, status: p.status, team_a: p.team_a, team_b: p.team_b,
      jugadores: jug.map((j) => ({ name: j.name, side: j.side, yo: j.discord_id === uid })),
      faltan: Math.max(0, p.team_a + p.team_b - jug.length),
      mia: p.created_by === uid,
      dentro: jug.some((j) => j.discord_id === uid),
    };
  });
}

// ===== Galería: /publicar, /editar y /borrar desde Discord =====
const CANAL_PUBLICACIONES = "publicaciones-web";
const DAPI = "https://discord.com/api/v10";
const hexBytes = (h) => new Uint8Array(h.match(/../g).map((x) => parseInt(x, 16)));

// Discord firma cada interacción con Ed25519; si la firma no cuadra, se rechaza.
async function verifyDiscord(env, request, raw) {
  const sig = request.headers.get("x-signature-ed25519") || "";
  const ts = request.headers.get("x-signature-timestamp") || "";
  if (!env.DISCORD_PUBLIC_KEY || !/^[0-9a-f]{128}$/i.test(sig) || !/^\d+$/.test(ts)) return false;
  try {
    const key = await crypto.subtle.importKey("raw", hexBytes(env.DISCORD_PUBLIC_KEY.trim()), { name: "Ed25519" }, false, ["verify"]);
    return await crypto.subtle.verify("Ed25519", key, hexBytes(sig), enc.encode(ts + raw));
  } catch (e) {
    return false;
  }
}

const bot = (env, path, init = {}) =>
  fetch(DAPI + path, { ...init, headers: { authorization: "Bot " + env.DISCORD_BOT_TOKEN, ...(init.headers || {}) } });

const DISCORD_COMMANDS = [
  {
    name: "publicar", description: "Publica una foto en la galería de la web",
    options: [
      { type: 11, name: "imagen", description: "La foto (PNG, JPG, GIF o WEBP, hasta 10 MB)", required: true },
      { type: 3, name: "texto", description: "Texto que acompaña a la foto", required: false, max_length: 500 },
    ],
  },
  {
    name: "editar", description: "Cambia el texto de una de tus publicaciones",
    options: [
      { type: 4, name: "id", description: "ID de la publicación", required: true, min_value: 1 },
      { type: 3, name: "texto", description: "Nuevo texto", required: true, max_length: 500 },
    ],
  },
  {
    name: "borrar", description: "Borra una de tus publicaciones de la web",
    options: [{ type: 4, name: "id", description: "ID de la publicación", required: true, min_value: 1 }],
  },
];

// Texto del mensaje del bot en el canal (menciona al autor sin notificarle).
const pubMensaje = (id, uid, texto) => `📸 **Publicación ${id}** · <@${uid}>` + (texto ? "\n" + texto : "");

// Ejecuta un comando y devuelve el texto de la respuesta privada para quien lo usa.
async function runCommand(env, it, uid, name, role) {
  const opt = Object.fromEntries((it.data.options || []).map((o) => [o.name, o.value]));
  const cmd = it.data.name;

  if (cmd === "publicar") {
    const att = ((it.data.resolved || {}).attachments || {})[opt.imagen];
    const tipo = att && (att.content_type || "").split(";")[0];
    const EXT = { "image/png": "png", "image/jpeg": "jpg", "image/gif": "gif", "image/webp": "webp" };
    if (!att || !EXT[tipo]) return "La imagen debe ser PNG, JPG, GIF o WEBP.";
    if (att.size > 10 * 1024 * 1024) return "La imagen no puede pasar de 10 MB.";
    const texto = String(opt.texto || "").trim().slice(0, 500) || null;
    const img = await fetch(att.url);
    if (!img.ok) return "No se pudo leer la imagen. Inténtalo de nuevo.";
    const blob = await img.blob();
    const r = await env.DB.prepare("INSERT INTO publicaciones (discord_id, autor, texto, channel_id) VALUES (?1,?2,?3,?4)")
      .bind(uid, name, texto, it.channel_id).run();
    const id = r.meta.last_row_id;
    const filename = `publicacion-${id}.${EXT[tipo]}`;
    const fd = new FormData();
    fd.append("payload_json", JSON.stringify({
      content: pubMensaje(id, uid, texto), allowed_mentions: { parse: [] }, attachments: [{ id: 0, filename }],
    }));
    fd.append("files[0]", blob, filename);
    const pm = await bot(env, `/channels/${it.channel_id}/messages`, { method: "POST", body: fd });
    if (!pm.ok) {
      await env.DB.prepare("DELETE FROM publicaciones WHERE id=?1").bind(id).run();
      return `No se pudo publicar (error ${pm.status}). Revisa que el bot pueda escribir y adjuntar archivos en #${CANAL_PUBLICACIONES}.`;
    }
    const msg = await pm.json();
    const a = (msg.attachments || [])[0] || {};
    await env.DB.prepare(
      "UPDATE publicaciones SET message_id=?2, image_url=?3, width=?4, height=?5, status='publicada' WHERE id=?1"
    ).bind(id, msg.id, a.url || null, a.width || null, a.height || null).run();
    return `✅ Publicada en la web con ID **${id}**.\nPara cambiar el texto: \`/editar id:${id}\` · Para quitarla: \`/borrar id:${id}\``;
  }

  const p = await env.DB.prepare("SELECT * FROM publicaciones WHERE id=?1").bind(Number(opt.id)).first();
  if (!p) return `No existe ninguna publicación con ID ${opt.id}.`;

  if (cmd === "editar") {
    if (p.discord_id !== uid) return "Solo puedes editar tus propias publicaciones.";
    const texto = String(opt.texto || "").trim().slice(0, 500) || null;
    if (p.message_id) {
      const r = await bot(env, `/channels/${p.channel_id}/messages/${p.message_id}`, {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: pubMensaje(p.id, p.discord_id, texto), allowed_mentions: { parse: [] } }),
      });
      if (!r.ok && r.status !== 404) return `No se pudo editar el mensaje en Discord (error ${r.status}).`;
    }
    await env.DB.prepare("UPDATE publicaciones SET texto=?2, updated_at=datetime('now') WHERE id=?1").bind(p.id, texto).run();
    return `✏️ Texto de la publicación ${p.id} actualizado.`;
  }

  if (cmd === "borrar") {
    if (p.discord_id !== uid && role !== "admin") return "Solo puedes borrar tus propias publicaciones.";
    if (p.message_id) {
      const r = await bot(env, `/channels/${p.channel_id}/messages/${p.message_id}`, { method: "DELETE" });
      if (!r.ok && r.status !== 404) return `No se pudo borrar el mensaje en Discord (error ${r.status}).`;
    }
    await env.DB.prepare("DELETE FROM publicaciones WHERE id=?1").bind(p.id).run();
    return `🗑️ Publicación ${p.id} borrada de la web y del canal.`;
  }
  return "Comando desconocido.";
}

// Caducidad (segundos) de un enlace de adjunto de Discord, del parámetro ?ex=.
const urlExpira = (u) => {
  const m = /[?&]ex=([0-9a-f]+)/i.exec(u || "");
  return m ? parseInt(m[1], 16) : 0;
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const back = (q) => Response.redirect(url.origin + "/?login=" + q, 302);

    // Interacciones de Discord (comandos /publicar, /editar y /borrar).
    if (path === "/discord/interactions" && request.method === "POST") {
      const raw = await request.text();
      if (!(await verifyDiscord(env, request, raw))) return new Response("Firma no válida", { status: 401 });
      let it;
      try { it = JSON.parse(raw); } catch (e) { return new Response("JSON no válido", { status: 400 }); }
      if (it.type === 1) return Response.json({ type: 1 }); // PING de verificación
      const reply = (content) => Response.json({ type: 4, data: { content, flags: 64, allowed_mentions: { parse: [] } } });
      if (it.type !== 2) return reply("Acción no soportada.");
      if (!it.member || it.guild_id !== env.GUILD_ID) return reply("Usa este comando en el servidor del club.");
      const role = roleOf(env, it.member.roles || []);
      if (!role) return reply("Necesitas uno de los roles del club para usar este comando.");
      if (!it.channel || it.channel.name !== CANAL_PUBLICACIONES) return reply(`Usa este comando en #${CANAL_PUBLICACIONES}.`);
      if (!env.DISCORD_BOT_TOKEN) return reply("El bot aún no está configurado. Avisa a un admin.");
      const u = it.member.user;
      const name = it.member.nick || u.global_name || u.username;
      // Se responde enseguida («pensando…», solo visible para quien lo usa) y el trabajo sigue en segundo plano.
      const edit = (content) => fetch(`${DAPI}/webhooks/${it.application_id}/${it.token}/messages/@original`, {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({ content, allowed_mentions: { parse: [] } }),
      });
      ctx.waitUntil((async () => {
        let msg;
        try { msg = await runCommand(env, it, u.id, name, role); } catch (e) { msg = "Algo ha fallado. Inténtalo de nuevo."; }
        await edit(msg);
      })());
      return Response.json({ type: 5, data: { flags: 64 } });
    }

    // Galería pública: las publicaciones, con los enlaces de imagen renovados si van a caducar.
    if (path === "/api/galeria" && request.method === "GET") {
      const { results } = await env.DB.prepare(
        "SELECT id, autor, texto, image_url, width, height, created_at, updated_at FROM publicaciones WHERE status='publicada' ORDER BY id DESC LIMIT 300"
      ).all();
      const pronto = Date.now() / 1000 + 3600;
      const viejos = results.filter((r) => r.image_url && urlExpira(r.image_url) < pronto);
      if (viejos.length && env.DISCORD_BOT_TOKEN) {
        for (let i = 0; i < viejos.length; i += 50) {
          const lote = viejos.slice(i, i + 50);
          try {
            const r = await bot(env, "/attachments/refresh-urls", {
              method: "POST", headers: { "content-type": "application/json" },
              body: JSON.stringify({ attachment_urls: lote.map((x) => x.image_url) }),
            });
            if (!r.ok) continue;
            const map = new Map(((await r.json()).refreshed_urls || []).map((x) => [x.original, x.refreshed]));
            const upd = [];
            for (const x of lote) {
              const nu = map.get(x.image_url);
              if (nu && nu !== x.image_url) {
                upd.push(env.DB.prepare("UPDATE publicaciones SET image_url=?2 WHERE id=?1").bind(x.id, nu));
                x.image_url = nu;
              }
            }
            if (upd.length) await env.DB.batch(upd);
          } catch (e) {}
        }
      }
      // Sin caché: las fotos nuevas, editadas o borradas tienen que verse al momento.
      return Response.json(results, { headers: noStore });
    }

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
        const fail = (error, status) => Response.json({ error }, { status, headers: noStore });
        if (!(request.headers.get("content-type") || "").includes("application/json")) return fail("Tipo no válido", 415);
        let b;
        try { b = await request.json(); } catch (x) { return fail("JSON no válido", 400); }
        b = b || {};
        const join = b.join == null || b.join === "" ? null : String(b.join);
        if (join) { b.teammates = []; b.rivals = []; }
        const plan = parsePlan(b, s.id);
        if (plan.error) return fail(plan.error, 400);
        if (join && (!/^\d{1,25}$/.test(join) || join === s.id)) return fail("Jugador no válido", 400);

        const ev = await env.DB.prepare("SELECT type,status,starts_at FROM events WHERE id=?1").bind(eventId).first();
        if (!ev || ev.type !== "quedada" || ev.status !== "publicado") return fail("Evento no disponible", 404);
        if (ev.starts_at <= now) return fail("La inscripción está cerrada", 409);
        const ya = await env.DB.prepare("SELECT 1 FROM registrations WHERE event_id=?1 AND discord_id=?2").bind(eventId, s.id).first();
        if (ya) return fail("Ya estás inscrito en esta quedada", 409);

        // Unirse a alguien que busca rival: se juega en su formato y se ocupa el hueco libre.
        if (join) {
          const c = await env.DB.prepare(
            "SELECT discord_id, activity, format, players, looking, match_id FROM registrations WHERE event_id=?1 AND discord_id=?2"
          ).bind(eventId, join).first();
          if (!c || !c.looking || !compatible(plan, c)) return fail("Esa persona ya no busca rival para esta partida", 409);
          const sides = c.match_id
            ? (await env.DB.prepare("SELECT side FROM registrations WHERE match_id=?1").bind(c.match_id).all()).results.map((x) => x.side)
            : ["A"];
          let a = sides.filter((x) => x === "A").length, bb = sides.length - a, side;
          if (c.activity === "necromunda") {
            if (sides.length >= (c.players || 1)) return fail("La partida ya está completa", 409);
            side = "B"; bb++;
          } else if (shapeFits(c.format, a, bb + 1)) { side = "B"; bb++; }
          else if (shapeFits(c.format, a + 1, bb)) { side = "A"; a++; }
          else return fail("La partida ya está completa", 409);
          const full = c.activity === "necromunda" ? a + bb >= c.players : shapeFull(c.format, a, bb);
          const matchId = c.match_id || crypto.randomUUID();
          const stmts = [];
          if (!c.match_id) {
            stmts.push(env.DB.prepare(
              "INSERT INTO matches (id,event_id,activity,format,players,created_by) VALUES (?1,?2,?3,?4,?5,?6)"
            ).bind(matchId, eventId, c.activity, c.format, c.players, c.discord_id));
            stmts.push(env.DB.prepare(
              "UPDATE registrations SET match_id=?1, side='A' WHERE event_id=?2 AND discord_id=?3 AND match_id IS NULL"
            ).bind(matchId, eventId, c.discord_id));
          }
          stmts.push(env.DB.prepare(
            `INSERT INTO registrations (event_id,discord_id,status,created_at,activity,format,players,looking,match_id,side)
             SELECT e.id, ?2, ${STATE_SQL}, datetime('now'), ?4, ?5, ?6, ?7, ?8, ?9
             FROM events e
             WHERE e.id=?1 AND e.type='quedada' AND e.status='publicado' AND e.starts_at>?3
             ON CONFLICT(event_id, discord_id) DO NOTHING`
          ).bind(eventId, s.id, now, c.activity, c.format, c.players, full ? 0 : 1, matchId, side));
          stmts.push(env.DB.prepare("UPDATE registrations SET looking=?1 WHERE match_id=?2").bind(full ? 0 : 1, matchId));
          await env.DB.batch(stmts);
          const st = await regState(env, eventId, s.id);
          if (!st.status) return fail("No se pudo completar la inscripción. Inténtalo de nuevo.", 409);
          return Response.json({ ...st, added: [] }, { headers: noStore });
        }

        const others = [...plan.team.map((id) => [id, "A"]), ...plan.rivals.map((id) => [id, "B"])];
        if (others.length) {
          const ph = others.map((_, i) => "?" + (i + 2)).join(",");
          const { results } = await env.DB.prepare(
            `SELECT u.discord_id, u.name, r.match_id FROM users u
             LEFT JOIN registrations r ON r.discord_id=u.discord_id AND r.event_id=?1
             WHERE u.discord_id IN (${ph})`
          ).bind(eventId, ...others.map((o) => o[0])).all();
          if (results.length !== others.length) return fail("Algún jugador no es socio del club", 400);
          const busy = results.filter((x) => x.match_id).map((x) => x.name);
          if (busy.length) return fail(busy.join(", ") + " ya tiene partida en esta quedada", 409);
        }

        // Todo en un batch (transacción). El estado de cada jugador se calcula dentro de su
        // propio INSERT, así que dos peticiones simultáneas no pueden ocupar la misma última plaza.
        const matchId = others.length ? crypto.randomUUID() : null;
        const stmts = [];
        if (matchId) {
          stmts.push(env.DB.prepare(
            "INSERT INTO matches (id,event_id,activity,format,players,created_by) VALUES (?1,?2,?3,?4,?5,?6)"
          ).bind(matchId, eventId, plan.activity, plan.format, plan.players, s.id));
        }
        stmts.push(env.DB.prepare(
          `INSERT INTO registrations (event_id,discord_id,status,created_at,activity,format,players,looking,match_id,side)
           SELECT e.id, ?2, ${STATE_SQL}, datetime('now'), ?4, ?5, ?6, ?7, ?8, ?9
           FROM events e
           WHERE e.id=?1 AND e.type='quedada' AND e.status='publicado' AND e.starts_at>?3
           ON CONFLICT(event_id, discord_id) DO NOTHING`
        ).bind(eventId, s.id, now, plan.activity, plan.format, plan.players, plan.looking, matchId, matchId ? "A" : null));
        // Compañeros y rivales: se inscriben (o, si ya estaban inscritos sin partida, se les
        // asigna esta). Solo si la inscripción de quien los añade se ha creado en este batch.
        for (const [id, side] of others) {
          stmts.push(env.DB.prepare(
            `INSERT INTO registrations (event_id,discord_id,status,created_at,activity,format,players,looking,match_id,side,added_by)
             SELECT e.id, ?2, ${STATE_SQL}, datetime('now'), ?3, ?4, ?5, ?9, ?6, ?7, ?8
             FROM events e
             WHERE e.id=?1 AND EXISTS (SELECT 1 FROM registrations m WHERE m.event_id=?1 AND m.discord_id=?8 AND m.match_id=?6)
             ON CONFLICT(event_id, discord_id) DO UPDATE SET
               activity=excluded.activity, format=excluded.format, players=excluded.players, looking=excluded.looking,
               match_id=excluded.match_id, side=excluded.side, added_by=excluded.added_by
             WHERE registrations.match_id IS NULL`
          ).bind(eventId, id, plan.activity, plan.format, plan.players, matchId, side, s.id, plan.looking));
        }
        await env.DB.batch(stmts);

        const st = await regState(env, eventId, s.id);
        if (!st.status) return fail("No se pudo completar la inscripción. Inténtalo de nuevo.", 409);
        let added = [];
        if (matchId) {
          ({ results: added } = await env.DB.prepare(
            `SELECT u.name, r.status FROM registrations r JOIN users u ON u.discord_id=r.discord_id
             WHERE r.match_id=?1 AND r.discord_id<>?2 ORDER BY r.id`
          ).bind(matchId, s.id).all());
        }
        return Response.json({ ...st, added }, { headers: noStore });
      }

      const e = await env.DB.prepare("SELECT starts_at FROM events WHERE id=?1").bind(eventId).first();
      if (!e) return Response.json({ error: "Evento no disponible" }, { status: 404, headers: noStore });
      if (e.starts_at <= now) {
        return Response.json({ error: "El evento ya ha empezado" }, { status: 409, headers: noStore });
      }
      // Si tenía partida, el resto baja de formato (2vs2 → 1vs2 → 1vs1, también si se va quien
      // iba solo en un 1vs2; Necromunda, menos participantes). Si solo queda uno, se deshace la
      // partida y vuelve a buscar rival.
      const fix = [];
      const mine = await env.DB.prepare("SELECT match_id FROM registrations WHERE event_id=?1 AND discord_id=?2").bind(eventId, s.id).first();
      if (mine && mine.match_id) {
        const mid = mine.match_id;
        const m = await env.DB.prepare("SELECT activity, format, players FROM matches WHERE id=?1").bind(mid).first();
        const rest = (await env.DB.prepare("SELECT id, side FROM registrations WHERE match_id=?1 AND discord_id<>?2 ORDER BY id").bind(mid, s.id).all()).results;
        const a = rest.filter((x) => x.side === "A").length, bb = rest.length - a;
        let set = null;
        if (rest.length <= 1) {
          fix.push(env.DB.prepare("UPDATE registrations SET match_id=NULL, side=NULL, looking=1 WHERE match_id=?1 AND discord_id<>?2").bind(mid, s.id));
        } else if (m && m.activity === "necromunda") set = { format: null, players: rest.length, looking: 0 };
        else if (a && bb) set = { format: shapeFormat(a, bb), players: null, looking: 0 };
        else {
          // Se va quien iba solo en un 1vs2: la pareja que queda pasa a jugar un 1vs1 entre sí.
          set = { format: "1v1", players: null, looking: 0 };
          fix.push(env.DB.prepare("UPDATE registrations SET side=CASE WHEN id=?1 THEN 'A' ELSE 'B' END WHERE match_id=?2 AND discord_id<>?3")
            .bind(rest[0].id, mid, s.id));
        }
        if (set) {
          fix.push(env.DB.prepare("UPDATE registrations SET format=?1, players=?2, looking=?3 WHERE match_id=?4 AND discord_id<>?5")
            .bind(set.format, set.players, set.looking, mid, s.id));
          fix.push(env.DB.prepare("UPDATE matches SET format=?1, players=?2 WHERE id=?3").bind(set.format, set.players, mid));
        }
      }
      const res = await env.DB.batch([
        ...fix,
        env.DB.prepare("DELETE FROM registrations WHERE event_id=?1 AND discord_id=?2").bind(eventId, s.id),
        env.DB.prepare(PROMOTE_SQL).bind(eventId),
        // Partidas que se han quedado sin jugadores.
        env.DB.prepare(
          "DELETE FROM matches WHERE event_id=?1 AND id NOT IN (SELECT match_id FROM registrations WHERE event_id=?1 AND match_id IS NOT NULL)"
        ).bind(eventId),
      ]);
      if (!res[fix.length].meta.changes) return Response.json({ error: "No estabas inscrito" }, { status: 404, headers: noStore });
      return Response.json(await regState(env, eventId, s.id), { headers: noStore });
    }

    if (path === "/api/my-registrations" && request.method === "GET") {
      const s = await readSession(env, request);
      if (!s) return Response.json({ error: "Inicia sesión con Discord" }, { status: 401, headers: noStore });
      const { results } = await env.DB.prepare(
        `SELECT e.id, e.title, e.starts_at, e.location, e.capacity, e.status AS event_status,
           r.status, r.created_at, r.discord_id, r.activity, r.format, r.players, r.looking, r.match_id, r.side,
           (SELECT name FROM users a WHERE a.discord_id=r.added_by) AS inscrito_por,
           CASE WHEN r.status='espera' THEN
             (SELECT COUNT(*) FROM registrations w WHERE w.event_id=r.event_id AND w.status='espera' AND w.id<=r.id)
           END AS posicion
         FROM registrations r JOIN events e ON e.id=r.event_id
         WHERE r.discord_id=?1 AND e.status IN ('publicado','cancelado')
         ORDER BY e.starts_at`
      ).bind(s.id).all();
      const players = results.some((r) => r.match_id) ? await matchPlayers(env, "discord_id=?1", s.id) : [];
      const out = withPartners(results, players).map(({ discord_id, match_id, side, ...r }) => r);
      return Response.json(out, { headers: { ...noStore, vary: "cookie" } });
    }

    // Quién busca rival en una quedada (requiere sesión).
    const lkm = path.match(/^\/api\/events\/(\d+)\/looking$/);
    if (lkm && request.method === "GET") {
      const s = await readSession(env, request);
      if (!s) return Response.json({ error: "Inicia sesión con Discord" }, { status: 401, headers: noStore });
      const list = (await openEntries(env, Number(lkm[1]))).filter((g) => g.join !== s.id && g.faltan > 0);
      return Response.json(list, { headers: { ...noStore, vary: "cookie" } });
    }

    // Partidas (requiere sesión: se ven nombres de socios).
    if (path === "/api/partidas" || path.startsWith("/api/partidas/")) {
      const s = await readSession(env, request);
      if (!s) return Response.json({ error: "Inicia sesión con Discord" }, { status: 401, headers: noStore });
      if (request.method !== "GET" && !sameOrigin(request, url)) return new Response("Prohibido", { status: 403 });
      const fail = (error, status) => Response.json({ error }, { status, headers: noStore });
      const ok = (data) => Response.json(data, { headers: { ...noStore, vary: "cookie" } });
      const body = async () => {
        if (!(request.headers.get("content-type") || "").includes("application/json")) return null;
        try { return (await request.json()) || {}; } catch (x) { return null; }
      };
      const now = nowLocal();

      if (path === "/api/partidas") {
        if (request.method === "GET") return ok(await listPartidas(env, s.id));
        // Borrar en bloque mis partidas que aún no han pasado (todas o solo las vacías).
        if (request.method === "DELETE") {
          const vacias = url.searchParams.get("solo") === "vacias";
          const r = await env.DB.prepare(
            `UPDATE partidas SET status='cancelada', mesa=NULL
             WHERE created_by=?1 AND status<>'cancelada'
               AND ((starts_at IS NULL AND last_day>=?2) OR starts_at>?3)
               ${vacias ? "AND (SELECT COUNT(*) FROM partida_players j WHERE j.partida_id=partidas.id) <= 1" : ""}`
          ).bind(s.id, now.slice(0, 10), now).run();
          return ok({ borradas: r.meta.changes });
        }
        if (request.method !== "POST") return new Response("Método no permitido", { status: 405 });
        const b = await body();
        if (!b) return fail("JSON no válido", 400);
        const p = parsePartida(b, now);
        if (p.error) return fail(p.error, 400);
        const n = await env.DB.prepare(
          "SELECT COUNT(*) AS n FROM partidas WHERE created_by=?1 AND status<>'cancelada' AND last_day>=?2"
        ).bind(s.id, now.slice(0, 10)).first();
        if (n.n + p.availability.length > MAX_PARTIDAS) {
          return fail(`Puedes tener como máximo ${MAX_PARTIDAS} partidas abiertas (ahora tienes ${n.n})`, 409);
        }
        // Una partida independiente por cada día marcado, cada una con sus propios rivales.
        const ids = [];
        for (const av of p.availability) {
          const r = await env.DB.prepare(
            `INSERT INTO partidas (created_by,activity,format,players,team_a,team_b,availability,last_day)
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8)`
          ).bind(s.id, p.activity, p.format, p.players, p.team_a, p.team_b, JSON.stringify([av]), av.date).run();
          ids.push(r.meta.last_row_id);
          await env.DB.prepare("INSERT INTO partida_players (partida_id,discord_id,side) VALUES (?1,?2,'A')").bind(r.meta.last_row_id, s.id).run();
        }
        return ok((await listPartidas(env, s.id)).filter((x) => ids.includes(x.id)));
      }

      const pm = path.match(/^\/api\/partidas\/(\d+)(\/join)?$/);
      if (!pm) return new Response("No encontrado", { status: 404 });
      const pid = Number(pm[1]);
      const p = await env.DB.prepare("SELECT * FROM partidas WHERE id=?1").bind(pid).first();
      if (!p || p.status === "cancelada") return fail("La partida ya no existe", 404);

      // Retirar la partida (quien la organiza o un admin).
      if (!pm[2]) {
        if (request.method !== "DELETE") return new Response("Método no permitido", { status: 405 });
        if (p.created_by !== s.id && s.role !== "admin") return fail("Solo quien organiza puede retirarla", 403);
        await env.DB.prepare("UPDATE partidas SET status='cancelada', mesa=NULL WHERE id=?1").bind(pid).run();
        return ok({ ok: true });
      }

      if (request.method === "POST") {
        if (p.status !== "abierta") return fail("La partida ya está completa", 409);
        const b = (await body()) || {};
        const slot = p.starts_at || String(b.slot || "");
        if (!p.starts_at && !inAvailability(JSON.parse(p.availability), slot)) return fail("Elige un día y una hora de los que se ofrecen", 400);
        if (slot <= now) return fail("Esa hora ya ha pasado", 409);
        const { results: js } = await env.DB.prepare("SELECT discord_id, side FROM partida_players WHERE partida_id=?1").bind(pid).all();
        if (js.some((j) => j.discord_id === s.id)) return fail("Ya estás en esta partida", 409);
        const a = js.filter((j) => j.side === "A").length, bb = js.length - a;
        // Bando elegido (no en Necromunda); si no se elige, primero rival y luego compañero.
        const want = p.activity !== "necromunda" && (b.side === "A" || b.side === "B") ? b.side : null;
        if (want && (want === "A" ? a >= p.team_a : bb >= p.team_b)) return fail("Ese bando ya está completo", 409);
        const side = want || (bb < p.team_b ? "B" : a < p.team_a ? "A" : null);
        if (!side) return fail("La partida ya está completa", 409);
        const [ins] = await env.DB.batch([
          // El hueco se comprueba dentro del INSERT para que dos personas no ocupen el mismo.
          env.DB.prepare(
            `INSERT INTO partida_players (partida_id,discord_id,side)
             SELECT ?1, ?2, ?3 WHERE EXISTS (SELECT 1 FROM partidas WHERE id=?1 AND status='abierta')
               AND (SELECT COUNT(*) FROM partida_players WHERE partida_id=?1 AND side=?3) < ?4
             ON CONFLICT DO NOTHING`
          ).bind(pid, s.id, side, side === "A" ? p.team_a : p.team_b),
          env.DB.prepare(
            `UPDATE partidas SET starts_at=?2 WHERE id=?1 AND starts_at IS NULL
               AND EXISTS (SELECT 1 FROM partida_players WHERE partida_id=?1 AND discord_id=?3)`
          ).bind(pid, slot, s.id),
          env.DB.prepare(
            `UPDATE partidas SET status='completa', mesa=${MESA_SQL}
             WHERE id=?1 AND status='abierta' AND (SELECT COUNT(*) FROM partida_players WHERE partida_id=?1) >= team_a + team_b`
          ).bind(pid),
        ]);
        if (!ins.meta.changes) return fail("Alguien ha ocupado el hueco antes. Vuelve a intentarlo.", 409);
        return ok((await listPartidas(env, s.id, pid))[0]);
      }

      if (request.method === "DELETE") {
        if (p.created_by === s.id) return fail("Organizas esta partida: usa «Retirar partida»", 400);
        if (p.starts_at && p.starts_at <= now) return fail("La partida ya ha empezado", 409);
        const [del] = await env.DB.batch([
          env.DB.prepare("DELETE FROM partida_players WHERE partida_id=?1 AND discord_id=?2").bind(pid, s.id),
          // Si estaba completa, se vuelve a abrir y se libera la mesa.
          env.DB.prepare("UPDATE partidas SET status='abierta', mesa=NULL WHERE id=?1 AND status='completa'").bind(pid),
          // Si solo queda quien organiza, se vuelve a ofrecer toda su disponibilidad.
          env.DB.prepare(
            "UPDATE partidas SET starts_at=NULL WHERE id=?1 AND (SELECT COUNT(*) FROM partida_players WHERE partida_id=?1) <= 1"
          ).bind(pid),
        ]);
        if (!del.meta.changes) return fail("No estabas en esta partida", 404);
        return ok((await listPartidas(env, s.id, pid))[0]);
      }
      return new Response("Método no permitido", { status: 405 });
    }

    // Socios para elegir compañero o rival (solo nombre; requiere sesión).
    if (path === "/api/members" && request.method === "GET") {
      const s = await readSession(env, request);
      if (!s) return Response.json({ error: "Inicia sesión con Discord" }, { status: 401, headers: noStore });
      const { results } = await env.DB.prepare(
        "SELECT discord_id AS id, name FROM users WHERE discord_id<>?1 ORDER BY name COLLATE NOCASE"
      ).bind(s.id).all();
      return Response.json(results, { headers: { ...noStore, vary: "cookie" } });
    }

    if (path.startsWith("/api/admin/")) {
      const s = await readSession(env, request);
      if (!s) return new Response("No autorizado", { status: 401 });
      if (s.role !== "admin") return new Response("Prohibido", { status: 403 });

      // Estado del bot de Discord y registro de los comandos de la galería en el servidor.
      if (path === "/api/admin/discord") {
        const cfg = { public_key: !!env.DISCORD_PUBLIC_KEY, bot_token: !!env.DISCORD_BOT_TOKEN };
        if (request.method === "GET") return Response.json(cfg, { headers: noStore });
        if (request.method !== "POST") return new Response("Método no permitido", { status: 405 });
        if (!sameOrigin(request, url)) return new Response("Prohibido", { status: 403 });
        if (!cfg.bot_token) return Response.json({ error: "Falta el secreto DISCORD_BOT_TOKEN" }, { status: 400 });
        const r = await bot(env, `/applications/${env.DISCORD_CLIENT_ID}/guilds/${env.GUILD_ID}/commands`, {
          method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(DISCORD_COMMANDS),
        });
        const t = await r.text();
        if (!r.ok) return Response.json({ error: "Discord respondió " + r.status + ": " + t.slice(0, 200) }, { status: 502 });
        return Response.json({ ok: true, comandos: JSON.parse(t).map((c) => c.name) });
      }

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
          `SELECT u.name, u.nr_username, r.status, r.created_at, r.discord_id,
             r.activity, r.format, r.players, r.looking, r.match_id, r.side,
             (SELECT name FROM users a WHERE a.discord_id=r.added_by) AS inscrito_por
           FROM registrations r LEFT JOIN users u ON u.discord_id=r.discord_id
           WHERE r.event_id=?1
           ORDER BY CASE r.status WHEN 'inscrito' THEN 0 ELSE 1 END, r.id`
        ).bind(eventId).all();
        const players = await matchPlayers(env, "event_id=?1", eventId);
        const list = withPartners(results, players).map((r) => ({
          name: r.name, nr_username: r.nr_username, status: r.status, created_at: r.created_at,
          plan: r.plan, partida: partidaText(r), inscrito_por: r.inscrito_por,
        }));
        if (!rgm[2]) return Response.json(list, { headers: noStore });
        const lines = [["Nombre", "Usuario New Recruit", "Estado", "Actividad", "Partida", "Inscrito por", "Fecha de inscripción (UTC)"]]
          .concat(list.map((x) => [x.name, x.nr_username, ESTADOS[x.status] || x.status, x.plan, x.partida, x.inscrito_por, x.created_at]))
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
