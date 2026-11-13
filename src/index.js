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
  "40k_1000": "Ir a jugar 40k a 1K",
  "40k_2000": "Ir a jugar 40k a 2K",
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

// ¿Puede alguien que busca rival con `plan` unirse a la entrada `r`? 40k a 1K comparte todos
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
    name: "publicar", description: "Publica hasta 10 fotos en la galería de la web",
    options: [
      { type: 11, name: "imagen", description: "Foto (PNG, JPG, GIF o WEBP, hasta 10 MB)", required: true },
      { type: 3, name: "texto", description: "Texto que acompaña a las fotos", required: false, max_length: 500 },
      ...[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({ type: 11, name: "imagen" + n, description: "Foto " + n + " (opcional)", required: false })),
    ],
  },
  {
    name: "editar", description: "Cambia el texto de una de tus publicaciones",
    options: [
      { type: 4, name: "id", description: "Número de la publicación", required: true, min_value: 1 },
      { type: 3, name: "texto", description: "Nuevo texto", required: true, max_length: 500 },
    ],
  },
  {
    name: "añadir", description: "Añade una foto al final de una de tus publicaciones",
    options: [
      { type: 4, name: "id", description: "Número de la publicación", required: true, min_value: 1 },
      { type: 11, name: "imagen", description: "Foto (PNG, JPG, GIF o WEBP, hasta 10 MB)", required: true },
    ],
  },
  {
    name: "añadir-post", description: "Publica un post en la web (imagen, título y descripción). Solo admins",
    options: [{ type: 11, name: "imagen", description: "Imagen del post (PNG, JPG, GIF o WEBP, hasta 10 MB)", required: true }],
  },
  {
    name: "editar-post", description: "Edita el título y la descripción de un post de la web. Solo admins",
    options: [{ type: 4, name: "post", description: "Escribe parte del título para buscarlo", required: true, autocomplete: true }],
  },
  {
    name: "borrar-post", description: "Borra un post de la web. Solo admins",
    options: [{ type: 4, name: "post", description: "Escribe parte del título para buscarlo", required: true, autocomplete: true }],
  },
  {
    name: "borrar", description: "Borra una de tus publicaciones de la web",
    options: [{ type: 4, name: "id", description: "Número de la publicación", required: true, min_value: 1 }],
  },
];

// Texto del mensaje del bot en el canal (menciona al autor sin notificarle).
const MAX_FOTO = 10 * 1024 * 1024; // por foto
const MAX_ALBUM = 25 * 1024 * 1024; // entre todas las de una publicación
const pubMensaje = (n, uid, texto) => `📸 **Publicación ${n}** · <@${uid}>` + (texto ? "\n" + texto : "");

// Corrige el número de los mensajes del bot que no coinciden con la numeración actual
// (tras borrar una publicación, las siguientes bajan un número).
async function syncNumeros(env, limit) {
  const { results } = await env.DB.prepare(
    `SELECT id, numero, discord_id, texto, channel_id, message_id FROM publicaciones
     WHERE status='publicada' AND message_id IS NOT NULL AND (numero_discord IS NULL OR numero_discord<>numero)
     ORDER BY numero LIMIT ?1`
  ).bind(limit).all();
  for (const p of results) {
    let r = await bot(env, `/channels/${p.channel_id}/messages/${p.message_id}`, {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: pubMensaje(p.numero, p.discord_id, p.texto), allowed_mentions: { parse: [] } }),
    });
    if (r.status === 429) break; // límite de Discord: se sigue en la próxima vez
    if (r.ok || r.status === 404) {
      await env.DB.prepare("UPDATE publicaciones SET numero_discord=?2 WHERE id=?1").bind(p.id, p.numero).run();
    }
  }
}

