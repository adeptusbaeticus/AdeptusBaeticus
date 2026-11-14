const FEED = "https://adeptus-baeticus.blogspot.com/feeds/posts/default?alt=json&max-results=6";
const COOKIE = "ab_session";
// La sesión dura 90 días y se renueva con el uso (ver /api/me): quien entra al menos una vez cada 90 días
// no tiene que volver a iniciar sesión. Al renovarla (como mucho una vez al día) se comprueba con el bot
// que sigue en el servidor de Discord y con qué rol.
const MAX_AGE = 90 * 24 * 3600;
const RENUEVA_SEG = 24 * 3600;
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

// --- Inscripción: cifrado (AES-GCM) del permiso de Discord con una clave derivada del secreto de sesión,
// y cookie firmada con la cuenta de Discord conectada mientras se rellena el formulario. ---
async function claveTokens(env) {
  const h = await crypto.subtle.digest("SHA-256", enc.encode("tokens-inscripcion:" + env.SESSION_SECRET));
  return crypto.subtle.importKey("raw", h, "AES-GCM", false, ["encrypt", "decrypt"]);
}
async function cifra(env, texto) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const c = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await claveTokens(env), enc.encode(texto));
  return b64u(iv) + "." + b64u(c);
}
async function descifra(env, s) {
  const bytes = (x) => Uint8Array.from(atob(x.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
  const [iv, c] = String(s || "").split(".");
  const p = await crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes(iv) }, await claveTokens(env), bytes(c));
  return new TextDecoder().decode(p);
}
const COOKIE_REG = "ab_reg";
async function firmaReg(env, obj) { const body = toB64(JSON.stringify(obj)); return body + "." + (await hmac(env.SESSION_SECRET, body)); }
async function leeReg(env, request, nombre = COOKIE_REG) {
  const m = (request.headers.get("cookie") || "").match(new RegExp(nombre + "=([^;]+)"));
  if (!m) return null;
  const [body, sig] = m[1].split(".");
  if (!body || !sig || sig !== (await hmac(env.SESSION_SECRET, body))) return null;
  try { const o = JSON.parse(fromB64(body)); return o.exp > Date.now() / 1000 ? o : null; } catch (e) { return null; }
}

async function makeSession(env, user) {
  const body = toB64(JSON.stringify({ ...user, exp: user.exp || Math.floor(Date.now() / 1000) + MAX_AGE }));
  return body + "." + (await hmac(env.SESSION_SECRET, body));
}

// Sesión firmada tal cual (incluida la de «ver como invitado»).
async function leeSesion(env, request) {
  const m = (request.headers.get("cookie") || "").match(new RegExp(COOKIE + "=([^;]+)"));
  if (!m) return null;
  const [body, sig] = m[1].split(".");
  if (!body || !sig || sig !== (await hmac(env.SESSION_SECRET, body))) return null;
  try {
    const u = JSON.parse(fromB64(body));
    // En la web ya no hay «veterano» (es miembro): las sesiones antiguas que lo traigan cuentan como miembro.
    if (u.role === "veterano") u.role = "miembro";
    return u.exp > Date.now() / 1000 ? u : null;
  } catch (e) {
    return null;
  }
}

// Sesión del usuario. En el modo «ver como invitado» se comporta como si no hubiera sesión.
async function readSession(env, request) {
  const u = await leeSesion(env, request);
  return u && !u.invitado ? u : null;
}

function roleOf(env, roles) {
  if (roles.includes(env.ROLE_ADMIN)) return "admin";
  if (roles.includes(env.ROLE_VETERANO)) return "miembro"; // el rol de Discord de veterano cuenta como miembro en la web
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
  // Físico (en el lugar indicado o «A decidir» si se deja vacío), online (Tabletop Simulator) o ambos (lo elige quien se une).
  // Sin el dato (versiones antiguas de la página) se toma físico; vacío o raro, se avisa.
  const modo = b.modo == null ? "fisico" : b.modo;
  if (!["fisico", "online", "ambos"].includes(modo)) return { error: "Marca si buscas jugar en físico, online (TTS) o las dos" };
  const lugar = modo !== "online" ? String(b.lugar || "").trim().slice(0, 120) || null : null;
  return { ...plan, team_a: ta, team_b: tb, availability, modo, lugar };
}

const MAX_PARTIDAS = 14; // partidas abiertas por socio

// ¿Está `slot` ("YYYY-MM-DDTHH:MM") dentro de la disponibilidad?
const inAvailability = (av, slot) =>
  /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):00$/.test(slot) &&
  av.some((x) => x.date === slot.slice(0, 10) && slot.slice(11) >= x.from && slot.slice(11) < x.to);


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
      last_day: p.last_day, mesa: p.mesa, status: p.status, team_a: p.team_a, team_b: p.team_b, modo: p.modo, lugar: p.lugar,
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

// --- Inscripción al club: opciones del formulario (clave → texto, también para el mensaje de Discord). ---
const INSC_JUEGOS = { "40k": "Warhammer 40.000", combat_patrol: "Combat Patrol", necromunda: "Necromunda", bloodbowl: "Blood Bowl",
  pintura: "Pintura y modelismo", otros: "Otros" };
const INSC_EXP_JUEGO = {
  nunca: "Nunca he jugado a juegos de miniaturas", otros: "He jugado a otros juegos de miniaturas, pero no a Warhammer",
  demo: "He jugado alguna partida de prueba de Warhammer", aprendiendo: "Estoy aprendiendo las reglas (menos de 10 partidas)",
  ocasional: "Juego de vez en cuando (alguna partida al mes)", habitual: "Juego con regularidad (varias partidas al mes)",
  torneos: "Juego torneos o ligas",
};
const INSC_EXP_PINTURA = {
  nunca: "Nunca he pintado miniaturas", empezando: "Estoy empezando (imprimación y colores base)",
  basico: "Nivel básico (capas, lavados y pincel seco)", intermedio: "Nivel intermedio (iluminaciones, perfilados y peanas trabajadas)",
  avanzado: "Nivel avanzado (degradados, efectos y nivel de concurso)",
};
const INSC_COMO = { instagram: "Instagram", discord: "Discord", amigo: "Un amigo o conocido", tienda: "En la tienda (2d6 Store)",
  evento: "En un torneo o evento", blog: "El blog del club", otro: "Otro" };

// Valida los datos del formulario de inscripción (también los que completa un socio al entrar).
// Devuelve { error } o { nombre, email, telefono, mayor_edad, juegos, experiencia_juego, experiencia_pintura, como }.
function validaDatosSocio(b, sinCondiciones) {
  const t = (v, n) => String(v == null ? "" : v).trim().slice(0, n);
  const nombre = t(b.nombre, 100), email = t(b.email, 120).toLowerCase(), telefono = t(b.telefono, 25).replace(/[\s.-]/g, "");
  const juegos = Array.isArray(b.juegos) ? [...new Set(b.juegos.filter((x) => INSC_JUEGOS[x]))] : [];
  const como = INSC_COMO[b.como_conocio] ? b.como_conocio : null, comoOtro = t(b.como_otro, 100);
  if (nombre.length < 3) return { error: "Escribe tu nombre y apellidos." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { error: "Escribe un correo electrónico válido." };
  if (!/^\+?\d{9,15}$/.test(telefono)) return { error: "Escribe un teléfono válido (con prefijo si no es de España)." };
  if (b.mayor_edad !== "si" && b.mayor_edad !== "no") return { error: "Indica si eres mayor de edad." };
  if (!INSC_EXP_JUEGO[b.experiencia_juego]) return { error: "Elige tu experiencia de juego." };
  if (!INSC_EXP_PINTURA[b.experiencia_pintura]) return { error: "Elige tu experiencia de pintura." };
  // Las condiciones solo las acepta el propio socio (el admin, al corregir sus datos, no las toca).
  if (!sinCondiciones && b.acepta_estatutos !== true) return { error: "Tienes que aceptar los estatutos y el reglamento interno." };
  if (!sinCondiciones && b.consentimiento !== true) return { error: "Tienes que aceptar el tratamiento de tus datos." };
  return { nombre, email, telefono, mayor_edad: b.mayor_edad === "si" ? 1 : 0, juegos: juegos.length ? JSON.stringify(juegos) : null,
    experiencia_juego: b.experiencia_juego, experiencia_pintura: b.experiencia_pintura,
    como: como ? (como === "otro" && comoOtro ? "Otro: " + comoOtro : INSC_COMO[como]) : null, juegosLista: juegos };
}

// --- Socios importados del Excel antiguo (`socios_datos`, origen 'excel') ---
// Alias de Discord del Excel → nombres a comparar: sin @ delante, sin #1234 y en minúsculas. Puede traer varios
// separados por «/»; si alguien puso su correo, vale la parte de antes de la @.
// Apodo del servidor sin lo que va entre paréntesis («Silvermane (Sergio)» → «Silvermane»), o null si no cambia.
function sinParentesis(n) {
  const x = String(n || "").replace(/\s*\([^)]*\)\s*/g, " ").trim();
  return x && x !== String(n || "").trim() ? x : null;
}
function aliasDiscord(txt) {
  return String(txt || "").split("/").map((a) => a.trim().replace(/^@/, "").replace(/#\d{4}$/, "").replace(/@[^@\s]+\.[a-z]{2,}$/i, "").trim().toLowerCase())
    .filter((a) => a.length >= 2);
}
// Posibles cuentas de Discord para un socio sin vincular: alias parecido (sin números ni signos, uno dentro del
// otro o con pocas letras distintas) o su nombre real en el apodo («Silvermane (Sergio)»). Hasta 3, de más a menos parecida.
function sugerenciasSocio(env, fila, miembros) {
  const norm = (x) => String(x || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const nucleo = (x) => norm(x).replace(/\d+$/, "");
  const lev = (a, b) => {
    if (Math.abs(a.length - b.length) > 3) return 99;
    let p = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const c = [i];
      for (let j = 1; j <= b.length; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      p = c;
    }
    return p[b.length];
  };
  const alias = aliasDiscord(fila.discord_alias).map(nucleo).filter((a) => a.length >= 3);
  const partes = String(fila.nombre || "").split(/\s+/).map(norm).filter((x) => x.length >= 3);
  const out = [];
  for (const m of miembros) {
    const claves = [m.user.username, m.user.global_name, m.nick, sinParentesis(m.nick), sinParentesis(m.user.global_name)].filter(Boolean).map(nucleo).filter((k) => k.length >= 3);
    let p = 0;
    for (const a of alias) for (const k of claves) {
      if (a === k) p = Math.max(p, 0.95);
      else if (Math.min(a.length, k.length) >= 4 && (a.includes(k) || k.includes(a))) p = Math.max(p, 0.8);
      else if (a.length >= 5) { const d = lev(a, k); if (d <= (a.length >= 8 ? 2 : 1)) p = Math.max(p, 0.7); }
    }
    // Nombre real: nombre y apellido dentro del apodo o del nombre visible.
    const texto = norm([m.nick, m.user.global_name, m.user.username].filter(Boolean).join(" "));
    if (partes.length >= 2 && texto.includes(partes[0]) && partes.slice(1).some((x) => texto.includes(x))) p = Math.max(p, 0.85);
    else if (partes.length) {
      // Solo el nombre de pila, entre paréntesis en el apodo («Archerus (Ismael)»): coincidencia floja.
      // También el nombre visible o el apodo que es solo su nombre («Gema») o un usuario que empieza por él («gemita26»).
      const entre = [m.nick, m.user.global_name].map((x) => (/\(([^)]*)\)/.exec(x || "") || [])[1]).filter(Boolean).map(norm);
      const solo = [m.user.global_name, m.nick, sinParentesis(m.nick)].filter(Boolean).map(norm);
      const n0 = partes[0], raiz = n0.slice(0, Math.max(4, n0.length - 1));
      if ([...entre, ...solo].some((x) => x === n0 || (x.length >= 4 && x.startsWith(n0)))) p = Math.max(p, 0.55);
      else if (n0.length >= 4 && norm(m.user.username).startsWith(raiz)) p = Math.max(p, 0.5);
    }
    if (p >= 0.5) out.push({ p, id: m.user.id, usuario: m.user.username, nombre: m.nick || m.user.global_name || m.user.username, rol: roleOf(env, m.roles || []) });
  }
  return out.sort((a, b) => b.p - a.p).slice(0, 3);
}
// Vincula filas del Excel con cuentas de Discord y crea su ficha en Miembros (sin conectar) si tienen rol del club.
// lista: [{ s: id de la fila, d: discord_id, n: nombre, a: avatar, r: rol o null }]. Dos consultas para toda la lista.
async function vinculaSocios(env, lista) {
  if (!lista.length) return;
  const j = JSON.stringify(lista);
  await env.DB.batch([
    env.DB.prepare(`UPDATE socios_datos SET discord_id=(SELECT json_extract(value,'$.d') FROM json_each(?1) WHERE json_extract(value,'$.s')=socios_datos.id)
      WHERE discord_id IS NULL AND id IN (SELECT json_extract(value,'$.s') FROM json_each(?1))`).bind(j),
    env.DB.prepare(`INSERT INTO users (discord_id, name, avatar, role, conectado, alta, instagram)
      SELECT json_extract(j.value,'$.d'), json_extract(j.value,'$.n'), json_extract(j.value,'$.a'), json_extract(j.value,'$.r'), 0, s.alta, s.instagram
      FROM json_each(?1) j JOIN socios_datos s ON s.id=json_extract(j.value,'$.s') WHERE json_extract(j.value,'$.r') IS NOT NULL
      ON CONFLICT(discord_id) DO UPDATE SET alta=COALESCE(users.alta, excluded.alta), instagram=COALESCE(users.instagram, excluded.instagram)`).bind(j),
  ]);
}
// Al iniciar sesión: si aún no está vinculado, se busca su fila del Excel por su nombre de usuario, nombre visible o
// apodo (solo si hay una única coincidencia). Después pasan a su ficha la fecha de registro y el Instagram (si faltan).
async function vinculaAlEntrar(env, u, nick) {
  if (!(await env.DB.prepare("SELECT 1 FROM socios_datos WHERE discord_id=?1").bind(u.id).first())) {
    const nombres = new Set([u.username, u.global_name, nick, sinParentesis(nick), sinParentesis(u.global_name)].filter(Boolean).map((x) => String(x).toLowerCase()));
    const filas = (await env.DB.prepare("SELECT id, discord_alias FROM socios_datos WHERE discord_id IS NULL AND discord_alias IS NOT NULL").all()).results;
    const hits = filas.filter((f) => aliasDiscord(f.discord_alias).some((a) => nombres.has(a)));
    if (hits.length === 1) await env.DB.prepare("UPDATE socios_datos SET discord_id=?2 WHERE id=?1 AND discord_id IS NULL").bind(hits[0].id, u.id).run();
  }
  await env.DB.prepare(`UPDATE users SET
      alta=COALESCE(alta, (SELECT alta FROM socios_datos WHERE discord_id=?1),
        (SELECT date(created_at) FROM solicitudes WHERE discord_id=?1 AND estado='aprobada' ORDER BY id DESC LIMIT 1)),
      instagram=COALESCE(instagram, (SELECT instagram FROM socios_datos WHERE discord_id=?1)) WHERE discord_id=?1`).bind(u.id).run();
}
// Para /api/me: `datos_pendientes` (aviso junto al usuario, también para el admin) y `completar` (obligatorio, menos el admin).
async function avisoDatos(env, s) {
  if (await tieneDatos(env, s.id)) return {};
  return s.role === "admin" ? { datos_pendientes: true } : { datos_pendientes: true, completar: true };
}
// Borra por completo el perfil de un socio en la web: ficha, datos de inscripción, inscripciones, partidas que creó,
// votos, bendiciones, trofeos, notificaciones… y quita su vínculo con la liga. Las fotos de la galería y los posts se
// quedan (son del club y están en Discord). Si sigue en Discord con rol del club y vuelve a entrar, empieza de cero.
async function borraPerfil(env, id) {
  await env.DB.batch([
    env.DB.prepare("DELETE FROM partida_players WHERE discord_id=?1 OR partida_id IN (SELECT id FROM partidas WHERE created_by=?1)").bind(id),
    env.DB.prepare("DELETE FROM partidas WHERE created_by=?1").bind(id),
    env.DB.prepare("DELETE FROM registrations WHERE discord_id=?1").bind(id),
    env.DB.prepare("DELETE FROM bendiciones WHERE discord_id=?1").bind(id),
    env.DB.prepare("DELETE FROM encuesta_votos WHERE discord_id=?1").bind(id),
    env.DB.prepare("UPDATE encuestas SET created_by=NULL WHERE created_by=?1").bind(id),
    env.DB.prepare("DELETE FROM trofeo_miembros WHERE discord_id=?1").bind(id),
    env.DB.prepare("DELETE FROM push_subs WHERE discord_id=?1").bind(id),
    env.DB.prepare("DELETE FROM dm_canales WHERE discord_id=?1").bind(id),
    env.DB.prepare("UPDATE liga_jugadores SET discord_id=NULL WHERE discord_id=?1").bind(id),
    env.DB.prepare("DELETE FROM socios_datos WHERE discord_id=?1").bind(id),
    env.DB.prepare("DELETE FROM solicitudes WHERE discord_id=?1").bind(id),
    env.DB.prepare("DELETE FROM users WHERE discord_id=?1").bind(id),
  ]);
}
// Lo único de la API que puede usar un socio mientras le faltan sus datos (además de /api/inscripcion*).
const SIN_DATOS_PERMITIDO = new Set(["/api/me", "/api/socio/datos", "/api/socio/borrar", "/api/ver-como/salir", "/api/push/baja"]);
// ¿Tiene que completar sus datos? Todos los socios menos el admin, hasta que los completen (o si se inscribieron con la web).
async function faltanDatos(env, s) {
  if (!s || s.role === "admin") return false;
  return !(await tieneDatos(env, s.id));
}
async function tieneDatos(env, id) {
  const r = await env.DB.prepare(`SELECT EXISTS (SELECT 1 FROM socios_datos WHERE discord_id=?1 AND completado_at IS NOT NULL)
    OR EXISTS (SELECT 1 FROM solicitudes WHERE discord_id=?1 AND estado='aprobada') AS ok`).bind(id).first();
  return !!(r && r.ok);
}

// Rol «Externo» del servidor (se busca por su nombre; se guarda 1 día). Quien solo tiene ese rol no ve nada en
// Discord y en la web es invitado (no es un rol del club).
async function rolExterno(env) {
  const c = await env.DB.prepare("SELECT datos FROM nr_cache WHERE clave='discord:rol-externo' AND actualizado > datetime('now','-1 day')").first();
  if (c && c.datos) return c.datos;
  const r = await bot(env, `/guilds/${env.GUILD_ID}/roles`);
  if (!r.ok) return null;
  const rol = (await r.json()).find((x) => normalCanal(x.name) === "externo");
  if (!rol) return null;
  await env.DB.prepare("INSERT INTO nr_cache (clave, datos, actualizado) VALUES ('discord:rol-externo', ?1, datetime('now')) ON CONFLICT(clave) DO UPDATE SET datos=?1, actualizado=datetime('now')").bind(rol.id).run();
  return rol.id;
}
// Permiso de Discord nuevo a partir del guardado (cifrado). Devuelve { access, rt } (rt = nuevo permiso cifrado) o null.
async function permisoDiscord(env, cifrado) {
  if (!cifrado) return null;
  try {
    const t = await fetch("https://discord.com/api/oauth2/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: env.DISCORD_CLIENT_ID, client_secret: env.DISCORD_CLIENT_SECRET, grant_type: "refresh_token",
        refresh_token: await descifra(env, cifrado) }) });
    if (!t.ok) return null;
    const j = await t.json();
    return { access: j.access_token, rt: j.refresh_token ? await cifra(env, j.refresh_token) : null };
  } catch (e) { return null; }
}
// Al enviar la inscripción: el bot mete al aspirante en el servidor con el rol Externo. Si lo consigue, el permiso de
// Discord ya no hace falta y se borra. Devuelve una línea para el mensaje de los admins.
async function entraComoExterno(env, sol) {
  const ext = await rolExterno(env);
  const p = await permisoDiscord(env, sol.token_cifrado);
  if (!p) return "⚠️ No se pudo meter en el servidor (permiso de Discord no válido).";
  const r = await bot(env, `/guilds/${env.GUILD_ID}/members/${sol.discord_id}`, { method: "PUT", headers: { "content-type": "application/json" },
    body: JSON.stringify({ access_token: p.access, roles: ext ? [ext] : [] }) });
  let ok = r.status === 201 || r.status === 204;
  if (r.status === 204 && ext) ok = (await bot(env, `/guilds/${env.GUILD_ID}/members/${sol.discord_id}/roles/${ext}`, { method: "PUT" })).ok;
  // Si no se pudo, se guarda el permiso renovado para intentarlo al aprobar.
  await env.DB.prepare("UPDATE solicitudes SET token_cifrado=?2 WHERE id=?1").bind(sol.id, ok ? null : p.rt).run();
  if (!ok) return `⚠️ No se pudo meter en el servidor (error ${r.status}): revisa los permisos del bot.`;
  return ext ? "🚪 Ya está en el servidor con el rol Externo." : "🚪 Ya está en el servidor (no existe el rol «Externo»: créalo para que no vea nada).";
}

