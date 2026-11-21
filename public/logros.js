// Logros del club: catálogo (español e inglés) e insignias de dibujo propio (sin motivos de Games Workshop).
// Cada insignia: un marco con la forma de su categoría y el color de su nivel (bronce, plata u oro; los de un solo
// nivel, en bronce; los secretos, en lacre), un disco oscuro y el emblema en hueso con relieve.
// Uso: window.abLogros.icono(id, nivel, tamaño) → <svg>; nivel 0 = no conseguido (apagado).
// Los ids y los umbrales coinciden con LOGROS en src/index.js (allí se calculan). Todo con DOM, sin innerHTML.
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const lang = () => {
    try { if (window.abI18n && window.abI18n.lang) return window.abI18n.lang; return localStorage.getItem("ab_lang") === "en" ? "en" : "es"; }
    catch (e) { return "es"; }
  };
  const T = (o) => (o ? o[lang()] || o.es : "");

  const CATS = [
    ["perfil", { es: "Bienvenida y perfil", en: "Welcome and profile" }],
    ["partidas", { es: "Partidas", en: "Games" }],
    ["liga", { es: "Gran Liga y ELO", en: "Grand League and ELO" }],
    ["torneos", { es: "Torneos", en: "Tournaments" }],
    ["comunidad", { es: "Comunidad", en: "Community" }],
    ["galeria", { es: "Galería y pintura", en: "Gallery and painting" }],
    ["secretos", { es: "Secretos", en: "Secrets" }],
  ];
  const NIVELES = { es: ["Bronce", "Plata", "Oro"], en: ["Bronze", "Silver", "Gold"] };
  const U = {
    anios: { es: "años", en: "years" }, partidas: { es: "partidas", en: "games" }, rivales: { es: "rivales", en: "opponents" },
    modalidades: { es: "modalidades", en: "game types" }, victorias: { es: "victorias seguidas", en: "wins in a row" },
    torneos: { es: "torneos", en: "tournaments" }, quedadas: { es: "quedadas", en: "meetups" }, encuestas: { es: "encuestas", en: "polls" },
    respuestas: { es: "respuestas", en: "replies" }, publicaciones: { es: "publicaciones", en: "posts" },
    bendiciones: { es: "bendiciones", en: "blessings" }, votos: { es: "votos", en: "votes" },
  };
  // [id, categoría, umbrales, unidad, nombre, descripción]
  const L = [
    ["juramento", "perfil", [1], null, { es: "Juramento prestado", en: "Oath Sworn" },
      { es: "Entra en la web y completa tus datos de socio.", en: "Log in to the website and complete your member details." }],
    ["expediente", "perfil", [1], null, { es: "Expediente completo", en: "Complete Dossier" },
      { es: "Rellena tu ficha: facciones, Instagram o Steam y usuario de New Recruit.", en: "Fill in your profile: factions, Instagram or Steam, and your New Recruit username." }],
    ["servocraneo", "perfil", [1], null, { es: "Servocráneo vinculado", en: "Servo-skull Bound" },
      { es: "Activa las notificaciones de la web en el móvil.", en: "Turn on the website's notifications on your phone." }],
    ["fundador", "perfil", [1], null, { es: "Fundador digital", en: "Digital Founder" },
      { es: "Sé uno de los 30 primeros socios en completar sus datos en la web.", en: "Be one of the first 30 members to complete their details on the website." }],
    ["servicio", "perfil", [1, 3, 5], "anios", { es: "Años de servicio", en: "Years of Service" },
      { es: "Cumple años en el club: 1, 3 y 5.", en: "Reach club anniversaries: 1, 3 and 5 years." }],
    ["llamamiento", "partidas", [1], null, { es: "Primer llamamiento", en: "First Call to Arms" },
      { es: "Publica tu primera partida en el calendario.", en: "Post your first game on the calendar." }],
    ["armas", "partidas", [5, 25, 100], "partidas", { es: "A las armas", en: "To Arms" },
      { es: "Juega partidas: las del calendario verificadas por un admin, las de la liga y las de torneos.", en: "Play games: calendar games verified by an admin, league games and tournament games." }],
    ["mercenario", "partidas", [10], "partidas", { es: "Mercenario", en: "Mercenary" },
      { es: "Únete a 10 partidas publicadas por otros socios (verificadas).", en: "Join 10 games posted by other members (verified)." }],
    ["enemigos", "partidas", [10], "rivales", { es: "Muchos enemigos", en: "Many Foes" },
      { es: "Juega contra 10 rivales distintos.", en: "Play against 10 different opponents." }],
    ["polivalente", "partidas", [3], "modalidades", { es: "Señor de la guerra polivalente", en: "Versatile Warlord" },
      { es: "Juega 3 modalidades distintas: Combat Patrol, 1K, 2K, Necromunda o Blood Bowl.", en: "Play 3 different game types: Combat Patrol, 1K, 2K, Necromunda or Blood Bowl." }],
    ["red", "partidas", [1], null, { es: "Guerra en la red", en: "War on the Wire" },
      { es: "Juega una partida online (Tabletop Simulator) verificada.", en: "Play a verified online game (Tabletop Simulator)." }],
    ["hermanos", "partidas", [1], null, { es: "Hermanos de armas", en: "Brothers in Arms" },
      { es: "Juega una partida 2 contra 2, en el calendario o en un torneo por parejas.", en: "Play a 2 vs 2 game, on the calendar or in a pairs tournament." }],
    ["bajo_tierra", "partidas", [1], null, { es: "Bajo tierra", en: "Down Below" },
      { es: "Juega una partida de Necromunda verificada.", en: "Play a verified game of Necromunda." }],
    ["placaje", "partidas", [1], null, { es: "Placaje brutal", en: "Brutal Tackle" },
      { es: "Juega una partida de Blood Bowl verificada.", en: "Play a verified game of Blood Bowl." }],
    ["llamado", "liga", [1], null, { es: "Llamado a la liga", en: "Called to the League" },
      { es: "Juega una temporada de la Gran Liga.", en: "Play a Grand League season." }],
    ["sin_rendicion", "liga", [1], null, { es: "Sin rendición", en: "No Surrender" },
      { es: "Termina una temporada de la Gran Liga sin abandonar.", en: "Finish a Grand League season without dropping out." }],
    ["primera_sangre", "liga", [1], null, { es: "Primera sangre", en: "First Blood" },
      { es: "Gana tu primera partida de liga o de torneo.", en: "Win your first league or tournament game." }],
    ["imparable", "liga", [3], "victorias", { es: "Imparable", en: "Unstoppable" },
      { es: "Gana 3 partidas seguidas de liga o de torneo.", en: "Win 3 league or tournament games in a row." }],
    ["podio", "liga", [1, 2, 3], null, { es: "Podio", en: "Podium" },
      { es: "Termina una temporada de la Gran Liga en el podio: bronce (3.º), plata (2.º) u oro (campeón).", en: "Finish a Grand League season on the podium: bronze (3rd), silver (2nd) or gold (champion)." }],
    ["clasificado", "liga", [1], null, { es: "Clasificado", en: "Ranked" },
      { es: "Juega las partidas necesarias para dejar de estar «Clasificando» en el ELO.", en: "Play enough games to stop being «Qualifying» in the ELO." }],
    ["ascenso", "liga", [1], null, { es: "Ascenso", en: "Promotion" },
      { es: "Alcanza el rango Iniciado en el ELO del club.", en: "Reach the Initiate rank in the club ELO." }],
    ["instructor", "liga", [1], null, { es: "Instructor", en: "Instructor" },
      { es: "Alcanza el rango Instructor en el ELO del club.", en: "Reach the Instructor rank in the club ELO." }],
    ["matagigantes", "liga", [1], null, { es: "Matagigantes", en: "Giant Slayer" },
      { es: "Gana a un rival con 100 puntos de ELO o más por encima de ti.", en: "Beat an opponent rated 100 ELO points or more above you." }],
    ["caballeroso", "liga", [1], null, { es: "Caballeroso", en: "Gentleman's Game" },
      { es: "Juega una partida «handshake».", en: "Play a «handshake» game." }],
    ["campo_batalla", "torneos", [1], null, { es: "Al campo de batalla", en: "To the Battlefield" },
      { es: "Inscríbete en tu primer torneo desde la web.", en: "Sign up for your first tournament on the website." }],
    ["capitan", "torneos", [1], null, { es: "Capitán", en: "Captain" },
      { es: "Capitanea una pareja o un equipo en un torneo.", en: "Captain a pair or a team in a tournament." }],
    ["parejas", "torneos", [1], null, { es: "Por parejas", en: "Paired Up" },
      { es: "Juega un torneo por parejas (2 contra 2).", en: "Play a pairs tournament (2 vs 2)." }],
    ["habitual", "torneos", [3, 10, 25], "torneos", { es: "Habitual de torneos", en: "Tournament Regular" },
      { es: "Juega torneos del club.", en: "Play club tournaments." }],
    ["presente", "comunidad", [3, 10, 30], "quedadas", { es: "Presente", en: "Present" },
      { es: "Asiste a quedadas del club (la asistencia la confirma un admin).", en: "Attend club meetups (attendance is confirmed by an admin)." }],
    ["voz", "comunidad", [5], "encuestas", { es: "Voz del club", en: "Voice of the Club" },
      { es: "Vota en 5 encuestas.", en: "Vote in 5 polls." }],
    ["ciudadano", "comunidad", [1], null, { es: "Ciudadano ejemplar", en: "Model Citizen" },
      { es: "Vota en todas las encuestas cerradas de un año (al menos 3).", en: "Vote in every poll closed in a year (at least 3)." }],
    ["consejero", "comunidad", [1], null, { es: "Consejero", en: "Counsellor" },
      { es: "Publica una sugerencia.", en: "Post a suggestion." }],
    ["idea", "comunidad", [1], null, { es: "Tu idea, hecha", en: "Your Idea, Done" },
      { es: "Consigue que una sugerencia tuya quede aceptada o hecha.", en: "Get one of your suggestions accepted or done." }],
    ["debate", "comunidad", [10], "respuestas", { es: "Debate", en: "Debater" },
      { es: "Escribe 10 respuestas en las sugerencias.", en: "Write 10 replies on suggestions." }],
    ["pincel", "galeria", [1], null, { es: "Primer pincel", en: "First Brushstroke" },
      { es: "Sube tu primera publicación a la galería.", en: "Upload your first post to the gallery." }],
    ["artesano", "galeria", [5, 20, 50], "publicaciones", { es: "Artesano", en: "Artisan" },
      { es: "Sube publicaciones a la galería.", en: "Upload posts to the gallery." }],
    ["bendecido", "galeria", [10], "bendiciones", { es: "Bendecido por el Emperador", en: "Blessed by the Emperor" },
      { es: "Consigue 10 bendiciones del Emperador en una publicación.", en: "Get 10 blessings from the Emperor on one post." }],
    ["caos", "galeria", [10], "votos", { es: "Tocado por el Caos", en: "Touched by Chaos" },
      { es: "Consigue 10 votos de los Poderes Ruinosos en una publicación.", en: "Get 10 votes from the Ruinous Powers on one post." }],
    ["disputa", "galeria", [5], "votos", { es: "Disputa eterna", en: "Eternal Struggle" },
      { es: "Consigue 5 o más votos de cada bando en una publicación.", en: "Get 5 or more votes from each side on one post." }],
    ["juez", "galeria", [25], "votos", { es: "Juez de la galería", en: "Gallery Judge" },
      { es: "Da 25 bendiciones o votos del Caos.", en: "Give 25 blessings or Chaos votes." }],
    ["insomne", "secretos", [1], null, { es: "Insomne", en: "Sleepless" },
      { es: "Juega una partida verificada que empiece a las 22:00 o más tarde.", en: "Play a verified game starting at 22:00 or later." }],
    ["navidad", "secretos", [1], null, { es: "Navidad en el frente", en: "Christmas at the Front" },
      { es: "Juega una partida verificada entre el 8 de diciembre y el 7 de enero.", en: "Play a verified game between 8 December and 7 January." }],
    ["empate", "secretos", [1], null, { es: "Empate perfecto", en: "Perfect Stalemate" },
      { es: "Empata una partida de liga o de torneo.", en: "Draw a league or tournament game." }],
    ["resucitado", "secretos", [1], null, { es: "Resucitado", en: "Back from the Dead" },
      { es: "Vuelve a la web después de más de 6 meses sin entrar.", en: "Come back to the website after more than 6 months away." }],
  ];
  const LOGROS = L.map(([id, cat, niv, u, n, d]) => ({ id, cat, niv, u: U[u] || null, n, d, secreto: cat === "secretos" }));
  const POR_ID = Object.fromEntries(LOGROS.map((x) => [x.id, x]));

  // ---------- Dibujo ----------
  // Emblemas en una caja de 64×64 (centro 32,32). Piezas: ["p", d] trazado; ["c", cx, cy, r]; ["e", cx, cy, rx, ry];
  // ["r", x, y, w, h, rx]; ["l", d, grosor] línea; ["g", transform, [piezas]]. Último valor opcional: "d" (hueco
  // oscuro), "r" (lacre rojo) o nada (hueso).
  const espada = () => [["p", "M30 12 L32 8 L34 12 V38 H30Z"], ["r", 24.5, 37.5, 15, 3.4, 1.4], ["r", 30.5, 40.9, 3, 7.2, 0.8], ["c", 32, 50.6, 2.6]];
  const escudo = (cx, top, w, h) => `M${cx - w / 2} ${top} H${cx + w / 2} V${top + h * 0.42} C${cx + w / 2} ${top + h * 0.78} ${cx} ${top + h} ${cx} ${top + h} C${cx} ${top + h} ${cx - w / 2} ${top + h * 0.78} ${cx - w / 2} ${top + h * 0.42}Z`;
  const estrella = (cx, cy, R, r, n = 5, giro = -90) => {
    let d = "";
    for (let i = 0; i < n * 2; i++) {
      const a = ((giro + (i * 180) / n) * Math.PI) / 180, k = i % 2 ? r : R;
      d += (i ? "L" : "M") + (cx + k * Math.cos(a)).toFixed(2) + " " + (cy + k * Math.sin(a)).toFixed(2);
    }
    return d + "Z";
  };
  const galon = (y, w = 30) => `M${32 - w / 2} ${y + 7} L32 ${y} L${32 + w / 2} ${y + 7} V${y + 12.5} L32 ${y + 5.5} L${32 - w / 2} ${y + 12.5}Z`;
  const calavera = (cx, cy, s = 1) => [
    ["p", `M${cx} ${cy - 13 * s} C${cx - 11 * s} ${cy - 13 * s} ${cx - 13 * s} ${cy - 5 * s} ${cx - 12 * s} ${cy + 1 * s} C${cx - 11.5 * s} ${cy + 4 * s} ${cx - 9 * s} ${cy + 5 * s} ${cx - 8 * s} ${cy + 6 * s} V${cy + 11 * s} H${cx + 8 * s} V${cy + 6 * s} C${cx + 9 * s} ${cy + 5 * s} ${cx + 11.5 * s} ${cy + 4 * s} ${cx + 12 * s} ${cy + 1 * s} C${cx + 13 * s} ${cy - 5 * s} ${cx + 11 * s} ${cy - 13 * s} ${cx} ${cy - 13 * s}Z`],
    ["e", cx - 5 * s, cy - 1.5 * s, 3.6 * s, 4 * s, "d"], ["e", cx + 5 * s, cy - 1.5 * s, 3.6 * s, 4 * s, "d"],
    ["p", `M${cx} ${cy + 2.5 * s} L${cx - 2 * s} ${cy + 5.5 * s} H${cx + 2 * s}Z`, "d"],
    ["l", `M${cx - 4 * s} ${cy + 7.5 * s} V${cy + 11 * s} M${cx} ${cy + 7.5 * s} V${cy + 11 * s} M${cx + 4 * s} ${cy + 7.5 * s} V${cy + 11 * s}`, 1.3 * s, "d"],
  ];
  const bocadillo = (x, y, w, h, cola) => `M${x + 4} ${y} H${x + w - 4} Q${x + w} ${y} ${x + w} ${y + 4} V${y + h - 4} Q${x + w} ${y + h} ${x + w - 4} ${y + h} H${cola ? x + w - 8 : x + 12} L${cola ? x + w - 4 : x + 6} ${y + h + 7} L${cola ? x + w - 14 : x + 8} ${y + h} H${x + 4} Q${x} ${y + h} ${x} ${y + h - 4} V${y + 4} Q${x} ${y} ${x + 4} ${y}Z`;

  const G = {
    juramento: [["p", "M13 20 C19 16.5 26 17.5 31 21 V47 C26 43.8 19 43 13 46Z"], ["p", "M51 20 C45 16.5 38 17.5 33 21 V47 C38 43.8 45 43 51 46Z"],
      ["l", "M17 26 C20.5 24.6 24.5 24.8 27.5 26.6 M17 31 C20.5 29.6 24.5 29.8 27.5 31.6 M17 36 C20.5 34.6 24.5 34.8 27.5 36.6", 1.4, "d"],
      ["l", "M36.5 26.6 C39.5 24.8 43.5 24.6 47 26 M36.5 31.6 C39.5 29.8 43.5 29.6 47 31 M36.5 36.6 C39.5 34.8 43.5 34.6 47 36", 1.4, "d"],
      ["c", 32, 46.5, 4.6, "r"]],
    expediente: [["p", "M19 13 H37 L45 21 V51 H19Z"], ["p", "M37 13 V21 H45Z", "d"], ["r", 23.5, 27, 17, 2.6, 1, "d"], ["r", 23.5, 32.5, 17, 2.6, 1, "d"], ["r", 23.5, 38, 17, 2.6, 1, "d"], ["r", 23.5, 43.5, 10, 2.6, 1, "d"]],
    servocraneo: [["p", "M32 15 C25 15 22 21 22 28 V35.5 L17 41.5 H47 L42 35.5 V28 C42 21 39 15 32 15Z"], ["c", 32, 13.4, 2.4], ["c", 32, 46, 3.8],
      ["l", "M13 23 C10 28 10 34 13 39 M51 23 C54 28 54 34 51 39", 2.4]],
    fundador: [["r", 18, 14, 28, 5.5, 1.5], ["r", 21, 19.5, 22, 3, 0.6], ["r", 23, 22.5, 18, 21], ["r", 26.5, 24, 2.2, 18, 1, "d"], ["r", 30.9, 24, 2.2, 18, 1, "d"], ["r", 35.3, 24, 2.2, 18, 1, "d"], ["r", 21, 43.5, 22, 3, 0.6], ["r", 18, 46.5, 28, 5.5, 1.5]],
    servicio: [["r", 18, 12.5, 28, 4.5, 1.8], ["r", 18, 47, 28, 4.5, 1.8], ["p", "M22 17 H42 C42 25 35 29 33.5 32 C35 35 42 39 42 47 H22 C22 39 29 35 30.5 32 C29 29 22 25 22 17Z"],
      ["p", "M25.5 19.5 H38.5 C38 24 34.5 27.4 32 30 C29.5 27.4 26 24 25.5 19.5Z", "d"], ["p", "M32 34 L32.8 38 C35 39.5 38.2 41.5 39.2 44.5 H24.8 C25.8 41.5 29 39.5 31.2 38Z", "d"], ["p", "M26.5 44.5 C28 41.5 30.5 40.4 32 40.4 C33.5 40.4 36 41.5 37.5 44.5Z"]],
    llamamiento: [["p", "M13 41 C24 42 36 36 44 19 L51 22.5 C45 40 30 49 15 48Z"], ["g", "rotate(26 47.5 20.8)", [["e", 47.5, 20.8, 3.4, 6]]], ["g", "rotate(26 47.5 20.8)", [["e", 47.5, 20.8, 1.8, 3.8, "d"]]],
      ["l", "M23.5 41.5 L25.5 47.5 M33.5 37.6 L37 42.6", 2.2, "d"], ["r", 10, 40.5, 4.5, 8, 1.5]],
    armas: [["g", "rotate(-40 32 32)", espada()], ["g", "rotate(40 32 32)", espada()]],
    mercenario: [["p", "M25 24 C17 30 16 45 23 48.5 H41 C48 45 47 30 39 24Z"], ["p", "M26.5 21 L22.5 14.5 H41.5 L37.5 21Z"], ["r", 24.5, 20, 15, 4.6, 2.2], ["c", 32, 37, 6.4, "d"], ["c", 32, 37, 4.2], ["r", 31, 34.2, 2, 5.6, 0.8, "d"]],
    enemigos: [["c", 32, 32, 14], ["c", 32, 32, 10.8, "d"], ["c", 32, 32, 7], ["c", 32, 32, 3.8, "d"], ["r", 30.4, 11, 3.2, 10, 1], ["r", 30.4, 43, 3.2, 10, 1], ["r", 11, 30.4, 10, 3.2, 1], ["r", 43, 30.4, 10, 3.2, 1]],
    polivalente: [["g", "rotate(-14 26 36)", [["r", 15, 25, 22, 22, 4.5], ["c", 20.5, 30.5, 2.2, "d"], ["c", 26, 36, 2.2, "d"], ["c", 31.5, 41.5, 2.2, "d"]]],
      ["g", "rotate(16 40 26)", [["r", 30, 16, 20, 20, 4.5], ["c", 35, 21, 2, "d"], ["c", 45, 21, 2, "d"], ["c", 35, 31, 2, "d"], ["c", 45, 31, 2, "d"]]]],
    red: [["r", 13, 15, 38, 25, 2.5], ["r", 16.5, 18.5, 31, 18, 1, "d"], ["r", 28.5, 40, 7, 5], ["r", 21, 45, 22, 4, 1.5], ["p", "M22 33 L27 27 L31 31 L36 24 L42 33Z"]],
    hermanos: [["p", escudo(25, 15, 20, 31)], ["p", escudo(39, 18, 20, 31)], ["r", 37.6, 23, 2.8, 18, 1, "d"], ["r", 32, 28, 14, 2.8, 1, "d"]],
    bajo_tierra: [["p", "M32 13 C22 13 18 20 18 29 C18 36 22 41 26 43 H38 C42 41 46 36 46 29 C46 20 42 13 32 13Z"], ["e", 25.8, 27.5, 4.8, 4.4, "d"], ["e", 38.2, 27.5, 4.8, 4.4, "d"],
      ["e", 25.8, 27.5, 2.4, 2.2], ["e", 38.2, 27.5, 2.4, 2.2], ["r", 26.5, 38, 11, 13, 3], ["l", "M27 42 H37 M27 45.5 H37 M27 49 H37", 1.4, "d"], ["c", 16, 41, 3.4], ["c", 48, 41, 3.4]],
    placaje: [["g", "rotate(-35 32 32)", [["e", 32, 32, 17, 11], ["l", "M22 32 H42", 1.8, "d"], ["l", "M26 29 V35 M30 29 V35 M34 29 V35 M38 29 V35", 1.5, "d"],
      ["p", "M24 22.4 L26 16 L28.6 21.5Z"], ["p", "M30.6 21.1 L32 14.5 L34 21Z"], ["p", "M36.2 21.6 L39 15.8 L40.2 22.6Z"], ["p", "M24 41.6 L26 48 L28.6 42.5Z"], ["p", "M30.6 42.9 L32 49.5 L34 43Z"], ["p", "M36.2 42.4 L39 48.2 L40.2 41.4Z"]]]],
    llamado: [["p", "M21 14 H43 V22 C43 31 38 36 32 36 C26 36 21 31 21 22Z"], ["l", "M21 18 C13 18 14 29 22 29 M43 18 C51 18 50 29 42 29", 2.6], ["r", 29.5, 36, 5, 6.5], ["r", 23.5, 42.5, 17, 4, 1.5], ["r", 20, 46.5, 24, 4, 1.5], ["p", estrella(32, 24, 5.2, 2.2), "d"]],
    sin_rendicion: [["p", escudo(32, 12, 30, 41)], ["r", 30, 17, 4, 28, 1, "d"], ["r", 21, 25, 22, 4, 1, "d"]],
    primera_sangre: [["p", "M32 11 C32 11 19 28 19 37 A13 13 0 0 0 45 37 C45 28 32 11 32 11Z", "r"], ["p", "M25.5 36 C25.5 32 28 28 30 25.5 C29 30 28.5 33 29 37 Z", "d"]],
    imparable: [["p", "M36 10 L19 35 H30 L26 54 L45 27 H34Z"]],
    podio: [["r", 13, 37, 12, 13, 1], ["r", 26, 30, 12, 20, 1], ["r", 39, 41, 12, 9, 1], ["p", estrella(32, 19, 8, 3.4)], ["l", "M31 35 V45 M30 36 L31.2 35", 1.6, "d"]],
    clasificado: [["p", galon(26, 38)], ["c", 32, 17, 4]],
    ascenso: [["p", galon(18, 32)], ["p", galon(30, 32)]],
    instructor: [["p", galon(24, 28)], ["p", galon(33, 28)], ["p", galon(42, 28)], ["p", estrella(32, 15, 7, 3)]],
    matagigantes: [["g", "rotate(45 32 32)", espada()], ...calavera(32, 31, 1.05)],
    caballeroso: [["g", "rotate(-20 22 40)", [["p", "M14 16 H30 V22 C30 29 26.5 32.5 22 32.5 C17.5 32.5 14 29 14 22Z"], ["r", 20.6, 32.5, 2.8, 9], ["r", 16, 41.5, 12, 3.6, 1.5], ["r", 16, 19, 12, 2.2, 0.8, "d"]]], ["g", "rotate(20 42 40)", [["p", "M34 16 H50 V22 C50 29 46.5 32.5 42 32.5 C37.5 32.5 34 29 34 22Z"], ["r", 40.6, 32.5, 2.8, 9], ["r", 36, 41.5, 12, 3.6, 1.5], ["r", 36, 19, 12, 2.2, 0.8, "d"]]],
      ["p", estrella(32, 13, 5, 1.8, 4, -90)], ["l", "M24 9 L26 11.5 M40 9 L38 11.5", 1.8]],
    campo_batalla: [["p", "M10 50 C18 39 46 39 54 50Z"], ["r", 30.6, 13, 2.8, 30, 1], ["p", "M33.4 14.5 L48 19.5 L33.4 25.5Z"], ["c", 32, 12, 2.2]],
    capitan: [["p", "M19 46 V31 C19 21 25 16 32 16 C39 16 45 21 45 31 V46 H38 V35.5 H26 V46Z"], ["p", "M30.5 16.5 C30 9 39 6.5 47 10.5 C40.5 11 36.5 13 34.5 16.8Z"], ["r", 24, 28, 16, 3.2, 1, "d"], ["r", 30.6, 31.2, 2.8, 8, 1, "d"]],
    parejas: [["c", 25, 32, 9.5], ["c", 25, 32, 6, "d"], ["c", 39, 32, 9.5], ["c", 39, 32, 6, "d"], ["p", "M30.6 24.4 A9.5 9.5 0 0 1 34.5 28 L31.6 29.6 A6 6 0 0 0 29.3 27.2Z"]],
    habitual: [["p", "M23 10 L32 25 L41 10 H35 L32 15.5 L29 10Z"], ["c", 32, 37, 12.5], ["c", 32, 37, 9, "d"], ["p", estrella(32, 37.5, 7.2, 3)]],
    presente: [["r", 19, 11, 3.4, 41, 1.2], ["c", 20.7, 10, 2.6], ["p", "M22.4 14 H47 L41.5 22.5 L47 31 H22.4Z"], ...calavera(32.5, 22, 0.42).map((x) => { const y = [...x]; if (y[0] === "p" && y.length === 2) y.push("d"); else if (y[y.length - 1] === "d") y[y.length - 1] = undefined; return y; })],
    voz: [["g", "rotate(-8 32 22)", [["r", 25, 10, 15, 19, 1.2], ["l", "M28 16 L31 19.5 L37 13", 2, "d"]]], ["r", 15, 28, 34, 22, 2.5], ["r", 22, 31.5, 20, 3, 1.2, "d"], ["r", 20, 40, 24, 2.4, 1, "d"]],
    ciudadano: [["r", 19, 16, 26, 32, 2], ["r", 16, 12.5, 32, 6, 3], ["r", 16, 45.5, 32, 6, 3], ["l", "M24.5 32 L30 37.5 L40 26", 3.2, "d"]],
    consejero: [["p", bocadillo(13, 15, 38, 25, false)], ["c", 23, 27.5, 2.6, "d"], ["c", 32, 27.5, 2.6, "d"], ["c", 41, 27.5, 2.6, "d"]],
    idea: [["c", 32, 26, 12.5], ["r", 26.5, 35, 11, 7], ["r", 27, 42.5, 10, 3, 1.2], ["r", 28.5, 46, 7, 3.5, 1.5], ["l", "M28 34 V29 L30.5 26.5 L32 29 L33.5 26.5 L36 29 V34", 1.6, "d"]],
    debate: [["p", bocadillo(10, 13, 30, 19, false)], ["p", bocadillo(24, 27, 30, 17, true)], ["r", 16, 20.5, 18, 2.6, 1, "d"], ["r", 30, 33.5, 18, 2.6, 1, "d"], ["r", 30, 38, 11, 2.6, 1, "d"]],
    pincel: [["g", "rotate(40 32 32)", [["r", 29.6, 8, 4.8, 24, 2], ["r", 28.6, 31, 6.8, 6, 0.8], ["l", "M28.6 33 H35.4", 1.2, "d"], ["p", "M28.8 37 H35.2 C35.2 44 33 50 32 54 C31 50 28.8 44 28.8 37Z"]]]],
    artesano: [["p", "M31 12 C18 12 11 22 12 33 C13 44 22 51 31 50 C35 49.6 35.6 45.5 33.6 43.5 C31.4 41 33 37.5 36.5 37.5 H42 C48 37.5 52 33 51 26 C49.5 17 41 12 31 12Z"],
      ["c", 22, 26, 3.4, "d"], ["c", 30.5, 20, 3.4, "d"], ["c", 40, 21.5, 3.4, "d"], ["c", 21, 36, 3.4, "d"], ["c", 43.5, 30.5, 2.4, "d"]],
    bendecido: [["p", estrella(32, 32, 21, 12, 12, -90)], ["c", 32, 32, 10.5, "d"], ["c", 32, 32, 7.5], ["r", 30.7, 26.5, 2.6, 11, 0.8, "d"], ["r", 27.5, 29.5, 9, 2.6, 0.8, "d"]],
    caos: (() => { const f = []; for (let i = 0; i < 8; i++) f.push(["g", `rotate(${i * 45} 32 32)`, [["r", 30.6, 15, 2.8, 14, 0.6], ["p", "M27.4 17.5 L32 9.5 L36.6 17.5Z"]]]); f.push(["c", 32, 32, 6.2], ["c", 32, 32, 3, "d"]); return f; })(),
    disputa: [["c", 32, 32, 15], ["p", "M32 17 A15 15 0 0 1 32 47Z", "d"], ["p", estrella(25, 32, 6.5, 2.8, 6, -90), "d"], ["p", estrella(39, 32, 6.5, 2.6, 8, -90)]],
    juez: [["r", 30.7, 13, 2.6, 33, 1], ["c", 32, 13, 2.8], ["r", 13, 19, 38, 3, 1.2], ["l", "M18 21 L12.5 33 M18 21 L23.5 33 M46 21 L40.5 33 M46 21 L51.5 33", 1.3],
      ["p", "M11 33 H25 C24.5 38 11.5 38 11 33Z"], ["p", "M39 33 H53 C52.5 38 39.5 38 39 33Z"], ["r", 24, 46, 16, 4, 1.5]],
    insomne: [["p", "M37 12 A17 17 0 1 0 50 40 A13.5 13.5 0 1 1 37 12Z"], ["p", estrella(44, 18, 4.5, 1.9)], ["p", estrella(50.5, 29, 3, 1.3)]],
    navidad: (() => { const f = []; for (let i = 0; i < 6; i++) f.push(["g", `rotate(${i * 60} 32 32)`, [["l", "M32 32 V12 M32 18 L27.5 14 M32 18 L36.5 14 M32 25 L28 21.5 M32 25 L36 21.5", 2.6]]]); f.push(["c", 32, 32, 3.4]); return f; })(),
    empate: [["r", 15, 22, 34, 6.5, 2.5], ["r", 15, 35.5, 34, 6.5, 2.5], ["c", 32, 13, 2.6], ["c", 32, 51, 2.6]],
    resucitado: [["r", 25, 31, 14, 20, 1.5], ["p", "M25 31 C27 33.5 29 33 30 31.5 C31 34 33.5 34 34.5 31.5 C35.5 33 37.5 33 39 31 Z"], ["r", 31.2, 26.5, 1.6, 5, 0.6, "d"],
      ["p", "M32 9 C36.5 15 39.5 18.5 39.5 22.5 A7.5 7.5 0 0 1 24.5 22.5 C24.5 18.5 27.5 15 32 9Z"], ["p", "M32 16.5 C34 19.5 35.2 21 35.2 23 A3.2 3.2 0 0 1 28.8 23 C28.8 21 30 19.5 32 16.5Z", "d"], ["r", 20, 50, 24, 3.5, 1.5]],
    oculto: [["l", "M25 24.5 C25 17.5 39 16.5 39 24.5 C39 30 32 30 32 37", 5.2], ["c", 32, 45, 3.4]],
  };

  // Marco de cada categoría (en 64×64, radio ~30).
  const radial = (n, rf) => { let d = ""; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 - Math.PI / 2, r = rf(i, a); d += (i ? "L" : "M") + (32 + r * Math.cos(a)).toFixed(2) + " " + (32 + r * Math.sin(a)).toFixed(2); } return d + "Z"; };
  const rueda = (() => { let d = ""; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, s = Math.PI / 12; const p = (r, t) => (32 + r * Math.cos(t)).toFixed(2) + " " + (32 + r * Math.sin(t)).toFixed(2); d += (i ? "L" : "M") + p(27.5, a - s * 0.75) + "L" + p(31, a - s * 0.45) + "L" + p(31, a + s * 0.45) + "L" + p(27.5, a + s * 0.75); } return d + "Z"; })();
  const FORMA = {
    perfil: rueda,
    partidas: "M7 6 H57 V29 C57 45 45 54 32 61 C19 54 7 45 7 29Z",
    liga: radial(6, () => 31),
    torneos: (() => { let d = ""; for (let i = 0; i < 8; i++) { const a = ((i + 0.5) / 8) * Math.PI * 2; d += (i ? "L" : "M") + (32 + 31 * Math.cos(a)).toFixed(2) + " " + (32 + 31 * Math.sin(a)).toFixed(2); } return d + "Z"; })(),
    comunidad: radial(96, (i, a) => 28.4 + 2.6 * Math.cos(16 * (a + Math.PI / 2))),
    galeria: "M16 3 H48 Q61 3 61 16 V48 Q61 61 48 61 H16 Q3 61 3 48 V16 Q3 3 16 3Z",
    secretos: radial(16, (i) => (i % 2 ? 23.5 : 31.5)),
  };
  const ESCALA_EMBLEMA = { perfil: 0.86, partidas: 0.8, liga: 0.84, torneos: 0.88, comunidad: 0.86, galeria: 0.92, secretos: 0.72 };
  const DY = { partidas: -2 };

  let defsListos = false;
  const nuevo = (tag, attrs) => { const x = document.createElementNS(NS, tag); for (const k in attrs) if (attrs[k] != null) x.setAttribute(k, attrs[k]); return x; };
  function defs() {
    if (defsListos) return;
    defsListos = true;
    const s = nuevo("svg", { "aria-hidden": "true", focusable: "false" });
    s.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
    const d = nuevo("defs", {});
    const grad = (id, tipo, attrs, paradas) => {
      const g = nuevo(tipo, Object.assign({ id }, attrs));
      paradas.forEach(([o, c]) => g.appendChild(nuevo("stop", { offset: o, "stop-color": c })));
      d.appendChild(g);
    };
    const diag = { x1: "0", y1: "0", x2: "1", y2: "1" };
    grad("abl-1", "linearGradient", diag, [["0", "#E7BE79"], ["0.45", "#A87638"], ["1", "#4E3313"]]); // bronce
    grad("abl-2", "linearGradient", diag, [["0", "#FFFFFF"], ["0.45", "#BEBDB4"], ["1", "#5E5D57"]]); // plata
    grad("abl-3", "linearGradient", diag, [["0", "#FFF0B5"], ["0.45", "#D9A63C"], ["1", "#7A5512"]]); // oro
    grad("abl-s", "linearGradient", diag, [["0", "#C2453B"], ["0.5", "#7E1A14"], ["1", "#2E0705"]]); // lacre (secretos)
    grad("abl-disco", "radialGradient", { cx: "0.5", cy: "0.38", r: "0.7" }, [["0", "#3B362C"], ["1", "#121110"]]);
    grad("abl-hueso", "linearGradient", { x1: "0", y1: "0", x2: "0", y2: "1" }, [["0", "#FBF6E8"], ["0.45", "#DCD8C2"], ["1", "#8F8A76"]]);
    grad("abl-rojo", "linearGradient", { x1: "0", y1: "0", x2: "0", y2: "1" }, [["0", "#D9473D"], ["1", "#6E120D"]]);
    s.appendChild(d);
    (document.body || document.documentElement).appendChild(s);
  }
  const OSCURO = "#16130F";
  function pieza(x, sombra) {
    const tipo = x[0];
    const modo = x[x.length - 1];
    const fill = sombra ? "#000" : modo === "d" ? OSCURO : modo === "r" ? "url(#abl-rojo)" : "url(#abl-hueso)";
    const borde = sombra ? "#000" : modo === "d" ? "none" : "#2A251C";
    if (tipo === "g") { const g = nuevo("g", { transform: x[1] }); x[2].forEach((y) => { const n = pieza(y, sombra); if (n) g.appendChild(n); }); return g; }
    if (sombra && modo === "d") return null; // los huecos no proyectan sombra
    if (tipo === "l") return nuevo("path", { d: x[1], fill: "none", stroke: sombra ? "#000" : modo === "d" ? OSCURO : "url(#abl-hueso)", "stroke-width": x[2], "stroke-linecap": "round", "stroke-linejoin": "round" });
    const comun = { fill, stroke: borde, "stroke-width": modo === "d" ? null : "0.9", "stroke-linejoin": "round" };
    if (tipo === "p") return nuevo("path", Object.assign({ d: x[1] }, comun));
    if (tipo === "c") return nuevo("circle", Object.assign({ cx: x[1], cy: x[2], r: x[3] }, comun));
    if (tipo === "e") return nuevo("ellipse", Object.assign({ cx: x[1], cy: x[2], rx: x[3], ry: x[4] }, comun));
    if (tipo === "r") return nuevo("rect", Object.assign({ x: x[1], y: x[2], width: x[3], height: x[4], rx: typeof x[5] === "number" ? x[5] : 0 }, comun));
    return null;
  }
  // Insignia: id del logro, nivel (0 = no conseguido), tamaño en px.
  function icono(id, nivel, tam) {
    defs();
    const lg = POR_ID[id];
    const cat = lg ? lg.cat : "perfil";
    const oculto = lg && lg.secreto && !nivel;
    const s = nuevo("svg", { viewBox: "0 0 64 64", width: tam || 48, height: tam || 48, "aria-hidden": "true", focusable: "false", class: "abl-ic" + (nivel ? "" : " abl-no") });
    const forma = FORMA[cat];
    const anillo = lg && lg.secreto ? "url(#abl-s)" : "url(#abl-" + Math.max(1, Math.min(3, nivel || 1)) + ")";
    s.appendChild(nuevo("path", { d: forma, fill: anillo, stroke: "#1E160A", "stroke-width": "1.3", "stroke-linejoin": "round" }));
    const dentro = nuevo("g", { transform: "translate(32 32) scale(.8) translate(-32 -32)" });
    dentro.appendChild(nuevo("path", { d: forma, fill: "none", stroke: "rgba(255,248,225,.35)", "stroke-width": "2.2", "stroke-linejoin": "round" }));
    s.appendChild(dentro);
    const disco = nuevo("g", { transform: "translate(32 32) scale(.76) translate(-32 -32)" });
    disco.appendChild(nuevo("path", { d: forma, fill: "url(#abl-disco)", stroke: "#1E160A", "stroke-width": "1.4", "stroke-linejoin": "round" }));
    s.appendChild(disco);
    const k = ESCALA_EMBLEMA[cat] || 0.72;
    const em = nuevo("g", { transform: `translate(32 ${32 + (DY[cat] || 0)}) scale(${k}) translate(-32 -32)` });
    const piezas = G[oculto ? "oculto" : id] || G.oculto;
    const sombra = nuevo("g", { transform: "translate(0 1.6)", opacity: ".55" });
    piezas.forEach((x) => { const n = pieza(x, true); if (n) sombra.appendChild(n); });
    em.appendChild(sombra);
    piezas.forEach((x) => { const n = pieza(x, false); if (n) em.appendChild(n); });
    s.appendChild(em);
    return s;
  }

  // Estilos comunes (insignia apagada si no se ha conseguido).
  const css = document.createElement("style");
  css.textContent = ".abl-ic{display:block;flex:none;filter:drop-shadow(0 2px 3px rgba(0,0,0,.45))}.abl-ic.abl-no{filter:grayscale(1) brightness(.5);opacity:.6}";
  document.head.appendChild(css);

  const nivelNombre = (lg, n) => (lg && lg.niv.length > 1 && n ? NIVELES[lang()][n - 1] : "");
  // Nombre con su nivel, en el idioma de la página («A las armas · Oro»).
  const titulo = (id, n) => { const lg = POR_ID[id]; if (!lg) return id; return T(lg.n) + (nivelNombre(lg, n) ? " · " + nivelNombre(lg, n) : ""); };
  // Orden de importancia (para la ficha rápida): secretos y oro primero, después plata, etc.
  const peso = (id, n) => { const lg = POR_ID[id]; if (!lg) return 0; return (lg.secreto ? 40 : 0) + (lg.niv.length > 1 ? n * 10 : 8) + (lg.cat === "liga" ? 2 : 0); };
  // Fila de insignias (lista de [id, nivel]); con `max`, las más importantes.
  function fila(lista, tam, max) {
    const w = document.createElement("span");
    w.className = "abl-fila";
    w.style.cssText = "display:inline-flex;gap:4px;flex-wrap:wrap;align-items:center";
    let l = (lista || []).filter(([id]) => POR_ID[id]);
    if (max) l = [...l].sort((a, b) => peso(b[0], b[1]) - peso(a[0], a[1])).slice(0, max);
    l.forEach(([id, n]) => {
      const c = document.createElement("span");
      c.title = titulo(id, n); c.setAttribute("role", "img"); c.setAttribute("aria-label", c.title); c.setAttribute("translate", "no");
      c.appendChild(icono(id, n, tam || 28));
      w.appendChild(c);
    });
    return w;
  }

  window.abLogros = { LOGROS, CATS, POR_ID, NIVELES, icono, titulo, fila, peso, T, lang, total: LOGROS.length };
})();