// Ejecuta un comando y devuelve el texto de la respuesta privada para quien lo usa.
async function runCommand(env, it, uid, name, role) {
  const opt = Object.fromEntries((it.data.options || []).map((o) => [o.name, o.value]));
  const cmd = it.data.name;

  if (cmd === "publicar") {
    // Hasta 10 fotos en un único álbum con un solo ID.
    const resolved = (it.data.resolved || {}).attachments || {};
    const keys = ["imagen", ...[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => "imagen" + n)];
    const atts = keys.filter((k) => opt[k]).map((k) => resolved[opt[k]]);
    const EXT = { "image/png": "png", "image/jpeg": "jpg", "image/gif": "gif", "image/webp": "webp" };
    if (!atts.length || atts.some((a) => !a || !EXT[(a.content_type || "").split(";")[0]])) {
      return "Todas las imágenes deben ser PNG, JPG, GIF o WEBP.";
    }
    if (atts.some((a) => a.size > MAX_FOTO)) return "Cada foto puede ocupar como máximo 10 MB.";
    if (atts.reduce((t, a) => t + a.size, 0) > MAX_ALBUM) return "Entre todas las fotos no pueden pasar de 25 MB. Prueba con menos fotos o más ligeras.";
    const texto = String(opt.texto || "").trim().slice(0, 500) || null;
    const blobs = await Promise.all(atts.map(async (a) => {
      const r = await fetch(a.url);
      return r.ok ? r.blob() : null;
    }));
    if (blobs.some((b) => !b)) return "No se pudo leer alguna de las imágenes. Inténtalo de nuevo.";
    // El número se asigna dentro del INSERT: el siguiente al mayor que exista.
    const r = await env.DB.prepare(
      `INSERT INTO publicaciones (discord_id, autor, texto, channel_id, numero)
       VALUES (?1, ?2, ?3, ?4, (SELECT COALESCE(MAX(numero), 0) + 1 FROM publicaciones))`
    ).bind(uid, name, texto, it.channel_id).run();
    const id = r.meta.last_row_id;
    const num = (await env.DB.prepare("SELECT numero FROM publicaciones WHERE id=?1").bind(id).first()).numero;
    const names = atts.map((a, i) => `publicacion-${id}-${i + 1}.${EXT[(a.content_type || "").split(";")[0]]}`);
    const fd = new FormData();
    fd.append("payload_json", JSON.stringify({
      content: pubMensaje(num, uid, texto), allowed_mentions: { parse: [] },
      attachments: names.map((filename, i) => ({ id: i, filename })),
    }));
    blobs.forEach((b, i) => fd.append(`files[${i}]`, b, names[i]));
    const pm = await bot(env, `/channels/${it.channel_id}/messages`, { method: "POST", body: fd });
    if (!pm.ok) {
      await env.DB.batch([
        env.DB.prepare("DELETE FROM publicaciones WHERE id=?1").bind(id),
        env.DB.prepare("UPDATE publicaciones SET numero=numero-1 WHERE numero>?1").bind(num),
      ]);
      return pm.status === 413
        ? "Las fotos ocupan demasiado para Discord. Prueba con menos fotos o más ligeras."
        : `No se pudo publicar (error ${pm.status}). Revisa que el bot pueda escribir y adjuntar archivos en #${CANAL_PUBLICACIONES}.`;
    }
    const msg = await pm.json();
    // Mismo orden en que se adjuntaron.
    const imgs = names.map((n) => (msg.attachments || []).find((a) => a.filename === n)).filter(Boolean)
      .map((a) => ({ url: a.url, filename: a.filename, width: a.width || null, height: a.height || null }));
    const first = imgs[0] || {};
    await env.DB.prepare(
      "UPDATE publicaciones SET message_id=?2, image_url=?3, width=?4, height=?5, imagenes=?6, status='publicada', numero_discord=?7 WHERE id=?1"
    ).bind(id, msg.id, first.url || null, first.width || null, first.height || null, JSON.stringify(imgs), num).run();
    const n = imgs.length;
    // Por si el número cambió mientras se subía (alguien borró otra publicación).
    await syncNumeros(env, 5);
    const ahora = (await env.DB.prepare("SELECT numero FROM publicaciones WHERE id=?1").bind(id).first()).numero;
    return `✅ Publicada en la web con el número **${ahora}**` + (n > 1 ? ` (${n} fotos)` : "") +
      `.\nPara cambiar el texto: \`/editar id:${ahora}\` · Para quitarla: \`/borrar id:${ahora}\``;
  }

  const p = await env.DB.prepare("SELECT * FROM publicaciones WHERE numero=?1 AND status='publicada'").bind(Number(opt.id)).first();
  if (!p) return `No existe ninguna publicación con el número ${opt.id}.`;

  if (cmd === "editar") {
    if (p.discord_id !== uid) return "Solo puedes editar tus propias publicaciones.";
    const texto = String(opt.texto || "").trim().slice(0, 500) || null;
    if (p.message_id) {
      const r = await bot(env, `/channels/${p.channel_id}/messages/${p.message_id}`, {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: pubMensaje(p.numero, p.discord_id, texto), allowed_mentions: { parse: [] } }),
      });
      if (!r.ok && r.status !== 404) return `No se pudo editar el mensaje en Discord (error ${r.status}).`;
    }
    await env.DB.prepare("UPDATE publicaciones SET texto=?2, numero_discord=numero, updated_at=datetime('now') WHERE id=?1").bind(p.id, texto).run();
    return `✏️ Texto de la publicación ${p.numero} actualizado.`;
  }

  if (cmd === "añadir") {
    if (p.discord_id !== uid) return "Solo puedes añadir fotos a tus propias publicaciones.";
    let imgs = [];
    try { imgs = JSON.parse(p.imagenes || "[]"); } catch (e) {}
    if (imgs.length >= 10) return `La publicación ${p.numero} ya tiene 10 fotos, que es el máximo.`;
    const att = ((it.data.resolved || {}).attachments || {})[opt.imagen];
    const EXT = { "image/png": "png", "image/jpeg": "jpg", "image/gif": "gif", "image/webp": "webp" };
    const tipo = att && (att.content_type || "").split(";")[0];
    if (!att || !EXT[tipo]) return "La imagen debe ser PNG, JPG, GIF o WEBP.";
    if (att.size > MAX_FOTO) return "La foto puede ocupar como máximo 10 MB.";
    if (!p.message_id) return "No se encuentra el mensaje de esta publicación en Discord.";
    const img = await fetch(att.url);
    if (!img.ok) return "No se pudo leer la imagen. Inténtalo de nuevo.";
    const blob = await img.blob();
    // Se conservan los adjuntos que ya tiene el mensaje (por su id) y se añade el nuevo al final.
    const gm = await bot(env, `/channels/${p.channel_id}/messages/${p.message_id}`);
    if (!gm.ok) return `No se pudo leer el mensaje de la publicación en Discord (error ${gm.status}).`;
    const antes = (await gm.json()).attachments || [];
    const filename = `publicacion-${p.id}-${Date.now()}.${EXT[tipo]}`;
    const fd = new FormData();
    fd.append("payload_json", JSON.stringify({
      attachments: antes.map((a) => ({ id: a.id })).concat([{ id: 0, filename }]),
    }));
    fd.append("files[0]", blob, filename);
    const pm = await bot(env, `/channels/${p.channel_id}/messages/${p.message_id}`, { method: "PATCH", body: fd });
    if (!pm.ok) {
      return pm.status === 413 ? "La foto ocupa demasiado para Discord." : `No se pudo añadir la foto en Discord (error ${pm.status}).`;
    }
    const despues = (await pm.json()).attachments || [];
    // El orden lo marca la web (no Discord): cada foto se localiza por su nombre de archivo y la nueva va al final.
    const nombre = (u) => decodeURIComponent((String(u || "").split("?")[0].split("/").pop()) || "");
    const usados = new Set();
    const orden = imgs.map((im) => despues.find((d) => d.filename === (im.filename || nombre(im.url)) && !usados.has(d.id)))
      .filter((d) => d && usados.add(d.id))
      .concat(despues.filter((d) => !usados.has(d.id) && d.filename !== filename))
      .concat(despues.filter((d) => d.filename === filename));
    const nuevas = orden.map((a) => ({ url: a.url, filename: a.filename, width: a.width || null, height: a.height || null }));
    const first = nuevas[0] || {};
    await env.DB.prepare(
      "UPDATE publicaciones SET imagenes=?2, image_url=?3, width=?4, height=?5, updated_at=datetime('now') WHERE id=?1"
    ).bind(p.id, JSON.stringify(nuevas), first.url || null, first.width || null, first.height || null).run();
    return `➕ Foto añadida al final de la publicación ${p.numero}. Ahora tiene ${nuevas.length} fotos.`;
  }

  if (cmd === "borrar") {
    if (p.discord_id !== uid && role !== "admin") return "Solo puedes borrar tus propias publicaciones.";
    if (p.message_id) {
      const r = await bot(env, `/channels/${p.channel_id}/messages/${p.message_id}`, { method: "DELETE" });
      if (!r.ok && r.status !== 404) return `No se pudo borrar el mensaje en Discord (error ${r.status}).`;
    }
    await env.DB.batch([
      env.DB.prepare("DELETE FROM publicaciones WHERE id=?1").bind(p.id),
      // Las siguientes bajan un número para que no haya saltos.
      env.DB.prepare("UPDATE publicaciones SET numero=numero-1 WHERE numero>?1").bind(p.numero),
    ]);
    await syncNumeros(env, 20);
    const sig = await env.DB.prepare("SELECT COUNT(*) AS n FROM publicaciones WHERE numero>=?1").bind(p.numero).first();
    return `🗑️ Publicación ${p.numero} borrada de la web y del canal.` +
      (sig.n ? ` Las siguientes han bajado un número (la ${p.numero + 1} ahora es la ${p.numero}, etc.).` : "");
  }
  return "Comando desconocido.";
}

// Caducidad (segundos) de un enlace de adjunto de Discord, del parámetro ?ex=.
const urlExpira = (u) => {
  const m = /[?&]ex=([0-9a-f]+)/i.exec(u || "");
  return m ? parseInt(m[1], 16) : 0;
};