// Un admin pulsa «Aprobar» o «Rechazar» en el mensaje de la solicitud (#inner-circle-general). Al aprobar, se le quita
// Externo y se le da Aspirante (si aún no estaba en el servidor, se le mete). Al rechazar, se le saca del servidor.
async function decideInscripcion(env, it, accion, id) {
  const webhook = `${DAPI}/webhooks/${it.application_id}/${it.token}`;
  const privado = (content) => fetch(webhook, { method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ content, flags: 64, allowed_mentions: { parse: [] } }) });
  const cierraMensaje = (linea) => fetch(webhook + "/messages/@original", { method: "PATCH", headers: { "content-type": "application/json" },
    body: JSON.stringify({ content: ((it.message && it.message.content) || "").slice(0, 1700) + "\n\n" + linea, components: [], allowed_mentions: { parse: [] } }) });
  const admin = it.member.user.id;
  const sol = await env.DB.prepare("SELECT * FROM solicitudes WHERE id=?1").bind(id).first();
  if (!sol) return privado("Esa solicitud ya no existe.");
  if (sol.estado !== "pendiente") return cierraMensaje(sol.estado === "aprobada" ? "✅ Ya estaba aprobada." : "❌ Ya estaba rechazada.");
  const ext = await rolExterno(env);
  const miembro = `/guilds/${env.GUILD_ID}/members/${sol.discord_id}`;
  if (accion === "rechazar") {
    const k = await bot(env, miembro, { method: "DELETE" }); // fuera del servidor (404: ya no estaba)
    await env.DB.prepare("UPDATE solicitudes SET estado='rechazada', token_cifrado=NULL, decidido_por=?2, decidido_at=datetime('now') WHERE id=?1").bind(id, admin).run();
    return cierraMensaje(`❌ Rechazada por <@${admin}>` + (k.ok || k.status === 404 ? "; ya no está en el servidor." : `. No se le pudo sacar del servidor (error ${k.status}): hazlo a mano.`));
  }
  // Aprobar: rol de Aspirante (y fuera Externo). Si ya no estaba en el servidor, se le mete con el permiso guardado.
  let r = await bot(env, `${miembro}/roles/${env.ROLE_ASPIRANTE}`, { method: "PUT" });
  let ok = r.ok, nota = r.ok ? "" : "error " + r.status;
  if (r.status === 404) {
    const p = await permisoDiscord(env, sol.token_cifrado);
    if (p) {
      const j = await bot(env, miembro, { method: "PUT", headers: { "content-type": "application/json" },
        body: JSON.stringify({ access_token: p.access, roles: [env.ROLE_ASPIRANTE] }) });
      ok = j.status === 201; nota = ok ? "" : "no se pudo meter en el servidor (error " + j.status + ")";
    } else nota = "ya no está en el servidor y su permiso de Discord no es válido";
  }
  if (!ok) return privado(`⚠️ No se pudo dar el rol de Aspirante a <@${sol.discord_id}>: ${nota}. Revisa que el bot tenga «Gestionar roles» y que su rol esté por encima de Aspirante, o dale el rol a mano.`);
  if (ext) await bot(env, `${miembro}/roles/${ext}`, { method: "DELETE" }).catch(() => {});
  await env.DB.prepare("UPDATE solicitudes SET estado='aprobada', token_cifrado=NULL, decidido_por=?2, decidido_at=datetime('now') WHERE id=?1").bind(id, admin).run();
  return cierraMensaje(`✅ Aprobada por <@${admin}>: <@${sol.discord_id}> ya tiene el rol de Aspirante.`);
}

// --- Publicaciones de la galería: lo común a los comandos de Discord y al formulario de la web. ---
// Las fotos viven en el mensaje del bot en #publicaciones-web; aquí solo se guarda la referencia.
const EXT_IMG = { "image/png": "png", "image/jpeg": "jpg", "image/gif": "gif", "image/webp": "webp" };

// Crea la publicación con sus fotos (files: [{ blob, ext }]). Devuelve { id, numero, imgs } o { error, status }.
async function pubCrear(env, { uid, name, texto, channelId, files }) {
  // El número se asigna dentro del INSERT: el siguiente al mayor que exista.
  const r = await env.DB.prepare(
    `INSERT INTO publicaciones (discord_id, autor, texto, channel_id, numero)
     VALUES (?1, ?2, ?3, ?4, (SELECT COALESCE(MAX(numero), 0) + 1 FROM publicaciones))`
  ).bind(uid, name, texto, channelId).run();
  const id = r.meta.last_row_id;
  const num = (await env.DB.prepare("SELECT numero FROM publicaciones WHERE id=?1").bind(id).first()).numero;
  const names = files.map((f, i) => `publicacion-${id}-${i + 1}.${f.ext}`);
  const fd = new FormData();
  fd.append("payload_json", JSON.stringify({
    content: pubMensaje(num, uid, texto), allowed_mentions: { parse: [] },
    attachments: names.map((filename, i) => ({ id: i, filename })),
  }));
  files.forEach((f, i) => fd.append(`files[${i}]`, f.blob, names[i]));
  const pm = await bot(env, `/channels/${channelId}/messages`, { method: "POST", body: fd });
  if (!pm.ok) {
    await env.DB.batch([
      env.DB.prepare("DELETE FROM publicaciones WHERE id=?1").bind(id),
      env.DB.prepare("UPDATE publicaciones SET numero=numero-1 WHERE numero>?1").bind(num),
    ]);
    return { error: pm.status === 413 ? "grande" : "discord", status: pm.status };
  }
  const msg = await pm.json();
  // Mismo orden en que se adjuntaron.
  const imgs = names.map((n) => (msg.attachments || []).find((a) => a.filename === n)).filter(Boolean)
    .map((a) => ({ url: a.url, filename: a.filename, width: a.width || null, height: a.height || null }));
  const first = imgs[0] || {};
  await env.DB.prepare(
    "UPDATE publicaciones SET message_id=?2, image_url=?3, width=?4, height=?5, imagenes=?6, status='publicada', numero_discord=?7 WHERE id=?1"
  ).bind(id, msg.id, first.url || null, first.width || null, first.height || null, JSON.stringify(imgs), num).run();
  // Por si el número cambió mientras se subía (alguien borró otra publicación).
  await syncNumeros(env, 5);
  const ahora = (await env.DB.prepare("SELECT numero FROM publicaciones WHERE id=?1").bind(id).first()).numero;
  return { id, numero: ahora, imgs };
}

// Añade una foto al final de una publicación (p = fila de publicaciones). Devuelve { n } o { error, status }.
async function pubAnadir(env, p, blob, ext) {
  let imgs = [];
  try { imgs = JSON.parse(p.imagenes || "[]"); } catch (e) {}
  if (imgs.length >= 10) return { error: "llena" };
  if (!p.message_id) return { error: "sin-mensaje" };
  // Se conservan los adjuntos que ya tiene el mensaje (por su id) y se añade el nuevo al final.
  const gm = await bot(env, `/channels/${p.channel_id}/messages/${p.message_id}`);
  if (!gm.ok) return { error: "leer", status: gm.status };
  const antes = (await gm.json()).attachments || [];
  const filename = `publicacion-${p.id}-${Date.now()}.${ext}`;
  const fd = new FormData();
  fd.append("payload_json", JSON.stringify({ attachments: antes.map((a) => ({ id: a.id })).concat([{ id: 0, filename }]) }));
  fd.append("files[0]", blob, filename);
  const pm = await bot(env, `/channels/${p.channel_id}/messages/${p.message_id}`, { method: "PATCH", body: fd });
  if (!pm.ok) return { error: pm.status === 413 ? "grande" : "discord", status: pm.status };
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
  return { n: nuevas.length };
}

// Borra la publicación de la web y su mensaje de Discord; las siguientes bajan un número. Devuelve { ok } o { error, status }.
async function pubBorrar(env, p) {
  if (p.message_id) {
    const r = await bot(env, `/channels/${p.channel_id}/messages/${p.message_id}`, { method: "DELETE" });
    if (!r.ok && r.status !== 404) return { error: "discord", status: r.status };
  }
  await env.DB.batch([
    env.DB.prepare("DELETE FROM bendiciones WHERE publicacion_id=?1").bind(p.id),
    env.DB.prepare("DELETE FROM publicaciones WHERE id=?1").bind(p.id),
    // Las siguientes bajan un número para que no haya saltos.
    env.DB.prepare("UPDATE publicaciones SET numero=numero-1 WHERE numero>?1").bind(p.numero),
  ]);
  await syncNumeros(env, 20);
  return { ok: true };
}

// Canal #publicaciones-web: el de las publicaciones existentes o, si no hay, se busca por su nombre.
async function canalPublicaciones(env) {
  const u = await env.DB.prepare("SELECT channel_id FROM publicaciones WHERE channel_id IS NOT NULL ORDER BY id DESC LIMIT 1").first();
  if (u && u.channel_id) return u.channel_id;
  const rc = await bot(env, `/guilds/${env.GUILD_ID}/channels`);
  if (!rc.ok) return null;
  const c = (await rc.json()).find((x) => (x.type === 0 || x.type === 5) && normalCanal(x.name).includes(CANAL_PUBLICACIONES));
  return c ? c.id : null;
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
    const res = await pubCrear(env, { uid, name, texto, channelId: it.channel_id,
      files: blobs.map((b, i) => ({ blob: b, ext: EXT[(atts[i].content_type || "").split(";")[0]] })) });
    if (res.error) {
      return res.error === "grande"
        ? "Las fotos ocupan demasiado para Discord. Prueba con menos fotos o más ligeras."
        : `No se pudo publicar (error ${res.status}). Revisa que el bot pueda escribir y adjuntar archivos en #${CANAL_PUBLICACIONES}.`;
    }
    const imgs = res.imgs, ahora = res.numero;
    const n = imgs.length;
    await notifica(env, { tipo: "galeria", excepto: uid, titulo: "Fotos nuevas en la galería",
      texto: name + " ha publicado " + (n > 1 ? n + " fotos" : "una foto") + (texto ? ": " + texto.slice(0, 80) : ""), url: "/galeria.html" }).catch(() => 0);
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
    const res = await pubAnadir(env, p, await img.blob(), EXT[tipo]);
    if (res.error === "leer") return `No se pudo leer el mensaje de la publicación en Discord (error ${res.status}).`;
    if (res.error) return res.error === "grande" ? "La foto ocupa demasiado para Discord." : `No se pudo añadir la foto en Discord (error ${res.status}).`;
    const nuevas = { length: res.n };
    return `➕ Foto añadida al final de la publicación ${p.numero}. Ahora tiene ${nuevas.length} fotos.`;
  }

  if (cmd === "borrar") {
    if (p.discord_id !== uid && role !== "admin") return "Solo puedes borrar tus propias publicaciones.";
    const res = await pubBorrar(env, p);
    if (res.error) return `No se pudo borrar el mensaje en Discord (error ${res.status}).`;
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

// --- Miembros: ficha de cada socio (facciones y cuentas) ---
const FACCIONES = [
  "Adepta Sororitas", "Adeptus Custodes", "Adeptus Mechanicus", "Astra Militarum", "Black Templars", "Blood Angels",
  "Dark Angels", "Deathwatch", "Grey Knights", "Imperial Agents", "Imperial Knights", "Space Marines", "Space Wolves",
  "Chaos Daemons", "Chaos Knights", "Chaos Space Marines", "Death Guard", "Emperor's Children", "Thousand Sons", "World Eaters",
  "Aeldari", "Drukhari", "Genestealer Cults", "Leagues of Votann", "Necrons", "Orks", "T'au Empire", "Tyranids",
];
// Limpia y valida cada cuenta; devuelve [valor | null, error | null]. Se aceptan enlaces y se guarda solo el usuario.
function cuentaLimpia(tipo, v) {
  v = String(v == null ? "" : v).trim();
  if (!v) return [null, null];
  if (tipo === "instagram") {
    v = v.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/[/?#].*$/, "").replace(/^@/, "");
    return /^[A-Za-z0-9._]{1,30}$/.test(v) ? [v, null] : [null, "Usuario de Instagram no válido"];
  }
  if (tipo === "steam") {
    const m = /^https?:\/\/(www\.)?steamcommunity\.com\/(id|profiles)\/([^/?#]+)/i.exec(v);
    if (m) v = m[3];
    return /^[A-Za-z0-9_-]{2,64}$/.test(v) ? [v, null] : [null, "Perfil de Steam no válido"];
  }
  if (tipo === "bcp") return /^[\p{L}\p{N} ._@'-]{2,40}$/u.test(v) ? [v, null] : [null, "Nombre de BCP no válido"];
  if (tipo === "nr") return /^[\p{L}\p{N} ._@-]{2,40}$/u.test(v) ? [v, null] : [null, "Usuario de New Recruit no válido"];
  return [null, null];
}

// Guarda la ficha de Miembros (facciones y cuentas) de un socio. Devuelve un error (texto) o null.
async function guardaFicha(env, discordId, b) {
  const u = await env.DB.prepare("SELECT discord_id, nr_username FROM users WHERE discord_id=?1").bind(discordId).first();
  if (!u) return "Ese miembro no existe";
  const fac = Array.isArray(b.facciones) ? [...new Set(b.facciones.map(String))] : [];
  if (fac.some((f) => !FACCIONES.includes(f))) return "Facción no válida";
  const v = {};
  for (const [campo, tipo] of [["instagram", "instagram"], ["steam", "steam"], ["bcp", "bcp"], ["nr", "nr"]]) {
    const [val, err] = cuentaLimpia(tipo, b[campo]);
    if (err) return err;
    v[campo] = val;
  }
  await env.DB.prepare("UPDATE users SET facciones=?2, instagram=?3, steam=?4, bcp=?5, nr_username=?6 WHERE discord_id=?1")
    .bind(u.discord_id, fac.length ? JSON.stringify(fac) : null, v.instagram, v.steam, v.bcp, v.nr).run();
  if ((v.nr || null) !== (u.nr_username || null)) { try { await ligaVincula(env, u.discord_id); } catch (e) {} }
  return null;
}

// --- Avisos de mantenimiento en Discord (#inner-circle-general) ---
// El bot escribe solo cuando algo empieza a fallar y cuando vuelve a funcionar (no en cada intento).
const CANAL_AVISOS = "inner-circle-general";
const normalCanal = (t) => String(t || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
async function avisoEstado(env, servicio, nombre, error) {
  try {
    if (!env.DISCORD_BOT_TOKEN) return;
    const clave = "aviso:" + servicio;
    const prev = await env.DB.prepare("SELECT datos FROM nr_cache WHERE clave=?1").bind(clave).first();
    const antes = prev ? prev.datos : "ok", ahora = error ? "error" : "ok";
    if (antes === ahora) return;
    await env.DB.prepare("INSERT INTO nr_cache (clave, datos, actualizado) VALUES (?1, ?2, datetime('now')) ON CONFLICT(clave) DO UPDATE SET datos=?2, actualizado=datetime('now')")
      .bind(clave, ahora).run();
    const rc = await bot(env, `/guilds/${env.GUILD_ID}/channels`);
    if (!rc.ok) return;
    const c = (await rc.json()).find((x) => (x.type === 0 || x.type === 5) && normalCanal(x.name).includes(CANAL_AVISOS));
    if (!c) return;
    const texto = error
      ? "⚠️ **Web del club: falla " + nombre + ".**\n" + String(error).slice(0, 300) + "\nLa web sigue mostrando la última copia buena; avisaré cuando vuelva a funcionar."
      : "✅ **Web del club: " + nombre + " vuelve a funcionar.**";
    await bot(env, `/channels/${c.id}/messages`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: texto, allowed_mentions: { parse: [] } }),
    });
  } catch (e) {} // un aviso que falla no debe romper nada
}

// --- Vista previa al compartir enlaces (Open Graph): título, descripción e imagen de cada página ---
const OG_PAGINAS = {
  "/": ["Adeptus Baeticus · Club de Warhammer 40.000 en Málaga", "Club gratuito y abierto a noveles: quedada el primer sábado de cada mes en 2d6 Store, Gran Liga, torneos y pintura."],
  "/calendario": ["Calendario · Adeptus Baeticus", "Quedadas, torneos y partidas del club. Apúntate o busca rival."],
  "/galeria": ["Galería · Adeptus Baeticus", "Miniaturas pintadas por los socios del club."],
  "/gran-liga": ["Gran Liga Adeptus · Adeptus Baeticus", "Clasificación, rondas y resultados de la liga del club."],
  "/miembros": ["Miembros · Adeptus Baeticus", "Los socios del club: sus facciones, su ranking y su palmarés."],
  "/faq": ["Reglas y FAQ · Adeptus Baeticus", "El reglamento del club y las dudas más habituales."],
  "/encuestas": ["Encuestas · Adeptus Baeticus", "Las votaciones del club."],
  "/inscripcion": ["Inscripción · Adeptus Baeticus", "Únete al club de Warhammer Adeptus Baeticus en Málaga."],
};
const escAttr = (t) => String(t).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// Etiquetas de la vista previa de una dirección (para un evento concreto, su nombre, fecha y lugar).
async function ogPara(env, url) {
  // Cloudflare sirve las páginas sin «.html» (/gran-liga.html → /gran-liga): se aceptan las dos formas.
  let ruta = url.pathname.replace(/\.html$/, "");
  if (ruta === "/index") ruta = "/";
  let [titulo, desc] = OG_PAGINAS[ruta] || ["Adeptus Baeticus", OG_PAGINAS["/"][1]];
  const id = ruta === "/calendario" ? Number(url.searchParams.get("evento")) : 0;
  if (id) {
    let e = null;
    try { e = await env.DB.prepare("SELECT type, title, starts_at, location, description FROM events WHERE id=?1 AND status='publicado'").bind(id).first(); } catch (x) {}
    if (e) {
      titulo = (e.type === "torneo" ? "Torneo: " : "Quedada: ") + e.title;
      desc = fechaCorta(e.starts_at) + (e.location ? " · " + e.location : "") + (e.description ? " — " + String(e.description).slice(0, 160) : "");
    }
  }
  const pagina = url.origin + ruta + (id ? "?evento=" + id : "");
  return [
    ["name", "description", desc], ["property", "og:type", "website"], ["property", "og:site_name", "Adeptus Baeticus"],
    ["property", "og:locale", "es_ES"], ["property", "og:title", titulo], ["property", "og:description", desc],
    ["property", "og:url", pagina], ["property", "og:image", url.origin + "/og-imagen.jpg"], ["property", "og:image:width", "1200"],
    ["property", "og:image:height", "630"], ["property", "og:image:alt", "Escudo del club Adeptus Baeticus"],
    ["name", "twitter:card", "summary_large_image"], ["name", "twitter:title", titulo], ["name", "twitter:description", desc],
    ["name", "twitter:image", url.origin + "/og-imagen.jpg"],
  ];
}
// Añade las etiquetas al <head> de las páginas HTML que se sirven.
async function conVistaPrevia(request, env, url, res) {
  if (request.method !== "GET" || !(res.headers.get("content-type") || "").includes("text/html") || typeof HTMLRewriter === "undefined") return res;
  let tags = "";
  try { tags = (await ogPara(env, url)).map(([k, n, v]) => `<meta ${k}="${n}" content="${escAttr(v)}">`).join("\n"); } catch (e) { return res; }
  return new HTMLRewriter().on("head", { element(el) { el.append(tags, { html: true }); } }).transform(res);
}

// --- Notificaciones en el móvil (Web Push: cifrado RFC 8291 y firma VAPID RFC 8292, sin librerías) ---
// Cada socio las activa por dispositivo y elige qué avisos quiere: eventos, partidas, liga y galería.
const VAPID_PUBLICA = "BKqVWHJMWWkT1cSTBrnXswmQ_AfX4ErXHsl8FH144YNB8dAGFxBBZiKs_weXEa5H-NJbWJfKoi3qpeFnZnffEo8";
const PUSH_TIPOS = ["eventos", "partidas", "liga", "galeria", "encuestas"];
const b64uDec = (t) => Uint8Array.from(atob(t.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((t.length + 3) % 4)), (c) => c.charCodeAt(0));
const b64uEnc = (b) => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unir = (...ps) => { const out = new Uint8Array(ps.reduce((t, p) => t + p.length, 0)); let i = 0; for (const p of ps) { out.set(p, i); i += p.length; } return out; };
async function hkdf(salt, ikm, info, bytes) {
  const k = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, k, bytes * 8));
}
let vapidClave = null;
async function vapidJwt(env, endpoint) {
  if (!vapidClave) {
    const pub = b64uDec(VAPID_PUBLICA);
    vapidClave = await crypto.subtle.importKey("jwk", { kty: "EC", crv: "P-256", d: env.VAPID_PRIVATE, x: b64uEnc(pub.slice(1, 33)), y: b64uEnc(pub.slice(33, 65)), ext: true },
      { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  }
  const enc8 = (o) => b64uEnc(new TextEncoder().encode(JSON.stringify(o)));
  const datos = enc8({ typ: "JWT", alg: "ES256" }) + "." + enc8({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: WEB });
  const firma = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, vapidClave, new TextEncoder().encode(datos));
  return datos + "." + b64uEnc(firma);
}
// Cifra y envía un aviso a una suscripción. Devuelve el estado HTTP (404/410: suscripción caducada).
async function pushEnvia(env, sub, mensaje) {
  const uaPub = b64uDec(sub.p256dh), auth = b64uDec(sub.auth);
  const efimera = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const asPub = new Uint8Array(await crypto.subtle.exportKey("raw", efimera.publicKey));
  const uaKey = await crypto.subtle.importKey("raw", uaPub, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const compartido = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, efimera.privateKey, 256));
  const te = new TextEncoder();
  const ikm = await hkdf(auth, compartido, unir(te.encode("WebPush: info\0"), uaPub, asPub), 32);
  const sal = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(sal, ikm, te.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(sal, ikm, te.encode("Content-Encoding: nonce\0"), 12);
  const claro = unir(te.encode(JSON.stringify(mensaje)), new Uint8Array([2]));
  const k = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const cifrado = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, k, claro));
  const cab = new Uint8Array(21); cab.set(sal, 0); new DataView(cab.buffer).setUint32(16, 4096); cab[20] = 65;
  const r = await fetch(sub.endpoint, {
    method: "POST",
    headers: { "content-encoding": "aes128gcm", "content-type": "application/octet-stream", ttl: "86400", urgency: "normal",
      authorization: "vapid t=" + (await vapidJwt(env, sub.endpoint)) + ", k=" + VAPID_PUBLICA },
    body: unir(cab, asPub, cifrado),
  });
  return r.status;
}
// Envía un aviso a los dispositivos que lo quieren (tipo) de unos socios (o de todos), menos a «excepto».
// Avisos concretos de cada tipo.
const fechaCorta = (t) => new Date(t.slice(0, 10) + "T12:00:00Z").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }) + (t.length > 10 ? " · " + t.slice(11, 16) : "");
function avisoEvento(env, id, ev, autor) {
  return notifica(env, { tipo: "eventos", excepto: autor, titulo: ev.type === "torneo" ? (ev.modo === "online" ? "Nuevo torneo online" : "Nuevo torneo") : "Nueva quedada",
    texto: ev.title + " · " + fechaCorta(ev.starts_at) + (ev.modo === "online" ? " · Online (TTS)" : ""), url: "/calendario.html?evento=" + id });
}
// Pone en la cola un aviso para los dispositivos que lo quieren (tipo) de unos socios (o de todos), menos a
// «excepto», y envía enseguida una primera tanda; el resto lo envía el temporizador al minuto siguiente.
async function notifica(env, { tipo, a = null, excepto = null, titulo, texto, url }) {
  if (!env.VAPID_PRIVATE) return 0;
  let sql = "SELECT endpoint, discord_id, p256dh, auth FROM push_subs WHERE EXISTS (SELECT 1 FROM json_each(tipos) WHERE value=?1)";
  const args = [tipo];
  if (a) { sql += " AND discord_id IN (SELECT value FROM json_each(?2))"; args.push(JSON.stringify(a)); }
  const subs = (await env.DB.prepare(sql).bind(...args).all()).results.filter((x) => !excepto || x.discord_id !== excepto);
  if (!subs.length) return 0;
  const msg = { titulo, texto, url: url || "/", tag: tipo };
  const filas = subs.map((x) => ({ sub: { endpoint: x.endpoint, p256dh: x.p256dh, auth: x.auth }, msg }));
  await env.DB.prepare("INSERT INTO cola_avisos (tipo, datos, coste) SELECT 'push', value, 1 FROM json_each(?1)").bind(JSON.stringify(filas)).run();
  await procesaCola(env, 12).catch(() => {});
  return subs.length;
}
// Envío inmediato (sin cola) a los dispositivos de un socio: solo para el aviso de prueba.
async function notificaAhora(env, uid, msg) {
  if (!env.VAPID_PRIVATE) return 0;
  const { results } = await env.DB.prepare("SELECT endpoint, p256dh, auth FROM push_subs WHERE discord_id=?1 LIMIT 10").bind(uid).all();
  let enviados = 0;
  for (const sub of results) {
    try {
      const st = await pushEnvia(env, sub, msg);
      if (st === 404 || st === 410) await env.DB.prepare("DELETE FROM push_subs WHERE endpoint=?1").bind(sub.endpoint).run();
      else if (st < 300) enviados++;
    } catch (e) {}
  }
  return enviados;
}

