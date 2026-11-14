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
    "Galería · Adeptus Baeticus": "Gallery · Adeptus Baeticus", "Reglas y FAQ · Adeptus Baeticus": "Rules & FAQ · Adeptus Baeticus", "Reglas y FAQ": "Rules & FAQ",
    "El reglamento del club y las dudas más habituales. Las preguntas se copian del canal #preguntas-frecuentes de nuestro Discord.": "The club rules and the most common questions. The questions are copied from the #preguntas-frecuentes channel on our Discord (in Spanish).",
    "Preguntas frecuentes": "Frequently asked questions", "FAQ": "FAQ",
    "Las dudas más habituales sobre el club. Se copian del canal #preguntas-frecuentes de nuestro Discord.": "The most common questions about the club, copied from the #preguntas-frecuentes channel on our Discord (in Spanish).",
    "Buscar en las preguntas...": "Search the questions...", "Reglamento interno": "Club rules",
    "Estatutos del club: finalidad, principios, organización, gestión económica, filosofía de eventos, convivencia y régimen de faltas.": "The club's statutes: purpose, principles, organisation, finances, event philosophy, conduct and disciplinary rules (in Spanish).",
    "Leer el reglamento": "Read the rules",
    "Miembros · Adeptus Baeticus": "Members · Adeptus Baeticus", "Miembros": "Members", "Mi ficha": "My profile",
    "Los socios del club, las facciones que juegan y dónde encontrarlos. Pulsa en una ficha para verla entera.": "The club's members, the factions they play and where to find them. Click a card to see the full profile.",
    "Entra con Discord para ver las cuentas de los socios y editar tu ficha.": "Log in with Discord to see members' accounts and edit your profile.",
    "Buscar por nombre...": "Search by name...", "Buscar por nombre": "Search by name", "Filtrar por facción": "Filter by faction",
    "Todas las facciones": "All factions", "Todos los roles": "All roles",
    "Asignar trofeos": "Assign trophies",
    "Encuestas · Adeptus Baeticus": "Polls · Adeptus Baeticus", "Encuestas": "Polls", "Encuestas abiertas": "Open polls", "Nueva encuesta": "New poll",
    "Las votaciones del club. Un voto por socio; puedes cambiarlo mientras la encuesta esté abierta.": "The club's polls. One vote per member; you can change it while the poll is open.",
    "Entra con Discord para ver y votar las encuestas del club.": "Log in with Discord to see and vote in the club's polls.",
    "Aspirantes y miembros": "Aspirants and members", "Solo miembros": "Members only", "Sin fecha de cierre": "No closing date",
    "Voto público": "Public vote", "Voto secreto": "Secret vote", "Cerrar ya": "Close now", "Voto público: los socios verán qué has votado.": "Public vote: members will see what you voted.",
    "Físico": "In person", "Online (TTS)": "Online (TTS)", "A decidir": "To be decided", "¿Dónde se juega?": "Where will you play?",
    "Lugar (opcional)": "Place (optional)",
    "Por ejemplo: 2d6 Store o casa de alguien. Si lo dejas vacío, queda «A decidir» y lo acordáis entre los jugadores.": "For example: 2d6 Store or someone's home. If you leave it empty, it stays “To be decided” and you agree on it among the players.",
    "Completa": "Full",
    "Físico u online (TTS)": "In person or online (TTS)", "¿Cómo jugáis?": "How will you play?", "Físico (lugar a decidir)": "In person (place to be decided)",
    "Elige si jugáis en físico u online.": "Choose whether you play in person or online.", "Elige si jugáis en físico u online": "Choose whether you play in person or online",
    "Puedes marcar las dos: quien se una elegirá cómo jugáis.": "You can tick both: whoever joins will choose how you play.",
    "Falta un dato:": "One thing is missing:", "Faltan datos:": "Some things are missing:",
    "Marca si buscas jugar en físico, online (TTS) o las dos.": "Tick whether you want to play in person, online (TTS) or both.",
    "Marca al menos un día en el que puedas jugar.": "Tick at least one day you can play.",
    "Marca si buscas jugar en físico, online (TTS) o las dos": "Tick whether you want to play in person, online (TTS) or both",
    "Pendiente de votar": "Not voted yet", "Ya has votado": "You've voted", "Ver todas las encuestas": "See all polls",
    "¿Para quién?": "Who is it for?",
    "«Miembros» incluye a veteranos y admin.": "“Members” includes veterans and admins.",
    "Votos": "Votes", "Secretos": "Secret", "Públicos": "Public", "Ya hay votos secretos: no se puede pasar a votos públicos.": "There are already secret votes: it can't be switched to public votes.",
    "Públicos: los socios ven quién ha votado cada opción.": "Public: members see who voted for each option.", "Resultados durante la encuesta": "Results during the poll",
    "Siempre visibles": "Always visible", "Al votar": "After voting", "Con fecha de cierre": "With a closing date", "Cierre": "Closing",
    "Hora de Madrid. Sin fecha, sigue abierta hasta que la cierres.": "Madrid time. Without a date, it stays open until you close it.",
    "La fecha de cierre no es válida": "The closing date is not valid",
    "Esta encuesta ya tiene votos secretos: no se puede pasar a votos públicos": "This poll already has secret votes: it can't be switched to public votes",
    "Todavía no hay encuestas.": "There are no polls yet.", "No se pudieron cargar las encuestas.": "Could not load the polls.",
    "Abierta": "Open", "Puedes elegir varias opciones": "You can choose several options", "Borrar": "Delete",
    "Votar": "Vote", "Guardar mi voto": "Save my vote", "Cambiar mi voto": "Change my vote", "Elige una opción": "Choose an option",
    "No se pudo guardar el voto.": "Could not save the vote.", "Has votado. Los resultados se verán cuando cierre la encuesta.": "You have voted. Results will be shown when the poll closes.",
    "Los resultados se verán cuando cierre la encuesta.": "Results will be shown when the poll closes.",
    "Editar encuesta": "Edit poll", "Pregunta": "Question", "Por ejemplo: ¿Qué formato para el próximo torneo?": "For example: Which format for the next tournament?",
    "Descripción (opcional)": "Description (optional)", "Opciones": "Options", "Opción": "Option", "Quitar opción": "Remove option", "Añadir opción": "Add option",
    "Si quitas una opción, se borran sus votos.": "If you remove an option, its votes are deleted.", "Tipo de voto": "Vote type", "Una opción": "One option", "Varias opciones": "Several options",
    "Resultados": "Results", "Visibles al votar": "Visible after voting", "Solo al cerrar": "Only when it closes", "Cierra el": "Closes on", "Hora de Madrid.": "Madrid time.",
    "Crear encuesta": "Create poll", "Nuevas encuestas del club": "New club polls", "Ver": "View",
    "Esa encuesta no existe": "That poll does not exist", "La encuesta ya está cerrada": "The poll is already closed", "Solo puedes elegir una opción": "You can only choose one option",
    "Opción no válida": "Invalid option", "Escribe la pregunta": "Write the question", "Pon entre 2 y 12 opciones": "Add between 2 and 12 options", "Hay opciones repetidas": "There are repeated options",
    "Elige la fecha y hora de cierre": "Choose the closing date and time", "La fecha de cierre ya ha pasado": "The closing date has already passed", "Editar trofeo": "Edit trophy", "Mes y año": "Month and year", "AAAA-MM": "YYYY-MM", "Guardar cambios": "Save changes", "Cancelar edición": "Cancel editing",
    "Cambios guardados.": "Changes saved.", "Elige el mes y el año del trofeo": "Choose the trophy's month and year", "Ese trofeo no existe": "That trophy does not exist", "Trofeos": "Trophies", "Trofeos asignados": "Assigned trophies", "Nombre del trofeo": "Trophy name",
    "Por ejemplo: Torneo de Navidad 2026": "For example: Christmas Tournament 2026", "Puesto": "Place", "1.º (oro)": "1st (gold)", "2.º (plata)": "2nd (silver)", "3.º (bronce)": "3rd (bronze)",
    "Tipo de trofeo": "Trophy type", "Pintura": "Painting", "Elige el tipo de trofeo": "Choose the trophy type", "Individual": "Individual", "Parejas": "Pairs", "Equipo": "Team", "Número de miembros del equipo": "Number of team members",
    "Ganadores": "Winners", "— Elige un miembro —": "— Choose a member —", "Guardar trofeo": "Save trophy", "Trofeo guardado.": "Trophy saved.", "Quitar": "Remove",
    "Elige todos los ganadores.": "Choose all the winners.", "No repitas miembros.": "Don't repeat members.", "1.º puesto": "1st place", "2.º puesto": "2nd place", "3.º puesto": "3rd place",
    "Escribe el nombre del trofeo": "Write the trophy name", "Elige el puesto (1.º, 2.º o 3.º)": "Choose the place (1st, 2nd or 3rd)",
    "Elige si es individual, de parejas o de equipo": "Choose individual, pairs or team", "Elige un miembro": "Choose a member",
    "Elige los dos miembros de la pareja": "Choose both members of the pair", "Elige entre 2 y 20 miembros del equipo, sin repetir": "Choose between 2 and 20 team members, without repeating",
    "No repitas miembros": "Don't repeat members", "Algún miembro no existe": "A member does not exist",
    "Notificaciones": "Notifications", "Nuevas quedadas y torneos": "New meetups and tournaments",
    "Mis partidas (alguien se une o se completa)": "My games (someone joins or it fills up)",
    "Gran Liga (tu partida de cada ronda y recordatorio)": "Grand League (your game each round and reminder)",
    "Fotos nuevas en la galería": "New photos in the gallery",
    "En iPhone y iPad las notificaciones solo funcionan con la web instalada como app: pulsa «Instalar app» al pie de la página y ábrela desde su icono.": "On iPhone and iPad notifications only work with the site installed as an app: tap «Install app» at the bottom of the page and open it from its icon.",
    "Este navegador no permite notificaciones.": "This browser doesn't support notifications.",
    "Elige qué avisos quieres recibir en este dispositivo. Puedes cambiarlo o desactivarlo cuando quieras.": "Choose which alerts you want on this device. You can change or turn them off at any time.",
    "Activadas en este dispositivo.": "Turned on for this device.", "Desactivadas en este dispositivo.": "Turned off for this device.",
    "Enviar un aviso de prueba": "Send a test alert", "Aviso de prueba enviado.": "Test alert sent.", "No se pudo enviar el aviso de prueba.": "Could not send the test alert.",
    "Desactivar en este dispositivo": "Turn off on this device", "Activar en este dispositivo": "Turn on for this device", "No se pudo desactivar.": "Could not turn them off.",
    "Has bloqueado las notificaciones de esta web: permítelas en los ajustes del navegador.": "You have blocked notifications for this site: allow them in your browser settings.",
    "Sin permiso para mostrar notificaciones.": "No permission to show notifications.", "No se pudieron activar las notificaciones.": "Could not turn on notifications.",
    "Suscripción no válida": "Invalid subscription",
    "Ver mes": "Month view", "Ver agenda": "Agenda view", "No hay nada previsto en los próximos dos meses.": "Nothing planned in the next two months.",
    "Añadir a mi calendario": "Add to my calendar", "Mi calendario": "My calendar", "Solo el club": "Club only",
    "Google Calendar (Android)": "Google Calendar (Android)", "iPhone, Mac u Outlook": "iPhone, Mac or Outlook", "Copiar el enlace": "Copy the link",
    "Enlace copiado.": "Link copied.", "Copia el enlace:": "Copy the link:",
    "Quedadas y torneos del club, las partidas a las que te apuntes y tu partida de cada ronda de la Gran Liga. Se actualiza solo. El enlace es personal: no lo compartas.": "The club's meetups and tournaments, the games you join and your game in each Grand League round. It updates by itself. The link is personal: don't share it.",
    "Quedadas y torneos del club. Se actualiza solo cuando se publican eventos nuevos.": "The club's meetups and tournaments. It updates by itself when new events are published.", "Instalar app": "Install app", "Instalar la app": "Install the app", "Entendido": "Got it",
    "Pulsa el botón Compartir de Safari (el cuadrado con la flecha hacia arriba).": "Tap Safari's Share button (the square with an arrow pointing up).",
    "Elige «Añadir a pantalla de inicio».": "Choose «Add to Home Screen».",
    "Pulsa el menú de Firefox (los tres puntos ⋮).": "Tap Firefox's menu (the three dots ⋮).",
    "Elige «Instalar» o «Añadir a pantalla de inicio».": "Choose «Install» or «Add to Home screen».",
    "Confirma: el icono del club aparecerá con el resto de tus apps.": "Confirm: the club icon will appear with the rest of your apps.",
    "Pulsa «Añadir»: el icono del club aparecerá con el resto de tus apps.": "Tap «Add»: the club icon will appear with the rest of your apps.", "Liga": "League", "Jugadas": "Played", "PV a favor": "VP scored", "Diferencia": "Difference",
    "Facciones jugadas en la liga:": "Factions played in the league:", "Ver la Gran Liga": "See the Grand League", "Gran Liga ·": "Grand League ·",
    "Aún no tienes acceso": "You don't have access yet", "Todavía no eres del club": "You're not a club member yet",
    "Tu cuenta está en el servidor de Discord del club, pero todavía no tiene ningún rol del club.": "Your account is on the club's Discord server, but it doesn't have a club role yet.",
    "Para entrar en la web tienes que formar parte del servidor de Discord de Adeptus Baeticus.": "To log in to the site you need to be on the Adeptus Baeticus Discord server.", "Ver las preguntas frecuentes": "See the FAQ", "Filtrar por rol": "Filter by role", "No hay miembros que coincidan.": "No members match.", "No se pudieron cargar los miembros.": "Could not load the members.",
    "Tú": "You", "Ranking ELO de la Gran Liga": "Grand League ELO ranking", "Ver el ranking completo en New Recruit": "See the full ranking on New Recruit",
    "Todavía no aparece en el ranking.": "Not in the ranking yet.", "V-D-E": "W-L-D", "V-D": "W-L", "Ranking ELO": "ELO ranking", "Sin facciones": "No factions", "Facciones": "Factions", "Cuentas": "Accounts",
    "Todavía no ha indicado sus facciones.": "No factions added yet.", "Entra con Discord para ver sus cuentas": "Log in with Discord to see their accounts",
    "Editar mi ficha": "Edit my profile", "Editar ficha": "Edit profile", "Cancelar": "Cancel", "No se pudo guardar.": "Could not save.",
    "Facciones que juegas": "Factions you play", "Caos": "Chaos",
    "Tu usuario o el enlace a tu perfil.": "Your username or a link to your profile.",
    "Tu nombre de perfil o el enlace a tu perfil de Steam.": "Your profile name or a link to your Steam profile.",
    "Tu usuario de New Recruit (se usa para la Gran Liga).": "Your New Recruit username (used for the Grand League).",
    "Tu nombre en BCP.": "Your name on BCP.", "@usuario": "@username",
    "Instagram (opcional)": "Instagram (optional)", "Steam (opcional)": "Steam (optional)", "New Recruit (opcional)": "New Recruit (optional)",
    "BCP (Best Coast Pairings) (opcional)": "BCP (Best Coast Pairings) (optional)", "Conectar con Steam": "Connect with Steam",
    "Conéctala con Steam o escribe tu nombre de perfil o el enlace.": "Connect it with Steam or type your profile name or link.",
    "Su nombre de perfil o el enlace a su perfil de Steam.": "Their profile name or a link to their Steam profile.",
    "✓ Cuenta de Steam conectada.": "✓ Steam account connected.", "Ver perfil de Steam": "View Steam profile",
    "No se pudo conectar la cuenta de Steam. Inténtalo de nuevo.": "Could not connect the Steam account. Please try again.",
    "Veterano": "Veteran", "Aspirante": "Aspirant",
    "Usuario de Instagram no válido": "Invalid Instagram username", "Perfil de Steam no válido": "Invalid Steam profile",
    "Nombre de BCP no válido": "Invalid BCP name", "Usuario de New Recruit no válido": "Invalid New Recruit username",
    "Facción no válida": "Invalid faction", "Solo puedes editar tu propia ficha": "You can only edit your own profile",
    "Ese miembro no existe": "That member does not exist", "Las preguntas se traducen automáticamente del español; puede haber pequeños errores. Tras un cambio, la traducción puede tardar unos minutos: si ves texto en español, refresca la página.": "The questions are machine-translated from Spanish and may contain small mistakes. After a change, the translation can take a few minutes: if you see text in Spanish, refresh the page.",
    "Algunas preguntas aún se están traduciendo y se muestran en español. Puede tardar unos minutos: refresca la página en un rato.": "Some questions are still being translated and are shown in Spanish. This can take a few minutes: please refresh the page in a little while.",
    "Refrescar la página": "Refresh the page", "Descargar PDF": "Download PDF", "PDF · 16 páginas": "PDF · 16 pages", "Buscar en las preguntas": "Search the questions",
    "No hay preguntas que coincidan con la búsqueda.": "No questions match your search.",
    "Todavía no hay preguntas frecuentes.": "There are no FAQs yet.", "No se pudo cargar la FAQ.": "Could not load the FAQ.",
    "Preguntas frecuentes (FAQ)": "FAQ", "Actualizar FAQ desde Discord": "Update FAQ from Discord",
    "Todavía no se ha copiado.": "Not copied yet.", "No se pudo actualizar.": "Could not update.",
    "Espera un momento entre actualizaciones": "Wait a moment between updates", "No encuentro el canal #preguntas-frecuentes": "Channel #preguntas-frecuentes not found",
    "Falta el secreto DISCORD_BOT_TOKEN": "The DISCORD_BOT_TOKEN secret is missing",
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
    "Fotos de los miembros del club.": "Photos by club members.",
    "Inscripción": "Sign up",
    "Inscripción · Adeptus Baeticus": "Sign up · Adeptus Baeticus",
    "Únete a Adeptus Baeticus, el club de Warhammer de Málaga. Al enviar la inscripción entrarás en el servidor de Discord del club como «Externo» y, cuando un admin la apruebe, pasarás a Aspirante y podrás ver los canales y usar la web.": "Join Adeptus Baeticus, the Warhammer club in Málaga. When you send the sign-up you will join the club's Discord server as «Externo» and, once an admin approves it, you will become an Aspirant and be able to see the channels and use the website.",
    "Primero conecta tu cuenta de Discord (así sabemos a quién dar acceso) y después rellena tus datos.": "First connect your Discord account (so we know who to give access to) and then fill in your details.",
    "Ya eres del club": "You're already in the club",
    "Tu cuenta de Discord ya tiene un rol del club, así que no necesitas inscribirte.": "Your Discord account already has a club role, so you don't need to sign up.",
    "No se pudo conectar con Discord. Inténtalo de nuevo.": "Could not connect to Discord. Please try again.",
    "1. Tus cuentas": "1. Your accounts",
    "2. Tus datos": "2. Your details",
    "Discord te pedirá permiso para que el bot del club pueda añadirte a su servidor.": "Discord will ask for permission so the club bot can add you to its server.",
    "Conectar con Discord": "Connect with Discord",
    "Usar otra cuenta": "Use another account",
    "✓ Discord:": "✓ Discord:", "✓ Steam:": "✓ Steam:",
    "Solicitud enviada": "Request sent",
    "Ya tienes una solicitud pendiente y ya estás en el servidor de Discord del club. Cuando un admin la apruebe, pasarás a Aspirante.": "You already have a pending request and you are already in the club's Discord server. Once an admin approves it, you will become an Aspirant.",
    "Enviar inscripción": "Send sign-up",
    "Nombre y apellidos": "Full name",
    "Correo electrónico": "Email",
    "Teléfono": "Phone",
    "Para añadirte al canal de WhatsApp del club.": "To add you to the club's WhatsApp channel.",
    "¿Eres mayor de edad?": "Are you over 18?",
    "Sí": "Yes",
    "No": "No",
    "¿Qué te interesa? (opcional)": "What are you interested in? (optional)",
    "Pintura y modelismo": "Painting and modelling",
    "Otros": "Others",
    "Experiencia de juego": "Gaming experience",
    "Experiencia de pintura": "Painting experience",
    "Nunca he jugado a juegos de miniaturas": "I have never played miniature games",
    "He jugado a otros juegos de miniaturas, pero no a Warhammer": "I have played other miniature games, but not Warhammer",
    "He jugado alguna partida de prueba de Warhammer": "I have played a Warhammer demo game",
    "Estoy aprendiendo las reglas (menos de 10 partidas)": "I'm learning the rules (fewer than 10 games)",
    "Juego de vez en cuando (alguna partida al mes)": "I play now and then (a game a month or so)",
    "Juego con regularidad (varias partidas al mes)": "I play regularly (several games a month)",
    "Juego torneos o ligas": "I play tournaments or leagues",
    "Nunca he pintado miniaturas": "I have never painted miniatures",
    "Estoy empezando (imprimación y colores base)": "I'm starting out (priming and base colours)",
    "Nivel básico (capas, lavados y pincel seco)": "Basic level (layers, washes and drybrushing)",
    "Nivel intermedio (iluminaciones, perfilados y peanas trabajadas)": "Intermediate level (highlights, edge highlighting and detailed bases)",
    "Nivel avanzado (degradados, efectos y nivel de concurso)": "Advanced level (blending, effects and competition level)",
    "¿Cómo nos has conocido? (opcional)": "How did you hear about us? (optional)",
    "Un amigo o conocido": "A friend or acquaintance",
    "En la tienda (2d6 Store)": "At the shop (2d6 Store)",
    "En un torneo o evento": "At a tournament or event",
    "El blog del club": "The club blog",
    "Otro": "Other",
    "¿Dónde?": "Where?",
    "Condiciones": "Terms",
    "Acepto los estatutos y el reglamento interno del club.": "I accept the club's statutes and internal rules.",
    "(leer los estatutos)": "(read the statutes)",
    "Acepto que el club guarde estos datos para gestionar mi inscripción y contactar conmigo.": "I agree that the club may keep this data to manage my sign-up and contact me.",
    "Escribe tu nombre y apellidos.": "Write your full name.",
    "Escribe un correo electrónico válido.": "Write a valid email.",
    "Escribe un teléfono válido (con prefijo si no es de España).": "Write a valid phone number (with country code if not Spanish).",
    "Indica si eres mayor de edad.": "Say whether you are over 18.",
    "Elige tu experiencia de juego.": "Choose your gaming experience.",
    "Elige tu experiencia de pintura.": "Choose your painting experience.",
    "Tienes que aceptar los estatutos y el reglamento interno.": "You must accept the statutes and internal rules.",
    "Tienes que aceptar el tratamiento de tus datos.": "You must accept the processing of your data.",
    "No se pudo enviar la inscripción.": "Could not send the sign-up.",
    "No se pudo enviar la inscripción. Revisa la conexión.": "Could not send the sign-up. Check your connection.",
    "¡Inscripción enviada!": "Sign-up sent!",
    "Gracias. Ya estás en el servidor de Discord del club con el rol de Externo. Cuando un admin apruebe tu solicitud, pasarás a Aspirante y podrás ver los canales y entrar en la web.": "Thank you. You are now in the club's Discord server with the Externo role. Once an admin approves your request, you will become an Aspirant and be able to see the channels and log in to the website.",
    "Conecta tu cuenta de Discord para enviar la inscripción.": "Connect your Discord account to send the sign-up.",
    "Datos no válidos.": "Invalid data.",
    "Ya tienes una solicitud pendiente. Un admin la revisará pronto.": "You already have a pending request. An admin will review it soon.",
    "Si ya enviaste tu inscripción, espera a que un admin la apruebe. Si no, rellénala.": "If you already sent your sign-up, wait for an admin to approve it. If not, fill it in.",
    "¿Quieres unirte? Rellena la inscripción: cuando un admin la apruebe, pasarás a Aspirante y podrás entrar en la web.": "Want to join? Fill in the sign-up form: once an admin approves it, you will become an Aspirant and be able to log in to the website.",
    "Rellenar la inscripción": "Fill in the sign-up form",
    "Conectar con Steam (opcional)": "Connect with Steam (optional)", "Para partidas online con Tabletop Simulator.": "For online games with Tabletop Simulator.",
    "Sin conectar": "Not connected", "La que has conectado arriba.": "The one you connected above.",
    "Puedes conectarla arriba con «Conectar con Steam».": "You can connect it above with “Connect with Steam”.",
    "No se pudo guardar la inscripción. Inténtalo de nuevo.": "Could not save the sign-up. Please try again.",
    "Cuenta de Discord": "Discord account", "La que has conectado arriba. Para usar otra, pulsa «Usar otra cuenta».": "The one you connected above. To use another one, press “Use another account”.",
    "Cuenta de Steam (opcional)": "Steam account (optional)",
    "Subir fotos": "Upload photos", "Ajustar": "Fit", "Alejar": "Zoom out", "Acercar": "Zoom in", "Publicar": "Post", "Bendecida por el Emperador y por los Poderes Ruinosos": "Blessed by the Emperor and by the Ruinous Powers", "Fotos (hasta 10)": "Photos (up to 10)", "Pulsa para elegir fotos": "Tap to choose photos",
    "Por ejemplo: mis Marines Espaciales recién pintados": "For example: my freshly painted Space Marines",
    "Solo se pueden subir 10 fotos por publicación; las demás no se han añadido.": "Only 10 photos can be uploaded per post; the rest were not added.",
    "Elige al menos una foto.": "Choose at least one photo.",
    "Entra con Discord para subir fotos": "Log in with Discord to upload photos", "No se pudo leer la foto.": "Could not read the photo.",
    "La foto debe ser PNG, JPG, GIF o WEBP.": "The photo must be PNG, JPG, GIF or WEBP.", "Cada foto puede ocupar como máximo 10 MB.": "Each photo can be at most 10 MB.",
    "Solo los miembros pueden subir fotos a la galería.": "Only members can upload photos to the gallery.",
    "Has llegado al máximo de 10 publicaciones al día. Prueba mañana.": "You have reached the limit of 10 posts per day. Try again tomorrow.",
    "No se encuentra el canal #publicaciones-web en Discord. Avisa a un admin.": "The #publicaciones-web channel can't be found on Discord. Tell an admin.",
    "La foto ocupa demasiado para Discord.": "The photo is too large for Discord.", "Esa publicación ya no existe.": "That post no longer exists.",
    "Solo puedes borrar tus propias publicaciones.": "You can only delete your own posts.", "Solo puedes añadir fotos a tus propias publicaciones.": "You can only add photos to your own posts.",
    "La publicación ya tiene 10 fotos, que es el máximo.": "The post already has 10 photos, which is the maximum.",
    "No se pudo añadir la foto en Discord.": "Could not add the photo on Discord.",

    "Más recientes": "Most recent",
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
    [/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}) · (Quedada|Torneo)( online \(TTS\))? · (publicado|borrador|cancelado)$/, (m, f, t, o, e) => f + " · " + (o ? "Online tournament (TTS)" : EXACT[t]) + " · " + EXACT[e]],
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
    [/^Ronda (\d+) · contra$/, "Round $1 · against"],
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
    [/^Actualizado el (.+)$/, (m, f) => "Updated " + fechas(f)],
    [/^Editar la ficha de (.+)$/, "Edit $1's profile"],
    [/^Miembro (\d+)$/, "Member $1"],
    [/^(Cierra|Cerró) el (.+) a las (\d\d:\d\d)$/, (m, v, f, h) => (v === "Cierra" ? "Closes on " : "Closed on ") + fechas(f) + " at " + h],
    [/^Ya has votado · Cierra el (.+) a las (\d\d:\d\d)$/, (m, f, h) => "You've voted · Closes on " + fechas(f) + " at " + h],
    [/^Ya has votado · Sin fecha de cierre$/, "You've voted · No closing date"],
    [/^Quitar foto (\d+)$/, "Remove photo $1"],
    [/^(1 foto elegida|(\d+) fotos elegidas) de 10 como máximo\.$/, (m, a, n) => (n ? n + " photos" : "1 photo") + " chosen, 10 at most."],
    [/^Subiendo foto (\d+) de (\d+)…$/, "Uploading photo $1 of $2…"],
    [/^No se pudo leer la foto (\d+)\.$/, "Could not read photo $1."],
    [/^No se pudo subir la foto (\d+)\.$/, "Could not upload photo $1."],
    [/^No se pudo subir la foto (\d+)\. Revisa la conexión\.$/, "Could not upload photo $1. Check your connection."],
    [/^No se pudo publicar en Discord \(error (\d+)\)\.$/, "Could not post on Discord (error $1)."],
    [/^No se pudo borrar el mensaje en Discord \(error (\d+)\)\.$/, "Could not delete the message on Discord (error $1)."],
    [/^¿Borrar la publicación #(\d+)\?$/, "Delete post #$1?"],
    [/^Publicación #(\d+): se han subido (\d+) de (\d+) fotos\. (.+)$/, (m, n, a, b, e) => "Post #" + n + ": " + a + " of " + b + " photos were uploaded. " + tr(e)],
    [/^Físico · (.+)$/, "In person · $1"],
    [/^(\d+) encuestas? sin votar$/, (m, n) => n + (n === "1" ? " poll" : " polls") + " not voted yet"],
    [/^¿Cerrar ahora la encuesta «(.+)»\? Ya no se podrá votar\.$/, "Close the poll «$1» now? Voting will no longer be possible."],
    [/^(\d+) votos?$/, (m, n) => n + (n === "1" ? " vote" : " votes")],
    [/^(\d+) votos? · (\d+) %$/, (m, n, p) => n + (n === "1" ? " vote" : " votes") + " · " + p + "%"],
    [/^¿Borrar la encuesta «(.+)» y sus votos\?$/, "Delete the poll «$1» and its votes?"],
    [/^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre) de (\d{4})$/i, (m, mes, y) => MESES[mes.toLowerCase()] + " " + y],
    [/^(.+) — ([123])\.º puesto · (Individual|Parejas|Equipo|Pintura)$/, (m, n, p, mo) => n + " — " + ({ 1: "1st", 2: "2nd", 3: "3rd" })[p] + " place · " + ({ Individual: "Individual", Parejas: "Pairs", Equipo: "Team", Pintura: "Painting" })[mo]],
    [/^(\d+) trofeos?$/, (m, n) => n + (n === "1" ? " trophy" : " trophies")],
    [/^¿Quitar el trofeo «(.+)»\?$/, "Remove the trophy «$1»?"],
    [/^(.+) · ([123])\.º puesto · (Individual|Parejas|Equipo|Pintura)(?: con (.+))?$/, (m, n, p, mo, c) => n + " · " + ({ 1: "1st", 2: "2nd", 3: "3rd" })[p] + " place · " + ({ Individual: "Individual", Parejas: "Pairs", Equipo: "Team", Pintura: "Painting" })[mo] + (c ? " with " + c : "")],
    [/^([123])\.º puesto · (Individual|Parejas|Equipo|Pintura)(?: con (.+))?$/, (m, p, mo, c) => ({ 1: "1st", 2: "2nd", 3: "3rd" })[p] + " place · " + ({ Individual: "Individual", Parejas: "Pairs", Equipo: "Team", Pintura: "Painting" })[mo] + (c ? " with " + c : "")],
    [/^([123])\.º puesto · (Individual|Parejas|Equipo|Pintura) ·$/, (m, p, mo) => ({ 1: "1st", 2: "2nd", 3: "3rd" })[p] + " place · " + ({ Individual: "Individual", Parejas: "Pairs", Equipo: "Team", Pintura: "Painting" })[mo] + " ·"],
    [/^Partida · disponible (\d\d:\d\d)–(\d\d:\d\d)$/, "Game · available $1–$2"],
    [/^Hoy · (.+)$/, (m, f) => "Today · " + fechas(f)],
    [/^Mañana · (.+)$/, (m, f) => "Tomorrow · " + fechas(f)],
    [/^de (\d+)$/, "of $1"],
    [/^Copia del (.+?) UTC( · último error: .+?)? · Inglés: (\d+) textos traducidos(?: \(error: (.+)\))?$/, (m, f, e, n, x) => "Copy from " + f + " UTC" + (e ? " · last error: " + e.slice(17) : "") + " · English: " + n + " texts translated" + (x ? " (error: " + x + ")" : "")],
    [/^Copia del (.+?) UTC( · último error: .+?)? · Inglés: Workers AI no está activado$/, (m, f, e) => "Copy from " + f + " UTC" + (e ? " · last error: " + e.slice(17) : "") + " · English: Workers AI is not enabled"],
    [/^Copia del (.+) UTC$/, "Copy from $1 UTC"],
    [/^Copia del (.+) UTC · último error: (.+)$/, "Copy from $1 UTC · last error: $2"],
    [/^Discord respondió (\d+) al leer #preguntas-frecuentes(.*)$/, (m, n, x) => "Discord returned " + n + " when reading #preguntas-frecuentes" + (x ? " (the bot needs to see the channel and read its history)" : "")],
    [/^Discord respondió (\d+) al pedir los canales$/, "Discord returned $1 when listing channels"],
    [/^Discord entrega los (\d+) mensajes del canal sin texto: activa «Message Content Intent» del bot en el portal de desarrolladores de Discord(.*)$/, "Discord returns the channel's $1 messages without text: enable the bot's «Message Content Intent» in the Discord developer portal$2"],
    [/^El canal #preguntas-frecuentes no tiene mensajes que el bot pueda leer$/, "The #preguntas-frecuentes channel has no messages the bot can read"],
    [/^FAQ: (\d+) mensajes? de #preguntas-frecuentes · actualizada (.+)$/, (m, n, f) => "FAQ: " + n + " message" + (n === "1" ? "" : "s") + " from #preguntas-frecuentes · updated " + f],
    [/^FAQ actualizada: (\d+) mensajes?\.$/, (m, n) => "FAQ updated: " + n + " message" + (n === "1" ? "" : "s") + "."],
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
    ["Resultados: ", "Results: "], ["Torneo: ", "Tournament: "], ["Ranking ELO: ", "ELO ranking: "], ["actualizado ", "updated "], ["sin datos", "no data"],
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
    // Aviso a las páginas que pintan contenido propio en cada idioma (p. ej. la FAQ traducida).
    window.dispatchEvent(new CustomEvent("ab-idioma", { detail: code }));
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