// ===== Posts de Inicio: /añadir-post, /editar-post y /borrar-post en #publicaciones-post-web =====
const CANAL_POSTS = "publicaciones-post-web";
const CMDS_POST = ["añadir-post", "editar-post", "borrar-post", "post-nuevo", "post-editar"];
const TIPOS_IMG = { "image/png": "png", "image/jpeg": "jpg", "image/gif": "gif", "image/webp": "webp" };

// Ventana emergente (modal) de Discord con título y descripción de varias líneas.
function modalPost(customId, tituloModal, p) {
  const campo = (id, label, style, max, value, placeholder) => ({
    type: 1,
    components: [{ type: 4, custom_id: id, label, style, max_length: max, required: true, value: value || undefined, placeholder }],
  });
  return Response.json({
    type: 9,
    data: {
      custom_id: customId, title: tituloModal,
      components: [
        campo("titulo", "Título", 1, 120, p && p.titulo, "Título del post"),
        campo("descripcion", "Descripción (admite el formato de Discord)", 2, 4000, p && p.descripcion,
          "Puedes usar **negrita**, *cursiva*, listas, enlaces, saltos de línea…"),
      ],
    },
  });
}

// Mensaje del bot en el canal: un embed con título, descripción e imagen.
const embedPost = (p) => ({
  title: p.titulo, description: p.descripcion, color: 0xd9b25a,
  image: p.image_filename ? { url: "attachment://" + p.image_filename } : undefined,
  footer: { text: "Publicado en la web · " + p.autor },
});

// Valores de los campos de un modal enviado (formato clásico con filas y formato nuevo con etiquetas).
const valoresModal = (it) => Object.fromEntries(
  (it.data.components || []).flatMap((r) => r.components || (r.component ? [r.component] : [])).map((c) => [c.custom_id, c.value])
);

// Sugerencias para elegir un post escribiendo parte del título.
async function sugerenciasPosts(env, texto) {
  const { results } = await env.DB.prepare(
    "SELECT id, titulo, created_at FROM posts WHERE status='publicado' AND titulo LIKE ?1 ORDER BY id DESC LIMIT 25"
  ).bind("%" + String(texto || "").slice(0, 80) + "%").all();
  return results.map((p) => ({ name: (p.titulo + " · " + p.created_at.slice(0, 10)).slice(0, 100), value: p.id }));
}

// Comandos de posts que no abren ventana: publicar (al enviar el modal), editar (al enviar) y borrar.
async function runPost(env, it, uid) {
  const cmd = it.type === 5 ? it.data.custom_id.split(":")[0] : it.data.name;
  if (cmd === "post-nuevo") {
    const id = Number(it.data.custom_id.split(":")[1]);
    const p = await env.DB.prepare("SELECT * FROM posts WHERE id=?1 AND status='pendiente'").bind(id).first();
    if (!p || p.discord_id !== uid) return "Este formulario ha caducado. Vuelve a usar /añadir-post.";
    const v = valoresModal(it);
    const titulo = String(v.titulo || "").trim().slice(0, 120), descripcion = String(v.descripcion || "").trim().slice(0, 4000);
    if (!titulo || !descripcion) return "El título y la descripción son obligatorios.";
    const img = await fetch(p.image_src);
    if (!img.ok) return "No se pudo leer la imagen (puede que haya caducado). Vuelve a usar /añadir-post.";
    const filename = `post-${id}.${TIPOS_IMG[p.image_tipo] || "png"}`;
    const datos = { ...p, titulo, descripcion, image_filename: filename };
    const fd = new FormData();
    fd.append("payload_json", JSON.stringify({ embeds: [embedPost(datos)], allowed_mentions: { parse: [] }, attachments: [{ id: 0, filename }] }));
    fd.append("files[0]", await img.blob(), filename);
    const pm = await bot(env, `/channels/${p.channel_id}/messages`, { method: "POST", body: fd });
    if (!pm.ok) return `No se pudo publicar (error ${pm.status}). Revisa que el bot pueda escribir, adjuntar archivos e insertar enlaces en #${CANAL_POSTS}.`;
    const msg = await pm.json();
    const a = imagenDeMensaje(msg, filename);
    await env.DB.prepare(
      `UPDATE posts SET titulo=?2, descripcion=?3, message_id=?4, image_filename=?5, image_url=?6, width=?7, height=?8,
         image_src=NULL, status='publicado' WHERE id=?1`
    ).bind(id, titulo, descripcion, msg.id, filename, a.url || null, a.width || null, a.height || null).run();
    return `✅ Post publicado en la web: «${titulo}».`;
  }

  const id = it.type === 5 ? Number(it.data.custom_id.split(":")[1]) : Number(((it.data.options || [])[0] || {}).value);
  const p = await env.DB.prepare("SELECT * FROM posts WHERE id=?1 AND status='publicado'").bind(id).first();
  if (!p) return "No se encuentra ese post. Elige uno de la lista que sugiere Discord.";

  if (cmd === "post-editar") {
    const v = valoresModal(it);
    const titulo = String(v.titulo || "").trim().slice(0, 120), descripcion = String(v.descripcion || "").trim().slice(0, 4000);
    if (!titulo || !descripcion) return "El título y la descripción son obligatorios.";
    if (p.message_id) {
      const r = await bot(env, `/channels/${p.channel_id}/messages/${p.message_id}`, {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({ embeds: [embedPost({ ...p, titulo, descripcion })], allowed_mentions: { parse: [] } }),
      });
      if (!r.ok && r.status !== 404) return `No se pudo editar el mensaje en Discord (error ${r.status}).`;
    }
    await env.DB.prepare("UPDATE posts SET titulo=?2, descripcion=?3, updated_at=datetime('now') WHERE id=?1").bind(id, titulo, descripcion).run();
    return `✏️ Post actualizado: «${titulo}».`;
  }

  if (cmd === "borrar-post") {
    if (p.message_id) {
      const r = await bot(env, `/channels/${p.channel_id}/messages/${p.message_id}`, { method: "DELETE" });
      if (!r.ok && r.status !== 404) return `No se pudo borrar el mensaje en Discord (error ${r.status}).`;
    }
    await env.DB.prepare("DELETE FROM posts WHERE id=?1").bind(id).run();
    return `🗑️ Post «${p.titulo}» borrado de la web y del canal.`;
  }
  return "Acción desconocida.";
}

// Imagen de un mensaje del bot: si va dentro del embed, Discord no la lista como adjunto sino en embeds[].image.
function imagenDeMensaje(msg, filename) {
  const a = (msg.attachments || []).find((x) => x.filename === filename) || (msg.attachments || [])[0];
  if (a && a.url) return a;
  const im = ((msg.embeds || [])[0] || {}).image || {};
  return { url: im.url || null, width: im.width || null, height: im.height || null };
}