// --- Cola de avisos: se procesa por tandas para no pasar los límites del plan gratuito de Cloudflare
// (50 llamadas externas y 50 consultas por ejecución). El temporizador la vacía cada minuto. ---
async function procesaCola(env, presupuesto = 25) {
  const { results: pend } = await env.DB.prepare(
    "SELECT id, tipo, datos, lote, coste, intentos FROM cola_avisos WHERE despues IS NULL OR despues <= datetime('now') ORDER BY id LIMIT 40"
  ).all();
  if (!pend.length) return 0;
  const elegidos = [];
  let suma = 0;
  for (const j of pend) { if (elegidos.length && suma + j.coste > presupuesto) break; suma += j.coste; elegidos.push(j); }
  // Reserva atómica (por si otra ejecución procesa la cola a la vez).
  const { results: tomados } = await env.DB.prepare(
    `UPDATE cola_avisos SET despues=datetime('now','+5 minutes'), intentos=intentos+1
     WHERE id IN (SELECT value FROM json_each(?1)) AND (despues IS NULL OR despues <= datetime('now')) RETURNING id`
  ).bind(JSON.stringify(elegidos.map((j) => j.id))).all();
  const mios = new Set(tomados.map((x) => x.id));
  const trabajos = elegidos.filter((j) => mios.has(j.id)).map((j) => ({ ...j, intentos: j.intentos + 1, d: JSON.parse(j.datos) }));
  if (!trabajos.length) return 0;
  // Datos para los recordatorios de la liga: canal privado guardado y dispositivos de cada jugador.
  const uids = [...new Set(trabajos.filter((j) => j.tipo === "liga").map((j) => j.d.uid))];
  const canales = new Map(), subsDe = new Map();
  if (uids.length) {
    for (const r of (await env.DB.prepare("SELECT discord_id, canal_id FROM dm_canales WHERE discord_id IN (SELECT value FROM json_each(?1))").bind(JSON.stringify(uids)).all()).results) canales.set(r.discord_id, r.canal_id);
    for (const r of (await env.DB.prepare(
      "SELECT endpoint, discord_id, p256dh, auth FROM push_subs WHERE discord_id IN (SELECT value FROM json_each(?1)) AND EXISTS (SELECT 1 FROM json_each(tipos) WHERE value='liga')"
    ).bind(JSON.stringify(uids)).all()).results) { if (!subsDe.has(r.discord_id)) subsDe.set(r.discord_id, []); subsDe.get(r.discord_id).push(r); }
  }
  const hechos = [], reintentar = [], esperar = [], caducadas = [], canalesNuevos = [], canalesMalos = [];
  const lotes = new Map(); // lote → { ok, sin: [] } de esta tanda
  const enLote = (l) => { if (!lotes.has(l)) lotes.set(l, { ok: 0, sin: [] }); return lotes.get(l); };
  for (const j of trabajos) {
    try {
      if (j.tipo === "push") {
        const st = await pushEnvia(env, j.d.sub, j.d.msg);
        if (st === 404 || st === 410) { caducadas.push(j.d.sub.endpoint); hechos.push(j.id); }
        else if (st === 429 || st >= 500) reintentar.push(j.id);
        else hechos.push(j.id);
      } else if (j.tipo === "liga") {
        let ok = false;
        let canal = canales.get(j.d.uid);
        if (!canal) {
          const c = await bot(env, "/users/@me/channels", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ recipient_id: j.d.uid }) });
          if (c.status === 429) { reintentar.push(j.id); continue; }
          if (c.ok) { canal = (await c.json()).id; canalesNuevos.push([j.d.uid, canal]); }
        }
        if (canal) {
          const m = await bot(env, `/channels/${canal}/messages`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ content: j.d.texto, allowed_mentions: { parse: [] } }) });
          if (m.status === 429) { reintentar.push(j.id); continue; }
          if (m.ok) ok = true; else if (m.status === 404) canalesMalos.push(j.d.uid);
        }
        for (const sub of subsDe.get(j.d.uid) || []) {
          const st = await pushEnvia(env, sub, j.d.push).catch(() => 0);
          if (st && st < 300) ok = true; else if (st === 404 || st === 410) caducadas.push(sub.endpoint);
        }
        if (j.lote) { const r = enLote(j.lote); if (ok) r.ok++; else r.sin.push(j.d.nombre + " (no acepta mensajes privados)"); }
        hechos.push(j.id);
      } else if (j.tipo === "canal") {
        // El resumen sale cuando ya no queda nada de su lote en la cola (ni en esta tanda).
        const quedan = (await env.DB.prepare("SELECT COUNT(*) n FROM cola_avisos WHERE lote=?1 AND id<>?2").bind(j.lote, j.id).first()).n;
        if (quedan) { esperar.push(j.id); continue; }
        const est = await env.DB.prepare("SELECT datos FROM nr_cache WHERE clave=?1").bind("lote:" + j.lote).first();
        const r = est ? JSON.parse(est.datos) : { ok: 0, sin: [] };
        await avisoCanal(env, CANAL_AVISOS, j.d.cabecera + r.ok + (r.ok === 1 ? " jugador" : " jugadores") + " (mensaje privado o notificación de la app)." +
          (r.sin.length ? "\nSin aviso (hacedlo a mano): " + r.sin.join(", ") : ""));
        hechos.push(j.id);
        await env.DB.prepare("DELETE FROM nr_cache WHERE clave=?1").bind("lote:" + j.lote).run();
      } else hechos.push(j.id);
    } catch (e) { reintentar.push(j.id); }
  }
  // Se guarda todo de una vez.
  const J = (x) => JSON.stringify(x);
  const st = [
    env.DB.prepare("DELETE FROM cola_avisos WHERE id IN (SELECT value FROM json_each(?1))").bind(J(hechos)),
    // Reintento con espera creciente; tras 3 intentos se descarta.
    env.DB.prepare("DELETE FROM cola_avisos WHERE id IN (SELECT value FROM json_each(?1)) AND intentos >= 3").bind(J(reintentar)),
    env.DB.prepare("UPDATE cola_avisos SET despues=datetime('now', '+' || (intentos * 2) || ' minutes') WHERE id IN (SELECT value FROM json_each(?1))").bind(J(reintentar)),
    env.DB.prepare("UPDATE cola_avisos SET despues=datetime('now','+1 minute'), intentos=intentos-1 WHERE id IN (SELECT value FROM json_each(?1))").bind(J(esperar)),
    env.DB.prepare("DELETE FROM push_subs WHERE endpoint IN (SELECT value FROM json_each(?1))").bind(J(caducadas)),
    env.DB.prepare("INSERT OR REPLACE INTO dm_canales (discord_id, canal_id) SELECT json_extract(value,'$[0]'), json_extract(value,'$[1]') FROM json_each(?1)").bind(J(canalesNuevos)),
    env.DB.prepare("DELETE FROM dm_canales WHERE discord_id IN (SELECT value FROM json_each(?1))").bind(J(canalesMalos)),
  ];
  for (const [l, r] of lotes) {
    st.push(env.DB.prepare(
      `UPDATE nr_cache SET datos=json_set(datos, '$.ok', json_extract(datos,'$.ok') + ?2,
         '$.sin', (SELECT json_group_array(value) FROM (SELECT value FROM json_each(json_extract(datos,'$.sin')) UNION ALL SELECT value FROM json_each(?3))))
       WHERE clave=?1`
    ).bind("lote:" + l, r.ok, J(r.sin)));
  }
  await env.DB.batch(st);
  return hechos.length;
}

// --- Recordatorios de la Gran Liga por mensaje privado (temporizador de Cloudflare; envío por la cola) ---
// Al empezar cada ronda (domingo 22:00) se avisa a cada jugador de su partida; el jueves anterior al cierre
// (20:00) a quien aún no tiene resultado. Solo jugadores con su cuenta de Discord vinculada. Cada aviso se
// envía una sola vez (marca en nr_cache) y al terminar se deja un resumen en #inner-circle-general.
const WEB = "https://adeptusbaeticus.adeptusbaeticus.workers.dev";
async function avisoCanal(env, nombreCanal, texto) {
  try {
    const rc = await bot(env, `/guilds/${env.GUILD_ID}/channels`);
    if (!rc.ok) return;
    const c = (await rc.json()).find((x) => (x.type === 0 || x.type === 5) && normalCanal(x.name).includes(nombreCanal));
    if (c) await bot(env, `/channels/${c.id}/messages`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ content: texto.slice(0, 1900), allowed_mentions: { parse: [] } }) });
  } catch (e) {}
}
const fechaLarga = (dia) => new Date(dia + "T12:00:00Z").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
async function ligaRecordatorios(env, ahora = nowLocal()) {
  if (!env.DISCORD_BOT_TOKEN) return [];
  const fase = await env.DB.prepare("SELECT * FROM liga_fases ORDER BY edicion DESC, fase DESC LIMIT 1").first();
  if (!fase) return [];
  const hechos = [];
  const dia0 = fase.inicio.slice(0, 10), hora = fase.inicio.slice(11, 16) || "22:00";
  for (let n = 1; n <= fase.rondas + 1; n++) {
    const ini = masDias(dia0, 14 * (n - 1)), fin = masDias(ini, 14);
    const abre = ini + "T" + hora, cierra = fin + "T14:00", jueves = masDias(fin, -3) + "T20:00";
    const aplazadas = n > fase.rondas;
    for (const [tipo, desde, hasta] of [["inicio", abre, masDias(ini, 1) + "T12:00"], ["jueves", jueves, cierra]]) {
      if (ahora < desde || ahora >= hasta) continue;
      // Marca atómica: cada aviso, una sola vez.
      const clave = "recordatorio:" + fase.id + ":" + n + ":" + tipo;
      const r = await env.DB.prepare("INSERT INTO nr_cache (clave, intento) VALUES (?1, datetime('now')) ON CONFLICT(clave) DO NOTHING").bind(clave).run();
      if (!r.meta.changes) continue;
      const ps = (await env.DB.prepare(
        `SELECT p.id, p.mesa, p.nr_partida, p.pv_a, p.aplazada, a.discord AS a, a.discord_id AS a_id, b.discord AS b, b.discord_id AS b_id
         FROM liga_partidas p JOIN liga_jugadores a ON a.id=p.jugador_a JOIN liga_jugadores b ON b.id=p.jugador_b
         WHERE p.fase_id=?1 AND ${aplazadas ? "p.aplazada=1" : "p.ronda=?2 AND p.aplazada=0"} AND p.pv_a IS NULL ORDER BY p.mesa`
      ).bind(...(aplazadas ? [fase.id] : [fase.id, n])).all()).results;
      if (!ps.length) { hechos.push({ n, tipo, enviados: 0 }); continue; }
      const nombreRonda = aplazadas ? "Ronda " + n + " (aplazadas)" : "Ronda " + n;
      // Cada jugador vinculado, a la cola (mensaje privado + notificación); al final, el resumen del lote.
      const filas = [], sinCuenta = [];
      for (const p of ps) {
        const enlace = p.nr_partida && fase.nr_torneo
          ? "https://www.newrecruit.eu/app/tournydetails/match?id_match=" + p.nr_partida + "&id=" + fase.nr_torneo
          : fase.nr_torneo ? "https://www.newrecruit.eu/app/tournydetails/details?id=" + fase.nr_torneo : null;
        for (const [yo, yoId, rival] of [[p.a, p.a_id, p.b], [p.b, p.b_id, p.a]]) {
          if (!yoId) { sinCuenta.push(yo + " (sin cuenta vinculada)"); continue; }
          const texto = tipo === "inicio"
            ? "⚔️ **Gran Liga · " + nombreRonda + "**\nJuegas contra **" + rival + "**" + (aplazadas ? "" : " (mesa " + p.mesa + ")") + ".\n" +
              "Plazo: hasta el " + fechaLarga(fin) + " a las 14:00.\n" + (enlace ? "Resultado en New Recruit: <" + enlace + ">\n" : "") + "Calendario y clasificación: <" + WEB + "/gran-liga.html>"
            : "⏰ **Gran Liga · " + nombreRonda + "**\nAún no está subido el resultado de tu partida contra **" + rival + "**.\n" +
              "El plazo termina el " + fechaLarga(fin) + " a las 14:00.\n" + (enlace ? "Súbelo en New Recruit: <" + enlace + ">" : "");
          const push = { tag: "liga", url: "/gran-liga.html?fase=" + fase.id + "#ronda-" + n,
            titulo: tipo === "inicio" ? "Gran Liga · " + nombreRonda : "Gran Liga · falta tu resultado",
            texto: tipo === "inicio" ? "Juegas contra " + rival + (aplazadas ? "" : " (mesa " + p.mesa + ")") + ". Plazo: " + fechaLarga(fin) + " a las 14:00."
              : "Aún no está subido el resultado contra " + rival + ". Plazo: " + fechaLarga(fin) + " a las 14:00." };
          filas.push({ uid: yoId, nombre: yo, texto, push });
        }
      }
      const cabecera = tipo === "inicio" ? "📨 Gran Liga · " + nombreRonda + ": avisados " : "📨 Gran Liga · " + nombreRonda + ", recordatorio de resultados: avisados ";
      await env.DB.batch([
        env.DB.prepare("INSERT OR REPLACE INTO nr_cache (clave, datos, actualizado) VALUES (?1, ?2, datetime('now'))").bind("lote:" + clave, JSON.stringify({ ok: 0, sin: sinCuenta })),
        // Coste estimado de cada jugador: mensaje privado (hasta 2 llamadas) + sus dispositivos.
        env.DB.prepare(
          `INSERT INTO cola_avisos (tipo, datos, lote, coste)
           SELECT 'liga', value, ?2, 2 + (SELECT COUNT(*) FROM push_subs WHERE discord_id=json_extract(value,'$.uid')) FROM json_each(?1)`
        ).bind(JSON.stringify(filas), clave),
        env.DB.prepare("INSERT INTO cola_avisos (tipo, datos, lote, coste) VALUES ('canal', ?1, ?2, 2)").bind(JSON.stringify({ cabecera }), clave),
      ]);
      hechos.push({ n, tipo, encolados: filas.length, sin_cuenta: sinCuenta });
    }
  }
  return hechos;
}

