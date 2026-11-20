// Contenido de las secciones Recursos y Tutoriales (Warhammer 40K) y Necromunda y Blood Bowl (Juegos de especialista).
// Cada texto va en español e inglés ({ es, en }) y se pinta según el idioma elegido (evento «ab-idioma»), como la FAQ:
// por eso el bloque lleva translate="no" (i18n.js no lo toca). Enlaces externos: solo fuentes oficiales de Games
// Workshop salvo los marcados como «de la comunidad». Comprobado en noviembre de 2026.
(function () {
  const WC = "https://www.warhammer-community.com/en-gb";
  const PDF = "https://assets.warhammer-community.com/";
  const DESCARGAS_40K = WC + "/downloads/warhammer-40000/";
  const fp = (fecha, nombre, hash) => PDF + "eng_" + fecha + "_warhammer40000_faction_pack_" + nombre + "-" + hash + ".pdf";
  const yt = (id) => "https://www.youtube.com/watch?v=" + id;
  const t = (es, en) => ({ es, en: en || es });

  // Facciones: [nombre en español, nombre en inglés, enlace al pack de facción (o null → página de descargas)]
  const FACCIONES = [
    [t("Imperio", "Imperium"), [
      ["Marines Espaciales", "Space Marines", null],
      ["Ángeles Sangrientos", "Blood Angels", null],
      ["Ángeles Oscuros", "Dark Angels", fp("08-06", "dark_angels", "fw4ot2jwtw-hplla1qiky")],
      ["Lobos Espaciales", "Space Wolves", fp("08-06", "space_wolves", "secweiq0m1-z9ayyyugii")],
      ["Templarios Negros", "Black Templars", fp("08-06", "black_templars", "3rhveur6zi-dsptpcxpkh")],
      ["Guardianes de la Muerte", "Deathwatch", null],
      ["Caballeros Grises", "Grey Knights", null],
      ["Adepta Sororitas", "Adepta Sororitas", fp("11-06", "adepta_sororitas", "ktlklgb0t5-knvswx9kyw")],
      ["Adeptus Custodes", "Adeptus Custodes", fp("11-06", "adeptus_custodes", "dntocqoxie-fpdm060c9y")],
      ["Adeptus Mechanicus", "Adeptus Mechanicus", fp("11-06", "adeptus_mechanicus", "4dczibqdew-ebqqmotlpe")],
      ["Astra Militarum", "Astra Militarum", fp("11-06", "astra_militarum", "etf9ihpodv-mbqdsa1bfv")],
      ["Agentes Imperiales", "Imperial Agents", fp("11-06", "imperial_agents", "qhp2xzepry-gapdknla3x")],
      ["Caballeros Imperiales", "Imperial Knights", fp("11-06", "imperial_knights", "uoieohputz-totyd7mvs6")],
      ["Adeptus Titanicus", "Adeptus Titanicus", fp("11-06", "adeptus_titanicus", "w2uqxtzclf-9hqf20r3dc")],
    ]],
    [t("Caos", "Chaos"), [
      ["Marines Espaciales del Caos", "Chaos Space Marines", fp("10-06", "chaos_space_marines", "h16lkqvvnq-bcejav0qap")],
      ["Guardia de la Muerte", "Death Guard", fp("10-06", "death_guard", "dgm6djcpoa-iiqvmsh0op")],
      ["Mil Hijos", "Thousand Sons", null],
      ["Devoradores de Mundos", "World Eaters", null],
      ["Hijos del Emperador", "Emperor's Children", null],
      ["Demonios del Caos", "Chaos Daemons", null],
      ["Caballeros del Caos", "Chaos Knights", null],
    ]],
    [t("Xenos", "Xenos"), [
      ["Aeldari", "Aeldari", fp("09-06", "aeldari", "glkjirbhiw-9udkry7xbr")],
      ["Drukhari", "Drukhari", fp("09-06", "drukhari", "ysf8uw2dyf-mxcaurb7zn")],
      ["Cultos Genestealer", "Genestealer Cults", fp("09-06", "genestealer_cults", "ee2tg004ty-lfbh6g1gr7")],
      ["Ligas de Votann", "Leagues of Votann", fp("09-06", "leagues_of_votann", "awex3qmdiz-clwoaoyyos")],
      ["Necrones", "Necrons", fp("09-06", "necrons", "qodfthk7tt-bzeqy07okc")],
      ["Orkos", "Orks", fp("09-06", "orks", "agh9kwrtno-0xarrl5fjj")],
      ["Tiránidos", "Tyranids", fp("09-06", "tyranids", "avhhzmcte8-j0kseag7td")],
      ["Imperio T'au", "T'au Empire", null],
    ]],
  ];

  // Bloques: { t, tx, enlaces: [{ t, u, d (detalle), tipo: "pdf"|"web"|"video"|"app", com (de la comunidad) }], facciones, lista }
  const GUIAS = {
    "/warhammer-40k/recursos": {
      cat: "Warhammer 40K", ic: "recursos", t: t("Recursos", "Resources"),
      intro: t("Todo lo oficial para jugar a la 11.ª edición de Warhammer 40.000 (desde junio de 2026): reglas básicas gratuitas, el documento de cada facción, el equilibrio de puntos y la app oficial.",
        "Everything official to play the 11th edition of Warhammer 40,000 (since June 2026): free core rules, each faction's document, points balance and the official app."),
      bloques: [
        { t: t("Reglas básicas", "Core rules"), tx: t("Las reglas básicas de la 11.ª edición son gratuitas: se descargan en PDF desde Warhammer Community y también vienen en la app.",
            "The 11th edition core rules are free: download the PDF from Warhammer Community; they're also in the app."),
          enlaces: [
            { t: t("Descarga las reglas básicas gratis", "Download the free core rules"), u: WC + "/articles/nhqt9wx3/new40k-rules-download-the-free-core-rules-now/", d: t("Warhammer Community · 11.ª edición", "Warhammer Community · 11th edition"), tipo: "pdf" },
            { t: t("Página de descargas de Warhammer 40.000", "Warhammer 40,000 downloads page"), u: DESCARGAS_40K, d: t("Reglas, packs de facción, Balance Dataslate, puntos y misiones: siempre la última versión", "Rules, faction packs, Balance Dataslate, points and missions: always the latest version"), tipo: "web" },
          ] },
        { t: t("Documento de cada facción", "Each faction's document"), tx: t("Cada ejército tiene su «Faction Pack» gratuito con los cambios de la 11.ª edición: destacamentos, hojas de datos, reglas y preguntas frecuentes. Estos son los de su primera versión (junio de 2026); las facciones sin enlace directo y las versiones nuevas están en la página de descargas.",
            "Each army has a free Faction Pack with the 11th edition changes: detachments, datasheets, rules and FAQs. These are their first versions (June 2026); factions without a direct link and newer versions are on the downloads page."),
          facciones: true },
        { t: t("Equilibrio y puntos", "Balance and points"), tx: t("Games Workshop revisa el juego cada pocos meses: el «Balance Dataslate» (cambios de reglas) y el «Munitorum Field Manual» (puntos de cada unidad). Se publican en la página de descargas y se actualizan solos en la app.",
            "Games Workshop reviews the game every few months: the Balance Dataslate (rule changes) and the Munitorum Field Manual (points for each unit). They're published on the downloads page and updated automatically in the app."),
          enlaces: [
            { t: t("Balance Dataslate y Munitorum Field Manual", "Balance Dataslate and Munitorum Field Manual"), u: DESCARGAS_40K, d: t("Página de descargas de Warhammer Community", "Warhammer Community downloads page"), tipo: "web" },
            { t: t("Munitorum Field Manual en la web", "Munitorum Field Manual online"), u: "https://mfm.warhammer-community.com/", d: t("Los puntos de cada unidad, consultables y siempre al día (oficial)", "Points for every unit, searchable and always up to date (official)"), tipo: "web" },
          ] },
        { t: t("App oficial de Warhammer 40.000", "Official Warhammer 40,000 app"), tx: t("La app oficial de Games Workshop (gratuita, con compras dentro) trae las reglas básicas y las hojas de datos de Patrulla de Combate gratis, crea listas de ejército con los puntos al día y lleva la puntuación de la partida. El resto del contenido (hojas de todos los ejércitos, etc.) es de pago.",
            "The official Games Workshop app (free, with in-app purchases) includes the core rules and the Combat Patrol datasheets for free, builds army lists with up-to-date points and tracks the score of your game. The rest of the content (all army datasheets, etc.) is paid."),
          enlaces: [
            { t: t("Descargar para iPhone y iPad (App Store)", "Download for iPhone and iPad (App Store)"), u: "https://apps.apple.com/app/id6443503982", d: t("Warhammer 40,000: The App", "Warhammer 40,000: The App"), tipo: "app" },
            { t: t("Descargar para Android (Google Play)", "Download for Android (Google Play)"), u: "https://play.google.com/store/apps/details?id=com.gamesworkshop.w40k", d: t("Warhammer 40,000: The App", "Warhammer 40,000: The App"), tipo: "app" },
            { t: t("La app para la nueva edición", "The app for the new edition"), u: WC + "/articles/dv1aslrr/new40k-new-app-for-a-new-edition/", d: t("Warhammer Community · qué incluye", "Warhammer Community · what's included"), tipo: "web" },
          ] },
        { t: t("Herramientas del club", "Club tools"), tx: t("Las listas de la Gran Liga y de los torneos del club se hacen y se envían en New Recruit; para consultar reglas, Wahapedia, y para jugar online, Tabletop Simulator.",
            "Lists for the Grand League and the club's tournaments are built and submitted on New Recruit; Wahapedia to look up rules, and Tabletop Simulator to play online."),
          enlaces: [
            { t: t("New Recruit", "New Recruit"), u: "https://www.newrecruit.eu/", d: t("Constructor de listas y torneos (de la comunidad)", "List builder and tournaments (community)"), tipo: "web", com: true },
            { t: t("Wahapedia (11.ª edición)", "Wahapedia (11th edition)"), u: "https://wahapedia.ru/wh40k11ed/nav.html", d: t("Reglas, hojas de datos y puntos de todas las facciones (de la comunidad)", "Rules, datasheets and points for every faction (community)"), tipo: "web", com: true },
            { t: t("Tabletop Simulator: comparar precios", "Tabletop Simulator: compare prices"), u: "https://www.allkeyshop.com/blog/buy-tabletop-simulator-cd-key-compare-prices/", d: t("Para jugar online: las partidas online del club son en Tabletop Simulator (Allkeyshop)", "To play online: the club's online games use Tabletop Simulator (Allkeyshop)"), tipo: "web", com: true },
            { t: t("Gran Liga Adeptus Baeticus", "Adeptus Baeticus Grand League"), u: "/warhammer-40k/gran-liga", d: t("Clasificación, rondas y resultados", "Standings, rounds and results"), tipo: "club" },
            { t: t("Ranking ELO del club", "Club ELO ranking"), u: "/warhammer-40k/ranking-elo", d: t("Cómo vas frente al resto del club", "How you stack up against the rest of the club"), tipo: "club" },
          ] },
      ],
    },
    "/warhammer-40k/tutoriales": {
      cat: "Warhammer 40K", ic: "tutoriales", t: t("Tutoriales", "Tutorials"),
      intro: t("Vídeos para aprender a jugar a la 11.ª edición de Warhammer 40.000: primero en español y después la serie oficial en inglés, fase a fase. Se ven aquí mismo al pulsar «Reproducir».",
        "Videos to learn to play the 11th edition of Warhammer 40,000: first in Spanish, then the official series in English, phase by phase. Press «Play» to watch them right here."),
      bloques: [
        { t: t("En español", "In Spanish"), tx: t("Para empezar sin pelearte con el inglés.", "To get started in Spanish."),
          enlaces: [
            { t: t("Cómo jugar a Warhammer 40.000 · 11.ª edición", "How to play Warhammer 40,000 · 11th edition"), u: yt("PLoCnPFgF2o"), d: t("La Voz de Horus: para quien empieza y para quien viene de la 10.ª", "La Voz de Horus: for newcomers and players coming from 10th"), tipo: "video", com: true },
            { t: t("Duelo entre el Caos: aprende a jugar en la 11.ª edición", "Duel among Chaos: learn to play 11th edition"), u: yt("oguC6ytvh3o"), d: t("Partida de iniciación explicada", "Explained introductory game"), tipo: "video" },
            { t: t("Aprende las reglas básicas en 15 minutos", "Learn the core rules in 15 minutes"), u: yt("RRQea_jFOn4"), d: t("Resumen rápido, paso a paso", "Quick step-by-step summary"), tipo: "video", com: true },
            { t: t("Podcast: aprende a jugar en menos de una hora", "Podcast: learn to play in under an hour"), u: "https://www.lavozdehorus.com/podcast-472-aprende-a-jugar-warhammer-40k-en-menos-de-una-hora/", d: t("La Voz de Horus · episodio 472, con los cambios respecto a la 10.ª", "La Voz de Horus · episode 472, with the changes from 10th"), tipo: "web", com: true },
            { t: t("Canal de La Voz de Horus", "La Voz de Horus channel"), u: "https://www.youtube.com/@lavozdehorus", d: t("Más vídeos de 40K en español", "More 40K videos in Spanish"), tipo: "web", com: true },
          ] },
        { t: t("Serie «How to Play Warhammer 40K 11th Edition» (en inglés)", "«How to Play Warhammer 40K 11th Edition» series"), tx: t("Serie con ScottyD (YouTube permite activar subtítulos en español) que repasa las reglas básicas de la nueva edición, de los conceptos generales a cada fase del turno. Empieza por la introducción.",
            "Series with ScottyD covering the new edition's core rules, from the general concepts to each phase of the turn. Start with the introduction."),
          enlaces: [
            { t: t("1 · Introducción a la 11.ª edición", "1 · Introduction to 11th edition"), u: yt("eCZ6n2yTMM8"), d: t("Visión general del juego", "General overview of the game"), tipo: "video" },
            { t: t("2 · Conceptos básicos", "2 · Core concepts"), u: yt("N06u4UQEMQk"), d: t("Lo que hay que saber antes de jugar", "What you need to know before playing"), tipo: "video" },
            { t: t("3 · Fase de mando y chequeos de moral", "3 · Command phase and Battle-shock"), u: yt("_iIHfEr-h3Y"), d: t("Puntos de mando y Battle-shock", "Command points and Battle-shock"), tipo: "video" },
            { t: t("4 · Fase de carga", "4 · Charge phase"), u: yt("7pg4zfIxD8k"), d: t("Cómo cargar contra el enemigo", "How to charge the enemy"), tipo: "video" },
            { t: t("Todos los capítulos de la serie", "Every episode of the series"), u: "https://www.youtube.com/results?search_query=%22How+to+Play+Warhammer+40K+11th+Edition%22+ScottyD", d: t("Movimiento, disparo, combate y el resto, en YouTube", "Movement, shooting, fight and the rest, on YouTube"), tipo: "video" },
          ] },
        { t: t("Canal oficial y más vídeos", "Official channel and more videos"), tx: t("El canal oficial de Warhammer publica novedades, guías de pintura y partidas. Si prefieres aprender jugando, la Patrulla de Combate es el formato más corto para empezar.",
            "The official Warhammer channel publishes news, painting guides and battle reports. If you prefer learning by playing, Combat Patrol is the shortest format to start with."),
          enlaces: [
            { t: t("Canal oficial de Warhammer en YouTube", "Official Warhammer YouTube channel"), u: "https://www.youtube.com/@warhammer", d: t("Games Workshop", "Games Workshop"), tipo: "video" },
            { t: t("Partida explicada: Ángeles Sangrientos contra Orkos", "Explained game: Blood Angels vs Orks"), u: yt("DF7f04a_MUk"), d: t("Las reglas básicas en una partida de ejemplo", "The core rules in an example game"), tipo: "video" },
            { t: t("Reglas básicas gratis (PDF)", "Free core rules (PDF)"), u: WC + "/articles/nhqt9wx3/new40k-rules-download-the-free-core-rules-now/", d: t("Para seguir los vídeos con el reglamento delante", "To follow the videos with the rulebook at hand"), tipo: "pdf" },
          ] },
        { t: t("¿Y ahora?", "What now?"), tx: t("Busca rival en el calendario del club o ven a la quedada del primer sábado de cada mes: siempre hay alguien dispuesto a enseñar.",
            "Find an opponent in the club calendar or come to the meetup on the first Saturday of every month: there's always someone happy to teach."),
          enlaces: [{ t: t("Buscar partida en el calendario", "Find a game in the calendar"), u: "/calendario.html", d: t("Partidas y quedadas del club", "Club games and meetups"), tipo: "club" }] },
      ],
    },
    "/juegos-de-especialista/necromunda": {
      cat: t("Juegos de especialista", "Specialist games"), ic: "necromunda", t: t("Necromunda", "Necromunda"),
      intro: t("Necromunda es el juego de escaramuzas de bandas en la colmena de Necromunda: pequeñas bandas de 6 a 12 miniaturas que luchan por territorio, ganan experiencia y mejoran campaña a campaña. Desde agosto de 2026 hay edición nueva: «Necromunda Skirmish».",
        "Necromunda is the gang skirmish game set in the hive city of Necromunda: small gangs of 6 to 12 models fight over territory, gain experience and improve campaign after campaign. Since August 2026 there's a new edition: «Necromunda Skirmish»."),
      bloques: [
        { t: t("Cómo empezar", "How to start"), tx: t("Lo más fácil es la caja de inicio (Core Set): trae el reglamento, dos bandas completas (Escher y Goliath, 8 miniaturas cada una), tablero, dados, plantillas y escenografía. Si ya tienes miniaturas, sirven: solo necesitas el reglamento y el libro de tu banda.",
            "The easiest way is the Core Set: it includes the rulebook, two complete gangs (Escher and Goliath, 8 models each), a board, dice, templates and terrain. If you already have models they still work: you only need the rulebook and your gang's book."),
          lista: [
            t("Reglamento (Core Rulebook): las reglas del juego y de las campañas.", "Core Rulebook: the game and campaign rules."),
            t("Gangs of the Underhive: las bandas de la subcolmena.", "Gangs of the Underhive: the underhive gangs."),
            t("Gangs of the Outlands: las bandas de los páramos exteriores.", "Gangs of the Outlands: the outlands gangs."),
            t("Las miniaturas que no salen en esos libros tienen reglas gratuitas en Warhammer Community.", "Models not covered in those books get free rules on Warhammer Community."),
          ] },
        { t: t("Bandas", "Gangs"), tx: t("En «Gangs of the Underhive»: las seis Casas (Goliath, Escher, Orlock, Van Saar, Cawdor y Delaque), los Ejecutores Palatinos, los Venators, los Cultos Corpse Grinder y las Cortes Justicar. En «Gangs of the Outlands», las bandas de fuera de la colmena, como los Nómadas de los Yermos de Ceniza. Los dos libros incluyen mercenarios (Hired Guns), brutos, acompañantes y mascotas.",
            "In «Gangs of the Underhive»: the six Houses (Goliath, Escher, Orlock, Van Saar, Cawdor and Delaque), Palanite Enforcers, Venators, Corpse Grinder Cults and Justicar Courts. In «Gangs of the Outlands», gangs from outside the hive, such as the Ash Waste Nomads. Both books include Hired Guns, Brutes, Hangers-on and Pets."),
          lista: [
            t("Goliath: brutos fuertes y duros, ideales para empezar.", "Goliath: strong, tough brutes, great to start with."),
            t("Escher: rápidas y letales en cuerpo a cuerpo, con venenos.", "Escher: fast and deadly in close combat, with poisons."),
            t("Orlock: tiradores fiables y equilibrados.", "Orlock: reliable, balanced shooters."),
            t("Van Saar: tecnología avanzada y armas de alcance.", "Van Saar: advanced technology and ranged weapons."),
            t("Cawdor: fanáticos numerosos y baratos.", "Cawdor: numerous, cheap zealots."),
            t("Delaque: espías y emboscadas.", "Delaque: spies and ambushes."),
          ] },
        { t: t("Reglas y enlaces", "Rules and links"), tx: "",
          enlaces: [
            { t: t("Descargas de Necromunda", "Necromunda downloads"), u: WC + "/downloads/necromunda/", d: t("Reglas gratuitas, FAQ y erratas en Warhammer Community", "Free rules, FAQs and errata on Warhammer Community"), tipo: "web" },
            { t: t("Presentación de la nueva edición", "New edition preview"), u: WC + "/articles/ek1kn9kh/sunday-preview-the-new-edition-of-necromunda-emerges-from-the-underhive/", d: t("Warhammer Community", "Warhammer Community"), tipo: "web" },
            { t: t("Personajes clásicos con reglas gratuitas", "Classic characters with free rules"), u: WC + "/articles/xxoq2ns3/classic-characters-are-getting-free-necromunda-rules/", d: t("Warhammer Community", "Warhammer Community"), tipo: "web" },
            { t: t("Necromunda en la tienda de Warhammer", "Necromunda in the Warhammer store"), u: "https://www.warhammer.com/en-GB/shop/necromunda-gangs-of-the-underhive-2026-eng", d: t("Gangs of the Underhive y el resto de la gama", "Gangs of the Underhive and the rest of the range"), tipo: "web" },
          ] },
        { t: t("Jugar en el club", "Playing at the club"), tx: t("Al buscar partida en el calendario puedes elegir Necromunda (para 2 o más jugadores). Si quieres montar una campaña, proponla en Discord.",
            "When you look for a game in the calendar you can choose Necromunda (for 2 or more players). If you want to run a campaign, suggest it on Discord."),
          enlaces: [{ t: t("Buscar partida en el calendario", "Find a game in the calendar"), u: "/calendario.html", d: t("Partidas y quedadas del club", "Club games and meetups"), tipo: "club" }] },
      ],
    },
    "/juegos-de-especialista/blood-bowl": {
      cat: t("Juegos de especialista", "Specialist games"), ic: "bloodbowl", t: t("Blood Bowl", "Blood Bowl"),
      intro: t("Blood Bowl es el fútbol americano de fantasía de Games Workshop: dos equipos de 11 jugadores, placajes, pases y mucha violencia. Se juega por turnos en un campo de casillas y es ideal para ligas. La edición actual es la «Third Season Edition» (noviembre de 2025).",
        "Blood Bowl is Games Workshop's fantasy football: two teams of 11 players, blocks, passes and plenty of violence. It's played in turns on a squared pitch and is ideal for leagues. The current edition is the «Third Season Edition» (November 2025)."),
      bloques: [
        { t: t("Cómo empezar", "How to start"), tx: t("La caja de la Third Season Edition trae todo para jugar: dos equipos (Bretonianos y Reyes Funerarios), el reglamento de unas 200 páginas con las reglas de todos los equipos, ligas y partidas de exhibición, un campo de doble cara, banquillos, fichas y dados.",
            "The Third Season Edition box has everything you need: two teams (Bretonnians and Tomb Kings), a rulebook of about 200 pages with the rules for every team, leagues and exhibition games, a double-sided pitch, dugouts, tokens and dice."),
          lista: [
            t("Para aprender, los equipos de la caja o equipos equilibrados como Humanos u Orcos.", "To learn, the box teams or balanced teams like Humans or Orcs."),
            t("Cada equipo se crea con un presupuesto (1.000.000 de monedas en partidas de exhibición) y mejora partido a partido en liga.", "Each team is built on a budget (1,000,000 gold pieces in exhibition games) and improves game after game in a league."),
            t("Los nuevos equipos salen con su caja y su revista Spike! Journal.", "New teams come out with their box and their Spike! Journal."),
          ] },
        { t: t("Equipos y niveles", "Teams and tiers"), tx: t("Games Workshop clasifica los equipos en niveles para equilibrar las partidas (actualizado en mayo de 2026). Nivel 1, los más fuertes; nivel 4, los de desafío.",
            "Games Workshop sorts the teams into tiers to balance games (updated May 2026). Tier 1, the strongest; tier 4, the challenge teams."),
          lista: [
            t("Nivel 1: Amazonas, Enanos del Caos, Elfos Oscuros, Altos Elfos, Hombres Lagarto, Nórdicos, Alianza del Viejo Mundo, Habitantes del Inframundo y Elfos Silvanos.", "Tier 1: Amazon, Chaos Dwarf, Dark Elf, High Elf, Lizardmen, Norse, Old World Alliance, Underworld Denizens and Wood Elf."),
            t("Nivel 2: Bretonianos, Enanos, Unión Élfica, Humanos, Nobleza Imperial, Horrores Nigrománticos, Orcos, No Muertos Errantes, Skaven, Reyes Funerarios y Vampiros.", "Tier 2: Bretonnian, Dwarf, Elven Union, Human, Imperial Nobility, Necromantic Horror, Orc, Shambling Undead, Skaven, Tomb Kings and Vampire."),
            t("Nivel 3: Orcos Negros, Elegidos del Caos, Renegados del Caos, Khorne y Nurgle.", "Tier 3: Black Orc, Chaos Chosen, Chaos Renegade, Khorne and Nurgle."),
            t("Nivel 4: Gnomos, Goblins, Halflings, Ogros y Snotlings.", "Tier 4: Gnome, Goblin, Halfling, Ogre and Snotling."),
          ] },
        { t: t("Reglas y enlaces", "Rules and links"), tx: "",
          enlaces: [
            { t: t("Descargas de Blood Bowl", "Blood Bowl downloads"), u: WC + "/downloads/blood-bowl/", d: t("Erratas, niveles de equipos y jugadores estrella en Warhammer Community", "Errata, team tiers and Star Players on Warhammer Community"), tipo: "web" },
            { t: t("FAQ y comentarios de diseño", "FAQs and designer's notes"), u: WC + "/articles/wqewdcvv/blood-bowl-faqs-games-designers-notes/", d: t("Warhammer Community", "Warhammer Community"), tipo: "web" },
            { t: t("Erratas y FAQ (mayo de 2026)", "Errata and FAQ (May 2026)"), u: PDF + "eng_20-05_blood_bowl_faq_errata-gytvlserev-ngihd3chox.pdf", d: t("PDF oficial", "Official PDF"), tipo: "pdf" },
            { t: t("Jugadores estrella gratis", "Free Star Players"), u: WC + "/articles/toadzzpx/download-star-player-rules-in-preparation-for-the-new-edition-of-blood-bowl/", d: t("Reglas descargables de los jugadores estrella", "Downloadable Star Player rules"), tipo: "web" },
            { t: t("Blood Bowl: Third Season Edition", "Blood Bowl: Third Season Edition"), u: "https://www.warhammer.com/en-GB/shop/blood-bowl-third-season-edition-2025-eng", d: t("La caja de inicio en la tienda de Warhammer", "The starter box in the Warhammer store"), tipo: "web" },
            { t: t("Guía para jugadores nuevos (NAF)", "New players guide (NAF)"), u: "https://www.thenaf.net/resources/newplayers/", d: t("Asociación internacional de Blood Bowl (de la comunidad)", "International Blood Bowl association (community)"), tipo: "web", com: true },
          ] },
        { t: t("Jugar en el club", "Playing at the club"), tx: t("Al buscar partida en el calendario puedes elegir Blood Bowl. Si te apetece una liga del club, proponla en Discord.",
            "When you look for a game in the calendar you can choose Blood Bowl. If you fancy a club league, suggest it on Discord."),
          enlaces: [{ t: t("Buscar partida en el calendario", "Find a game in the calendar"), u: "/calendario.html", d: t("Partidas y quedadas del club", "Club games and meetups"), tipo: "club" }] },
      ],
    },
  };

  const ETIQUETA = { pdf: t("PDF", "PDF"), web: t("Web", "Web"), video: t("Vídeo", "Video"), app: t("App", "App"), club: t("Club", "Club") };
  const el = (tag, cls, txt) => { const x = document.createElement(tag); if (cls) x.className = cls; if (txt != null) x.textContent = txt; return x; };

  function video(e, id, L, tx) {
    const c = el("div", "g-v");
    const pant = el("button", "g-vp");
    pant.type = "button";
    pant.setAttribute("aria-label", (L === "en" ? "Play here: " : "Reproducir aquí: ") + tx(e.t));
    const pl = el("span", "g-play"); pl.setAttribute("aria-hidden", "true");
    pant.append(pl, el("span", "g-vt", L === "en" ? "Play" : "Reproducir"));
    pant.onclick = () => {
      const f = document.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0&hl=" + L;
      f.title = tx(e.t);
      f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      f.allowFullscreen = true;
      f.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
      f.className = "g-vf";
      f.__boton = pant;
      pant.replaceWith(f);
    };
    const pie = el("div", "g-vpie");
    const txt = el("div", "g-tx");
    txt.append(el("strong", "", tx(e.t)), el("span", "", tx(e.d)));
    const a = el("a", "g-vyt", L === "en" ? "Watch on YouTube" : "Ver en YouTube");
    a.href = e.u; a.target = "_blank"; a.rel = "noopener";
    a.setAttribute("aria-label", tx(e.t) + (L === "en" ? " on YouTube (opens in a new tab)" : " en YouTube (se abre en otra pestaña)"));
    pie.append(txt);
    if (e.com) pie.appendChild(el("span", "g-et com", L === "en" ? "Community" : "Comunidad"));
    c.append(pant, pie, a);
    return c;
  }

  window.abGuia = function (ruta, caja) {
    const g = GUIAS[ruta];
    if (!g) return false;
    const abiertos = new Set(); let cerradoPrimero = false; // lo abierto se conserva al cambiar de idioma
    const pinta = () => {
      // (i18n.js se carga después: hasta entonces, el idioma guardado)
      let guardado = null; try { guardado = localStorage.getItem("ab_lang"); } catch (x) {}
      const L = (window.abI18n ? window.abI18n.lang : guardado) === "en" ? "en" : "es";
      const tx = (v) => (v && typeof v === "object" ? v[L] : v) || "";
      caja.textContent = "";
      const cab = el("header", "g-cab");
      if (window.abNav && window.abNav.medalla) cab.appendChild(window.abNav.medalla(g.ic, 96));
      const tit = el("div", "g-tit");
      tit.append(el("p", "cat", tx(g.cat)), el("h1", "", tx(g.t)), el("p", "g-intro", tx(g.intro)));
      cab.appendChild(tit);
      caja.appendChild(cab);
      document.title = tx(g.t) + " · Adeptus Baeticus";
      // Botones para abrir o cerrar todos los bloques.
      const todo = el("div", "g-todo");
      const bt = (txt, abrir) => { const x = el("button", "", txt); x.type = "button"; x.onclick = () => caja.querySelectorAll("details.g-bloque").forEach((d) => { d.open = abrir; }); return x; };
      todo.append(bt(L === "en" ? "Expand all" : "Desplegar todo", true), bt(L === "en" ? "Collapse all" : "Plegar todo", false));
      caja.appendChild(todo);
      g.bloques.forEach((b, k) => {
        // Cada bloque se pliega y despliega (abierto el primero o los que se dejaron abiertos en esta visita).
        const det = el("details", "g-bloque");
        const clave = ruta + "#" + k;
        det.open = abiertos.has(clave) || (!abiertos.size && k === 0 && !cerradoPrimero);
        const sum = el("summary");
        sum.appendChild(el("h2", "", tx(b.t)));
        det.appendChild(sum);
        const s = el("div", "g-cuerpo");
        det.appendChild(s);
        det.addEventListener("toggle", () => {
          if (det.open) abiertos.add(clave); else {
            abiertos.delete(clave); if (k === 0) cerradoPrimero = true;
            // Al plegar, se paran los vídeos que estuvieran sonando (vuelve el botón «Reproducir»).
            det.querySelectorAll("iframe.g-vf").forEach((f) => { if (f.__boton) f.replaceWith(f.__boton); });
          }
        });
        if (tx(b.tx)) s.appendChild(el("p", "", tx(b.tx)));
        if (b.lista) { const ul = el("ul", "g-lista"); b.lista.forEach((x) => ul.appendChild(el("li", "", tx(x)))); s.appendChild(ul); }
        if (b.facciones) {
          FACCIONES.forEach(([grupo, fs]) => {
            s.appendChild(el("h3", "", tx(grupo)));
            const w = el("div", "g-fac");
            fs.forEach(([es, en, u]) => {
              const a = el("a", u ? "pdf" : "");
              a.href = u || DESCARGAS_40K; a.target = "_blank"; a.rel = "noopener";
              a.append(el("span", "", L === "en" ? en : es), el("small", "", u ? "PDF" : (L === "en" ? "Downloads" : "Descargas")));
              w.appendChild(a);
            });
            s.appendChild(w);
          });
          const todo = el("a", "g-mas", L === "en" ? "All factions and the latest versions →" : "Todas las facciones y las últimas versiones →");
          todo.href = DESCARGAS_40K; todo.target = "_blank"; todo.rel = "noopener";
          s.appendChild(todo);
        }
        if (b.enlaces) {
          const w = el("div", "g-enl"), wv = el("div", "g-vids");
          b.enlaces.forEach((e) => {
            // Vídeo de YouTube: se ve aquí al pulsar «Reproducir» (youtube-nocookie; antes no se carga nada de YouTube).
            const id = e.tipo === "video" && (/[?&]v=([\w-]{11})/.exec(e.u) || [])[1];
            if (id) { wv.appendChild(video(e, id, L, tx)); return; }
            const a = el("a", "g-e " + e.tipo);
            a.href = e.u;
            const fuera = /^https?:/.test(e.u);
            if (fuera) { a.target = "_blank"; a.rel = "noopener"; }
            const ic = el("span", "g-ic"); if (window.abNav && window.abNav.medalla) ic.appendChild(window.abNav.medalla({ pdf: "recursos", web: "faq", video: "tutoriales", app: "w40k", club: "inicio" }[e.tipo] || "recursos", 40));
            const cuerpo = el("span", "g-tx");
            cuerpo.append(el("strong", "", tx(e.t)), el("span", "", tx(e.d)));
            const et = el("span", "g-et" + (e.com ? " com" : ""), e.com ? (L === "en" ? "Community" : "Comunidad") : tx(ETIQUETA[e.tipo]));
            a.append(ic, cuerpo, et);
            if (fuera) a.setAttribute("aria-label", tx(e.t) + (L === "en" ? " (opens in a new tab)" : " (se abre en otra pestaña)"));
            w.appendChild(a);
          });
          if (wv.childNodes.length) s.appendChild(wv);
          if (w.childNodes.length) s.appendChild(w);
        }
        caja.appendChild(det);
      });
    };
    pinta();
    window.addEventListener("ab-idioma", pinta);
    return true;
  };
})();