// Renueva enlaces de adjuntos de Discord que caducan en menos de una hora. Devuelve original → nuevo.
async function renovarUrls(env, urls) {
  const map = new Map();
  const pronto = Date.now() / 1000 + 3600;
  const viejos = [...new Set(urls.filter((u) => u && urlExpira(u) < pronto))];
  if (!viejos.length || !env.DISCORD_BOT_TOKEN) return map;
  for (let i = 0; i < viejos.length; i += 50) {
    try {
      const r = await bot(env, "/attachments/refresh-urls", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ attachment_urls: viejos.slice(i, i + 50) }),
      });
      if (r.ok) ((await r.json()).refreshed_urls || []).forEach((x) => map.set(x.original, x.refreshed));
    } catch (e) {}
  }
  return map;
}

// ===== New Recruit (API oficial): consultas mínimas, con copia local en D1 =====
const NR_API = "https://www.newrecruit.eu/api/";
const NR_ESPERA_MIN = 15; // minutos mínimos entre dos consultas del mismo tipo

// Sincroniza un dato de New Recruit ('tournament' o 'reports') de un torneo. Una sola petición,
// sin reintentos; si otra sincronización reciente o en curso ya lo hizo, no consulta.
async function nrSync(env, tipo, idTorneo) {
  if (!env.NR_LOGIN || !env.NR_PASSWORD) return { ok: false, error: "Faltan los secretos NR_LOGIN y NR_PASSWORD" };
  const clave = tipo + ":" + idTorneo;
  // Reserva atómica: solo pasa si no hubo consulta en los últimos NR_ESPERA_MIN minutos.
  const r = await env.DB.prepare(
    `INSERT INTO nr_cache (clave, intento) VALUES (?1, datetime('now'))
     ON CONFLICT(clave) DO UPDATE SET intento=excluded.intento
     WHERE nr_cache.intento IS NULL OR nr_cache.intento < datetime('now', ?2)`
  ).bind(clave, "-" + NR_ESPERA_MIN + " minutes").run();
  if (!r.meta.changes) {
    const c = await env.DB.prepare("SELECT intento FROM nr_cache WHERE clave=?1").bind(clave).first();
    return { ok: false, espera: true, error: "Se consultó hace poco (" + c.intento + " UTC). Espera " + NR_ESPERA_MIN + " minutos entre consultas." };
  }
  let texto = "", estado = 0;
  try {
    const res = await fetch(NR_API + tipo, {
      method: "POST",
      headers: { "content-type": "application/json", "NR-Login": env.NR_LOGIN, "NR-Password": env.NR_PASSWORD },
      body: JSON.stringify(tipo === "reports" ? { id_tournament: idTorneo } : { id: idTorneo }),
    });
    estado = res.status;
    texto = await res.text();
    if (!res.ok) throw new Error("New Recruit respondió " + res.status + ": " + texto.slice(0, 200));
    const json = JSON.parse(texto);
    if (json && (json.error || json.message)) throw new Error("New Recruit: " + (json.error || json.message));
    // Los resultados se asignan a las partidas de la liga (con sus listas); la copia se guarda sin listas.
    let liga = null;
    if (tipo === "reports" && Array.isArray(json)) liga = await ligaProcesa(env, idTorneo, json);
    const guardar = tipo === "reports"
      ? JSON.stringify(json, (k, v) => (k === "exported_list" || k === "report_list" || k === "scoring" ? undefined : v))
      : texto;
    await env.DB.prepare("UPDATE nr_cache SET datos=?2, actualizado=datetime('now'), error=NULL WHERE clave=?1").bind(clave, guardar).run();
    return { ok: true, bytes: texto.length, guardado: guardar.length, resumen: resumenNr(json), liga };
  } catch (e) {
    await env.DB.prepare("UPDATE nr_cache SET error=?2 WHERE clave=?1").bind(clave, String(e.message || e).slice(0, 500)).run();
    return { ok: false, estado, error: String(e.message || e).slice(0, 300) };
  }
}

// Resumen de la forma de los datos (claves y tamaños), sin contenido personal.
function resumenNr(j) {
  if (Array.isArray(j)) return { tipo: "lista", elementos: j.length, claves: j[0] && typeof j[0] === "object" ? Object.keys(j[0]) : [] };
  if (j && typeof j === "object") return { tipo: "objeto", claves: Object.keys(j) };
  return { tipo: typeof j };
}

// ===== Gran Liga Adeptus =====
const LIGA_AUTO_HORAS = 6;
const LIGA_LISTAS_PUBLICAS = false; // de momento no se muestran las listas (se siguen guardando) // como mucho una consulta automática a New Recruit cada 6 horas

// Facción a partir de la lista exportada («FACTION KEYWORD: Imperium - Adeptus Astartes - Space Wolves»).
function faccionDeLista(txt) {
  const m = /FACTION KEYWORD:\s*([^\n\r]+)/.exec(txt || "");
  if (!m) return null;
  const partes = m[1].split(" - ").map((x) => x.trim()).filter(Boolean);
  return partes[partes.length - 1] || null;
}

// Asigna los informes de New Recruit a las partidas de la fase. En una liga todos contra todos
// cada pareja se enfrenta una sola vez por fase, así que la pareja identifica la partida.
async function ligaProcesa(env, nrTorneo, reports) {
  const fase = await env.DB.prepare("SELECT id FROM liga_fases WHERE nr_torneo=?1").bind(nrTorneo).first();
  if (!fase) return { asignados: 0, sin_asignar: reports.length };
  const js = (await env.DB.prepare("SELECT id, nr_participante FROM liga_jugadores WHERE fase_id=?1").bind(fase.id).all()).results;
  const ps = (await env.DB.prepare("SELECT id, jugador_a, jugador_b FROM liga_partidas WHERE fase_id=?1").bind(fase.id).all()).results;
  const porPart = new Map(js.map((j) => [j.nr_participante, j.id]));
  const clavePar = (a, b) => (a < b ? a + "-" + b : b + "-" + a);
  const porPar = new Map(ps.map((p) => [clavePar(p.jugador_a, p.jugador_b), p]));
  const upd = [], informes = [];
  let sinAsignar = 0;
  for (const r of reports) {
    const pl = r.players || [];
    if (r.id_tourny !== nrTorneo || pl.length !== 2) continue;
    const j0 = porPart.get(pl[0].id_participant), j1 = porPart.get(pl[1].id_participant);
    const p = j0 && j1 ? porPar.get(clavePar(j0, j1)) : null;
    if (!p) { sinAsignar++; continue; }
    const pv = (i) => { const v = ((r.score || [])[i] || {}).PV; return Number.isFinite(v) ? v : null; };
    const dato = (i) => ({
      pv: pv(i), faccion: faccionDeLista(pl[i].exported_list),
      destac: (pl[i].report_list && pl[i].report_list.detachment) || null,
      lista: pl[i].exported_list ? String(pl[i].exported_list).slice(0, 20000) : null,
    });
    const [a, b] = p.jugador_a === j0 ? [dato(0), dato(1)] : [dato(1), dato(0)];
    informes.push(String(r._id));
    upd.push(env.DB.prepare(
      `UPDATE liga_partidas SET pv_a=?2, pv_b=?3, jugada=?4, nr_informe=?5, nr_partida=COALESCE(?6, nr_partida),
         faccion_a=?7, faccion_b=?8, destac_a=?9, destac_b=?10, lista_a=?11, lista_b=?12 WHERE id=?1`
    ).bind(p.id, a.pv, b.pv, String(r.date || "").slice(0, 10) || null, String(r._id), r.id_match || null,
      a.faccion, b.faccion, a.destac, b.destac, a.lista, b.lista));
  }
  // Informes borrados en New Recruit: se quita su resultado.
  upd.push(env.DB.prepare(
    `UPDATE liga_partidas SET pv_a=NULL, pv_b=NULL, jugada=NULL, nr_informe=NULL, faccion_a=NULL, faccion_b=NULL,
       destac_a=NULL, destac_b=NULL, lista_a=NULL, lista_b=NULL
     WHERE fase_id=?1 AND nr_informe IS NOT NULL AND nr_informe NOT IN (SELECT value FROM json_each(?2))`
  ).bind(fase.id, JSON.stringify(informes)));
  for (let i = 0; i < upd.length; i += 50) await env.DB.batch(upd.slice(i, i + 50));
  return { asignados: informes.length, sin_asignar: sinAsignar };
}