// --- Calendario para el móvil (iCalendar .ics): enlace del club y enlace personal firmado ---
const MODALIDAD = { combat_patrol: "Combat Patrol", "40k_1000": "40k a 1K", "40k_2000": "40k a 2K", necromunda: "Necromunda", bloodbowl: "Blood Bowl" };
const firmaCal = async (env, id) => (await hmac(env.SESSION_SECRET, "cal:" + id)).slice(0, 22);
function ics(nombre, eventos) {
  const esc = (t) => String(t || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
  const local = (t) => t.replace(/[-:]/g, "").slice(0, 13) + "00"; // "2026-11-22T10:00" → 20261122T100000
  const sello = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const out = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Adeptus Baeticus//Web del club//ES", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "X-WR-CALNAME:" + esc(nombre), "X-WR-TIMEZONE:Europe/Madrid", "REFRESH-INTERVAL;VALUE=DURATION:PT6H", "X-PUBLISHED-TTL:PT6H",
    "BEGIN:VTIMEZONE", "TZID:Europe/Madrid",
    "BEGIN:STANDARD", "DTSTART:19701025T030000", "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU", "TZOFFSETFROM:+0200", "TZOFFSETTO:+0100", "TZNAME:CET", "END:STANDARD",
    "BEGIN:DAYLIGHT", "DTSTART:19700329T020000", "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU", "TZOFFSETFROM:+0100", "TZOFFSETTO:+0200", "TZNAME:CEST", "END:DAYLIGHT",
    "END:VTIMEZONE"];
  for (const e of eventos) {
    out.push("BEGIN:VEVENT", "UID:" + e.uid + "@adeptusbaeticus", "DTSTAMP:" + sello);
    if (e.dia) out.push("DTSTART;VALUE=DATE:" + e.dia.replace(/-/g, ""), "DTEND;VALUE=DATE:" + e.hastaDia.replace(/-/g, ""));
    else out.push("DTSTART;TZID=Europe/Madrid:" + local(e.inicio), "DTEND;TZID=Europe/Madrid:" + local(e.fin));
    out.push("SUMMARY:" + esc(e.titulo));
    if (e.lugar) out.push("LOCATION:" + esc(e.lugar));
    if (e.desc) out.push("DESCRIPTION:" + esc(e.desc));
    if (e.url) out.push("URL:" + e.url);
    out.push("END:VEVENT");
  }
  out.push("END:VCALENDAR");
  // Líneas de 75 octetos como pide el estándar (plegado con un espacio).
  return out.map((l) => {
    const b = new TextEncoder().encode(l);
    if (b.length <= 75) return l;
    const partes = []; let i = 0, act = "";
    for (const ch of l) { const n = new TextEncoder().encode(ch).length; if (i + n > (partes.length ? 74 : 75)) { partes.push(act); act = ""; i = 0; } act += ch; i += n; }
    partes.push(act);
    return partes.join("\r\n ");
  }).join("\r\n") + "\r\n";
}
const sumaHoras = (t, h) => { const d = new Date(t + ":00Z"); d.setUTCMinutes(d.getUTCMinutes() + h * 60); return d.toISOString().slice(0, 16); };
async function calendarioEventos(env, uid) {
  const ev = [];
  const { results: es } = await env.DB.prepare("SELECT id, type, title, starts_at, location, description, modo FROM events WHERE status='publicado' AND starts_at >= ?1 ORDER BY starts_at")
    .bind(masDias(nowLocal().slice(0, 10), -60)).all();
  let mias = new Map();
  if (uid) mias = new Map((await env.DB.prepare("SELECT event_id, status FROM registrations WHERE discord_id=?1").bind(uid).all()).results.map((r) => [r.event_id, r.status]));
  for (const e of es) {
    const st = mias.get(e.id);
    ev.push({ uid: "evento-" + e.id, inicio: e.starts_at, fin: sumaHoras(e.starts_at, e.type === "torneo" ? 8 : 4),
      titulo: (e.type === "torneo" ? "🏆 " : "🎲 ") + e.title + (st === "inscrito" ? " (apuntado)" : st === "espera" ? " (lista de espera)" : ""),
      lugar: e.modo === "online" ? "Online (TTS)" + (e.location ? " · " + e.location : "") : e.location, desc: e.description, url: WEB + "/calendario.html?evento=" + e.id });
  }
  if (!uid) return ev;
  // Tus partidas con hora fijada.
  const { results: ps } = await env.DB.prepare(
    `SELECT p.id, p.activity, p.starts_at, p.availability, p.mesa, p.modo, p.lugar,
       (SELECT GROUP_CONCAT(u.name, ', ') FROM partida_players q JOIN users u ON u.discord_id=q.discord_id WHERE q.partida_id=p.id AND q.discord_id<>?1) AS rivales
     FROM partidas p JOIN partida_players me ON me.partida_id=p.id AND me.discord_id=?1
     WHERE p.status<>'cancelada' AND p.starts_at IS NOT NULL`
  ).bind(uid).all();
  for (const p of ps) {
    let fin = sumaHoras(p.starts_at, 3);
    try { const av = JSON.parse(p.availability).find((x) => x.date === p.starts_at.slice(0, 10)); if (av && av.to > p.starts_at.slice(11, 16)) fin = p.starts_at.slice(0, 11) + av.to; } catch (e) {}
    ev.push({ uid: "partida-" + p.id, inicio: p.starts_at, fin, titulo: "⚔️ " + (MODALIDAD[p.activity] || "Partida") + (p.rivales ? " · " + p.rivales : ""),
      lugar: p.modo === "online" ? "Online (TTS)" : p.modo === "ambos" ? "Físico u online (TTS)" + (p.lugar ? " · " + p.lugar : "") : p.lugar || (p.mesa ? "Mesa " + p.mesa : "A decidir"), url: WEB + "/calendario.html?partida=" + p.id });
  }
  // Tu partida de cada ronda de la Gran Liga (todo el periodo de la ronda) y su cierre.
  const fase = await env.DB.prepare("SELECT * FROM liga_fases ORDER BY edicion DESC, fase DESC LIMIT 1").first();
  if (fase) {
    const { results: ls } = await env.DB.prepare(
      `SELECT p.id, p.ronda, p.mesa, p.aplazada, p.pv_a, p.pv_b, a.discord AS a, a.discord_id AS a_id, b.discord AS b
       FROM liga_partidas p JOIN liga_jugadores a ON a.id=p.jugador_a JOIN liga_jugadores b ON b.id=p.jugador_b
       WHERE p.fase_id=?1 AND (a.discord_id=?2 OR b.discord_id=?2)`
    ).bind(fase.id, uid).all();
    const dia0 = fase.inicio.slice(0, 10);
    for (const p of ls) {
      const n = p.aplazada ? fase.rondas + 1 : p.ronda;
      const ini = masDias(dia0, 14 * (n - 1)), fin = masDias(ini, 14);
      const rival = p.a_id === uid ? p.b : p.a;
      const res = p.pv_a != null ? " (" + (p.a_id === uid ? p.pv_a + "–" + p.pv_b : p.pv_b + "–" + p.pv_a) + ")" : "";
      ev.push({ uid: "liga-" + p.id, dia: masDias(ini, 1), hastaDia: fin, titulo: "🗡️ Gran Liga R" + n + " · contra " + rival + res,
        desc: "Mesa " + p.mesa + ". Cierre: " + fin + " a las 14:00.", url: WEB + "/gran-liga.html?fase=" + fase.id + "#ronda-" + n });
      if (p.pv_a == null) ev.push({ uid: "liga-cierre-" + p.id, inicio: fin + "T13:00", fin: fin + "T14:00", titulo: "⏰ Cierre Gran Liga R" + n + ": sube el resultado contra " + rival,
        url: WEB + "/gran-liga.html?fase=" + fase.id + "#ronda-" + n });
    }
  }
  return ev;
}

// --- FAQ: copia del canal #preguntas-frecuentes de Discord ---
// Se guarda en nr_cache (clave 'discord:faq'). Discord no avisa a la web de las ediciones, así que al visitar
// la FAQ, si la copia tiene más de FAQ_MINUTOS, se vuelve a leer el canal (normalmente una sola petición:
// el id del canal y los nombres de las menciones se reutilizan de la copia anterior). También a mano desde Admin.
const CANAL_FAQ = "preguntas-frecuentes";
const FAQ_CLAVE = "discord:faq";
const FAQ_MINUTOS = 2;
const FAQ_EN = "discord:faq:en"; // traducciones al inglés: { huella del texto en español: texto en inglés }

