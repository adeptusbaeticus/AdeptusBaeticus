// Traducción de la interfaz (español / inglés).
// Se traducen los textos de la web; el contenido que escriben los socios (títulos, descripciones,
// nombres, posts…) se marca con translate="no" y se deja tal cual.
(() => {
  const KEY = "ab_lang";
  let lang = "es";
  try { lang = localStorage.getItem(KEY) === "en" ? "en" : "es"; } catch (e) {}

  // Textos completos.
  const EXACT = {
    // Menú y páginas
    "Inicio": "Home", "Blog": "Blog", "Gran Liga": "Grand League", "Gran Liga Adeptus": "Adeptus Grand League",
    "Gran Liga · Adeptus Baeticus": "Grand League · Adeptus Baeticus", "Clasificación": "Standings", "Rondas": "Rounds",
    "Reglamento": "Rules", "Normas de la liga": "League rules", "Pos.": "Pos.", "Jugador": "Player", "Facción": "Faction",
    "PJ": "GP", "V": "W", "D": "L", "PV": "VP", "Dif.": "Diff.", "Ver listas": "Show lists", "Ocultar listas": "Hide lists",
    "Por jugar": "Not started", "Pendiente": "Pending", "Sin resultado": "No result", "Ver emparejamientos": "See pairings",
    "La fase ha terminado.": "The phase has finished.", "Todavía no hay ninguna fase de la liga.": "There is no league phase yet.",
    "No se pudo cargar la liga.": "Could not load the league.", "Fase": "Phase",
    "Aplazar": "Postpone", "Quitar aplazamiento": "Cancel postponement",
    "Ver la web como": "View the site as", "Invitado (sin registrar)": "Guest (not signed in)",
    "Estás viendo la web como invitado (sin registrar).": "You are viewing the site as a guest (not signed in).", "— Elige un usuario —": "— Choose a user —", "Salir de «ver como»": "Exit «view as»",
    "No se pudo cambiar de usuario.": "Could not switch user.", "No se pudo salir del modo «ver como».": "Could not exit «view as» mode.",
    "Modo «ver como»: solo lectura": "«View as» mode: read only", "Elige otro usuario": "Choose another user",
    "No estás en el modo «ver como»": "You are not in «view as» mode",
    "Subir resultado": "Upload result", "Solo pueden aplazarla sus jugadores o un admin": "Only its players or an admin can postpone it",
    "La ronda ya ha cerrado: habla con un admin": "The round has already closed: talk to an admin",
    "Tu partida": "Your game", "Recuerda subir el resultado a New Recruit antes del cierre.": "Remember to upload the result to New Recruit before the deadline.",
    "Jugadores de la Gran Liga": "Grand League players", "Cuenta vinculada": "Linked account", "— Sin vincular —": "— Not linked —",
    "Se vinculan solos al entrar con Discord si coinciden su apodo y su usuario de New Recruit. Aquí puedes confirmar las sugerencias o vincular a mano.":
      "They are linked automatically when they log in with Discord if their nickname and New Recruit username match. Here you can confirm suggestions or link manually.",
    "Confirmar": "Confirm", "No se pudo cargar.": "Could not load.", "El jugador no existe": "The player does not exist", "Ese usuario no existe": "That user does not exist",
    "¿Quitar el aplazamiento de esta partida?": "Cancel the postponement of this game?",
    "La partida ya tiene resultado": "The game already has a result", "La partida no existe": "The game does not exist",
    "Todavía no ha usado ninguna lista.": "Has not used any list yet.",
    "Solo aparecen las listas que ya ha usado en alguna partida.": "Only lists already used in a game are shown.",
    "No se pudieron cargar las listas.": "Could not load the lists.", "usada en 1 partida": "used in 1 game", "Instagram": "Instagram", "Enlaces": "Links", "Calendario": "Calendar", "Galería": "Gallery", "Admin": "Admin", "Salir": "Log out",
    "Mis inscripciones": "My sign-ups", "Entrar con Discord": "Log in with Discord", "Entra con Discord para buscar partida": "Log in with Discord to find a game",
    "Adeptus Baeticus": "Adeptus Baeticus",
    "Calendario · Adeptus Baeticus": "Calendar · Adeptus Baeticus",
    "Galería · Adeptus Baeticus": "Gallery · Adeptus Baeticus",
    "Mis inscripciones · Adeptus Baeticus": "My sign-ups · Adeptus Baeticus",
    "Admin · Adeptus Baeticus": "Admin · Adeptus Baeticus",
    "Club de Warhammer 40.000 en Málaga": "Warhammer 40,000 club in Málaga",
    "Club gratuito para noveles. Quedada el primer sábado de cada mes en": "Free club for newcomers. Meetup on the first Saturday of every month at",
    "Noticias del club": "Club news", "Importante": "Important",
    "Próxima quedada": "Next meetup", "No hay ninguna quedada programada.": "No meetup scheduled.",
    "Ver mi inscripción": "See my sign-up",
    "ene": "Jan", "abr": "Apr", "ago": "Aug", "sept": "Sep", "dic": "Dec",
    "Últimas entradas del blog": "Latest blog posts", "Cargando entradas...": "Loading posts...",
    "No se han podido cargar las entradas.": "Could not load the posts.",
    "Leer más": "Read more", "Leer menos": "Read less",
    "Ver en el blog": "See on the blog", "▶ Ver vídeo": "▶ Watch video", "Entradas del blog": "Blog posts",  "Spoiler: pulsa para verlo": "Spoiler: click to reveal",
    "Cargando...": "Loading...", "Comprobando...": "Checking...",
    // Inicio de sesión
    "Tu cuenta de Discord no está en el servidor del club.": "Your Discord account is not in the club server.",
    "No tienes ninguno de los roles del club en Discord.": "You don't have any of the club roles on Discord.",
    "No se pudo iniciar sesión. Inténtalo de nuevo.": "Could not log in. Please try again.",
    "Bienvenido al club": "Welcome to the club",
    "Indica tu usuario de New Recruit para vincular tus resultados en los torneos.": "Enter your New Recruit username to link your tournament results.",
    "Usuario de New Recruit": "New Recruit username", "Guardar": "Save",
    "Usuario no válido (de 2 a 40 caracteres).": "Invalid username (2 to 40 characters).",
    "No se pudo guardar. Inténtalo de nuevo.": "Could not save. Please try again.",
    // Calendario
    "Todos": "All", "Quedadas": "Meetups", "Torneos": "Tournaments", "Partidas": "Games",
    "Quedada": "Meetup", "Torneo": "Tournament", "Partida": "Game",
    "Buscar partida": "Find a game", "Borrar mis partidas": "Delete my games",
    "Mes anterior": "Previous month", "Mes siguiente": "Next month", "Leyenda": "Legend",
    "Lun": "Mon", "Mar": "Tue", "Mié": "Wed", "Jue": "Thu", "Vie": "Fri", "Sáb": "Sat", "Dom": "Sun",
    "Hoy": "Today",
    "Color claro: abierto · oscuro: completo o cerrado": "Light colour: open · dark: full or closed",
    "Selecciona un evento del calendario.": "Select an event in the calendar.",
    "Todas las modalidades": "All game types", "Modalidad": "Game type",
    "La inscripción está cerrada.": "Sign-ups are closed.",
    "Entra con Discord para apuntarte": "Log in with Discord to sign up",
    "Estás inscrito.": "You're signed up.",
    "No quedan plazas: entrarás en la lista de espera.": "No spots left: you'll join the waiting list.",
    "Apuntarme": "Sign me up", "Cancelar inscripción": "Cancel sign-up",
    "¿Qué vas a hacer?": "What will you do?", "— Elige una opción —": "— Choose an option —",
    "Ir a ver": "Just watching", "Ir a pintar": "Painting",
    "Ir a jugar Combat Patrol": "Playing Combat Patrol", "Ir a jugar 40k a 1K": "Playing 40k at 1K",
    "Ir a jugar 40k a 2K": "Playing 40k at 2K", "Ir a jugar Necromunda": "Playing Necromunda",
    "Ir a jugar Blood Bowl": "Playing Blood Bowl",
    "Formato de la partida": "Game format", "¿Cómo vas en el 1vs2?": "How are you playing the 1v2?",
    "Voy solo (contra 2)": "On my own (against 2)", "Voy en pareja (contra 1)": "As a pair (against 1)",
    "Número de participantes (contándote a ti)": "Number of players (including you)",
    "¿Tienes ya rival?": "Do you already have an opponent?", "Busco rival": "Looking for an opponent",
    "Ya tengo rival": "I have an opponent", "— Sin decidir —": "— Undecided —",
    "Compañero": "Teammate", "Rival": "Opponent", "Participante": "Player",
    "Los jugadores que elijas quedarán inscritos en la quedada contigo. Solo aparecen los socios que han entrado alguna vez en la web.":
      "The players you choose will be signed up for the meetup with you. Only members who have logged in to the website at least once are listed.",
    "Todavía no hay otros socios registrados en la web.": "No other members have registered on the website yet.",
    "Confirmar inscripción": "Confirm sign-up", "Volver": "Back",
    "Elige qué vas a hacer en la quedada.": "Choose what you'll do at the meetup.",
    "Elige al menos un jugador o marca «Busco rival».": "Choose at least one player or select «Looking for an opponent».",
    "Has elegido al mismo jugador dos veces.": "You chose the same player twice.",
    "No se pudo completar. Inténtalo de nuevo.": "Could not complete. Please try again.",
    "No se pudo completar.": "Could not complete.",
    "También buscan rival": "Also looking for an opponent",
    "Ahora mismo nadie más busca rival para esto.": "Nobody else is looking for an opponent for this right now.",
    "Seguir buscando rival": "Keep looking for an opponent",
    "Si te unes a alguien, jugarás en su formato.": "If you join someone, you'll play in their format.",
    "Buscando rival.": "Looking for an opponent.", "Buscando rival": "Looking for an opponent",
    "¿Cancelar tu inscripción?": "Cancel your sign-up?",
    "Puede jugar:": "Available:", "Día": "Day", "Hora de inicio": "Start time",
    "¿En qué bando?": "Which side?", "Unirme": "Join",
    "Retirar partida": "Withdraw game", "Salir de la partida": "Leave the game",
    "La partida está cerrada.": "The game is closed.",
    "Ya no quedan horas disponibles.": "There are no time slots left.",
    "No se admiten más jugadores salvo que alguien se caiga.": "No more players unless someone drops out.",
    "¿Retirar esta partida? Desaparecerá del calendario para todos.": "Withdraw this game? It will disappear from the calendar for everyone.",
    "¿Salir de esta partida?": "Leave this game?", "Partida retirada.": "Game withdrawn.",
    "¿A qué quieres jugar?": "What do you want to play?", "— Elige una modalidad —": "— Choose a game type —",
    "¿Cuándo puedes en los próximos 7 días?": "When are you available in the next 7 days?",
    "Se publica una partida independiente por cada día que marques, cada una con sus propios rivales.":
      "A separate game is posted for each day you select, each with its own opponents.",
    "Publicar partida": "Post game", "Desde": "From", "Hasta": "To",
    "Elige una modalidad.": "Choose a game type.", "Marca al menos un día.": "Select at least one day.",
    "En cada día, la hora de fin debe ser posterior a la de inicio.": "For each day, the end time must be after the start time.",
    "No se pudo publicar. Inténtalo de nuevo.": "Could not post. Please try again.",
    "Borrar partidas": "Delete games", "Mis partidas de esta semana": "My games this week",
    "No tienes partidas publicadas.": "You have no posted games.",
    "No se pudo borrar.": "Could not delete.", "Se ha borrado 1 partida.": "1 game deleted.",
    // Mis inscripciones
    "Próximas": "Upcoming", "Pasadas": "Past", "Inscrito": "Signed up", "Lista de espera": "Waiting list",
    "Evento cancelado": "Event cancelled", "Mis partidas": "My games", "Cerrada": "Closed", "En curso": "In progress",
    "Quedadas de los próximos 3 meses": "Meetups in the next 3 months", "Quedadas y torneos": "Meetups & tournaments", "Solo quedadas": "Meetups only", "Solo torneos": "Tournaments only",
    "Quedadas y torneos de los próximos 3 meses": "Meetups & tournaments in the next 3 months",
    "No hay quedadas ni torneos en los próximos 3 meses.": "No meetups or tournaments in the next 3 months.", "Torneos de los próximos 3 meses": "Tournaments in the next 3 months",
    "No hay quedadas en los próximos 3 meses.": "No meetups in the next 3 months.", "No hay torneos en los próximos 3 meses.": "No tournaments in the next 3 months.", "Hecho por": "Made by", "Liga · aplazadas": "League · postponed", "Ronda de aplazadas de la Gran Liga": "Grand League postponed-games round",
    "Ronda de la Gran Liga (pulsa para verla)": "Grand League round (click to open it)",
    "Aún no te has apuntado a ninguna quedada.": "You haven't signed up for any meetup yet.",
    "Ver el calendario": "See the calendar",
    "Entra con Discord para ver tus inscripciones": "Log in with Discord to see your sign-ups",
    "No se pudieron cargar tus inscripciones.": "Could not load your sign-ups.",
    "No se pudo cancelar.": "Could not cancel.",
    // Galería
    "Galería": "Gallery", "Ordenar": "Sort by",
    "Fotos de los miembros del club. Para publicar la tuya, usa": "Photos by club members. To post yours, use",
    "en el canal #publicaciones-web de Discord.": "in the #publicaciones-web channel on Discord.", "Más recientes": "Most recent",
    "Más bendiciones del Emperador": "Most Emperor's blessings",
    "Más bendiciones de los Poderes Ruinosos": "Most Ruinous Powers' blessings",
    "Miembro": "Member", "Todos los miembros": "All members",
    "Todavía no hay fotos publicadas.": "No photos have been posted yet.",
    "Este miembro aún no ha publicado fotos.": "This member hasn't posted any photos yet.",
    "No se pudo cargar la galería.": "Could not load the gallery.",
    "Cerrar": "Close", "‹ Anterior": "‹ Previous", "Siguiente ›": "Next ›",
    "Entra con Discord para dar tu bendición": "Log in with Discord to give your blessing",
    "Dar la bendición del Emperador": "Give the Emperor's blessing",
    "Retirar tu bendición del Emperador": "Withdraw your Emperor's blessing",
    "Dar la bendición de los Poderes Ruinosos": "Give the Ruinous Powers' blessing",
    "Retirar tu bendición de los Poderes Ruinosos": "Withdraw your Ruinous Powers' blessing",
    // Admin
    "Administración de eventos": "Event management", "Tipo": "Type", "Título": "Title",
    "Fecha y hora": "Date and time", "Lugar": "Location", "Plazas (opcional)": "Spots (optional)",
    "Enlace o ID de New Recruit (torneos)": "New Recruit link or ID (tournaments)", "Estado": "Status",
    "Publicado": "Published", "Borrador": "Draft", "Cancelado": "Cancelled", "Descripción": "Description",
    "Crear evento": "Create event", "Limpiar": "Clear", "Eventos": "Events", "Guardar cambios": "Save changes",
    "Editar": "Edit", "Cancelar evento": "Cancel event", "Publicar de nuevo": "Publish again",
    "Inscritos": "Sign-ups", "Descargar CSV": "Download CSV", "No hay eventos.": "No events.",
    "¿Cancelar este evento?": "Cancel this event?", "Guardado.": "Saved.",
    "No se pudieron cargar los eventos.": "Could not load the events.",
    "No se pudo guardar. Revisa los datos.": "Could not save. Check the details.",
    "Esta página es solo para administradores.": "This page is for administrators only.",
    "Inicia sesión con Discord para continuar.": "Log in with Discord to continue.",
    "No se pudo comprobar la sesión.": "Could not check your session.",
    "Todavía no hay inscritos.": "No sign-ups yet.", "No se pudo cargar la lista de inscritos.": "Could not load the sign-up list.",
    "Nombre": "Name", "Usuario New Recruit": "New Recruit username", "Actividad": "Activity",
    "Inscrito por": "Signed up by", "Fecha de inscripción": "Sign-up date", "(sin nombre)": "(no name)",
    "Bot de Discord (galería)": "Discord bot (gallery)", "Gran Liga · New Recruit": "Grand League · New Recruit",
    "ID del torneo en New Recruit": "Tournament ID on New Recruit", "Sincronizar torneo": "Sync tournament",
    "Sincronizar resultados": "Sync results", "Consultando New Recruit...": "Querying New Recruit...",
    "No se pudo sincronizar.": "Could not sync.", "Todavía no se ha sincronizado nada.": "Nothing has been synced yet.",
    "Faltan los secretos NR_LOGIN y NR_PASSWORD.": "The NR_LOGIN and NR_PASSWORD secrets are missing.",
    "Faltan los secretos NR_LOGIN y NR_PASSWORD": "The NR_LOGIN and NR_PASSWORD secrets are missing", "Registrar comandos en Discord": "Register commands on Discord",
    "Configurado. Comandos: /publicar, /editar y /borrar.": "Configured. Commands: /publicar, /editar and /borrar.",
    "No se pudo comprobar.": "Could not check.", "No se pudo registrar.": "Could not register.",
    "quedada": "meetup", "torneo": "tournament", "publicado": "published", "borrador": "draft", "cancelado": "cancelled",
    // Mensajes del servidor
    "Alguien ha ocupado el hueco antes. Vuelve a intentarlo.": "Someone took the spot first. Please try again.",
    "Algún jugador no es socio del club": "Some player is not a club member",
    "Datos no válidos": "Invalid data", "El evento ya ha empezado": "The event has already started",
    "El número de participantes debe estar entre 1 y 9": "The number of players must be between 1 and 9",
    "Elige el formato de la partida": "Choose the game format",
    "Elige qué vas a hacer en la quedada": "Choose what you'll do at the meetup",
    "Elige un día y una hora de los que se ofrecen": "Choose one of the offered days and times",
    "Elige una modalidad de juego": "Choose a game type",
    "En Necromunda hacen falta al menos 2 participantes": "Necromunda needs at least 2 players",
    "Esa hora ya ha pasado": "That time has already passed",
    "Esa persona ya no busca rival para esta partida": "That person is no longer looking for an opponent for this game",
    "Esa publicación ya no existe": "That post no longer exists", "Ese bando ya está completo": "That side is already full",
    "Evento no disponible": "Event not available",
    "Hay más jugadores de los que permite el formato": "There are more players than the format allows",
    "Indica si vas solo o en pareja en el 1vs2": "Say whether you're playing alone or as a pair in the 1v2",
    "Inicia sesión con Discord": "Log in with Discord", "JSON no válido": "Invalid JSON", "Jugador no válido": "Invalid player",
    "La inscripción está cerrada": "Sign-ups are closed", "La lista de jugadores no es válida": "The player list is not valid",
    "La partida ya está completa": "The game is already full", "La partida ya ha empezado": "The game has already started",
    "La partida ya no existe": "The game no longer exists",
    "Las horas que has marcado para hoy ya han pasado": "The times you selected for today have already passed",
    "Marca al menos un día con sus horas": "Select at least one day with its times",
    "No estabas en esta partida": "You weren't in this game", "No estabas inscrito": "You weren't signed up",
    "No se pudo completar la inscripción. Inténtalo de nuevo.": "Could not complete the sign-up. Please try again.",
    "Organizas esta partida: usa «Retirar partida»": "You're organising this game: use «Withdraw game»",
    "Revisa los días y las horas": "Check the days and times",
    "Solo quien organiza puede retirarla": "Only the organiser can withdraw it",
    "Tipo no válido": "Invalid type", "Usuario no válido": "Invalid username",
    "Ya estás en esta partida": "You're already in this game", "Ya estás inscrito en esta quedada": "You're already signed up for this meetup",
  };

  const DIAS = { lunes: "Monday", martes: "Tuesday", "miércoles": "Wednesday", jueves: "Thursday", viernes: "Friday", "sábado": "Saturday", domingo: "Sunday" };
  const MESES = { enero: "January", febrero: "February", marzo: "March", abril: "April", mayo: "May", junio: "June", julio: "July",
    agosto: "August", septiembre: "September", octubre: "October", noviembre: "November", diciembre: "December" };
  const MESES_CORTOS = { ene: "Jan", feb: "Feb", mar: "Mar", abr: "Apr", may: "May", jun: "Jun", jul: "Jul", ago: "Aug", sept: "Sep", sep: "Sep", oct: "Oct", nov: "Nov", dic: "Dec" };
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  // Textos con datos variables (números, nombres): patrón completo → traducción.
  const RULES = [
    [/^(Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Octubre|Noviembre|Diciembre) (\d{4})$/, (m, mes, y) => MESES[mes.toLowerCase()] + " " + y],
    [/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}) · (Quedada|Torneo) · (publicado|borrador|cancelado)$/, (m, f, t, e) => f + " · " + EXACT[t] + " · " + EXACT[e]],
    [/^Plazas: (\d+) de (\d+)$/, "Spots: $1 of $2"],
    [/^Plazas: (\d+)$/, "Spots: $1"],
    [/^Entrada (\d+): ([\s\S]*)$/, "Post $1: $2"],
    [/^Plazas libres: (\d+) de (\d+)$/, "Free spots: $1 of $2"],
    [/^Sin plazas libres \((\d+) de (\d+) ocupadas\)$/, "No free spots ($1 of $2 taken)"],
    [/^Plazas libres: sin límite · (\d+) inscritos?$/, (m, n) => "Free spots: unlimited · " + n + " signed up"],
    [/^Inscritos: (\d+)(?: de (\d+) · Libres: (\d+))? · En espera: (\d+)$/, (m, a, b, l, c) => "Signed up: " + a + (b ? " of " + b + " · Free: " + l : "") + " · Waiting: " + c],
    [/^En lista de espera: (\d+)$/, "On the waiting list: $1"],
    [/^Estás en lista de espera \(posición (\d+)\)\.$/, "You're on the waiting list (position $1)."],
    [/^Estás en lista de espera\.$/, "You're on the waiting list."],
    [/^Abierta · faltan? (\d+)( jugador(es)?)?$/, (m, n, j) => "Open · " + n + (j ? (n === "1" ? " player" : " players") : "") + " needed"],
    [/^Completa · Mesa (\d+)$/, "Full · Table $1"],
    [/^Completa · sin mesa libre(: avisa a un admin)?$/, (m, a) => "Full · no free table" + (a ? ": tell an admin" : "")],
    [/^Se han publicado (\d+) partidas, una por cada día\.$/, "$1 games posted, one per day."],
    [/^Se han borrado (\d+) partidas\.$/, "$1 games deleted."],
    [/^(\d+) publicadas?, (\d+) sin rivales todavía\.$/, (m, a, b) => a + " posted, " + b + " still without opponents."],
    [/^Borrar mis partidas vacías \((\d+)\)$/, "Delete my empty games ($1)"],
    [/^Borrar todas \((\d+)\)$/, "Delete all ($1)"],
    [/^¿Borrar tus (\d+) partidas sin rivales\?$/, "Delete your $1 games without opponents?"],
    [/^¿Borrar todas tus partidas \((\d+)\)\? Las que ya tienen rivales también desaparecerán\.$/, "Delete all your games ($1)? Those that already have opponents will also disappear."],
    [/^¿Cancelar tu inscripción en «(.+)»\?$/, "Cancel your sign-up for «$1»?"],
    [/^Ampliar publicación (\d+)( \((\d+) fotos\))?$/, (m, n, _, f) => "Enlarge post " + n + (f ? " (" + f + " photos)" : "")],
    [/^Ampliar foto (\d+)$/, "Enlarge photo $1"],
    [/^(\d+) bendici(?:ón|ones) del Emperador\. (.+)$/, (m, n, r) => n + (n === "1" ? " Emperor's blessing. " : " Emperor's blessings. ") + tr(r)],
    [/^(\d+) bendici(?:ón|ones) de los Poderes Ruinosos\. (.+)$/, (m, n, r) => n + (n === "1" ? " Ruinous Powers' blessing. " : " Ruinous Powers' blessings. ") + tr(r)],
    [/^Comandos registrados: (.+)$/, "Commands registered: $1"],
    [/^Mesa (\d+)$/, "Table $1"],
    [/^■ Cierre R(\d+) · 14:00$/, "■ R$1 closes · 14:00"],
    [/^▶ Inicio R(\d+) · (\d\d:\d\d)$/, "▶ R$1 starts · $2"],
    [/^Liga · R(\d+)$/, "League · R$1"],
    [/^Ronda (\d+) de la Gran Liga$/, "Grand League round $1"],
    [/^Estás viendo la web como (.+) \(solo lectura\)\.$/, "You are viewing the site as $1 (read only)."],
    [/^Mesa (\d+) · contra$/, "Table $1 · against"],
    [/^(Victoria|Derrota|Empate) (\d+) – (\d+)$/, (m, r, a, b) => ({ Victoria: "Win", Derrota: "Loss", Empate: "Draw" })[r] + " " + a + " – " + b],
    [/^Sugerencia: (.+) $/, "Suggestion: $1 "],
    [/^Lista (\d+)$/, "List $1"],
    [/^· usada en (\d+) partidas$/, "· used in $1 games"],
    [/^· usada en 1 partida$/, "· used in 1 game"],
    [/^Ronda (\d+) de (\d+)$/, "Round $1 of $2"],
    [/^Ronda (\d+) \(aplazadas\)$/, "Round $1 (postponed)"],
    [/^Ronda (\d+)$/, "Round $1"],
    [/^Aplazada a la ronda (\d+)$/, "Postponed to round $1"],
    [/^¿Aplazar esta partida a la ronda (\d+)\?$/, "Postpone this game to round $1?"],
    [/^Del (.+) al (.+)$/, (m, a, b) => "From " + fechas(a) + " to " + fechas(b)],
    [/^(\d+) de (\d+) jugadas$/, "$1 of $2 played"],
    [/^Cierre: (.+) a las 14:00(?: \((?:quedan (\d+) días|(mañana)|(hoy))\))?$/, (m, f, n, man, hoy) => "Closes: " + fechas(f) + " at 14:00" + (n ? " (" + n + " days left)" : man ? " (tomorrow)" : hoy ? " (today)" : "")],
    [/^Empieza el (.+) a las (\d\d:\d\d)$/, (m, f, h) => "Starts on " + fechas(f) + " at " + h],
    [/^Resultados de New Recruit · actualizado (.+)$/, (m, f) => "New Recruit results · updated " + fechas(f)],
    [/^Fase (I|II) (.+)$/, "Phase $1 $2"],
    [/^Sincronizado: (\d+) bytes\. Resultados asignados a la liga: (\d+)(?: \(sin asignar: (\d+)\))?\.$/, (m, b, a, s) => "Synced: " + b + " bytes. Results assigned to the league: " + a + (s ? " (unassigned: " + s + ")" : "") + "."],
    [/^Sincronizado: (\d+) bytes\.$/, "Synced: $1 bytes."],
    [/^Se consultó hace poco \((.+) UTC\)\. Espera (\d+) minutos entre consultas\.$/, "Queried recently ($1 UTC). Wait $2 minutes between queries."],
    [/^Faltan los secretos: (.+)$/, "Missing secrets: $1"],
    [/^Puedes tener como máximo (\d+) partidas abiertas \(ahora tienes (\d+)\)$/, "You can have at most $1 open games (you have $2)"],
    [/^Editando: (.+)$/, "Editing: $1"],
    [/^Detalle: (.+)$/, "Details: $1"],
    [/^Sin plaza, en lista de espera: (.+)\.$/, "No spot, on the waiting list: $1."],
    [/^Sin fecha aún\. Puede: (.+)$/, (m, r) => "No date yet. Available: " + frases(r)],
    [/^Partidas: (.+)$/, "Games: $1"],
    [/^(Compañero|Rival|Participante) (\d+)$/, (m, w, n) => EXACT[w] + " " + n],
  ];

  // Frases de la interfaz dentro de textos compuestos (fechas, planes, listas de jugadores…).
  const PHRASES = [
    ["Ir a jugar 40k a 1K", "Playing 40k at 1K"], ["Ir a jugar 40k a 2K", "Playing 40k at 2K"],
    ["Ir a jugar ", "Playing "], ["Ir a ver", "Just watching"], ["Ir a pintar", "Painting"],
    ["40k a 1K", "40k at 1K"], ["40k a 2K", "40k at 2K"],
    [" participantes", " players"], ["Participantes: ", "Players: "],
    ["Compañero: ", "Teammate: "], ["Rival: ", "Opponent: "], ["Te inscribió ", "Signed up by "],
    ["Buscando rival", "Looking for an opponent"], ["Lista de espera", "Waiting list"], [" · posición ", " · position "],
    ["Organiza: ", "Organiser: "], ["hueco libre", "free spot"], [" (tú)", " (you)"], ["tú contra", "you against"],
    [" contra ", " against "], ["Jugar con ", "Play with "], [" · faltan ", " · needed: "],
    ["En el equipo de ", "On the team of "], ["Contra ", "Against "], [" (con ", " (with "],
    ["Resultados: ", "Results: "], ["Torneo: ", "Tournament: "], ["actualizado ", "updated "], ["sin datos", "no data"],
    [" · de ", " · from "], [" a las ", " at "], [" y ", " and "], [" / ", " / "],
  ];

  function fechas(t) {
    t = t.replace(/(\d{1,2}) de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(?: de (\d{4}))?/gi,
      (m, d, mes, y) => d + " " + MESES[mes.toLowerCase()] + (y ? " " + y : ""));
    t = t.replace(/(\d{1,2}) (ene|feb|mar|abr|may|jun|jul|ago|sept?|oct|nov|dic)\.? (\d{4})/gi,
      (m, d, mes, y) => d + " " + MESES_CORTOS[mes.toLowerCase()] + " " + y);
    t = t.replace(/(^|[^\p{L}])(lunes|martes|miércoles|jueves|viernes|sábado|domingo)(?![\p{L}])/giu,
      (m, pre, dia) => pre + DIAS[dia.toLowerCase()]);
    // «de 17:00 a 21:00» (franjas horarias)
    t = t.replace(/\bde (\d{2}:\d{2}) a (\d{2}:\d{2})/g, "from $1 to $2");
    return t;
  }

  function frases(t) {
    t = fechas(t);
    for (const [a, b] of PHRASES) t = t.split(a).join(b);
    return t;
  }

  function tr(s) {
    if (lang !== "en" || !s) return s;
    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s);
    const core = m[2];
    if (!core) return s;
    if (Object.prototype.hasOwnProperty.call(EXACT, core)) return m[1] + EXACT[core] + m[3];
    for (const [re, rep] of RULES) if (re.test(core)) return m[1] + core.replace(re, rep) + m[3];
    if (!/[a-záéíóúñ]/i.test(core)) return s;
    return m[1] + frases(core) + m[3];
  }

  // --- Aplicación sobre la página (y sobre lo que se pinte después) ---
  const ORIG = new WeakMap(); // nodo de texto → texto original en español
  const ATTRS = ["placeholder", "aria-label", "title", "alt", "aria-roledescription"];
  // <html translate="no"> solo evita el traductor automático del navegador (choca con este); no protege nada aquí.
  const protegido = (el) => !!(el && el.closest && el.closest('[translate="no"]:not(html), script, style, svg'));

  function textoNodo(n) {
    if (protegido(n.parentElement)) return;
    let o = ORIG.get(n);
    if (o === undefined || (n.nodeValue !== o && n.nodeValue !== n.__trad)) { o = n.nodeValue; ORIG.set(n, o); }
    const v = tr(o);
    n.__trad = v;
    if (n.nodeValue !== v) n.nodeValue = v;
  }

  function atributos(el) {
    if (protegido(el)) return;
    for (const a of ATTRS) {
      if (!el.hasAttribute(a)) continue;
      const k = "data-i18n-" + a;
      const cur = el.getAttribute(a);
      if (!el.hasAttribute(k) || (cur !== el.getAttribute(k) && cur !== el.__tradAttr?.[a])) el.setAttribute(k, cur);
      const v = tr(el.getAttribute(k));
      (el.__tradAttr ||= {})[a] = v;
      if (cur !== v) el.setAttribute(a, v);
    }
  }

  let ocupado = false;
  function recorrer(root) {
    ocupado = true;
    if (root.nodeType === 3) textoNodo(root);
    else if (root.nodeType === 1 || root.nodeType === 9) {
      if (root.nodeType === 1) atributos(root);
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
      let n;
      while ((n = w.nextNode())) n.nodeType === 3 ? textoNodo(n) : atributos(n);
    }
    ocupado = false;
  }

  const tituloEs = document.title;
  function todo() {
    document.documentElement.lang = lang;
    document.documentElement.setAttribute("translate", "no");
    document.title = tr(tituloEs);
    recorrer(document.body);
    document.querySelectorAll(".lang button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  }

  new MutationObserver((ms) => {
    if (ocupado) return;
    for (const m of ms) {
      if (m.type === "childList") m.addedNodes.forEach(recorrer);
      else if (m.type === "characterData") textoNodo(m.target);
      else if (m.type === "attributes" && ATTRS.includes(m.attributeName)) atributos(m.target);
    }
  }).observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });

  // Los avisos de confirmación del navegador también se traducen.
  const conf = window.confirm.bind(window);
  window.confirm = (msg) => conf(tr(String(msg)));
  const avisa = window.alert.bind(window);
  window.alert = (msg) => avisa(tr(String(msg)));

  // --- Selector de idioma (banderas) ---
  const NS = "http://www.w3.org/2000/svg";
  function svg(w, h, partes) {
    const s = document.createElementNS(NS, "svg");
    s.setAttribute("viewBox", "0 0 " + w + " " + h);
    s.setAttribute("aria-hidden", "true");
    for (const [tag, attrs] of partes) {
      const e = document.createElementNS(NS, tag);
      for (const k in attrs) e.setAttribute(k, attrs[k]);
      s.appendChild(e);
    }
    return s;
  }
  const BANDERAS = {
    es: () => svg(30, 20, [["rect", { width: 30, height: 20, fill: "#AA151B" }], ["rect", { y: 5, width: 30, height: 10, fill: "#F1BF00" }]]),
    en: () => svg(60, 30, [
      ["rect", { width: 60, height: 30, fill: "#012169" }],
      ["path", { d: "M0,0 60,30 M60,0 0,30", stroke: "#fff", "stroke-width": 6 }],
      ["path", { d: "M0,0 60,30 M60,0 0,30", stroke: "#C8102E", "stroke-width": 2 }],
      ["path", { d: "M30,0v30M0,15h60", stroke: "#fff", "stroke-width": 10 }],
      ["path", { d: "M30,0v30M0,15h60", stroke: "#C8102E", "stroke-width": 6 }],
    ]),
  };

  function selector() {
    const span = document.createElement("span");
    span.className = "lang";
    span.setAttribute("translate", "no");
    span.setAttribute("role", "group");
    span.setAttribute("aria-label", "Idioma / Language");
    [["es", "Español"], ["en", "English"]].forEach(([code, nombre]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.dataset.lang = code;
      b.title = nombre;
      b.setAttribute("aria-label", nombre);
      b.setAttribute("aria-pressed", String(code === lang));
      b.appendChild(BANDERAS[code]());
      b.onclick = () => cambiar(code);
      span.appendChild(b);
    });
    return span;
  }

  function cambiar(code) {
    lang = code;
    try { localStorage.setItem(KEY, code); } catch (e) {}
    todo();
  }

  const css = document.createElement("style");
  css.textContent = ".lang{display:inline-flex;gap:4px;vertical-align:middle;margin-right:12px}" +
    ".lang button{display:inline-flex;align-items:center;justify-content:center;min-width:40px;min-height:36px;padding:0 6px;background:none;border:2px solid transparent;border-radius:8px;cursor:pointer;opacity:.6}" +
    ".lang button svg{width:26px;height:17px;display:block;border-radius:3px}" +
    ".lang button[aria-pressed=true]{border-color:#D9B25A;opacity:1}" +
    ".lang button:hover{opacity:1}";
  document.head.appendChild(css);

  window.abI18n = { tr, selector, get lang() { return lang; } };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", todo);
  else todo();
})();