// Fecha y hora de Madrid ('YYYY-MM-DDTHH:MM') de un instante.
function enMadrid(fecha) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(fecha).map((x) => [x.type, x.value])
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
// Día 'YYYY-MM-DD' desplazado n días.
const masDias = (dia, n) => { const d = new Date(dia + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

// Actualización automática (la dispara una visita): solo durante la fase, como mucho cada 6 horas
// y una vez tras cada cierre de ronda (domingo 14:00). Si New Recruit falló, no se reintenta antes de 1 hora.
async function ligaAuto(env, fase) {
  if (!fase || !fase.nr_torneo || !env.NR_LOGIN) return;
  const ahora = nowLocal();
  const dia0 = fase.inicio.slice(0, 10);
  const fin = masDias(dia0, 14 * (fase.rondas + 1)) + "T14:00"; // cierre de la ronda de aplazadas
  if (ahora < fase.inicio || ahora > masDias(fin.slice(0, 10), 1) + "T23:59") return;
  let ultimoCierre = "";
  for (let n = 1; n <= fase.rondas + 1; n++) {
    const c = masDias(dia0, 14 * n) + "T14:00";
    if (c <= ahora) ultimoCierre = c; else break;
  }
  const c = await env.DB.prepare("SELECT actualizado, intento, error FROM nr_cache WHERE clave=?1").bind("reports:" + fase.nr_torneo).first();
  const madrid = (utc) => (utc ? enMadrid(new Date(utc.replace(" ", "T") + "Z")) : "");
  const hace = (h) => enMadrid(new Date(Date.now() - h * 3600e3));
  if (c && c.error && madrid(c.intento) > hace(1)) return;
  const ultima = madrid(c && c.actualizado);
  if (ultima && ultima > hace(LIGA_AUTO_HORAS) && ultima >= ultimoCierre) return;
  await nrSync(env, "reports", fase.nr_torneo);
}

// Vincula a un usuario de la web con su jugador de la liga en cada fase. Automático solo si
// coinciden el apodo de Discord (p. ej. «Frambu (Nacho)» → «Frambu») y el usuario de New Recruit;
// si solo coincide uno, queda como sugerencia para que un admin la confirme.
async function ligaVincula(env, discordId) {
  const u = await env.DB.prepare("SELECT name, nr_username FROM users WHERE discord_id=?1").bind(discordId).first();
  if (!u) return;
  const norm = (x) => String(x || "").trim().toLowerCase();
  const nick = norm(u.name), base = norm(String(u.name || "").split(" (")[0]), nr = norm(u.nr_username);
  const { results } = await env.DB.prepare(
    "SELECT id, fase_id, discord, nombre, nr_nombre, discord_id, sugerido_id FROM liga_jugadores"
  ).all();
  const fases = [...new Set(results.map((j) => j.fase_id))];
  const upd = [];
  for (const f of fases) {
    const js = results.filter((j) => j.fase_id === f);
    if (js.some((j) => j.discord_id === discordId)) continue; // ya vinculado en esta fase
    const libres = js.filter((j) => !j.discord_id);
    const porNick = libres.filter((j) => {
      const d = norm(j.discord);
      return d && (d === base || d === nick || (j.nombre && norm(j.discord + " (" + j.nombre + ")") === nick));
    });
    const porNr = nr ? libres.filter((j) => norm(j.nr_nombre) === nr) : [];
    if (porNick.length === 1 && porNr.length === 1 && porNick[0].id === porNr[0].id) {
      upd.push(env.DB.prepare("UPDATE liga_jugadores SET discord_id=?2, sugerido_id=NULL WHERE id=?1 AND discord_id IS NULL").bind(porNick[0].id, discordId));
    } else {
      const cand = [...new Map([...porNick, ...porNr].map((j) => [j.id, j])).values()];
      if (cand.length === 1 && !cand[0].sugerido_id) {
        upd.push(env.DB.prepare("UPDATE liga_jugadores SET sugerido_id=?2 WHERE id=?1 AND discord_id IS NULL").bind(cand[0].id, discordId));
      }
    }
  }
  if (upd.length) await env.DB.batch(upd);
}

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
      // 2 = comando, 4 = autocompletado, 5 = envío de una ventana (modal)
      if (![2, 4, 5].includes(it.type)) return reply("Acción no soportada.");
      const cmd = it.type === 5 ? String((it.data || {}).custom_id || "").split(":")[0] : (it.data || {}).name;
      const esPost = CMDS_POST.includes(cmd);
      const role = it.member && it.guild_id === env.GUILD_ID ? roleOf(env, it.member.roles || []) : null;
      if (it.type === 4) {
        // Sugerencias de posts mientras se escribe (solo para admins).
        const foco = ((it.data.options || []).find((o) => o.focused) || {}).value;
        const choices = esPost && role === "admin" ? await sugerenciasPosts(env, foco) : [];
        return Response.json({ type: 8, data: { choices } });
      }
      if (!it.member || it.guild_id !== env.GUILD_ID) return reply("Usa este comando en el servidor del club.");
      if (!role) return reply("Necesitas uno de los roles del club para usar este comando.");
      const canal = esPost ? CANAL_POSTS : CANAL_PUBLICACIONES;
      if (!it.channel || it.channel.name !== canal) return reply(`Usa este comando en #${canal}.`);
      if (esPost && role !== "admin") return reply("Solo los admins pueden gestionar los posts de la web.");
      if (!env.DISCORD_BOT_TOKEN) return reply("El bot aún no está configurado. Avisa a un admin.");
      const u = it.member.user;
      const name = it.member.nick || u.global_name || u.username;

      // /añadir-post y /editar-post abren una ventana con el título y la descripción (respuesta inmediata).
      if (it.type === 2 && cmd === "añadir-post") {
        const optImg = ((it.data.options || []).find((o) => o.name === "imagen") || {}).value;
        const att = ((it.data.resolved || {}).attachments || {})[optImg];
        const tipo = att && (att.content_type || "").split(";")[0];
        if (!att || !TIPOS_IMG[tipo]) return reply("La imagen debe ser PNG, JPG, GIF o WEBP.");
        if (att.size > MAX_FOTO) return reply("La imagen puede ocupar como máximo 10 MB.");
        // Borradores abandonados (formularios que nunca se enviaron).
        await env.DB.prepare("DELETE FROM posts WHERE status='pendiente' AND created_at < datetime('now','-1 day')").run();
        const r = await env.DB.prepare(
          "INSERT INTO posts (discord_id, autor, channel_id, image_src, image_tipo) VALUES (?1,?2,?3,?4,?5)"
        ).bind(u.id, name, it.channel_id, att.url, tipo).run();
        return modalPost("post-nuevo:" + r.meta.last_row_id, "Nuevo post para la web");
      }
      if (it.type === 2 && cmd === "editar-post") {
        const id = Number(((it.data.options || [])[0] || {}).value);
        const p = await env.DB.prepare("SELECT * FROM posts WHERE id=?1 AND status='publicado'").bind(id).first();
        if (!p) return reply("No se encuentra ese post. Elige uno de la lista que sugiere Discord.");
        return modalPost("post-editar:" + id, "Editar post", p);
      }

      // Se responde enseguida («pensando…», solo visible para quien lo usa) y el trabajo sigue en segundo plano.
      const edit = (content) => fetch(`${DAPI}/webhooks/${it.application_id}/${it.token}/messages/@original`, {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({ content, allowed_mentions: { parse: [] } }),
      });
      ctx.waitUntil((async () => {
        let msg;
        try { msg = esPost ? await runPost(env, it, u.id) : await runCommand(env, it, u.id, name, role); } catch (e) { msg = "Algo ha fallado. Inténtalo de nuevo."; }
        await edit(msg);
      })());
      return Response.json({ type: 5, data: { flags: 64 } });
    }

    // Posts de Inicio (públicos), con el enlace de la imagen renovado si va a caducar.
    if (path === "/api/posts" && request.method === "GET") {
      const { results } = await env.DB.prepare(
        `SELECT id, titulo, descripcion, autor, image_url, width, height, created_at, updated_at
         FROM posts WHERE status='publicado' ORDER BY id DESC LIMIT 20`
      ).all();
      const upd = [];
      // Posts sin enlace de imagen guardado: se recupera del mensaje del bot.
      for (const r of results.filter((x) => !x.image_url).slice(0, 5)) {
        const p = await env.DB.prepare("SELECT channel_id, message_id, image_filename FROM posts WHERE id=?1").bind(r.id).first();
        if (!p || !p.message_id || !env.DISCORD_BOT_TOKEN) continue;
        try {
          const gm = await bot(env, `/channels/${p.channel_id}/messages/${p.message_id}`);
          if (!gm.ok) continue;
          const a = imagenDeMensaje(await gm.json(), p.image_filename);
          if (!a.url) continue;
          Object.assign(r, { image_url: a.url, width: a.width, height: a.height });
          upd.push(env.DB.prepare("UPDATE posts SET image_url=?2, width=?3, height=?4 WHERE id=?1").bind(r.id, a.url, a.width, a.height));
        } catch (e) {}
      }
      const map = await renovarUrls(env, results.map((r) => r.image_url));
      results.forEach((r) => {
        const nu = map.get(r.image_url);
        if (nu && nu !== r.image_url) { r.image_url = nu; upd.push(env.DB.prepare("UPDATE posts SET image_url=?2 WHERE id=?1").bind(r.id, nu)); }
      });
      if (upd.length) await env.DB.batch(upd);
      return Response.json(results, { headers: noStore });
    }

    // Gran Liga (pública): fase, jugadores, calendario y resultados (sin las listas, que se piden aparte).
    if (path === "/api/liga" && request.method === "GET") {
      const fases = (await env.DB.prepare("SELECT id, nombre, edicion, fase FROM liga_fases ORDER BY edicion DESC, fase DESC").all()).results;
      const pedida = Number(url.searchParams.get("fase")) || null;
      const fase = await env.DB.prepare(
        pedida ? "SELECT * FROM liga_fases WHERE id=?1" : "SELECT * FROM liga_fases ORDER BY edicion DESC, fase DESC LIMIT 1"
      ).bind(...(pedida ? [pedida] : [])).first();
      if (!fase) return Response.json({ fases, fase: null }, { headers: { "cache-control": "public, max-age=120" } });
      ctx.waitUntil(ligaAuto(env, fase).catch(() => {}));
      const jugadores = (await env.DB.prepare("SELECT id, discord, nombre FROM liga_jugadores WHERE fase_id=?1 ORDER BY discord COLLATE NOCASE").bind(fase.id).all()).results;
      const partidas = (await env.DB.prepare(
        `SELECT id, ronda, mesa, stream, jugador_a, jugador_b, nr_partida, aplazada, pv_a, pv_b, jugada,
           faccion_a, faccion_b, destac_a, destac_b, ${LIGA_LISTAS_PUBLICAS ? "(lista_a IS NOT NULL OR lista_b IS NOT NULL)" : "0"} AS listas
         FROM liga_partidas WHERE fase_id=?1 ORDER BY ronda, mesa`
      ).bind(fase.id).all()).results;
      const sync = fase.nr_torneo
        ? await env.DB.prepare("SELECT actualizado FROM nr_cache WHERE clave=?1").bind("reports:" + fase.nr_torneo).first()
        : null;
      return Response.json(
        { fases, fase: { id: fase.id, nombre: fase.nombre, edicion: fase.edicion, fase: fase.fase, nr_torneo: fase.nr_torneo, inicio: fase.inicio, rondas: fase.rondas },
          jugadores, partidas, actualizado: sync ? sync.actualizado : null, ahora: nowLocal() },
        { headers: { "cache-control": "public, max-age=120" } }
      );
    }

    // Aplazar (o quitar el aplazamiento de) una partida sin resultado: un admin en cualquier momento,
    // o uno de sus dos jugadores (cuenta vinculada) antes del cierre de la ronda.
    const apm = path.match(/^\/api\/liga\/partida\/(\d+)\/aplazar$/);
    if (apm && request.method === "POST") {
      const s = await readSession(env, request);
      if (!s) return Response.json({ error: "Inicia sesión con Discord" }, { status: 401, headers: noStore });
      if (!sameOrigin(request, url)) return new Response("Prohibido", { status: 403 });
      let b = {};
      try { b = await request.json(); } catch (e) {}
      if (typeof b.aplazada !== "boolean") return Response.json({ error: "Datos no válidos" }, { status: 400, headers: noStore });
      const p = await env.DB.prepare(
        `SELECT p.id, p.ronda, p.pv_a, p.pv_b, f.inicio, a.discord_id AS da, bb.discord_id AS db
         FROM liga_partidas p JOIN liga_fases f ON f.id=p.fase_id
         JOIN liga_jugadores a ON a.id=p.jugador_a JOIN liga_jugadores bb ON bb.id=p.jugador_b WHERE p.id=?1`
      ).bind(Number(apm[1])).first();
      if (!p) return Response.json({ error: "La partida no existe" }, { status: 404, headers: noStore });
      const admin = s.role === "admin", jugador = s.id === p.da || s.id === p.db;
      if (!admin && !jugador) return Response.json({ error: "Solo pueden aplazarla sus jugadores o un admin" }, { status: 403, headers: noStore });
      if (p.pv_a != null || p.pv_b != null) return Response.json({ error: "La partida ya tiene resultado" }, { status: 409, headers: noStore });
      if (!admin && nowLocal() > masDias(p.inicio.slice(0, 10), 14 * p.ronda) + "T14:00") {
        return Response.json({ error: "La ronda ya ha cerrado: habla con un admin" }, { status: 409, headers: noStore });
      }
      await env.DB.prepare("UPDATE liga_partidas SET aplazada=?2 WHERE id=?1 AND pv_a IS NULL AND pv_b IS NULL").bind(p.id, b.aplazada ? 1 : 0).run();
      return Response.json({ ok: true, aplazada: b.aplazada }, { headers: noStore });
    }

    // Jugador de la liga vinculado al usuario con sesión (para resaltarle y mostrar su partida).
    if (path === "/api/liga/yo" && request.method === "GET") {
      const s = await readSession(env, request);
      const fase = Number(url.searchParams.get("fase"));
      const j = s && fase ? await env.DB.prepare("SELECT id FROM liga_jugadores WHERE fase_id=?1 AND discord_id=?2").bind(fase, s.id).first() : null;
      return Response.json({ jugador: j ? j.id : null }, { headers: { ...noStore, vary: "cookie" } });
    }

    // Listas distintas que ha usado un jugador en la fase (públicas), sin repetir las iguales.
    if (path === "/api/liga/listas" && request.method === "GET") {
      if (!LIGA_LISTAS_PUBLICAS) return new Response("No disponible", { status: 404 });
      const id = Number(url.searchParams.get("jugador"));
      if (!id) return new Response("Datos no válidos", { status: 400 });
      const { results } = await env.DB.prepare(
        `SELECT lista_a AS lista, destac_a AS destac, jugada FROM liga_partidas WHERE jugador_a=?1 AND lista_a IS NOT NULL
         UNION ALL
         SELECT lista_b, destac_b, jugada FROM liga_partidas WHERE jugador_b=?1 AND lista_b IS NOT NULL
         ORDER BY jugada`
      ).bind(id).all();
      const vistas = new Map();
      for (const r of results) {
        // Se comparan sin la línea del nombre del jugador (cambia entre informes) ni espacios finales.
        const clave = r.lista.split(/\r?\n/).filter((l) => !l.startsWith("+ PLAYER NAME")).map((l) => l.trimEnd()).join("\n");
        const v = vistas.get(clave);
        if (v) v.partidas++;
        else vistas.set(clave, { destac: r.destac, primera: r.jugada, partidas: 1, lista: r.lista });
      }
      return Response.json([...vistas.values()], { headers: { "cache-control": "public, max-age=600" } });
    }

    // Lista de ejército usada por un jugador en una partida de la liga (pública).
    if (path === "/api/liga/lista" && request.method === "GET") {
      if (!LIGA_LISTAS_PUBLICAS) return new Response("No disponible", { status: 404 });
      const id = Number(url.searchParams.get("partida")), lado = url.searchParams.get("lado");
      if (!id || (lado !== "a" && lado !== "b")) return new Response("Datos no válidos", { status: 400 });
      const r = await env.DB.prepare(`SELECT lista_${lado} AS lista FROM liga_partidas WHERE id=?1`).bind(id).first();
      if (!r || !r.lista) return new Response("No hay lista", { status: 404 });
      return new Response(r.lista, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
    }

    // Galería pública: las publicaciones, con los enlaces de imagen renovados si van a caducar.
    if (path === "/api/galeria" && request.method === "GET") {
      const s = await readSession(env, request);
      // autor: el nombre más reciente de cada socio, para que el filtro por miembro no se parta si cambia de apodo.
      const { results } = await env.DB.prepare(
        `SELECT p.id, p.numero, p.texto, p.imagenes, p.image_url, p.width, p.height, p.created_at, p.updated_at,
           (SELECT q.autor FROM publicaciones q WHERE q.discord_id=p.discord_id ORDER BY q.id DESC LIMIT 1) AS autor,
           (SELECT COUNT(*) FROM bendiciones b WHERE b.publicacion_id=p.id AND b.tipo='emperador') AS emperador,
           (SELECT COUNT(*) FROM bendiciones b WHERE b.publicacion_id=p.id AND b.tipo='ruinosos') AS ruinosos,
           EXISTS (SELECT 1 FROM bendiciones b WHERE b.publicacion_id=p.id AND b.discord_id=?1 AND b.tipo='emperador') AS mi_emperador,
           EXISTS (SELECT 1 FROM bendiciones b WHERE b.publicacion_id=p.id AND b.discord_id=?1 AND b.tipo='ruinosos') AS mi_ruinosos
         FROM publicaciones p WHERE p.status='publicada' ORDER BY p.numero DESC LIMIT 300`
      ).bind(s ? s.id : "").all();
      for (const r of results) {
        let imgs = [];
        try { imgs = JSON.parse(r.imagenes || "[]"); } catch (e) {}
        if (!imgs.length && r.image_url) imgs = [{ url: r.image_url, width: r.width, height: r.height }];
        r.imagenes = imgs;
        delete r.image_url; delete r.width; delete r.height;
      }
      // Los enlaces de Discord caducan: se renuevan los que caducan en menos de una hora.
      const pronto = Date.now() / 1000 + 3600;
      const viejos = [];
      results.forEach((r) => r.imagenes.forEach((im) => { if (im.url && urlExpira(im.url) < pronto) viejos.push(im.url); }));
      if (viejos.length && env.DISCORD_BOT_TOKEN) {
        const map = new Map();
        for (let i = 0; i < viejos.length; i += 50) {
          try {
            const r = await bot(env, "/attachments/refresh-urls", {
              method: "POST", headers: { "content-type": "application/json" },
              body: JSON.stringify({ attachment_urls: viejos.slice(i, i + 50) }),
            });
            if (r.ok) ((await r.json()).refreshed_urls || []).forEach((x) => map.set(x.original, x.refreshed));
          } catch (e) {}
        }
        const upd = [];
        for (const r of results) {
          let cambia = false;
          r.imagenes.forEach((im) => {
            const nu = map.get(im.url);
            if (nu && nu !== im.url) { im.url = nu; cambia = true; }
          });
          if (cambia) {
            upd.push(env.DB.prepare("UPDATE publicaciones SET imagenes=?2, image_url=?3 WHERE id=?1")
              .bind(r.id, JSON.stringify(r.imagenes), r.imagenes[0].url));
          }
        }
        if (upd.length) await env.DB.batch(upd);
      }
      // Si algún mensaje de Discord muestra un número antiguo, se corrige en segundo plano.
      if (env.DISCORD_BOT_TOKEN) ctx.waitUntil(syncNumeros(env, 10).catch(() => {}));
      results.forEach((r) => {
        r.mias = { emperador: !!r.mi_emperador, ruinosos: !!r.mi_ruinosos };
        delete r.mi_emperador; delete r.mi_ruinosos;
      });
      // Sin caché: las fotos nuevas, editadas o borradas tienen que verse al momento.
      return Response.json({ sesion: !!s, publicaciones: results }, { headers: noStore });
    }

    // Bendiciones (?tipo=emperador|ruinosos): POST la da, DELETE la quita. Una de cada tipo por socio y publicación.
    const bm = path.match(/^\/api\/galeria\/(\d+)\/bendicion$/);
    if (bm && (request.method === "POST" || request.method === "DELETE")) {
      const s = await readSession(env, request);
      if (!s) return Response.json({ error: "Entra con Discord para dar tu bendición" }, { status: 401, headers: noStore });
      if (!sameOrigin(request, url)) return new Response("Prohibido", { status: 403 });
      const tipo = url.searchParams.get("tipo") || "emperador";
      if (tipo !== "emperador" && tipo !== "ruinosos") return Response.json({ error: "Tipo no válido" }, { status: 400, headers: noStore });
      const pid = Number(bm[1]);
      const p = await env.DB.prepare("SELECT 1 FROM publicaciones WHERE id=?1 AND status='publicada'").bind(pid).first();
      if (!p) return Response.json({ error: "Esa publicación ya no existe" }, { status: 404, headers: noStore });
      await env.DB.prepare(request.method === "POST"
        ? "INSERT INTO bendiciones (publicacion_id, discord_id, tipo) VALUES (?1, ?2, ?3) ON CONFLICT DO NOTHING"
        : "DELETE FROM bendiciones WHERE publicacion_id=?1 AND discord_id=?2 AND tipo=?3").bind(pid, s.id, tipo).run();
      const c = await env.DB.prepare(
        `SELECT (SELECT COUNT(*) FROM bendiciones WHERE publicacion_id=?1 AND tipo='emperador') AS emperador,
                (SELECT COUNT(*) FROM bendiciones WHERE publicacion_id=?1 AND tipo='ruinosos') AS ruinosos,
                EXISTS (SELECT 1 FROM bendiciones WHERE publicacion_id=?1 AND discord_id=?2 AND tipo='emperador') AS me,
                EXISTS (SELECT 1 FROM bendiciones WHERE publicacion_id=?1 AND discord_id=?2 AND tipo='ruinosos') AS mr`
      ).bind(pid, s.id).first();
      return Response.json(
        { emperador: c.emperador, ruinosos: c.ruinosos, mias: { emperador: !!c.me, ruinosos: !!c.mr } },
        { headers: noStore }
      );
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
      try { await ligaVincula(env, u.id); } catch (e) {}
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
      try { await ligaVincula(env, s.id); } catch (e) {}
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
      // New Recruit: estado de la copia local y sincronización manual (con espera mínima).
      if (path === "/api/admin/nr") {
        if (request.method === "GET") {
          const { results } = await env.DB.prepare(
            "SELECT clave, actualizado, intento, error, length(datos) AS bytes FROM nr_cache ORDER BY clave"
          ).all();
          return Response.json({ secretos: !!(env.NR_LOGIN && env.NR_PASSWORD), espera_min: NR_ESPERA_MIN, copias: results }, { headers: noStore });
        }
        if (request.method !== "POST") return new Response("Método no permitido", { status: 405 });
        if (!sameOrigin(request, url)) return new Response("Prohibido", { status: 403 });
        let b = {};
        try { b = await request.json(); } catch (e) {}
        const id = String(b.id || "").trim();
        const tipo = b.tipo === "tournament" ? "tournament" : b.tipo === "reports" ? "reports" : null;
        if (!/^[a-f0-9]{24}$/.test(id) || !tipo) return Response.json({ error: "Datos no válidos" }, { status: 400, headers: noStore });
        return Response.json(await nrSync(env, tipo, id), { headers: noStore });
      }

      // Gran Liga: jugadores con su vínculo (y sugerencias) y usuarios de la web para vincular a mano.
      if (path === "/api/admin/liga/jugadores" && request.method === "GET") {
        const fase = await env.DB.prepare("SELECT id, nombre FROM liga_fases ORDER BY edicion DESC, fase DESC LIMIT 1").first();
        if (!fase) return Response.json({ fase: null, jugadores: [], usuarios: [] }, { headers: noStore });
        const jugadores = (await env.DB.prepare(
          `SELECT j.id, j.discord, j.nombre, j.nr_nombre, j.discord_id, j.sugerido_id,
             (SELECT name FROM users u WHERE u.discord_id=j.discord_id) AS vinculado,
             (SELECT name FROM users u WHERE u.discord_id=j.sugerido_id) AS sugerido
           FROM liga_jugadores j WHERE j.fase_id=?1 ORDER BY j.discord COLLATE NOCASE`
        ).bind(fase.id).all()).results;
        const usuarios = (await env.DB.prepare("SELECT discord_id, name, nr_username FROM users ORDER BY name COLLATE NOCASE").all()).results;
        return Response.json({ fase, jugadores, usuarios }, { headers: noStore });
      }
      const ljm = path.match(/^\/api\/admin\/liga\/jugador\/(\d+)$/);
      if (ljm && request.method === "POST") {
        if (!sameOrigin(request, url)) return new Response("Prohibido", { status: 403 });
        let b = {};
        try { b = await request.json(); } catch (e) {}
        const id = Number(ljm[1]);
        const j = await env.DB.prepare("SELECT fase_id FROM liga_jugadores WHERE id=?1").bind(id).first();
        if (!j) return Response.json({ error: "El jugador no existe" }, { status: 404, headers: noStore });
        const did = b.discord_id == null || b.discord_id === "" ? null : String(b.discord_id);
        if (did) {
          const u = await env.DB.prepare("SELECT 1 FROM users WHERE discord_id=?1").bind(did).first();
          if (!u) return Response.json({ error: "Ese usuario no existe" }, { status: 400, headers: noStore });
        }
        // Un usuario solo puede estar vinculado a un jugador por fase: se quita de donde estuviera.
        const stmts = [];
        if (did) stmts.push(env.DB.prepare("UPDATE liga_jugadores SET discord_id=NULL WHERE fase_id=?1 AND discord_id=?2 AND id<>?3").bind(j.fase_id, did, id));
        stmts.push(env.DB.prepare("UPDATE liga_jugadores SET discord_id=?2, sugerido_id=NULL WHERE id=?1").bind(id, did));
        await env.DB.batch(stmts);
        return Response.json({ ok: true }, { headers: noStore });
      }

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
      // v2: incluye el contenido completo (HTML de Blogger, que el navegador filtra antes de mostrar).
      const key = new Request(url.origin + "/api/blog?v=2");
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
            html: html.slice(0, 200000),
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