// Huella corta de un texto (FNV-1a de 32 bits); la página calcula la misma para buscar la traducción.
function huella(t) {
  let h = 0x811c9dc5;
  for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16);
}
// Textos de la FAQ que se traducen (mensajes, y títulos, textos y campos de los embeds).
function faqTextos(mensajes) {
  const out = [];
  for (const m of mensajes) {
    out.push(m.texto);
    for (const e of m.embeds || []) { out.push(e.titulo, e.texto); for (const c of e.campos || []) out.push(c.nombre, c.valor); }
  }
  return [...new Set(out.filter((t) => t && /[a-záéíóúñ]/i.test(t)))];
}
// Traduce al inglés con Workers AI solo los textos nuevos o editados; el resto se reutiliza.
async function faqTraduce(env, mensajes) {
  if (!env.AI) return { traducidos: 0, error: "Workers AI no está activado" };
  const row = await env.DB.prepare("SELECT datos FROM nr_cache WHERE clave=?1").bind(FAQ_EN).first();
  let prev = {};
  try { prev = JSON.parse((row && row.datos) || "{}"); } catch (e) {}
  const textos = faqTextos(mensajes);
  const en = {};
  for (const t of textos) if (prev[huella(t)]) en[huella(t)] = prev[huella(t)];
  const faltan = textos.filter((t) => !en[huella(t)]).slice(0, 12);
  let error = null;
  const sistema = "You translate the FAQ of a Warhammer 40,000 wargaming club from Spanish (Spain) to natural British English. " +
    "The input uses Discord markdown. Keep EXACTLY the same markdown and line breaks (**bold**, *italic*, __underline__, lists, headings, " +
    "links [text](url) — translate the link text, never the URL). Keep URLs, mentions such as <@123>, <@&123>, <#123> and emojis such as <:name:123> unchanged. " +
    "Do not translate proper nouns or game names (Adeptus Baeticus, Inner Circle, Mournival, Warhammer 40,000, Age of Sigmar, Necromunda, Blood Bowl, " +
    "2d6 Store, WhatsApp, Discord, Instagram). Club glossary: «quedada» = «meetup» (never «meeting»), «partida» = «game», «torneo» = «tournament», " +
    "«socio»/«miembro» = «member», «la administración» = «the admins», «ejército» = «army», «lista» = «army list». " +
    "Output ONLY the translated text, with no notes or quotes.";
  await Promise.all(faltan.map(async (t) => {
    try {
      const r = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
        messages: [{ role: "system", content: sistema }, { role: "user", content: t }],
        max_tokens: 2048, temperature: 0.2,
      });
      const out = String((r && r.response) || "").trim();
      if (out) en[huella(t)] = out;
    } catch (e) { error = String(e.message || e).slice(0, 200); }
  }));
  const ahora = new Date().toISOString().replace("T", " ").slice(0, 19);
  await env.DB.prepare(
    `INSERT INTO nr_cache (clave, datos, actualizado, error) VALUES (?1, ?2, ?3, ?4)
     ON CONFLICT(clave) DO UPDATE SET datos=?2, actualizado=?3, error=?4`
  ).bind(FAQ_EN, JSON.stringify(en), ahora, error).run();
  return { traducidos: faltan.length, pendientes: textos.filter((t) => !en[huella(t)]).length, error };
}
async function faqSync(env) {
  const ahora = new Date().toISOString().replace("T", " ").slice(0, 19);
  // Reserva: no más de una consulta cada 30 s aunque lleguen varias a la vez.
  const res = await env.DB.prepare(
    `INSERT INTO nr_cache (clave, intento) VALUES (?1, ?2)
     ON CONFLICT(clave) DO UPDATE SET intento=?2 WHERE intento IS NULL OR intento < datetime(?2, '-30 seconds')`
  ).bind(FAQ_CLAVE, ahora).run();
  if (!res.meta.changes) return { ok: false, error: "Espera un momento entre actualizaciones" };
  try {
    if (!env.DISCORD_BOT_TOKEN) throw new Error("Falta el secreto DISCORD_BOT_TOKEN");
    let prev = {};
    try { const r0 = await env.DB.prepare("SELECT datos FROM nr_cache WHERE clave=?1").bind(FAQ_CLAVE).first(); prev = JSON.parse((r0 && r0.datos) || "{}"); } catch (e) {}
    let chs = null; // lista de canales del servidor (solo se pide si hace falta)
    const pideCanales = async () => {
      if (chs) return chs;
      const rc = await bot(env, `/guilds/${env.GUILD_ID}/channels`);
      if (!rc.ok) throw new Error("Discord respondió " + rc.status + " al pedir los canales");
      return (chs = await rc.json());
    };
    const lee = async (canalId) => {
      let todos = [], antes = "";
      for (let i = 0; i < 3; i++) {
        const r = await bot(env, `/channels/${canalId}/messages?limit=100${antes ? "&before=" + antes : ""}`);
        if (!r.ok) return { status: r.status };
        const ms = await r.json();
        todos.push(...ms);
        if (ms.length < 100) break;
        antes = ms[ms.length - 1].id;
      }
      return { todos };
    };
    let canalId = prev.canal_id, leido = canalId ? await lee(canalId) : { status: 404 };
    if (!leido.todos) {
      // Sin id guardado, o el canal cambió: se busca por nombre.
      // El nombre puede llevar letras decorativas de Unicode (p. ej. «𝐏𝐫𝐞𝐠𝐮𝐧𝐭𝐚𝐬-𝐟𝐫𝐞𝐜𝐮𝐞𝐧𝐭𝐞𝐬») o emojis:
      // se pasa a letras normales, sin tildes ni símbolos, antes de comparar.
      const c = (await pideCanales()).find((x) => (x.type === 0 || x.type === 5) && normalCanal(x.name).includes(CANAL_FAQ));
      if (!c) throw new Error("No encuentro el canal #" + CANAL_FAQ);
      canalId = c.id;
      leido = await lee(canalId);
      if (!leido.todos) throw new Error("Discord respondió " + leido.status + " al leer #" + CANAL_FAQ + (leido.status === 403 ? " (el bot necesita ver el canal y leer su historial)" : ""));
    }
    const todos = leido.todos.reverse(); // del más antiguo al más reciente
    // El texto puede venir en el mensaje, en un mensaje reenviado (message_snapshots) o en «componentes»
    // (mensajes hechos con bots o Discohook: bloques de texto dentro de contenedores y secciones).
    const textoComp = (cs) => (cs || []).flatMap((c) => (c.type === 10 && c.content ? [c.content] : textoComp(c.components).concat(c.accessory ? textoComp([c.accessory]) : []))).filter(Boolean);
    // Solo embeds hechos a propósito («rich»); las vistas previas de enlaces que añade Discord se descartan.
    const embedsDe = (es) => (es || []).filter((e) => (!e.type || e.type === "rich") && (e.title || e.description || (e.fields || []).length))
      .map((e) => ({ titulo: e.title || "", texto: e.description || "", campos: (e.fields || []).map((f) => ({ nombre: f.name, valor: f.value })) }));
    const partes = (m) => {
      const fuentes = [m, ...(m.message_snapshots || []).map((x) => x.message || {})];
      const texto = fuentes.flatMap((f) => [f.content || "", ...textoComp(f.components)]).filter(Boolean).join("\n\n");
      return { texto, embeds: fuentes.flatMap((f) => embedsDe(f.embeds)) };
    };
    const deOtros = todos.filter((m) => m.type === 0 || m.type === 19);
    const mensajes = deOtros.map((m) => ({ id: m.id, ...partes(m) })).filter((m) => m.texto || m.embeds.length);
    if (!deOtros.length) throw new Error("El canal #" + CANAL_FAQ + " no tiene mensajes que el bot pueda leer");
    // Sin el permiso «Message Content Intent», Discord entrega los mensajes de otros con el texto vacío.
    if (!mensajes.length) {
      const tipos = deOtros.map((m) => "flags " + (m.flags || 0) + (m.attachments && m.attachments.length ? " +adjuntos" : "") + (m.components && m.components.length ? " +componentes" : "") + (m.message_snapshots ? " +reenviado" : "")).join("; ");
      throw new Error("Discord entrega los " + deOtros.length + " mensajes del canal sin texto: activa «Message Content Intent» del bot en el portal de desarrolladores de Discord (" + tipos + ")");
    }
    // Nombres para las menciones (#canal, @rol y @usuario); se reutilizan los ya conocidos.
    const todoTexto = JSON.stringify(mensajes);
    const idsDe = (re) => [...new Set([...todoTexto.matchAll(re)].map((x) => x[1]))];
    const canales = {}, roles = {}, usuarios = {};
    const idsCanal = idsDe(/<#(\d+)>/g);
    if (idsCanal.some((id) => !(prev.canales || {})[id])) for (const x of await pideCanales()) if (idsCanal.includes(x.id)) canales[x.id] = x.name;
    for (const id of idsCanal) if (!canales[id] && (prev.canales || {})[id]) canales[id] = prev.canales[id];
    const idsRol = idsDe(/<@&(\d+)>/g);
    if (idsRol.some((id) => !(prev.roles || {})[id])) {
      const rr = await bot(env, `/guilds/${env.GUILD_ID}/roles`);
      if (rr.ok) for (const x of await rr.json()) if (idsRol.includes(x.id)) roles[x.id] = x.name;
    }
    for (const id of idsRol) if (!roles[id] && (prev.roles || {})[id]) roles[id] = prev.roles[id];
    for (const id of idsDe(/<@!?(\d+)>/g).slice(0, 50)) {
      const u = await env.DB.prepare("SELECT name FROM users WHERE discord_id=?1").bind(id).first();
      if (u) usuarios[id] = u.name;
    }
    const datos = JSON.stringify({ guild: env.GUILD_ID, canal_id: canalId, mensajes, canales, roles, usuarios });
    await env.DB.prepare("UPDATE nr_cache SET datos=?2, actualizado=?3, error=NULL WHERE clave=?1").bind(FAQ_CLAVE, datos, ahora).run();
    // Traducción al inglés de lo nuevo o editado (no bloquea la copia en español si falla).
    const tr = await faqTraduce(env, mensajes).catch((e) => ({ error: String(e.message || e) }));
    await avisoEstado(env, "faq", "la copia de la FAQ desde Discord", null);
    await avisoEstado(env, "faq-en", "la traducción al inglés de la FAQ", tr && tr.error);
    return { ok: true, mensajes: mensajes.length, traduccion: tr };
  } catch (e) {
    await env.DB.prepare("UPDATE nr_cache SET error=?2 WHERE clave=?1").bind(FAQ_CLAVE, String(e.message || e).slice(0, 300)).run();
    await avisoEstado(env, "faq", "la copia de la FAQ desde Discord", String(e.message || e));
    return { ok: false, error: String(e.message || e) };
  }
}
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

// Ranking ELO de la liga del club en New Recruit. Su API oficial no tiene ligas: se usa la llamada interna
// de su web (ladder_get_paginated), con permiso del propietario, solo cuando se actualizan los resultados de la
// liga (como mucho cada 6 h, tras cada cierre, o a mano desde Admin) y nunca en una visita.
const NR_ELO = { sistema: 827374861, liga: "6a8d9de5988fd3f424053719" };
const ELO_CLAVE = "elo:" + NR_ELO.liga;
async function nrRpc(metodo, params) {
  const key = [...crypto.getRandomValues(new Uint8Array(12))].map((b) => b.toString(16).padStart(2, "0")).join("");
  const r = await fetch("https://www.newrecruit.eu/api/rpc?m=" + encodeURIComponent(metodo), {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json", "nrtab-key": key, "Idempotency-Key": key },
    body: JSON.stringify({ method: metodo, params }),
  });
  if (!r.ok) throw new Error("New Recruit respondió " + r.status);
  let d = await r.json();
  if (d && d.obfuscated && d.data) d = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(d.data), (c) => c.charCodeAt(0))));
  if (d && d.error) throw new Error("New Recruit: " + d.error);
  return d;
}
async function eloSync(env) {
  const res = await env.DB.prepare(
    `INSERT INTO nr_cache (clave, intento) VALUES (?1, datetime('now'))
     ON CONFLICT(clave) DO UPDATE SET intento=excluded.intento
     WHERE nr_cache.intento IS NULL OR nr_cache.intento < datetime('now', ?2)`
  ).bind(ELO_CLAVE, "-" + NR_ESPERA_MIN + " minutes").run();
  if (!res.meta.changes) return { ok: false, error: "Se consultó hace poco" };
  try {
    const todos = [];
    for (let pag = 0; pag < 5; pag++) {
      const d = await nrRpc("ladder_get_paginated", [NR_ELO.sistema, NR_ELO.liga, 100, null, pag * 100, null]);
      const es = (d && d.entries) || [];
      todos.push(...es);
      if (es.length < 100 || todos.length >= (d.total || 0)) break;
    }
    const lista = todos.map((e) => {
      const x = ((e.elo || {})[NR_ELO.sistema] || {})[NR_ELO.liga] || {};
      return { login: String(e.login || ""), elo: Math.round(Number(x.elo) || 0), v: x.wins || 0, d: x.losses || 0, e: x.draws || 0 };
    }).filter((x) => x.login && x.elo).sort((a, b) => b.elo - a.elo);
    lista.forEach((x, i) => { x.pos = i + 1; });
    await env.DB.prepare("UPDATE nr_cache SET datos=?2, actualizado=datetime('now'), error=NULL WHERE clave=?1").bind(ELO_CLAVE, JSON.stringify(lista)).run();
    await avisoEstado(env, "elo", "el ranking ELO de New Recruit", null);
    return { ok: true, jugadores: lista.length };
  } catch (e) {
    await env.DB.prepare("UPDATE nr_cache SET error=?2 WHERE clave=?1").bind(ELO_CLAVE, String(e.message || e).slice(0, 300)).run();
    await avisoEstado(env, "elo", "el ranking ELO de New Recruit", String(e.message || e));
    return { ok: false, error: String(e.message || e) };
  }
}

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
    // Con los resultados nuevos, también el ranking ELO de la liga.
    const elo = tipo === "reports" ? await eloSync(env).catch((e) => ({ ok: false, error: String(e.message || e) })) : null;
    await avisoEstado(env, "nr-" + tipo, tipo === "reports" ? "la sincronización de resultados con New Recruit" : "la sincronización del torneo con New Recruit", null);
    return { ok: true, bytes: texto.length, guardado: guardar.length, resumen: resumenNr(json), liga, elo };
  } catch (e) {
    await env.DB.prepare("UPDATE nr_cache SET error=?2 WHERE clave=?1").bind(clave, String(e.message || e).slice(0, 500)).run();
    await avisoEstado(env, "nr-" + tipo, tipo === "reports" ? "la sincronización de resultados con New Recruit" : "la sincronización del torneo con New Recruit", String(e.message || e));
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
  const js = (await env.DB.prepare("SELECT id, nr_participante, nr_nombre, nr_anteriores FROM liga_jugadores WHERE fase_id=?1").bind(fase.id).all()).results;
  const ps = (await env.DB.prepare("SELECT id, jugador_a, jugador_b FROM liga_partidas WHERE fase_id=?1").bind(fase.id).all()).results;
  const porPart = new Map(js.filter((j) => j.nr_participante).map((j) => [j.nr_participante, j.id]));
  // Reemplazos: los id de New Recruit de los jugadores sustituidos siguen apuntando a la fila (sus resultados se quedan).
  for (const j of js) { try { for (const v of JSON.parse(j.nr_anteriores || "[]")) if (!porPart.has(v)) porPart.set(v, j.id); } catch (e) {} }
  // Jugador añadido o sustituto sin id de New Recruit: se toma el de su primer informe, por su usuario de New Recruit.
  const sinId = new Map(js.filter((j) => !j.nr_participante && j.nr_nombre).map((j) => [String(j.nr_nombre).trim().toLowerCase(), j]));
  const clavePar = (a, b) => (a < b ? a + "-" + b : b + "-" + a);
  const porPar = new Map(ps.map((p) => [clavePar(p.jugador_a, p.jugador_b), p]));
  const upd = [], informes = [];
  let sinAsignar = 0;
  for (const r of reports) {
    const pl = r.players || [];
    if (r.id_tourny !== nrTorneo || pl.length !== 2) continue;
    for (const x of pl) {
      const j = !porPart.has(x.id_participant) && sinId.get(String(x.name || "").trim().toLowerCase());
      if (j) {
        porPart.set(x.id_participant, j.id); sinId.delete(String(x.name).trim().toLowerCase());
        upd.push(env.DB.prepare("UPDATE liga_jugadores SET nr_participante=?2 WHERE id=?1 AND nr_participante IS NULL").bind(j.id, x.id_participant));
      }
    }
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

// Empareja los jugadores sin cuenta de una fase con los usuarios de la web: por su nombre de Discord igual al apodo
// del usuario (sin lo que va entre paréntesis), o a su alias del Excel, o por su usuario de New Recruit; solo si hay
// un único candidato libre. Devuelve cuántos ha vinculado.
async function ligaEmpareja(env, faseId) {
  const norm = (x) => String(x || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const js = (await env.DB.prepare("SELECT id, discord, nr_nombre, discord_id FROM liga_jugadores WHERE fase_id=?1").bind(faseId).all()).results;
  const usados = new Set(js.filter((j) => j.discord_id).map((j) => j.discord_id));
  const us = (await env.DB.prepare("SELECT u.discord_id, u.name, u.nr_username, s.discord_alias FROM users u LEFT JOIN socios_datos s ON s.discord_id=u.discord_id").all()).results
    .filter((u) => !usados.has(u.discord_id));
  const claves = (u) => new Set([u.name, sinParentesis(u.name), ...aliasDiscord(u.discord_alias)].filter(Boolean).map(norm).filter((k) => k.length >= 3));
  const ks = us.map((u) => [u, claves(u)]);
  const upd = [];
  for (const j of js) {
    if (j.discord_id) continue;
    const d = norm(j.discord), nr = norm(j.nr_nombre);
    let c = ks.filter(([, k]) => k.has(d));
    if (c.length !== 1 && nr) c = ks.filter(([u]) => norm(u.nr_username) === nr);
    if (c.length !== 1 || usados.has(c[0][0].discord_id)) continue;
    usados.add(c[0][0].discord_id);
    upd.push(env.DB.prepare("UPDATE liga_jugadores SET discord_id=?2, sugerido_id=NULL WHERE id=?1 AND discord_id IS NULL").bind(j.id, c[0][0].discord_id));
  }
  if (upd.length) await env.DB.batch(upd);
  return upd.length;
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
  // Temporizador de Cloudflare (cada minuto): recordatorios de la Gran Liga y envío de la cola de avisos.
  async scheduled(event, env, ctx) {
    ctx.waitUntil((async () => {
      await ligaRecordatorios(env).catch(() => {});
      await procesaCola(env, 25).catch(() => {});
    })());
  },
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const back = (q) => Response.redirect(url.origin + "/?login=" + q, 302);

    // Modo «ver como» (un admin viendo la web con los permisos de otro usuario): solo lectura.
    // Cualquier petición que modifique datos se rechaza, salvo la de salir del modo.
    if (path.startsWith("/api/") && request.method !== "GET" && request.method !== "HEAD" && path !== "/api/ver-como/salir") {
      const sv = await leeSesion(env, request);
      if (sv && sv.admin) return Response.json({ error: "Modo «ver como»: solo lectura" }, { status: 403, headers: { "cache-control": "no-store" } });
    }
    // Socio que aún no ha completado sus datos de inscripción (`faltanDatos`): solo puede usar lo necesario para
    // rellenarlos; el resto de la API le responde 403 hasta que los guarde.
    if (path.startsWith("/api/") && !SIN_DATOS_PERMITIDO.has(path) && !path.startsWith("/api/inscripcion")) {
      const sd = await readSession(env, request);
      if (sd && !sd.admin && (await faltanDatos(env, sd))) {
        return Response.json({ error: "Antes tienes que completar tus datos de socio.", completar: true }, { status: 403, headers: { "cache-control": "no-store" } });
      }
    }
    const cookieSesion = (valor, maxAge) => `${COOKIE}=${valor}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;

    // Salir del modo «ver como»: se recupera la sesión del admin guardada en la sesión firmada.
    if (path === "/api/ver-como/salir" && request.method === "POST") {
      const sv = await leeSesion(env, request);
      if (!sv || !sv.admin) return Response.json({ error: "No estás en el modo «ver como»" }, { status: 400, headers: { "cache-control": "no-store" } });
      if (request.headers.get("origin") && request.headers.get("origin") !== url.origin) return new Response("Prohibido", { status: 403 });
      const a = sv.admin;
      const cookie = await makeSession(env, { id: a.id, name: a.name, avatar: a.avatar, role: a.role, exp: a.exp });
      return Response.json({ ok: true }, { headers: { "cache-control": "no-store", "set-cookie": cookieSesion(cookie, Math.max(60, a.exp - Math.floor(Date.now() / 1000))) } });
    }

    // Interacciones de Discord (comandos /publicar, /editar y /borrar).
    if (path === "/discord/interactions" && request.method === "POST") {
      const raw = await request.text();
      if (!(await verifyDiscord(env, request, raw))) return new Response("Firma no válida", { status: 401 });
      let it;
      try { it = JSON.parse(raw); } catch (e) { return new Response("JSON no válido", { status: 400 }); }
      if (it.type === 1) return Response.json({ type: 1 }); // PING de verificación
      const reply = (content) => Response.json({ type: 4, data: { content, flags: 64, allowed_mentions: { parse: [] } } });
      // Botones «Aprobar»/«Rechazar» de una solicitud de inscripción (solo admins).
      const cid = String((it.data || {}).custom_id || "");
      if (it.type === 3 && cid.startsWith("insc:")) {
        const rol = it.member && it.guild_id === env.GUILD_ID ? roleOf(env, it.member.roles || []) : null;
        if (rol !== "admin") return reply("Solo los admins pueden aprobar o rechazar inscripciones.");
        const [, accion, id] = cid.split(":");
        if (!["aprobar", "rechazar"].includes(accion)) return reply("Acción no soportada.");
        ctx.waitUntil(decideInscripcion(env, it, accion, Number(id)).catch(() => {}));
        return Response.json({ type: 6 }); // se actualiza el mensaje en segundo plano
      }
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

    // Notificaciones en el móvil: activar/desactivar por dispositivo y elegir los avisos.
    if (path === "/api/push" || path.startsWith("/api/push/")) {
      if (path === "/api/push" && request.method === "GET") return Response.json({ clave: VAPID_PUBLICA, tipos: PUSH_TIPOS, activo: !!env.VAPID_PRIVATE }, { headers: noStore });
      const s = await readSession(env, request);
      if (!s) return Response.json({ error: "Inicia sesión con Discord" }, { status: 401, headers: noStore });
      if (request.method !== "POST") return new Response("Método no permitido", { status: 405 });
      if (!sameOrigin(request, url)) return new Response("Prohibido", { status: 403 });
      let b = {};
      try { b = await request.json(); } catch (e) {}
      const endpoint = String(b.endpoint || "");
      const endpointOk = /^https:\/\/[^\s]{10,}$/.test(endpoint) && endpoint.length <= 1000;
      if (path === "/api/push") {
        const k = b.keys || {};
        const tipos = Array.isArray(b.tipos) ? [...new Set(b.tipos.map(String))].filter((t) => PUSH_TIPOS.includes(t)) : PUSH_TIPOS;
        if (!endpointOk || !/^[A-Za-z0-9_-]{80,100}$/.test(String(k.p256dh || "")) || !/^[A-Za-z0-9_-]{16,30}$/.test(String(k.auth || ""))) {
          return Response.json({ error: "Suscripción no válida" }, { status: 400, headers: noStore });
        }
        await env.DB.prepare(
          `INSERT INTO push_subs (endpoint, discord_id, p256dh, auth, tipos) VALUES (?1, ?2, ?3, ?4, ?5)
           ON CONFLICT(endpoint) DO UPDATE SET discord_id=?2, p256dh=?3, auth=?4, tipos=?5`
        ).bind(endpoint, s.id, k.p256dh, k.auth, JSON.stringify(tipos)).run();
        return Response.json({ ok: true, tipos }, { headers: noStore });
      }
      if (path === "/api/push/estado") {
        const r = endpointOk ? await env.DB.prepare("SELECT tipos FROM push_subs WHERE endpoint=?1 AND discord_id=?2").bind(endpoint, s.id).first() : null;
        return Response.json({ suscrito: !!r, tipos: r ? JSON.parse(r.tipos) : PUSH_TIPOS }, { headers: noStore });
      }
      if (path === "/api/push/baja") {
        await env.DB.prepare("DELETE FROM push_subs WHERE endpoint=?1 AND discord_id=?2").bind(endpoint, s.id).run();
        return Response.json({ ok: true }, { headers: noStore });
      }
      if (path === "/api/push/prueba") {
        const n = await notificaAhora(env, s.id, { titulo: "Adeptus Baeticus", texto: "Las notificaciones funcionan en este dispositivo. ¡Por el Emperador!", url: "/", tag: "prueba" });
        return Response.json({ ok: n > 0, enviados: n, error: n ? undefined : "No se pudo enviar el aviso de prueba" }, { status: n ? 200 : 502, headers: noStore });
      }
      return new Response("No encontrado", { status: 404 });
    }

    // Encuestas del club, solo para socios con sesión. Cada una va dirigida a «aspirantes» (aspirantes y
    // miembros) o a «miembros» (miembros y admin). El admin las crea, edita, cierra y borra.
    if (path === "/api/encuestas" || path.startsWith("/api/encuestas/") || path.startsWith("/api/admin/encuestas")) {
      const s = await readSession(env, request);
      const admin = !!s && s.role === "admin";
      const ahora = nowLocal();
      if (request.method !== "GET" && !sameOrigin(request, url)) return new Response("Prohibido", { status: 403 });
      const err = (t, st = 400) => Response.json({ error: t }, { status: st, headers: noStore });
      const esMiembro = !!s && ["miembro", "admin"].includes(s.role);
      // Encuestas que puede ver y votar quien hace la petición (sin sesión, ninguna).
      const paras = !s ? [] : esMiembro ? ["aspirantes", "miembros"] : ["aspirantes"];
      const abiertaSQL = "(cierra IS NULL OR cierra > ?2)";
      if (path === "/api/encuestas" && request.method === "GET") {
        const { results: es } = await env.DB.prepare(
          `SELECT id, pregunta, descripcion, para, multiple, votos, resultados, cierra FROM encuestas
           WHERE para IN (SELECT value FROM json_each(?1)) ORDER BY ${abiertaSQL} DESC, COALESCE(cierra, '9999') DESC, id DESC LIMIT 50`
        ).bind(JSON.stringify(paras), ahora).all();
        const ids = JSON.stringify(es.map((e) => e.id));
        const [ops, votos] = await env.DB.batch([
          env.DB.prepare("SELECT id, encuesta_id, texto FROM encuesta_opciones WHERE encuesta_id IN (SELECT value FROM json_each(?1)) ORDER BY orden, id").bind(ids),
          env.DB.prepare("SELECT v.encuesta_id, v.opcion_id, v.discord_id, u.name FROM encuesta_votos v JOIN users u ON u.discord_id=v.discord_id WHERE v.encuesta_id IN (SELECT value FROM json_each(?1)) ORDER BY u.name COLLATE NOCASE").bind(ids),
        ]).then((r) => r.map((x) => x.results));
        const lista = es.map((e) => {
          const abierta = !e.cierra || e.cierra > ahora;
          const vs = votos.filter((v) => v.encuesta_id === e.id);
          const misVotos = s ? vs.filter((v) => v.discord_id === s.id).map((v) => v.opcion_id) : [];
          // Resultados: siempre, al votar o al cerrar (según la encuesta). El admin los ve siempre.
          const ver = !abierta || admin || e.resultados === "siempre" || (e.resultados === "al_votar" && misVotos.length > 0);
          const nombres = ver && e.votos === "publicos";
          return { id: e.id, pregunta: e.pregunta, descripcion: e.descripcion, para: e.para, multiple: !!e.multiple, votos: e.votos,
            resultados: e.resultados, cierra: e.cierra, abierta, votantes: new Set(vs.map((v) => v.discord_id)).size,
            mis_votos: misVotos, ver_resultados: ver,
            opciones: ops.filter((o) => o.encuesta_id === e.id).map((o) => {
              const de = vs.filter((v) => v.opcion_id === o.id);
              return { id: o.id, texto: o.texto, votos: ver ? de.length : null, quien: nombres ? de.map((v) => v.name) : null };
            }) };
        });
        return Response.json({ admin, sesion: !!s, ahora, encuestas: lista }, { headers: noStore });
      }
      if (!s) return err("Inicia sesión con Discord", 401);
      const vm = path.match(/^\/api\/encuestas\/(\d+)\/votar$/);
      if (vm && request.method === "POST") {
        const e = await env.DB.prepare("SELECT id, para, multiple, cierra FROM encuestas WHERE id=?1").bind(vm[1]).first();
        if (!e || !paras.includes(e.para)) return err("Esa encuesta no existe", 404);
        if (e.cierra && e.cierra <= ahora) return err("La encuesta ya está cerrada", 409);
        let b = {};
        try { b = await request.json(); } catch (x) {}
        const elegidas = Array.isArray(b.opciones) ? [...new Set(b.opciones.map(Number))] : [];
        if (!elegidas.length) return err("Elige una opción");
        if (!e.multiple && elegidas.length > 1) return err("Solo puedes elegir una opción");
        const validas = (await env.DB.prepare("SELECT COUNT(*) n FROM encuesta_opciones WHERE encuesta_id=?1 AND id IN (SELECT value FROM json_each(?2))").bind(e.id, JSON.stringify(elegidas)).first()).n;
        if (validas !== elegidas.length) return err("Opción no válida");
        // El voto se puede cambiar mientras la encuesta esté abierta.
        await env.DB.batch([
          env.DB.prepare("DELETE FROM encuesta_votos WHERE encuesta_id=?1 AND discord_id=?2").bind(e.id, s.id),
          env.DB.prepare("INSERT INTO encuesta_votos (encuesta_id, opcion_id, discord_id) SELECT ?1, value, ?2 FROM json_each(?3)").bind(e.id, s.id, JSON.stringify(elegidas)),
        ]);
        return Response.json({ ok: true }, { headers: noStore });
      }
      // Admin: crear (POST), editar (PUT), cerrar ya (POST …/cerrar) y borrar (DELETE).
      const am = path.match(/^\/api\/admin\/encuestas(?:\/(\d+)(\/cerrar)?)?$/);
      if (am) {
        if (!admin) return new Response("Prohibido", { status: 403 });
        if (am[1] && am[2] && request.method === "POST") {
          const r = await env.DB.prepare("UPDATE encuestas SET cierra=?2 WHERE id=?1 AND (cierra IS NULL OR cierra > ?2)").bind(am[1], ahora).run();
          if (!r.meta.changes) return err("La encuesta ya está cerrada", 409);
          return Response.json({ ok: true }, { headers: noStore });
        }
        if (am[1] && !am[2] && request.method === "DELETE") {
          await env.DB.batch([
            env.DB.prepare("DELETE FROM encuesta_votos WHERE encuesta_id=?1").bind(am[1]),
            env.DB.prepare("DELETE FROM encuesta_opciones WHERE encuesta_id=?1").bind(am[1]),
            env.DB.prepare("DELETE FROM encuestas WHERE id=?1").bind(am[1]),
          ]);
          return Response.json({ ok: true }, { headers: noStore });
        }
        if (!am[2] && ((!am[1] && request.method === "POST") || (am[1] && request.method === "PUT"))) {
          let b = {};
          try { b = await request.json(); } catch (x) {}
          const pregunta = String(b.pregunta || "").trim().slice(0, 200);
          const descripcion = String(b.descripcion || "").trim().slice(0, 1000) || null;
          const cierra = b.cierra ? String(b.cierra) : null;
          const para = b.para === "aspirantes" ? "aspirantes" : "miembros";
          const votosTipo = b.votos === "publicos" ? "publicos" : "secretos";
          const resultados = ["siempre", "al_votar", "al_cerrar"].includes(b.resultados) ? b.resultados : "al_votar";
          // Opciones: [{id?, texto}] — con id, se conserva (y sus votos); sin id, es nueva.
          const ops = (Array.isArray(b.opciones) ? b.opciones : []).map((o) => ({ id: Number(o && o.id) || null, texto: String((o && o.texto) || "").trim().slice(0, 120) })).filter((o) => o.texto);
          if (pregunta.length < 3) return err("Escribe la pregunta");
          if (ops.length < 2 || ops.length > 12) return err("Pon entre 2 y 12 opciones");
          if (new Set(ops.map((o) => o.texto.toLowerCase())).size !== ops.length) return err("Hay opciones repetidas");
          if (cierra && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(cierra)) return err("La fecha de cierre no es válida");
          if (!am[1] && cierra && cierra <= ahora) return err("La fecha de cierre ya ha pasado");
          let eid;
          if (am[1]) {
            eid = Number(am[1]);
            const ant = await env.DB.prepare("SELECT votos, (SELECT COUNT(*) FROM encuesta_votos WHERE encuesta_id=?1) n FROM encuestas WHERE id=?1").bind(eid).first();
            if (!ant) return err("Esa encuesta no existe", 404);
            // Quien votó en secreto no puede quedar a la vista después.
            if (ant.votos === "secretos" && votosTipo === "publicos" && ant.n > 0) return err("Esta encuesta ya tiene votos secretos: no se puede pasar a votos públicos");
            await env.DB.prepare("UPDATE encuestas SET pregunta=?2, descripcion=?3, para=?4, multiple=?5, votos=?6, resultados=?7, cierra=?8 WHERE id=?1")
              .bind(eid, pregunta, descripcion, para, b.multiple ? 1 : 0, votosTipo, resultados, cierra).run();
            const actuales = (await env.DB.prepare("SELECT id FROM encuesta_opciones WHERE encuesta_id=?1").bind(eid).all()).results.map((x) => x.id);
            const quedan = ops.filter((o) => o.id && actuales.includes(o.id));
            const quitar = actuales.filter((id) => !quedan.some((o) => o.id === id));
            const st = [];
            if (quitar.length) {
              st.push(env.DB.prepare("DELETE FROM encuesta_votos WHERE opcion_id IN (SELECT value FROM json_each(?1))").bind(JSON.stringify(quitar)));
              st.push(env.DB.prepare("DELETE FROM encuesta_opciones WHERE id IN (SELECT value FROM json_each(?1))").bind(JSON.stringify(quitar)));
            }
            ops.forEach((o, i) => st.push(o.id && actuales.includes(o.id)
              ? env.DB.prepare("UPDATE encuesta_opciones SET texto=?2, orden=?3 WHERE id=?1").bind(o.id, o.texto, i)
              : env.DB.prepare("INSERT INTO encuesta_opciones (encuesta_id, texto, orden) VALUES (?1, ?2, ?3)").bind(eid, o.texto, i)));
            // Si deja de ser de varias opciones, cada socio conserva solo uno de sus votos.
            if (!b.multiple) st.push(env.DB.prepare(
              `DELETE FROM encuesta_votos WHERE encuesta_id=?1 AND rowid NOT IN (SELECT MIN(rowid) FROM encuesta_votos WHERE encuesta_id=?1 GROUP BY discord_id)`
            ).bind(eid));
            // Si pasa a ser solo de miembros, se quitan los votos de quien ya no puede votar.
            if (para === "miembros") st.push(env.DB.prepare(
              "DELETE FROM encuesta_votos WHERE encuesta_id=?1 AND discord_id NOT IN (SELECT discord_id FROM users WHERE role IN ('miembro','admin'))"
            ).bind(eid));
            await env.DB.batch(st);
          } else {
            const r = await env.DB.prepare("INSERT INTO encuestas (pregunta, descripcion, para, multiple, votos, resultados, cierra, created_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)")
              .bind(pregunta, descripcion, para, b.multiple ? 1 : 0, votosTipo, resultados, cierra, s.id).run();
            eid = r.meta.last_row_id;
            await env.DB.batch(ops.map((o, i) => env.DB.prepare("INSERT INTO encuesta_opciones (encuesta_id, texto, orden) VALUES (?1, ?2, ?3)").bind(eid, o.texto, i)));
            // Aviso solo a quien puede votarla.
            const a = para === "miembros"
              ? (await env.DB.prepare("SELECT discord_id FROM users WHERE role IN ('miembro','admin')").all()).results.map((x) => x.discord_id)
              : null;
            ctx.waitUntil(notifica(env, { tipo: "encuestas", a, excepto: s.id, titulo: "Nueva encuesta del club", texto: pregunta + (cierra ? " · Cierra el " + fechaCorta(cierra) : ""), url: "/encuestas.html#e" + eid }).catch(() => {}));
          }
          return Response.json({ ok: true, id: eid }, { headers: noStore });
        }
      }
      return new Response("No encontrado", { status: 404 });
    }

    // Inscripción al club (formulario de inscripcion.html): GET estado, POST enviar, POST /salir (cambiar de cuenta).
    if (path === "/api/inscripcion" || path === "/api/inscripcion/salir") {
      const reg = await leeReg(env, request);
      const err = (t, st = 400) => Response.json({ error: t }, { status: st, headers: noStore });
      if (request.method !== "GET" && !sameOrigin(request, url)) return new Response("Prohibido", { status: 403 });
      if (path === "/api/inscripcion/salir" && request.method === "POST") {
        return Response.json({ ok: true }, { headers: { ...noStore, "set-cookie": `${COOKIE_REG}=; Path=/; Max-Age=0` } });
      }
      if (request.method === "GET") {
        if (!reg) return Response.json({ conectado: false }, { headers: noStore });
        const p = await env.DB.prepare("SELECT 1 FROM solicitudes WHERE discord_id=?1 AND estado='pendiente'").bind(reg.id).first();
        return Response.json({ conectado: true, usuario: reg.usuario, nombre: reg.nombre, id: reg.id, avatar: reg.avatar, pendiente: !!p }, { headers: noStore });
      }
      if (request.method !== "POST") return new Response("Método no permitido", { status: 405 });
      if (!reg) return err("Conecta tu cuenta de Discord para enviar la inscripción.", 401);
      let b = {};
      try { b = await request.json(); } catch (e) { return err("Datos no válidos."); }
      const v = validaDatosSocio(b);
      if (v.error) return err(v.error);
      const { nombre, email, telefono } = v, juegos = v.juegosLista, comoTexto = v.como;
      // Steam: solo la cuenta conectada con «Conectar con Steam» (verificada), nunca escrita a mano.
      // Steam (opcional): lo escribe el aspirante (mejor su ID de Steam); no se puede verificar.
      const [steam, errSteam] = cuentaLimpia("steam", b.steam);
      if (errSteam) return err(errSteam);
      let id;
      try {
        const r = await env.DB.prepare(
          `INSERT INTO solicitudes (discord_id, discord_usuario, nombre, email, telefono, mayor_edad, juegos, experiencia_juego, experiencia_pintura,
             como_conocio, acepta_estatutos, consentimiento, token_cifrado, steam) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,1,1,?11,?12)`
        ).bind(reg.id, reg.usuario, nombre, email, telefono, b.mayor_edad === "si" ? 1 : 0, juegos.length ? JSON.stringify(juegos) : null,
          b.experiencia_juego, b.experiencia_pintura, comoTexto, reg.rt, steam).run();
        id = r.meta.last_row_id;
      } catch (e) {
        // Índice único: ya hay una solicitud pendiente de esta cuenta. Cualquier otro fallo, error genérico.
        if (/UNIQUE/i.test(String(e && e.message))) return err("Ya tienes una solicitud pendiente. Un admin la revisará pronto.", 409);
        return err("No se pudo guardar la inscripción. Inténtalo de nuevo.", 500);
      }
      // Aviso a los admins en #inner-circle-general con los botones para aprobar o rechazar.
      let texto = [`📝 **Nueva solicitud de inscripción** (n.º ${id})`, `**Nombre:** ${nombre}`, `**Discord:** <@${reg.id}> (${reg.usuario})`,
        `**Correo:** ${email}`, `**Teléfono (WhatsApp):** ${telefono}`, `**Steam:** ${steam ? steam + " (https://steamcommunity.com/" + (/^\d{17}$/.test(steam) ? "profiles/" : "id/") + steam + ")" : "—"}`, `**Mayor de edad:** ${b.mayor_edad === "si" ? "Sí" : "No"}`,
        `**Le interesa:** ${juegos.length ? juegos.map((x) => INSC_JUEGOS[x]).join(", ") : "—"}`,
        `**Experiencia de juego:** ${INSC_EXP_JUEGO[b.experiencia_juego]}`, `**Experiencia de pintura:** ${INSC_EXP_PINTURA[b.experiencia_pintura]}`,
        `**Nos conoció por:** ${comoTexto || "—"}`].join("\n");
      ctx.waitUntil((async () => {
        try {
          // Primero entra en el servidor con el rol Externo; luego el aviso a los admins, con cómo ha ido.
          let entrada = "";
          try { entrada = await entraComoExterno(env, { id, discord_id: reg.id, token_cifrado: reg.rt }); } catch (e) { entrada = "⚠️ No se pudo meter en el servidor."; }
          texto = texto + "\n" + entrada;
          const rc = await bot(env, `/guilds/${env.GUILD_ID}/channels`);
          const c = rc.ok && (await rc.json()).find((x) => (x.type === 0 || x.type === 5) && normalCanal(x.name).includes(CANAL_AVISOS));
          if (!c) return;
          const m = await bot(env, `/channels/${c.id}/messages`, { method: "POST", headers: { "content-type": "application/json" },
            body: JSON.stringify({ content: texto.slice(0, 1900), flags: 4 /* sin vista previa de enlaces */, allowed_mentions: { parse: [] }, components: [{ type: 1, components: [
              { type: 2, style: 3, label: "Aprobar", custom_id: "insc:aprobar:" + id },
              { type: 2, style: 4, label: "Rechazar", custom_id: "insc:rechazar:" + id }] }] }) });
          if (m.ok) { const mj = await m.json(); await env.DB.prepare("UPDATE solicitudes SET canal_id=?2, mensaje_id=?3 WHERE id=?1").bind(id, c.id, mj.id).run(); }
        } catch (e) {}
      })());
      const hs = new Headers(noStore);
      hs.append("set-cookie", `${COOKIE_REG}=; Path=/; Max-Age=0`);
      return Response.json({ ok: true }, { headers: hs });
    }

    // Calendarios para el móvil: el del club (público) y el personal (enlace firmado, sin sesión para que
    // lo pueda leer Google Calendar o el iPhone).
    if (path === "/cal/club.ics" && request.method === "GET") {
      return new Response(ics("Adeptus Baeticus", await calendarioEventos(env, null)), {
        headers: { "content-type": "text/calendar; charset=utf-8", "cache-control": "public, max-age=1800" },
      });
    }
    const calm = path.match(/^\/cal\/u\/(\d+)\.([A-Za-z0-9_-]{22})\.ics$/);
    if (calm && request.method === "GET") {
      if (calm[2] !== (await firmaCal(env, calm[1]))) return new Response("No encontrado", { status: 404 });
      const u = await env.DB.prepare("SELECT discord_id FROM users WHERE discord_id=?1").bind(calm[1]).first();
      if (!u) return new Response("No encontrado", { status: 404 });
      return new Response(ics("Adeptus Baeticus · Mi calendario", await calendarioEventos(env, u.discord_id)), {
        headers: { "content-type": "text/calendar; charset=utf-8", "cache-control": "private, max-age=900" },
      });
    }
    if (path === "/api/calendario/enlace" && request.method === "GET") {
      const s = await readSession(env, request);
      const club = url.origin + "/cal/club.ics";
      if (!s) return Response.json({ club, personal: null }, { headers: noStore });
      return Response.json({ club, personal: url.origin + "/cal/u/" + s.id + "." + (await firmaCal(env, s.id)) + ".ics" }, { headers: noStore });
    }

    // FAQ (copia del canal de Discord). Si la copia tiene más de FAQ_MINUTOS, se vuelve a leer el canal
    // antes de responder (con un tope de 3 s: si Discord tarda, se sirve la copia que hay).
    if (path === "/api/faq" && request.method === "GET") {
      const lee = () => env.DB.prepare("SELECT datos, actualizado, intento FROM nr_cache WHERE clave=?1").bind(FAQ_CLAVE).first();
      let row = await lee();
      const hace = (t) => (t ? Date.now() - Date.parse(t.replace(" ", "T") + "Z") : Infinity);
      if (hace(row && row.actualizado) > FAQ_MINUTOS * 60000 && hace(row && row.intento) > FAQ_MINUTOS * 60000) {
        const sync = faqSync(env).catch(() => {});
        ctx.waitUntil(sync);
        await Promise.race([sync, new Promise((r) => setTimeout(r, 3000))]);
        row = await lee();
      }
      if (!row || !row.datos) return Response.json({ mensajes: null }, { headers: noStore });
      const en = await env.DB.prepare("SELECT datos FROM nr_cache WHERE clave=?1").bind(FAQ_EN).first();
      return new Response('{"actualizado":' + JSON.stringify(row.actualizado) + ',"faq":' + row.datos + ',"en":' + ((en && en.datos) || "{}") + "}", {
        headers: { "content-type": "application/json", "cache-control": "public, max-age=30" },
      });
    }

    // Fechas de las fases de la liga para marcar sus rondas en el calendario (sin consultar New Recruit).
    if (path === "/api/liga/calendario" && request.method === "GET") {
      const { results } = await env.DB.prepare(
        `SELECT f.id, f.nombre, f.inicio, f.rondas,
           EXISTS (SELECT 1 FROM liga_partidas p WHERE p.fase_id=f.id AND p.aplazada=1) AS aplazadas
         FROM liga_fases f ORDER BY f.inicio`
      ).all();
      return Response.json(results, { headers: { "cache-control": "public, max-age=300" } });
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
        `SELECT p.id, p.numero, p.texto, p.imagenes, p.image_url, p.width, p.height, p.created_at, p.updated_at, (p.discord_id=?1) AS es_mia,
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
      // Solo los enlaces de Discord (cdn.discordapp.com / media.discordapp.net) caducan y se renuevan.
      const deDiscord = (u) => /^https:\/\/(cdn\.discordapp\.com|media\.discordapp\.net)\//.test(u || "");
      results.forEach((r) => r.imagenes.forEach((im) => { if (deDiscord(im.url) && urlExpira(im.url) < pronto) viejos.push(im.url); }));
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
      const admin = !!s && s.role === "admin";
      results.forEach((r) => {
        r.mias = { emperador: !!r.mi_emperador, ruinosos: !!r.mi_ruinosos };
        // Puede borrarla quien la publicó o un admin.
        r.puedo_borrar = admin || !!r.es_mia;
        delete r.mi_emperador; delete r.mi_ruinosos; delete r.es_mia;
      });
      // Pueden subir fotos desde la web los miembros (y el admin), no los aspirantes.
      const puedeSubir = !!s && ["miembro", "admin"].includes(s.role);
      // Sin caché: las fotos nuevas, editadas o borradas tienen que verse al momento.
      return Response.json({ sesion: !!s, puede_subir: puedeSubir, publicaciones: results }, { headers: noStore });
    }

    // Subir fotos desde la web (solo miembros). La primera foto crea la publicación y su mensaje en Discord;
    // las demás se añaden de una en una (una foto por petición, para no pasar los límites del plan gratuito).
    // Al acabar, /fin manda el aviso «Fotos nuevas» una sola vez. DELETE borra la publicación y su mensaje.
    const gw = path.match(/^\/api\/galeria\/(?:publicar|(\d+)(\/foto|\/fin)?)$/);
    if (gw && (request.method === "POST" || (request.method === "DELETE" && gw[1] && !gw[2]))) {
      const s = await readSession(env, request);
      const err = (t, st = 400) => Response.json({ error: t }, { status: st, headers: noStore });
      if (!s) return err("Entra con Discord para subir fotos", 401);
      if (!sameOrigin(request, url)) return new Response("Prohibido", { status: 403 });
      if (!env.DISCORD_BOT_TOKEN) return err("El bot aún no está configurado. Avisa a un admin.", 503);
      const esMiembro = ["miembro", "admin"].includes(s.role);
      // Lee la foto de la petición (una por petición; el navegador ya la ha reducido).
      const leeFoto = async () => {
        if (Number(request.headers.get("content-length") || 0) > MAX_FOTO + 64 * 1024) return { error: "Cada foto puede ocupar como máximo 10 MB." };
        let fd;
        try { fd = await request.formData(); } catch (e) { return { error: "No se pudo leer la foto." }; }
        const f = fd.get("foto");
        const tipo = f && typeof f === "object" ? String(f.type || "").split(";")[0] : "";
        if (!f || typeof f !== "object" || !EXT_IMG[tipo]) return { error: "La foto debe ser PNG, JPG, GIF o WEBP." };
        if (f.size > MAX_FOTO) return { error: "Cada foto puede ocupar como máximo 10 MB." };
        return { fd, blob: f, ext: EXT_IMG[tipo] };
      };
      if (!gw[1]) {
        if (!esMiembro) return err("Solo los miembros pueden subir fotos a la galería.", 403);
        // Límite de uso: como mucho 10 publicaciones por socio en 24 horas.
        const hoy = await env.DB.prepare("SELECT COUNT(*) AS n FROM publicaciones WHERE discord_id=?1 AND created_at > datetime('now','-1 day')").bind(s.id).first();
        if (hoy.n >= 10) return err("Has llegado al máximo de 10 publicaciones al día. Prueba mañana.", 429);
        const f = await leeFoto();
        if (f.error) return err(f.error);
        const texto = String(f.fd.get("texto") || "").trim().slice(0, 500) || null;
        const canal = await canalPublicaciones(env);
        if (!canal) return err("No se encuentra el canal #" + CANAL_PUBLICACIONES + " en Discord. Avisa a un admin.", 503);
        const nombre = s.name || ((await env.DB.prepare("SELECT name FROM users WHERE discord_id=?1").bind(s.id).first()) || {}).name || "Socio";
        const res = await pubCrear(env, { uid: s.id, name: nombre, texto, channelId: canal, files: [{ blob: f.blob, ext: f.ext }] });
        if (res.error) return err(res.error === "grande" ? "La foto ocupa demasiado para Discord." : "No se pudo publicar en Discord (error " + res.status + ").", 502);
        return Response.json({ ok: true, id: res.id, numero: res.numero }, { headers: noStore });
      }
      const p = await env.DB.prepare("SELECT * FROM publicaciones WHERE id=?1 AND status='publicada'").bind(Number(gw[1])).first();
      if (!p) return err("Esa publicación ya no existe.", 404);
      if (request.method === "DELETE") {
        if (p.discord_id !== s.id && s.role !== "admin") return err("Solo puedes borrar tus propias publicaciones.", 403);
        const res = await pubBorrar(env, p);
        if (res.error) return err("No se pudo borrar el mensaje en Discord (error " + res.status + ").", 502);
        return Response.json({ ok: true }, { headers: noStore });
      }
      if (p.discord_id !== s.id) return err("Solo puedes añadir fotos a tus propias publicaciones.", 403);
      if (gw[2] === "/foto") {
        if (!esMiembro) return err("Solo los miembros pueden subir fotos a la galería.", 403);
        const f = await leeFoto();
        if (f.error) return err(f.error);
        const res = await pubAnadir(env, p, f.blob, f.ext);
        if (res.error === "llena") return err("La publicación ya tiene 10 fotos, que es el máximo.", 409);
        if (res.error) return err(res.error === "grande" ? "La foto ocupa demasiado para Discord." : "No se pudo añadir la foto en Discord.", 502);
        return Response.json({ ok: true, fotos: res.n }, { headers: noStore });
      }
      // /fin: aviso a los socios (una sola vez por publicación y solo recién creada).
      const marca = await env.DB.prepare("INSERT OR IGNORE INTO nr_cache (clave, actualizado) VALUES (?1, datetime('now'))").bind("galeria-aviso:" + p.id).run();
      if (marca.meta.changes && p.created_at > new Date(Date.now() - 3600e3).toISOString().replace("T", " ").slice(0, 19)) {
        let n = 1;
        try { n = JSON.parse(p.imagenes || "[]").length || 1; } catch (e) {}
        ctx.waitUntil(notifica(env, { tipo: "galeria", excepto: s.id, titulo: "Fotos nuevas en la galería",
          texto: p.autor + " ha publicado " + (n > 1 ? n + " fotos" : "una foto") + (p.texto ? ": " + p.texto.slice(0, 80) : ""), url: "/galeria.html" }).catch(() => {}));
      }
      return Response.json({ ok: true, numero: p.numero }, { headers: noStore });
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
        // Si el socio ya autorizó la web antes, Discord no vuelve a mostrar la pantalla de «Autorizar».
        prompt: "none",
      });
      return new Response(null, {
        status: 302,
        headers: {
          location: "https://discord.com/oauth2/authorize?" + p,
          "set-cookie": `ab_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
        },
      });
    }

    // Inscripción: conectar la cuenta de Discord del aspirante (mismo callback que el inicio de sesión; el «state»
    // empieza por «r»). guilds.join permite al bot meterle en el servidor cuando un admin apruebe la solicitud.
    if (path === "/auth/registro") {
      const state = "r" + crypto.randomUUID();
      const p = new URLSearchParams({ client_id: env.DISCORD_CLIENT_ID, response_type: "code", scope: "identify guilds.join",
        redirect_uri: url.origin + "/auth/callback", state });
      return new Response(null, { status: 302, headers: {
        location: "https://discord.com/oauth2/authorize?" + p,
        "set-cookie": `ab_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600` } });
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
      const tokens = await tok.json();
      const { access_token } = tokens;
      if (st.startsWith("r")) {
        // Inscripción: se guarda la cuenta (y su permiso, cifrado) en una cookie firmada durante 1 hora.
        const vuelve = (q) => { const h = new Headers({ location: url.origin + "/inscripcion.html" + (q ? "?" + q : "") }); h.append("set-cookie", "ab_state=; Path=/; Max-Age=0"); return h; };
        const ur = await fetch("https://discord.com/api/users/@me", { headers: { authorization: "Bearer " + access_token } });
        if (!ur.ok || !tokens.refresh_token) return new Response(null, { status: 302, headers: vuelve("error=discord") });
        const u = await ur.json();
        // ¿Ya es socio (tiene uno de los roles del club)? Entonces no necesita inscribirse.
        if (env.DISCORD_BOT_TOKEN) {
          const gm = await bot(env, `/guilds/${env.GUILD_ID}/members/${u.id}`);
          if (gm.ok && roleOf(env, (await gm.json()).roles || [])) return new Response(null, { status: 302, headers: vuelve("ya=socio") });
        }
        const reg = await firmaReg(env, { id: u.id, usuario: u.username, nombre: u.global_name || u.username, avatar: u.avatar || null,
          rt: await cifra(env, tokens.refresh_token), exp: Math.floor(Date.now() / 1000) + 3600 });
        const h = vuelve("");
        h.append("set-cookie", `${COOKIE_REG}=${reg}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`);
        return new Response(null, { status: 302, headers: h });
      }
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
        "INSERT INTO users (discord_id,name,avatar,role) VALUES (?1,?2,?3,?4) ON CONFLICT(discord_id) DO UPDATE SET name=excluded.name, avatar=excluded.avatar, role=excluded.role, conectado=1"
      ).bind(u.id, name, u.avatar, role).run();
      try { await ligaVincula(env, u.id); } catch (e) {}
      try { await vinculaAlEntrar(env, u, mem.nick); } catch (e) {}
      // Si entró por la inscripción y dio su Steam, pasa a su ficha de Miembros (si aún no tiene uno).
      try {
        await env.DB.prepare(`UPDATE users SET steam=(SELECT steam FROM solicitudes WHERE discord_id=?1 AND estado='aprobada' AND steam IS NOT NULL ORDER BY id DESC LIMIT 1)
          WHERE discord_id=?1 AND steam IS NULL AND EXISTS (SELECT 1 FROM solicitudes WHERE discord_id=?1 AND estado='aprobada' AND steam IS NOT NULL)`).bind(u.id).run();
      } catch (e) {}
      const cookie = await makeSession(env, { id: u.id, name, avatar: u.avatar, role, r: Math.floor(Date.now() / 1000) });
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
      const raw = await leeSesion(env, request);
      // Renovación de la sesión (no en el modo «ver como»): como mucho una vez al día se comprueba con el bot
      // que sigue en el servidor y su rol, y la sesión vuelve a durar 90 días.
      let renovada = null, cerrar = false;
      const ahoraS = Math.floor(Date.now() / 1000);
      if (raw && !raw.admin && !raw.invitado && ahoraS - (raw.r || 0) > RENUEVA_SEG && env.DISCORD_BOT_TOKEN) {
        try {
          const mr = await bot(env, `/guilds/${env.GUILD_ID}/members/${raw.id}`);
          if (mr.status === 404) cerrar = true; // ya no está en el servidor
          else if (mr.ok) {
            const mem = await mr.json();
            const role = roleOf(env, mem.roles || []);
            if (!role) cerrar = true;
            else {
              const u = mem.user || {};
              const name = mem.nick || u.global_name || u.username || raw.name;
              await env.DB.prepare("UPDATE users SET name=?2, avatar=?3, role=?4 WHERE discord_id=?1").bind(raw.id, name, u.avatar || null, role).run();
              renovada = { id: raw.id, name, avatar: u.avatar || null, role, r: ahoraS, exp: ahoraS + MAX_AGE };
            }
          }
        } catch (e) {} // si Discord falla, la sesión sigue como estaba
      }
      if (cerrar) {
        return Response.json(null, { headers: { "cache-control": "no-store", "set-cookie": `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0` } });
      }
      if (renovada) {
        const ck = await makeSession(env, renovada);
        let nr = null;
        const row = await env.DB.prepare("SELECT nr_username FROM users WHERE discord_id=?1").bind(renovada.id).first();
        if (row) nr = row.nr_username;
        return Response.json({ id: renovada.id, name: renovada.name, avatar: renovada.avatar, role: renovada.role, nr_username: nr, ver_como: null,
          ...(await avisoDatos(env, renovada)) },
          { headers: { "cache-control": "no-store", "set-cookie": `${COOKIE}=${ck}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}` } });
      }
      if (raw && raw.invitado && raw.admin) {
        return Response.json({ invitado: true, ver_como: String(raw.admin.name || raw.admin.id) }, { headers: { "cache-control": "no-store" } });
      }
      const s = await readSession(env, request);
      let nr = null;
      if (s) {
        const row = await env.DB.prepare("SELECT nr_username FROM users WHERE discord_id=?1").bind(s.id).first();
        // Perfil borrado (por el admin o por el propio socio): la sesión se cierra; si vuelve a entrar, empieza de cero.
        if (!row && !s.admin) return Response.json(null, { headers: { "cache-control": "no-store", "set-cookie": `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0` } });
        nr = row ? row.nr_username : null;
      }
      return Response.json(
        s ? { id: s.id, name: s.name, avatar: s.avatar, role: s.role, nr_username: nr, ver_como: s.admin ? String(s.admin.name || s.admin.id) : null,
          ...(s.admin ? {} : await avisoDatos(env, s)) } : null,
        { headers: { "cache-control": "no-store" } }
      );
    }

    // Datos de inscripción del socio con sesión: los importados del Excel (o vacíos) para revisarlos y completar lo que
    // falte. Se piden al entrar hasta que los completa (`faltanDatos`).
    // Borrar todos mis datos (con confirmación en la web): se borra el perfil y se cierra la sesión.
    if (path === "/api/socio/borrar" && request.method === "POST") {
      const s = await readSession(env, request);
      if (!s) return Response.json({ error: "Inicia sesión con Discord" }, { status: 401, headers: noStore });
      if (!sameOrigin(request, url)) return new Response("Prohibido", { status: 403 });
      let b = {};
      try { b = await request.json(); } catch (e) {}
      if (b.confirmo !== true) return Response.json({ error: "Falta la confirmación." }, { status: 400, headers: noStore });
      await borraPerfil(env, s.id);
      return Response.json({ ok: true }, { headers: { ...noStore, "set-cookie": `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0` } });
    }
    // Admin: borrar por completo el perfil de otro socio (DELETE /api/admin/miembros/:id).
    const bpm = path.match(/^\/api\/admin\/miembros\/(\d+)$/);
    if (bpm && request.method === "DELETE") {
      const s = await readSession(env, request);
      if (!s || s.role !== "admin") return Response.json({ error: "Solo para administradores" }, { status: 403, headers: noStore });
      if (!sameOrigin(request, url)) return new Response("Prohibido", { status: 403 });
      if (bpm[1] === s.id) return Response.json({ error: "Tu propio perfil se borra desde «Mis datos»." }, { status: 400, headers: noStore });
      if (!(await env.DB.prepare("SELECT 1 FROM users WHERE discord_id=?1").bind(bpm[1]).first())) return Response.json({ error: "Ese miembro no existe" }, { status: 404, headers: noStore });
      await borraPerfil(env, bpm[1]);
      return Response.json({ ok: true }, { headers: noStore });
    }
    // Hoja de datos del socio: la suya (/api/socio/datos) o, para el admin, la de cualquiera (/api/admin/miembros/:id/datos).
    const adm = path.match(/^\/api\/admin\/miembros\/(\d+)\/datos$/);
    if (path === "/api/socio/datos" || adm) {
      const s0 = await readSession(env, request);
      if (!s0) return Response.json({ error: "Inicia sesión con Discord" }, { status: 401, headers: noStore });
      if (adm && s0.role !== "admin") return Response.json({ error: "Solo para administradores" }, { status: 403, headers: noStore });
      let s = s0;
      if (adm) {
        const t = await env.DB.prepare("SELECT discord_id, name, role FROM users WHERE discord_id=?1").bind(adm[1]).first();
        if (!t) return Response.json({ error: "Ese miembro no existe" }, { status: 404, headers: noStore });
        s = { id: t.discord_id, name: t.name, role: t.role };
      }
      if (request.method === "GET") {
        // Sus datos: los propios (Excel o ya completados) o, si se inscribió con la web, los de su solicitud aprobada.
        const d = (await env.DB.prepare(`SELECT nombre, email, telefono, mayor_edad, juegos, experiencia_juego, experiencia_pintura, como_conocio,
          acepta_estatutos, consentimiento, completado_at FROM socios_datos WHERE discord_id=?1`).bind(s.id).first())
          || (await env.DB.prepare(`SELECT nombre, email, telefono, mayor_edad, juegos, experiencia_juego, experiencia_pintura, como_conocio,
          acepta_estatutos, consentimiento, created_at AS completado_at FROM solicitudes WHERE discord_id=?1 AND estado='aprobada' ORDER BY id DESC LIMIT 1`).bind(s.id).first());
        const u = await env.DB.prepare("SELECT facciones, instagram, steam, bcp, nr_username FROM users WHERE discord_id=?1").bind(s.id).first();
        let fac = [];
        try { fac = JSON.parse((u && u.facciones) || "[]"); } catch (e) {}
        let como = null, comoOtro = "";
        if (d && d.como_conocio) {
          if (d.como_conocio.startsWith("Otro: ")) { como = "otro"; comoOtro = d.como_conocio.slice(6); }
          else como = Object.keys(INSC_COMO).find((k) => INSC_COMO[k] === d.como_conocio) || null;
        }
        let juegos = [];
        try { juegos = JSON.parse((d && d.juegos) || "[]"); } catch (e) {}
        return Response.json({ nombre: s.name, steam: u && u.steam, datos: d ? { nombre: d.nombre, email: d.email, telefono: d.telefono,
          mayor_edad: d.mayor_edad == null ? null : d.mayor_edad ? "si" : "no", juegos, experiencia_juego: d.experiencia_juego,
          experiencia_pintura: d.experiencia_pintura, como_conocio: como, como_otro: comoOtro, acepta_estatutos: d.acepta_estatutos === 1,
          consentimiento: d.consentimiento === 1 } : null, completar: adm ? false : await faltanDatos(env, s), facciones: FACCIONES, admin: !!adm,
          ficha: u ? { facciones: fac, instagram: u.instagram, steam: u.steam, bcp: u.bcp, nr: u.nr_username } : null }, { headers: noStore });
      }
      if (request.method !== "POST") return new Response("Método no permitido", { status: 405 });
      if (!sameOrigin(request, url)) return new Response("Prohibido", { status: 403 });
      let b = {};
      try { b = await request.json(); } catch (e) {}
      const v = validaDatosSocio(b, !!adm);
      if (v.error) return Response.json({ error: v.error }, { status: 400, headers: noStore });
      // Ficha de Miembros (facciones y cuentas), en el mismo formulario.
      if (b.ficha && typeof b.ficha === "object") {
        const e = await guardaFicha(env, s.id, b.ficha);
        if (e) return Response.json({ error: e }, { status: 400, headers: noStore });
      }
      const campos = [s.id, v.nombre, v.email, v.telefono, v.mayor_edad, v.juegos, v.experiencia_juego, v.experiencia_pintura, v.como];
      const guarda = adm
        // El admin corrige los datos; las condiciones y el «completado» siguen siendo cosa del socio.
        ? env.DB.prepare(`INSERT INTO socios_datos (discord_id, nombre, email, telefono, mayor_edad, juegos, experiencia_juego, experiencia_pintura,
            como_conocio, origen) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,'web')
          ON CONFLICT(discord_id) DO UPDATE SET nombre=excluded.nombre, email=excluded.email, telefono=excluded.telefono, mayor_edad=excluded.mayor_edad,
            juegos=excluded.juegos, experiencia_juego=excluded.experiencia_juego, experiencia_pintura=excluded.experiencia_pintura, como_conocio=excluded.como_conocio`)
        : env.DB.prepare(`INSERT INTO socios_datos (discord_id, nombre, email, telefono, mayor_edad, juegos, experiencia_juego, experiencia_pintura,
            como_conocio, acepta_estatutos, consentimiento, alta, origen, completado_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,1,1,date('now'),'web',datetime('now'))
          ON CONFLICT(discord_id) DO UPDATE SET nombre=excluded.nombre, email=excluded.email, telefono=excluded.telefono, mayor_edad=excluded.mayor_edad,
            juegos=excluded.juegos, experiencia_juego=excluded.experiencia_juego, experiencia_pintura=excluded.experiencia_pintura,
            como_conocio=excluded.como_conocio, acepta_estatutos=1, consentimiento=1, completado_at=excluded.completado_at`);
      const ops = [guarda.bind(...campos)];
      if (!adm) ops.push(env.DB.prepare("UPDATE users SET alta=COALESCE(alta, (SELECT alta FROM socios_datos WHERE discord_id=?1)) WHERE discord_id=?1").bind(s.id));
      await env.DB.batch(ops);
      return Response.json({ ok: true }, { headers: noStore });
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
            `INSERT INTO partidas (created_by,activity,format,players,team_a,team_b,availability,last_day,modo,lugar)
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)`
          ).bind(s.id, p.activity, p.format, p.players, p.team_a, p.team_b, JSON.stringify([av]), av.date, p.modo, p.lugar).run();
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
        // Si vale físico u online, quien se une elige cómo se juega (y queda fijado para todos).
        const modoElegido = b.modo === "fisico" || b.modo === "online" ? b.modo : null;
        if (p.modo === "ambos" && !modoElegido) return fail("Elige si jugáis en físico u online", 400);
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
            `UPDATE partidas SET modo=?2 WHERE id=?1 AND modo='ambos'
               AND EXISTS (SELECT 1 FROM partida_players WHERE partida_id=?1 AND discord_id=?3)`
          ).bind(pid, modoElegido || "fisico", s.id),
          env.DB.prepare(
            `UPDATE partidas SET status='completa'
             WHERE id=?1 AND status='abierta' AND (SELECT COUNT(*) FROM partida_players WHERE partida_id=?1) >= team_a + team_b`
          ).bind(pid),
        ]);
        if (!ins.meta.changes) return fail("Alguien ha ocupado el hueco antes. Vuelve a intentarlo.", 409);
        // Aviso a los demás jugadores de la partida (y a todos si se ha completado).
        ctx.waitUntil((async () => {
          const q = await env.DB.prepare("SELECT status, starts_at, mesa FROM partidas WHERE id=?1").bind(pid).first();
          const otros = js.map((j) => j.discord_id);
          const modo = MODALIDAD[p.activity] || "partida";
          const cuando = q && q.starts_at ? " · " + fechaCorta(q.starts_at) : "";
          await notifica(env, { tipo: "partidas", a: otros, titulo: "Se han unido a tu partida", texto: s.name + " se ha unido a tu partida de " + modo + cuando, url: "/calendario.html?partida=" + pid });
          if (q && q.status === "completa") {
            await notifica(env, { tipo: "partidas", a: [...otros, s.id], titulo: "Partida completa", texto: "Tu partida de " + modo + cuando + (q.mesa ? " · mesa " + q.mesa : "") + " ya está completa", url: "/calendario.html?partida=" + pid });
          }
        })().catch(() => {}));
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
    // Miembros: el listado es público (nombre, foto, rol, facciones, liga y ELO); las cuentas
    // (Discord, Instagram, Steam, New Recruit, BCP) solo se entregan a los socios con sesión.
    if (path === "/api/miembros" && request.method === "GET") {
      const s = await readSession(env, request);
      const { results } = await env.DB.prepare(
        "SELECT discord_id, name, avatar, role, facciones, instagram, steam, bcp, nr_username, conectado, alta FROM users ORDER BY name COLLATE NOCASE"
      ).all();
      // ELO de la liga: por usuario de New Recruit (el de la ficha o el del jugador de la liga vinculado).
      let elo = [];
      try { elo = JSON.parse(((await env.DB.prepare("SELECT datos FROM nr_cache WHERE clave=?1").bind(ELO_CLAVE).first()) || {}).datos || "[]"); } catch (e) {}
      const porLogin = new Map(elo.map((x) => [x.login.trim().toLowerCase(), x]));
      const nrLiga = new Map((await env.DB.prepare("SELECT discord_id, nr_nombre FROM liga_jugadores WHERE discord_id IS NOT NULL AND nr_nombre IS NOT NULL").all()).results.map((j) => [j.discord_id, j.nr_nombre]));
      const eloDe = (u) => porLogin.get(String(u.nr_username || "").trim().toLowerCase()) || porLogin.get(String(nrLiga.get(u.discord_id) || "").trim().toLowerCase()) || null;
      // Gran Liga (fase más reciente): clasificación como en la página de la liga (V → PV → DIF) y datos de cada jugador vinculado.
      const ligaDe = new Map();
      const fase = await env.DB.prepare("SELECT id, nombre FROM liga_fases ORDER BY edicion DESC, fase DESC LIMIT 1").first();
      if (fase) {
        const js = (await env.DB.prepare("SELECT id, discord, discord_id FROM liga_jugadores WHERE fase_id=?1").bind(fase.id).all()).results;
        const t = new Map(js.map((j) => [j.id, { j, pj: 0, v: 0, d: 0, e: 0, pv: 0, contra: 0, fac: new Map() }]));
        const ps = (await env.DB.prepare("SELECT jugador_a, jugador_b, pv_a, pv_b, faccion_a, faccion_b FROM liga_partidas WHERE fase_id=?1 AND pv_a IS NOT NULL AND pv_b IS NOT NULL").bind(fase.id).all()).results;
        for (const p of ps) {
          for (const [id, mio, suyo, fac] of [[p.jugador_a, p.pv_a, p.pv_b, p.faccion_a], [p.jugador_b, p.pv_b, p.pv_a, p.faccion_b]]) {
            const x = t.get(id);
            if (!x) continue;
            x.pj++; x.pv += mio; x.contra += suyo;
            if (mio > suyo) x.v++; else if (mio < suyo) x.d++; else x.e++;
            if (fac) x.fac.set(fac, (x.fac.get(fac) || 0) + 1);
          }
        }
        const orden = [...t.values()].sort((a, b) => b.v - a.v || b.pv - a.pv || (b.pv - b.contra) - (a.pv - a.contra) || a.j.discord.localeCompare(b.j.discord));
        orden.forEach((x, i) => {
          if (!x.j.discord_id) return;
          ligaDe.set(x.j.discord_id, {
            fase: fase.nombre, pos: i + 1, total: orden.length, pj: x.pj, v: x.v, d: x.d, e: x.e, pv: x.pv, contra: x.contra,
            facciones: [...x.fac.entries()].sort((a, b) => b[1] - a[1]).map(([f, n]) => ({ f, n })),
          });
        });
      }
      // Trofeos (palmarés): por socio, con su puesto, modalidad y compañeros.
      const tr = (await env.DB.prepare(
        `SELECT t.id, t.nombre, t.puesto, t.modalidad, t.fecha, t.created_at, m.discord_id
         FROM trofeos t JOIN trofeo_miembros m ON m.trofeo_id=t.id ORDER BY t.fecha DESC, t.puesto, t.id DESC`
      ).all()).results;
      const nombreDe = new Map(results.map((u) => [u.discord_id, u.name]));
      const ganadores = new Map();
      for (const x of tr) { if (!ganadores.has(x.id)) ganadores.set(x.id, []); ganadores.get(x.id).push(x.discord_id); }
      const trofeosDe = (id) => tr.filter((x) => x.discord_id === id).map((x) => ({
        id: x.id, nombre: x.nombre, puesto: x.puesto, modalidad: x.modalidad, fecha: x.fecha,
        con: ganadores.get(x.id).filter((o) => o !== id).map((o) => nombreDe.get(o)).filter(Boolean),
      }));
      const miembros = results.map((u) => {
        let fac = [];
        try { fac = JSON.parse(u.facciones || "[]"); } catch (e) {}
        const x = eloDe(u);
        const m = { id: u.discord_id, name: u.name, avatar: u.avatar, role: u.role, facciones: fac, elo: x ? { elo: x.elo, pos: x.pos, total: elo.length, v: x.v, d: x.d, e: x.e } : null, liga: ligaDe.get(u.discord_id) || null, trofeos: trofeosDe(u.discord_id) };
        if (!u.conectado) m.desconectado = true; // creado desde la web y aún sin iniciar sesión
        if (s) Object.assign(m, { instagram: u.instagram, steam: u.steam, bcp: u.bcp, nr: u.nr_username, alta: u.alta || null });
        m.editable = !!s && (s.id === u.discord_id || s.role === "admin");
        return m;
      });
      const lista = [...ganadores.keys()].map((id) => { const x = tr.find((t) => t.id === id); return { id, nombre: x.nombre, puesto: x.puesto, modalidad: x.modalidad, fecha: x.fecha, ids: ganadores.get(id), miembros: ganadores.get(id).map((o) => nombreDe.get(o)).filter(Boolean) }; });
      return Response.json({ sesion: !!s, yo: s ? s.id : null, admin: !!s && s.role === "admin", facciones: FACCIONES, liga_nr: NR_ELO.liga,
        trofeos: s && s.role === "admin" ? lista : undefined, miembros }, { headers: { ...noStore, vary: "cookie" } });
    }
    // Editar una ficha: cada socio la suya; el admin, todas.
    const mbm = path.match(/^\/api\/miembros\/(\d+)$/);
    if (mbm && request.method === "PUT") {
      const s = await readSession(env, request);
      if (!s) return Response.json({ error: "Inicia sesión con Discord" }, { status: 401, headers: noStore });
      if (!sameOrigin(request, url)) return new Response("Prohibido", { status: 403 });
      if (s.id !== mbm[1] && s.role !== "admin") return Response.json({ error: "Solo puedes editar tu propia ficha" }, { status: 403, headers: noStore });
      let b = {};
      try { b = await request.json(); } catch (e) {}
      const e = await guardaFicha(env, mbm[1], b);
      if (e) return Response.json({ error: e }, { status: e === "Ese miembro no existe" ? 404 : 400, headers: noStore });
      return Response.json({ ok: true }, { headers: noStore });
    }

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
            "SELECT clave, actualizado, intento, error, length(datos) AS bytes FROM nr_cache WHERE clave NOT LIKE 'discord:%' ORDER BY clave"
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

      // Socios importados del Excel: estado (GET) y vinculación con sus cuentas de Discord con el bot (POST).
      if (path === "/api/admin/socios") {
        const filas = (await env.DB.prepare("SELECT id, discord_id, discord_alias, nombre, completado_at FROM socios_datos WHERE origen='excel' ORDER BY nombre COLLATE NOCASE").all()).results;
        const informe = (extra) => Response.json({ total: filas.length, vinculados: filas.filter((f) => f.discord_id).length,
          completados: filas.filter((f) => f.completado_at).length,
          sin: filas.filter((f) => !f.discord_id).map((f) => ({ id: f.id, nombre: f.nombre, alias: f.discord_alias,
            sugerencias: extra.libresDe ? sugerenciasSocio(env, f, extra.libresDe) : undefined })), ...extra, libresDe: undefined }, { headers: noStore });
        if (request.method === "GET") return informe({});
        if (request.method !== "POST") return new Response("Método no permitido", { status: 405 });
        if (!sameOrigin(request, url)) return new Response("Prohibido", { status: 403 });
        // Lista de miembros del servidor (una llamada; necesita «Server Members Intent» activado en el bot).
        const rm = await bot(env, `/guilds/${env.GUILD_ID}/members?limit=1000`);
        if (rm.status === 403) return Response.json({ error: "El bot no puede leer la lista de miembros: activa «Server Members Intent» en el portal de desarrolladores de Discord (Bot → Privileged Gateway Intents)." }, { status: 502, headers: noStore });
        if (!rm.ok) return Response.json({ error: "No se pudo leer la lista de miembros de Discord." }, { status: 502, headers: noStore });
        const miembros = (await rm.json()).filter((m) => m.user && !m.user.bot);
        const usados = new Set(filas.filter((f) => f.discord_id).map((f) => f.discord_id));
        const idx = new Map();
        const pon = (k, m) => { if (!k) return; k = String(k).toLowerCase(); if (!idx.has(k)) idx.set(k, new Set()); idx.get(k).add(m); };
        miembros.forEach((m) => { pon(m.user.username, m); pon(m.user.global_name, m); pon(m.nick, m); pon(sinParentesis(m.nick), m); pon(sinParentesis(m.user.global_name), m); });
        const lista = [], dudosos = [];
        for (const f of filas) {
          if (f.discord_id) continue;
          const cands = new Set();
          aliasDiscord(f.discord_alias).forEach((a) => (idx.get(a) || []).forEach((m) => cands.add(m)));
          const libres = [...cands].filter((m) => !usados.has(m.user.id));
          if (libres.length === 1) {
            const m = libres[0]; usados.add(m.user.id);
            lista.push({ s: f.id, d: m.user.id, n: m.nick || m.user.global_name || m.user.username, a: m.user.avatar || null, r: roleOf(env, m.roles || []) });
            f.discord_id = m.user.id;
          } else if (libres.length > 1) dudosos.push({ nombre: f.nombre, alias: f.discord_alias, opciones: libres.map((m) => m.user.username) });
        }
        await vinculaSocios(env, lista);
        // Con rol del club en Discord, pero sin datos (ni en el Excel ni inscritos con la web): tendrán que rellenarlos al entrar.
        const conDatos = new Set((await env.DB.prepare("SELECT discord_id FROM solicitudes WHERE estado='aprobada' UNION SELECT discord_id FROM socios_datos WHERE discord_id IS NOT NULL").all()).results.map((x) => x.discord_id));
        const fuera = miembros.filter((m) => roleOf(env, m.roles || []) && !conDatos.has(m.user.id)).map((m) => ({ nombre: m.nick || m.user.global_name || m.user.username, usuario: m.user.username }));
        const sinRol = lista.filter((x) => !x.r).length;
        // Para los que siguen sin vincular: posibles cuentas entre los miembros que aún no tienen ficha vinculada.
        const libresDe = miembros.filter((m) => !usados.has(m.user.id) && !conDatos.has(m.user.id));
        // Se guarda esa lista (solo cuenta, usuario, nombre visible, apodo y rol) para poder revisar las parejas a mano.
        await env.DB.prepare("INSERT INTO nr_cache (clave, datos, actualizado) VALUES ('discord:sin-datos', ?1, datetime('now')) ON CONFLICT(clave) DO UPDATE SET datos=?1, actualizado=datetime('now')")
          .bind(JSON.stringify(libresDe.map((m) => ({ id: m.user.id, usuario: m.user.username, visible: m.user.global_name || null, apodo: m.nick || null, rol: roleOf(env, m.roles || []) })))).run();
        return informe({ nuevos: lista.length, sin_rol: sinRol, dudosos, fuera, libresDe });
      }
      // Vincular a mano una fila del Excel con una cuenta de Discord (desde las sugerencias).
      if (path === "/api/admin/socios/vincula" && request.method === "POST") {
        if (!sameOrigin(request, url)) return new Response("Prohibido", { status: 403 });
        let b = {};
        try { b = await request.json(); } catch (e) {}
        const fila = Number(b.fila), did = String(b.discord_id || "");
        if (!Number.isInteger(fila) || !/^\d{5,25}$/.test(did)) return Response.json({ error: "Datos no válidos" }, { status: 400, headers: noStore });
        const f = await env.DB.prepare("SELECT id, discord_id FROM socios_datos WHERE id=?1 AND origen='excel'").bind(fila).first();
        if (!f) return Response.json({ error: "Ese socio no existe" }, { status: 404, headers: noStore });
        if (f.discord_id) return Response.json({ error: "Ese socio ya está vinculado" }, { status: 409, headers: noStore });
        if (await env.DB.prepare("SELECT 1 FROM socios_datos WHERE discord_id=?1").bind(did).first()) return Response.json({ error: "Esa cuenta de Discord ya está vinculada con otro socio" }, { status: 409, headers: noStore });
        const gm = await bot(env, `/guilds/${env.GUILD_ID}/members/${did}`);
        if (!gm.ok) return Response.json({ error: "Esa cuenta ya no está en el servidor de Discord" }, { status: 404, headers: noStore });
        const m = await gm.json();
        await vinculaSocios(env, [{ s: f.id, d: did, n: m.nick || m.user.global_name || m.user.username, a: m.user.avatar || null, r: roleOf(env, m.roles || []) }]);
        return Response.json({ ok: true }, { headers: noStore });
      }

      // Usuarios de la web (para «ver como»).
      if (path === "/api/admin/usuarios" && request.method === "GET") {
        const { results } = await env.DB.prepare("SELECT discord_id, name, role FROM users ORDER BY name COLLATE NOCASE").all();
        return Response.json(results, { headers: noStore });
      }
      // Ver la web como otro usuario (solo lectura, 2 horas como máximo). La sesión del admin
      // queda guardada dentro de la nueva sesión firmada para poder volver.
      if (path === "/api/admin/ver-como" && request.method === "POST") {
        if (!sameOrigin(request, url)) return new Response("Prohibido", { status: 403 });
        let b = {};
        try { b = await request.json(); } catch (e) {}
        const did = String(b.discord_id || "");
        const admin = { id: s.id, name: s.name, avatar: s.avatar, role: s.role, exp: s.exp };
        if (did === "invitado") {
          // Visitante sin registrar: una sesión que el servidor trata como si no hubiera sesión.
          const exp = Math.min(s.exp, Math.floor(Date.now() / 1000) + 2 * 3600);
          const cookie = await makeSession(env, { invitado: true, exp, admin });
          return Response.json({ ok: true }, { headers: { ...noStore, "set-cookie": cookieSesion(cookie, exp - Math.floor(Date.now() / 1000)) } });
        }
        if (!did || did === s.id) return Response.json({ error: "Elige otro usuario" }, { status: 400, headers: noStore });
        const u = await env.DB.prepare("SELECT discord_id, name, avatar, role FROM users WHERE discord_id=?1").bind(did).first();
        if (!u) return Response.json({ error: "Ese usuario no existe" }, { status: 404, headers: noStore });
        const exp = Math.min(s.exp, Math.floor(Date.now() / 1000) + 2 * 3600);
        const cookie = await makeSession(env, {
          id: u.discord_id, name: u.name, avatar: u.avatar, role: u.role, exp,
          admin: { id: s.id, name: s.name, avatar: s.avatar, role: s.role, exp: s.exp },
        });
        return Response.json({ ok: true, name: u.name }, { headers: { ...noStore, "set-cookie": cookieSesion(cookie, exp - Math.floor(Date.now() / 1000)) } });
      }

      // Trofeos (palmarés): asignar uno (nombre, puesto 1-3, modalidad y ganadores) o quitarlo.
      // Crear (POST /api/admin/trofeos) o editar (PUT /api/admin/trofeos/:id) un trofeo.
      const tre = path.match(/^\/api\/admin\/trofeos(?:\/(\d+))?$/);
      if (tre && ((!tre[1] && request.method === "POST") || (tre[1] && request.method === "PUT"))) {
        if (!sameOrigin(request, url)) return new Response("Prohibido", { status: 403 });
        let b = {};
        try { b = await request.json(); } catch (e) {}
        const nombre = String(b.nombre || "").trim().slice(0, 120);
        const puesto = Number(b.puesto), modalidad = String(b.modalidad || ""), fecha = String(b.fecha || "");
        const ids = Array.isArray(b.miembros) ? [...new Set(b.miembros.map(String))] : [];
        const err = (t) => Response.json({ error: t }, { status: 400, headers: noStore });
        if (nombre.length < 2) return err("Escribe el nombre del trofeo");
        if (![1, 2, 3].includes(puesto)) return err("Elige el puesto (1.º, 2.º o 3.º)");
        if (!["individual", "parejas", "equipo", "pintura"].includes(modalidad)) return err("Elige el tipo de trofeo");
        const fm = /^(\d{4})-(\d{2})$/.exec(fecha);
        if (!fm || +fm[1] < 2000 || +fm[1] > 2100 || +fm[2] < 1 || +fm[2] > 12) return err("Elige el mes y el año del trofeo");
        const cuantos = modalidad === "individual" || modalidad === "pintura" ? 1 : modalidad === "parejas" ? 2 : null;
        if (cuantos ? ids.length !== cuantos : ids.length < 2 || ids.length > 20) {
          return err(modalidad === "individual" || modalidad === "pintura" ? "Elige un miembro" : modalidad === "parejas" ? "Elige los dos miembros de la pareja" : "Elige entre 2 y 20 miembros del equipo, sin repetir");
        }
        if (Array.isArray(b.miembros) && b.miembros.length !== ids.length) return err("No repitas miembros");
        const existen = (await env.DB.prepare("SELECT COUNT(*) n FROM users WHERE discord_id IN (SELECT value FROM json_each(?1))").bind(JSON.stringify(ids)).first()).n;
        if (existen !== ids.length) return err("Algún miembro no existe");
        let tid;
        if (tre[1]) {
          tid = Number(tre[1]);
          const r = await env.DB.prepare("UPDATE trofeos SET nombre=?2, puesto=?3, modalidad=?4, fecha=?5 WHERE id=?1").bind(tid, nombre, puesto, modalidad, fecha).run();
          if (!r.meta.changes) return Response.json({ error: "Ese trofeo no existe" }, { status: 404, headers: noStore });
          await env.DB.batch([
            env.DB.prepare("DELETE FROM trofeo_miembros WHERE trofeo_id=?1").bind(tid),
            ...ids.map((id) => env.DB.prepare("INSERT INTO trofeo_miembros (trofeo_id, discord_id) VALUES (?1, ?2)").bind(tid, id)),
          ]);
        } else {
          const r = await env.DB.prepare("INSERT INTO trofeos (nombre, puesto, modalidad, fecha) VALUES (?1, ?2, ?3, ?4)").bind(nombre, puesto, modalidad, fecha).run();
          tid = r.meta.last_row_id;
          await env.DB.batch(ids.map((id) => env.DB.prepare("INSERT INTO trofeo_miembros (trofeo_id, discord_id) VALUES (?1, ?2)").bind(tid, id)));
        }
        return Response.json({ ok: true, id: tid }, { headers: noStore });
      }
      const trm = path.match(/^\/api\/admin\/trofeos\/(\d+)$/);
      if (trm && request.method === "DELETE") {
        if (!sameOrigin(request, url)) return new Response("Prohibido", { status: 403 });
        await env.DB.batch([
          env.DB.prepare("DELETE FROM trofeo_miembros WHERE trofeo_id=?1").bind(trm[1]),
          env.DB.prepare("DELETE FROM trofeos WHERE id=?1").bind(trm[1]),
        ]);
        return Response.json({ ok: true }, { headers: noStore });
      }

      // Gran Liga: jugadores con su vínculo (y sugerencias) y usuarios de la web para vincular a mano.
      if (path === "/api/admin/liga/jugadores" && request.method === "GET") {
        const fase = await env.DB.prepare("SELECT id, nombre, rondas FROM liga_fases ORDER BY edicion DESC, fase DESC LIMIT 1").first();
        if (!fase) return Response.json({ fase: null, jugadores: [], usuarios: [] }, { headers: noStore });
        const jugadores = (await env.DB.prepare(
          `SELECT j.id, j.discord, j.nombre, j.nr_nombre, j.discord_id, j.sugerido_id,
             (SELECT count(*) FROM liga_partidas p WHERE p.jugador_a=j.id OR p.jugador_b=j.id) AS partidas,
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

      // Gran Liga: añadir un jugador a la fase actual (sin partidas; luego se le ponen cruces).
      const ligaFase = async () => env.DB.prepare("SELECT id, nombre, rondas FROM liga_fases ORDER BY edicion DESC, fase DESC LIMIT 1").first();
      const datosJugador = async (b, faseId, idActual) => {
        const t = (v, n) => String(v == null ? "" : v).trim().slice(0, n);
        const discord = t(b.discord, 60), nombre = t(b.nombre, 60) || null, nr = t(b.nr_nombre, 60) || null;
        const did = b.discord_id ? String(b.discord_id) : null;
        if (discord.length < 2) return { error: "Escribe el nombre del jugador (su nombre de Discord)." };
        if (await env.DB.prepare("SELECT 1 FROM liga_jugadores WHERE fase_id=?1 AND discord=?2 COLLATE NOCASE AND id<>?3").bind(faseId, discord, idActual || 0).first())
          return { error: "Ya hay un jugador con ese nombre en la liga." };
        if (did && !(await env.DB.prepare("SELECT 1 FROM users WHERE discord_id=?1").bind(did).first())) return { error: "Ese usuario no existe" };
        if (did && (await env.DB.prepare("SELECT 1 FROM liga_jugadores WHERE fase_id=?1 AND discord_id=?2 AND id<>?3").bind(faseId, did, idActual || 0).first()))
          return { error: "Esa cuenta ya está vinculada a otro jugador de la liga." };
        return { discord, nombre, nr, did };
      };
      if (path === "/api/admin/liga/emparejar" && request.method === "POST") {
        if (!sameOrigin(request, url)) return new Response("Prohibido", { status: 403 });
        const fase = await ligaFase();
        return Response.json({ ok: true, vinculados: fase ? await ligaEmpareja(env, fase.id) : 0 }, { headers: noStore });
      }
      if (path === "/api/admin/liga/jugador" && request.method === "POST") {
        if (!sameOrigin(request, url)) return new Response("Prohibido", { status: 403 });
        const fase = await ligaFase();
        if (!fase) return Response.json({ error: "Todavía no hay ninguna fase de la liga." }, { status: 400, headers: noStore });
        let b = {}; try { b = await request.json(); } catch (e) {}
        const d = await datosJugador(b, fase.id);
        if (d.error) return Response.json({ error: d.error }, { status: 400, headers: noStore });
        await env.DB.prepare("INSERT INTO liga_jugadores (fase_id, discord, nombre, nr_nombre, discord_id) VALUES (?1,?2,?3,?4,?5)").bind(fase.id, d.discord, d.nombre, d.nr, d.did).run();
        if (!d.did) await ligaEmpareja(env, fase.id);
        return Response.json({ ok: true }, { headers: noStore });
      }
      // Reemplazar a un jugador: el sustituto se queda con su fila (partidas y resultados) y el id de New Recruit del
      // anterior se guarda para que sus resultados sigan asignados. Quitar: solo si no tiene partidas.
      const ljr = path.match(/^\/api\/admin\/liga\/jugador\/(\d+)\/reemplazar$/);
      if (ljr && request.method === "POST") {
        if (!sameOrigin(request, url)) return new Response("Prohibido", { status: 403 });
        const j = await env.DB.prepare("SELECT id, fase_id, nr_participante, nr_anteriores FROM liga_jugadores WHERE id=?1").bind(Number(ljr[1])).first();
        if (!j) return Response.json({ error: "El jugador no existe" }, { status: 404, headers: noStore });
        let b = {}; try { b = await request.json(); } catch (e) {}
        const d = await datosJugador(b, j.fase_id, j.id);
        if (d.error) return Response.json({ error: d.error }, { status: 400, headers: noStore });
        let ant = []; try { ant = JSON.parse(j.nr_anteriores || "[]"); } catch (e) {}
        if (j.nr_participante && !ant.includes(j.nr_participante)) ant.push(j.nr_participante);
        await env.DB.prepare(`UPDATE liga_jugadores SET discord=?2, nombre=?3, nr_nombre=?4, discord_id=?5, sugerido_id=NULL, nr_participante=NULL,
          nr_anteriores=?6 WHERE id=?1`).bind(j.id, d.discord, d.nombre, d.nr, d.did, ant.length ? JSON.stringify(ant) : null).run();
        if (!d.did) await ligaEmpareja(env, j.fase_id);
        return Response.json({ ok: true }, { headers: noStore });
      }
      const ljd = path.match(/^\/api\/admin\/liga\/jugador\/(\d+)$/);
      if (ljd && request.method === "DELETE") {
        if (!sameOrigin(request, url)) return new Response("Prohibido", { status: 403 });
        const id = Number(ljd[1]);
        if (await env.DB.prepare("SELECT 1 FROM liga_partidas WHERE jugador_a=?1 OR jugador_b=?1").bind(id).first())
          return Response.json({ error: "Tiene partidas en el calendario: usa «Reemplazar» o quítalo antes de sus cruces." }, { status: 409, headers: noStore });
        await env.DB.prepare("DELETE FROM liga_jugadores WHERE id=?1").bind(id).run();
        return Response.json({ ok: true }, { headers: noStore });
      }
      // Cruces (calendario del club): partidas de la fase actual; se pueden cambiar, añadir y quitar las que no tienen resultado.
      if (path === "/api/admin/liga/partidas" && request.method === "GET") {
        const fase = await ligaFase();
        if (!fase) return Response.json({ fase: null, partidas: [] }, { headers: noStore });
        const partidas = (await env.DB.prepare(`SELECT id, ronda, mesa, jugador_a, jugador_b, aplazada, (pv_a IS NOT NULL OR pv_b IS NOT NULL) AS resultado
          FROM liga_partidas WHERE fase_id=?1 ORDER BY ronda, mesa`).bind(fase.id).all()).results;
        return Response.json({ fase, partidas }, { headers: noStore });
      }
      const lpm = path.match(/^\/api\/admin\/liga\/partida(?:\/(\d+))?$/);
      if (lpm && ["POST", "PUT", "DELETE"].includes(request.method)) {
        if (!sameOrigin(request, url)) return new Response("Prohibido", { status: 403 });
        const fase = await ligaFase();
        if (!fase) return Response.json({ error: "Todavía no hay ninguna fase de la liga." }, { status: 400, headers: noStore });
        const err = (m, st = 400) => Response.json({ error: m }, { status: st, headers: noStore });
        let p = null;
        if (lpm[1]) {
          p = await env.DB.prepare("SELECT id, ronda, jugador_a, jugador_b, (pv_a IS NOT NULL OR pv_b IS NOT NULL) AS resultado FROM liga_partidas WHERE id=?1 AND fase_id=?2").bind(Number(lpm[1]), fase.id).first();
          if (!p) return err("Esa partida no existe", 404);
          if (p.resultado) return err("Esa partida ya tiene resultado: no se puede cambiar.");
        } else if (request.method !== "POST") return err("Datos no válidos");
        if (request.method === "DELETE") {
          await env.DB.prepare("DELETE FROM liga_partidas WHERE id=?1").bind(p.id).run();
          return Response.json({ ok: true }, { headers: noStore });
        }
        let b = {}; try { b = await request.json(); } catch (e) {}
        const ronda = p ? p.ronda : Number(b.ronda);
        const a = Number(b.jugador_a), c = Number(b.jugador_b);
        if (!Number.isInteger(ronda) || ronda < 1 || ronda > fase.rondas) return err("Ronda no válida");
        if (!a || !c || a === c) return err("Elige dos jugadores distintos.");
        const ok = (await env.DB.prepare("SELECT count(*) n FROM liga_jugadores WHERE fase_id=?1 AND id IN (?2, ?3)").bind(fase.id, a, c).first()).n;
        if (ok !== 2) return err("Esos jugadores no son de esta fase.");
        const yaRonda = await env.DB.prepare(`SELECT 1 FROM liga_partidas WHERE fase_id=?1 AND ronda=?2 AND id<>?3 AND (jugador_a IN (?4, ?5) OR jugador_b IN (?4, ?5))`)
          .bind(fase.id, ronda, p ? p.id : 0, a, c).first();
        if (yaRonda) return err("Alguno de los dos ya juega otra partida en esa ronda.");
        // En la liga cada pareja se enfrenta una sola vez por fase (así se asignan los resultados de New Recruit).
        const yaPar = await env.DB.prepare(`SELECT ronda FROM liga_partidas WHERE fase_id=?1 AND id<>?2 AND ((jugador_a=?3 AND jugador_b=?4) OR (jugador_a=?4 AND jugador_b=?3))`)
          .bind(fase.id, p ? p.id : 0, a, c).first();
        if (yaPar) return err("Esa pareja ya se enfrenta en la ronda " + yaPar.ronda + ".");
        if (p) {
          await env.DB.prepare("UPDATE liga_partidas SET jugador_a=?2, jugador_b=?3, nr_partida=NULL WHERE id=?1").bind(p.id, a, c).run();
        } else {
          const m = (await env.DB.prepare("SELECT COALESCE(MAX(mesa), 0) + 1 AS m FROM liga_partidas WHERE fase_id=?1 AND ronda=?2").bind(fase.id, ronda).first()).m;
          await env.DB.prepare("INSERT INTO liga_partidas (fase_id, ronda, mesa, jugador_a, jugador_b) VALUES (?1,?2,?3,?4,?5)").bind(fase.id, ronda, m, a, c).run();
        }
        return Response.json({ ok: true }, { headers: noStore });
      }

      // FAQ: estado de la copia y actualización manual desde Discord.
      if (path === "/api/admin/faq") {
        if (request.method === "POST") {
          if (!sameOrigin(request, url)) return new Response("Prohibido", { status: 403 });
          const r = await faqSync(env);
          return Response.json(r, { status: r.ok ? 200 : 400, headers: noStore });
        }
        const row = await env.DB.prepare("SELECT actualizado, error, length(datos) AS n FROM nr_cache WHERE clave=?1").bind(FAQ_CLAVE).first();
        const en = await env.DB.prepare("SELECT actualizado, error, datos FROM nr_cache WHERE clave=?1").bind(FAQ_EN).first();
        let traducidos = 0;
        try { traducidos = Object.keys(JSON.parse((en && en.datos) || "{}")).length; } catch (e) {}
        return Response.json({ ...(row || {}), ingles: { traducidos, actualizado: en ? en.actualizado : null, error: en ? en.error : null, ai: !!env.AI } }, { headers: noStore });
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
          // Las quedadas son siempre físicas; los torneos, físicos u online (TTS).
          modo: b.type === "torneo" && b.modo === "online" ? "online" : "fisico",
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
            "INSERT INTO events (type,title,starts_at,location,description,capacity,nr_tournament_id,status,modo) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)"
          ).bind(ev.type, ev.title, ev.starts_at, ev.location, ev.description, ev.capacity, ev.nr, ev.status, ev.modo).run();
          if (ev.status === "publicado") ctx.waitUntil(avisoEvento(env, r.meta.last_row_id, ev, s.id).catch(() => {}));
          return Response.json({ ok: true, id: r.meta.last_row_id });
        }
        const antes = await env.DB.prepare("SELECT status FROM events WHERE id=?1").bind(Number(idm[1])).first();
        if (antes && antes.status !== "publicado" && ev.status === "publicado") ctx.waitUntil(avisoEvento(env, Number(idm[1]), ev, s.id).catch(() => {}));
        await env.DB.batch([
          env.DB.prepare(
            "UPDATE events SET type=?1,title=?2,starts_at=?3,location=?4,description=?5,capacity=?6,nr_tournament_id=?7,status=?8,modo=?10 WHERE id=?9"
          ).bind(ev.type, ev.title, ev.starts_at, ev.location, ev.description, ev.capacity, ev.nr, ev.status, Number(idm[1]), ev.modo),
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
        `SELECT e.id,e.type,e.title,e.starts_at,e.location,e.description,e.capacity,e.modo,
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

    return conVistaPrevia(request, env, url, await env.ASSETS.fetch(request));
  },
};

// Solo para las pruebas automáticas (no es una ruta de la web).
export const _test = { ligaRecordatorios, calendarioEventos, ics, pushEnvia, ogPara, procesaCola };
