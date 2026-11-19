# Funciones de la web de Adeptus Baeticus

Lista completa de lo que hace la web, por secciones. Entre paréntesis, quién puede usar cada cosa cuando no es
cualquiera: **invitado** (sin cuenta), **aspirante**, **miembro** y **admin**.

---

## 1. Comunes a toda la web

### Cuenta y acceso
- **Entrar con Discord.** La web no tiene contraseñas propias: se entra con la cuenta de Discord del servidor del club.
- **Roles de la web:** admin, miembro y aspirante, sacados del rol que tiene cada uno en Discord. El rol de veterano
  de Discord cuenta como miembro.
- **Sesión de 90 días.** Se renueva sola: como mucho una vez al día, el bot comprueba que sigues en el servidor y con
  qué rol.
- **Aviso a quien entra sin ser del club.** Distingue entre «no estás en el servidor» y «no tienes rol del club», y
  ofrece rellenar la inscripción o ver las preguntas frecuentes.
- **Cerrar sesión.**

### Menú del usuario
- Mi ficha, **Mis datos**, Encuestas, Notificaciones y Mis inscripciones.
- Admin y **«Ver la web como»** (solo admin, ver la sección 12).
- Salir.

### Servocalavera de avisos (junto al usuario)
- Sale si hay encuestas abiertas, si te faltan datos de socio o si tienes un anuncio sin aceptar.
- Muestra un número con lo que tienes pendiente: anuncios, encuestas sin votar y el aviso de datos.
- Al pulsarla se despliega la lista: los anuncios, «Completa tus datos de socio», las encuestas abiertas (votada o
  pendiente) y «Ver todas las encuestas».
- **Notificaciones tipo anuncio** (preparadas para futuros avisos del club): un mensaje que se queda arriba en la lista
  hasta que pulsas «Aceptar». La lista se abre sola la primera vez que lo ves en cada visita.

### Efectos de Navidad
- **Automáticos** del 8 de diciembre a las 00:00 al 8 de enero a las 00:00 (hora de España), y en Admin se pueden
  poner «Siempre activados» o «Desactivados»: nieve ligera cayendo, nieve acumulada encima de las
  tarjetas (blog, galería, miembros, encuestas de Inicio, rondas de la liga, eventos del calendario, desplegables
  de la FAQ y el reglamento…) y una tira de luces bajo el menú en los colores del Emperador y de los cuatro
  dioses del Caos. Todo decorativo y sin tapar nada (no recibe clics); con «reducir movimiento» no cae nieve.
- Iguales para todos mientras estén activados (nadie puede quitarlos para sí). No se envía ningún aviso.
- **Año nuevo:** con los efectos activados, desde la medianoche de Nochevieja (hora de España) y durante los 7
  primeros días de enero sale solo un cartel «¡Feliz año 2027!» (con el año que toque) colgado de las luces del menú.

### Idiomas
- Toda la web en **español e inglés**, con las banderas de la cabecera. La elección se recuerda en el navegador.
- Lo que escriben los socios (nombres, títulos, descripciones…) no se traduce.
- Los mensajes del bot en Discord van siempre en español.

### Notificaciones en el móvil (aspirante, miembro, admin)
- Se activan **por dispositivo** desde el menú «Notificaciones», eligiendo los tipos:
  - nuevas quedadas y torneos;
  - mis partidas (alguien se une o se completa);
  - Gran Liga (tu partida de cada ronda y el recordatorio);
  - fotos nuevas en la galería;
  - nuevas encuestas.
- Botón para enviarse un **aviso de prueba**, y otro para desactivarlas.

### App instalable
- La web se puede **instalar** como una app en el móvil o el ordenador (botón «Instalar app», con instrucciones
  según el navegador).
- Funciona sin conexión mostrando las páginas ya visitadas, o un aviso de «Sin conexión».

### Fichas rápidas
- En **Galería** y **Gran Liga**, al pasar el ratón por el nombre de un socio (o tocarlo en el móvil, o llegar a él
  con el teclado) aparece su ficha:
  - foto con la corona de laurel;
  - rol y «Desconectado» si aún no ha entrado en la web;
  - facciones;
  - puesto en la liga y ELO;
  - trofeos en iconos;
  - enlace «Ver ficha completa».

### Privacidad
- Página **«Privacidad y aviso legal»** (enlace en el pie de todas las páginas): qué datos se guardan, para qué, quién
  los ve, servicios usados, cuánto se conservan, derechos (ver, corregir y borrar desde «Mis datos»), cookies técnicas y
  aviso de que es una web no oficial (las marcas son de Games Workshop).
- Las solicitudes de inscripción rechazadas se borran de la web al rechazarlas.

### Otros
- **Vista previa** de los enlaces al compartirlos (WhatsApp, Discord…) con imagen y título de cada página.
- Cabecera fija al desplazarse y transiciones suaves entre páginas.
- Diseño adaptado al móvil en todas las páginas.

---

## 2. Inicio
- **Próxima quedada** con sus datos, las plazas libres, la fecha de cierre de la inscripción y el botón
  «Apuntarme». Si no quedan plazas, se entra en la lista de espera.
- **Encuestas abiertas**, al lado de la próxima quedada, también en el móvil.
- **Noticias del club:** posts que publican los admins desde Discord (`/añadir-post`). Llevan imagen, título y
  descripción con formato de Discord: negritas, spoilers, «Leer más»…
- **Últimas entradas del blog del club**, con un enlace a cada una.

---

## 3. Calendario

### Vistas y filtros
- Vista de **lista** o de **mes**, con flechas para cambiar de mes.
- Filtros por tipo (todo, solo quedadas y torneos, solo partidas) y por modalidad de partida.
- **Leyenda** de colores e iconos:
  - colores: quedadas en rojo, torneos en verde y partidas en dorado;
  - iconos: mesa para físico, ordenador para online (Tabletop Simulator) e icono partido para «ambos».
- **Iconos propios de cada modalidad:** Combat Patrol, 40k a 1K, 40k a 2K, Necromunda (máscara de gas) y Blood Bowl
  (balón con pinchos).

### Quedadas y torneos
- Ficha de cada evento: fecha, lugar, plazas, descripción, físico u online y enlace a New Recruit en los torneos.
- **Inscribirse** en una quedada eligiendo qué vas a hacer: ir a pintar, ir a ver, o ir a jugar una modalidad.
  - Para jugar se indica si ya tienes rival, el compañero, el bando y, en el 1 contra 2, si vas solo o en pareja.
  - Se puede inscribir a otros socios.
- **Lista de espera** cuando se llenan las plazas; se avanza sola si alguien se da de baja.
- Cancelar la inscripción.
- Los torneos pueden ser físicos u online; las quedadas son siempre físicas.
- **Inscripción a torneos de New Recruit** (si el admin la activa): formato (individual, parejas o equipos de N),
  puntos por persona y quién puede apuntarse (Instructor, Iniciado, Aprendiz, Clasificando novel, Clasificando
  veterano; sin «Clasificando», solo los clasificados); si no puedes, se dice por qué. Se comprueba al inscribirse: si
  después cambia tu ELO sigues inscrito, pero si te das de baja y ya no cumples, no puedes volver.
  - Individual: «Inscribirme» y se muestra el enlace para unirte en New Recruit.
  - Parejas y equipos: nombre del equipo y compañeros (solo salen los que pueden apuntarse y están libres); el capitán
    es quien inscribe al equipo; a ellos les llega un aviso en la servocalavera con enlace al
    torneo, donde confirman (o rechazan); al confirmar ven el enlace de New Recruit.
  - Lista de inscritos (jugadores, o equipos con cada jugador confirmado o pendiente), con la ficha de cada uno.
  - Cancelar la inscripción o salir del equipo hasta que empieza el torneo. El capitán puede cancelar la del equipo
    entero o salir pasando la capitanía a un compañero (el equipo sigue inscrito y el nuevo capitán recibe un aviso).
  - El admin, con «Gestionar inscritos»: cambiar nombres de equipo, añadir o quitar jugadores, crear equipos, marcar
    confirmaciones, borrar equipos y mandar a un jugador (o a todos) un recordatorio en la servocalavera para que se
    apunte en New Recruit.

### Partidas entre socios (aspirante, miembro, admin)
- **Buscar partida:**
  - modalidad y formato (1 contra 1, 1 contra 2, por parejas);
  - número de participantes;
  - días y horas en los que puedes en los próximos 7 días;
  - físico, online o las dos;
  - lugar (opcional; si se deja vacío, «A decidir»).
  - Si falta algo, la web dice qué.
- **Unirse** a una partida de otro. Si se ofreció «físico u online», quien se une elige cómo se juega.
- **«También buscan rival»:** al publicar, la web te enseña quién busca lo mismo.
- **Retirar** tu partida, **salir** de una a la que te uniste, y **borrar tus partidas** (las vacías o todas).
- «Mis partidas de esta semana».

### Añadir a mi calendario
- Enlace para **Google Calendar, iPhone, Mac u Outlook**: solo el calendario del club, o «Mi calendario», que incluye
  además tus inscripciones y partidas. Se actualiza solo.

### Administración de eventos (admin)
- Botón **«Administrar eventos»**, que abre un panel:
  - crear y editar quedadas y torneos: tipo, físico u online, título, fecha, lugar, plazas, enlace de New Recruit,
    estado (publicado, borrador o cancelado) y descripción; en los torneos, la inscripción en la web (formato,
    jugadores por equipo, puntos por persona, rangos y experiencia que pueden apuntarse);
  - cancelar un evento o publicarlo de nuevo;
  - ver los **inscritos** de cada quedada (plazas libres, lista de espera, actividad, partida, quién inscribió a
    quién) y **descargarlos en CSV**.

---

## 4. Mis inscripciones (aspirante, miembro, admin)
- Tus próximas inscripciones a quedadas, con su estado (inscrito, en lista de espera o evento cancelado).
- Tus partidas, con el rival o compañeros y el estado de cada una.
- Cancelar inscripciones, salir de partidas, retirar o borrar las tuyas.

---

## 5. Galería
- Fotos del club, guardadas en Discord (en #publicaciones-web). Cada publicación tiene su **número (#N)**, el mismo
  en la web y en Discord.
- **Filtro por miembro** y **orden** de las publicaciones.
- **Ampliar fotos** con zoom: rueda del ratón, doble clic, pellizco en el móvil, arrastrar, botones −/+/Ajustar y
  teclas +, − y 0. Se pasa de una foto a otra con las flechas.
- **Bendiciones** (aspirante, miembro, admin): del Emperador o de los Poderes Ruinosos, una de cada por publicación.
  - Con cada voto, la publicación gana un puñado de **sellos de pureza** (a la izquierda) o de **sellos del Caos**
    (a la derecha), colgados del borde y con pergaminos que se mecen; con 10 votos cubren el lateral entero.
  - Desde 5 votos gana un **marco**: dorado del Emperador o del Caos (que va pasando por el color de los cuatro dioses),
    y se lo disputan las dos facciones según el porcentaje.
- **Subir fotos** (miembro, admin): hasta 10 fotos con una descripción. El navegador las reduce antes de enviarlas y
  el bot las publica en Discord. Desde Discord también se puede, con `/publicar`, `/editar` y `/borrar`.
- **Borrar** una publicación (su autor o un admin). Se borra también en Discord.
- Ficha rápida del autor al pasar el ratón por su nombre.

---

## 6. Gran Liga Adeptus
- Cada edición tiene **Fase I** (ida) y **Fase II** (vuelta). Se juega todos contra todos en rondas de 2 semanas, y
  después de la última ronda hay una ronda de **aplazadas**.
- **Desplegable de liga** arriba: las fases de la liga en curso y las ligas pasadas.
- **Clasificación:** victorias, puntos de victoria a favor y diferencia (siempre en ese orden, también en las ligas
  pasadas).
- **Rondas y emparejamientos:** las partidas de cada ronda con su mesa (en la ronda de aplazadas, la ronda de
  origen), con el resultado, la facción de cada jugador y el enlace a la partida en New Recruit.
- **Tu partida** destacada y «Recuerda subir el resultado a New Recruit antes del cierre».
- **Handshake** (admin): botón en cada partida con resultado, también en las ligas pasadas, para marcarla como
  partida acordada: lleva la etiqueta «Handshake» y no cuenta para el ELO del club.
- **Aplazar una partida** a la ronda de aplazadas, o quitar el aplazamiento. «Subir resultado» solo sale en la ronda
  final.
- **Listas:** de momento ni se publican ni se guardan; de cada partida solo se toman la facción y el destacamento.
- **Resultados de New Recruit:** se leen solos (el servidor los consulta cada hora durante la fase, sin depender de las visitas) y una vez tras cada cierre
  de ronda. La web nunca escribe en New Recruit.
- **ELO del club** (propio, no el de New Recruit): todos empiezan en 1500 y cada partida de la Gran Liga lo mueve
  (fórmula de Elo, K = 32), en orden desde la primera partida de la Gran Liga 2026 y siguiendo con la actual y las
  siguientes; no cuentan las partidas perdidas por abandono. Se recalcula al llegar resultados y una vez al día.
  Hasta 10 partidas sale «Clasificando»; después, el rango y el número: **Instructor** (1560 o más), **Iniciado**
  (1460 a 1559) y **Aprendiz** (1459 o menos); el admin cambia esas barreras en Admin. Se ve en Miembros (listado y ficha) y en la ficha rápida.
  También cuentan los **torneos puntuales** que el admin añade (ver Ranking ELO). En Admin se elige cuántas partidas hacen falta para dejar de
  estar «Clasificando» (0 = salen todos) y las barreras de los rangos.
  En los torneos puntuales, la partida mueve el ELO según los puntos y el formato: 2k cuenta entero; 1k, tres cuartos
  (entero por parejas); Combat Patrol, la mitad (tres cuartos por parejas).
- **Novel o Veterano:** cada socio es Novel salvo que el admin lo marque como Veterano (en el Ranking ELO).
- **Ranking ELO** (botón en Miembros, página `elo.html`): los socios clasificados por su ELO (puesto, título, ELO,
  partidas y V-D-E) y, debajo, los que aún están clasificando (con al menos una partida). Al pasar el ratón por uno,
  una gráfica de sus últimas 5 partidas (victoria, derrota o empate y cuánto subió o bajó); al pulsarlo, arriba de la
  tabla, la gráfica de toda su evolución (escala detallada, número de partida, separación por ligas y las «handshake» en
  gris; al tocar un punto se resalta su partida en la lista y al pulsar una partida se marca su punto) y todas sus
  partidas en orden (fecha, liga y ronda, rival, resultado, cambio y
  ELO); las partidas «handshake» salen apagadas y sin cambio.
- **Torneos puntuales** (admin, en el Ranking ELO, en un desplegable): se pega el enlace de un torneo de New Recruit y «Leer torneo» trae
  sus jugadores y resultados; cada jugador se asigna a un socio (con sugerencias: ✓ si su usuario de New Recruit ya se
  conoce, o nombres parecidos con «Usar») o a «REDACTED» si es un jugador antiguo. «Añadir al ELO» suma sus partidas,
  que cuentan desde ese momento (después de las de la Gran Liga ya jugadas). Lista de torneos añadidos con «Quitar».
  Al añadirlo se eligen los puntos por persona (Combat Patrol, 1k o 2k), que se pueden cambiar después en la lista.
  En los torneos por parejas (2 contra 2) cada cruce cuenta como una sola partida de la pareja (con la media de su ELO)
  y en la lista sale con quién jugó y contra qué dos rivales; en los de equipos más grandes, cada mesa cuenta aparte. En esa lista, al pasar el ratón por un rival sale su ficha y al pulsarlo se abre su desglose. Desde la ficha de
  Miembros, «Ver su evolución en el ranking ELO».
- **Calendario de la liga** para el móvil.
- **Recordatorios por Discord** (mensaje privado del bot): tu partida de cada ronda y el aviso antes del cierre.
- Ficha rápida de cada jugador al pasar el ratón por su nombre.
- **Ligas pasadas:** en el desplegable de arriba (grupo «Ligas pasadas»; de momento la Gran Liga 2026). Cada liga
  pasada muestra sus fechas, el podio, la **clasificación final tal como quedó en New Recruit** y las rondas con sus
  emparejamientos y resultados (sin fechas, sin botones y sin reglamento), con «Volver a la Gran Liga actual». No salen
  en el calendario y no se pueden modificar. Las partidas perdidas por abandono llevan la etiqueta «Abandono», y quien
  abandonó, «Abandonó» en la clasificación.
- **Jugadores que ya no son socios:** al pasar el ratón por su nombre sale una ficha **«REDACTED»** con un sello
  inquisitorial («Expediente sellado por la Inquisición»). Pasa con cualquiera que no tenga cuenta en la web.

### Administración de la liga (admin)
- Botón **«Administrar liga»**, que abre un panel con tres pestañas:
  - **Temporada:**
    - con una liga en curso: cuántas partidas van jugadas y enlazadas; **«Enlazar emparejamientos con New Recruit»**
      (revisa el pod del torneo y enlaza cada cruce con su partida por la pareja de jugadores, y avisa de los jugadores
      cuyo usuario no aparece y de los cruces sin partida); y **«Archivar liga»**, solo con todas las partidas jugadas:
      pasa a «Ligas pasadas» con su clasificación final;
    - sin liga en curso: **«Nueva liga»** con el enlace del torneo en New Recruit (ya creado allí, con los jugadores
      apuntados), el nombre, el número de jugadores, los socios que juegan (con su usuario de New Recruit) y la fecha de
      inicio, que tiene que ser domingo. **«Lanzar liga»** crea el calendario con emparejamientos al azar, todos contra
      todos (con número impar, uno descansa cada ronda).
  - **Jugadores:**
    - la cuenta de la web de cada jugador, con «Emparejar automáticamente» y las sugerencias;
    - **añadir** jugador;
    - **reemplazar** a un jugador: el sustituto se queda con sus partidas y resultados;
    - **quitar** a un jugador, solo si aún no tiene partidas.
  - **Cruces:** por ronda, cambiar, añadir o quitar partidas sin resultado. No deja que nadie juegue dos veces en
    una ronda ni que una pareja se repita en la fase.

---

## 7. Miembros
- Listado de socios con foto, **corona de laurel** (verde para los miembros, roja para el admin), nombre, rol,
  facciones, puesto en la liga, ELO y trofeos.
- **Buscar** por nombre y **filtrar** por rol y por facción. Un desplegable «Mostrar y ordenar» agrupa: **«Con trofeos»**
  (los que más tienen primero), **«Desconectados»** (socios creados que aún no han entrado en la web) y **antigüedad de
  más a menos** o **de menos a más** (con sesión).
- **Ficha completa** de cada socio:
  - facciones;
  - estadísticas en la Gran Liga (puesto, partidas, victorias y derrotas, puntos de victoria, diferencia y facciones
    usadas);
  - ranking ELO;
  - **trofeos** (en cascada si se repiten);
  - **Antigüedad** (desde la inscripción; solo miembros y admin): «En el club desde mayo de 2025 · 1 año y 6 meses», y en la **corona de laurel** cada medio año en el club dora un par de hojas, de abajo hacia arriba,
    junto a la foto (también en el listado y en la ficha rápida).
  - Para socios con sesión, además, sus **cuentas**: Discord, Instagram, Steam, New Recruit y BCP.
- **Editar mi ficha:** lleva a «Mis datos».

### Administración de socios (admin)
- **Editar datos y ficha** de cualquier socio: su hoja de datos de inscripción y su ficha. Las condiciones
  (estatutos y consentimiento) solo las puede aceptar el propio socio.
- **Borrar perfil** por completo, con confirmación. Se borran:
  - ficha y datos;
  - inscripciones y partidas;
  - votos, bendiciones y trofeos;
  - notificaciones.
- **Asignar trofeos:** nombre, mes y año, puesto (1.º, 2.º o 3.º), modalidad (individual, parejas, equipo o pintura)
  y ganadores. También se pueden editar y quitar.

---

## 8. Mis datos (aspirante, miembro, admin)
- **Tus datos de socio:**
  - nombre, correo, teléfono (para el canal de WhatsApp) y mayor de edad;
  - intereses, experiencia de juego y de pintura, y cómo nos conociste;
  - estatutos y consentimiento.
- **Tu ficha en Miembros:** facciones, Instagram, Steam, New Recruit y BCP. Todo opcional. Para Steam se recomienda
  el ID de 17 cifras y se explica cómo verlo.
- Botón de guardar en una **barra fija abajo** que te acompaña mientras rellenas.
- **Borrar todos mis datos**, con confirmación: borra tu perfil de la web y cierra la sesión.
- **«Completa tus datos» obligatorio:** la primera vez que entras, si no te inscribiste con la web, tienes que
  rellenarlos antes de usar nada. Vienen rellenos con lo que había en el Excel antiguo. El servidor también lo exige.

---

## 9. Inscripción (invitado)
- Pestaña «Inscripción», visible solo para quien no es del club.
- **Paso 1:** conectar con Discord. Si ya tienes rol del club, te avisa.
- **Paso 2:** el formulario.
  - Pide nombre, correo, teléfono, mayor de edad, intereses (opcional), experiencia de juego y de pintura con
    opciones detalladas, cómo nos conociste (opcional), Steam (opcional) y la aceptación de los estatutos (con
    enlace al PDF) y del tratamiento de datos.
  - Avisos claros de lo que falta.
- Al enviarla:
  - el bot te mete en el servidor de Discord con el rol **Externo**;
  - publica la solicitud en #inner-circle-general con los botones **Aprobar** y **Rechazar** (solo admins). Al
    aprobar pasas a **Aspirante**; al rechazar se te saca del servidor.
- El permiso de Discord se guarda cifrado y se borra en cuanto ya no hace falta.

---

## 10. Encuestas (aspirante, miembro, admin)
- Encuestas para «aspirantes y miembros» o «solo miembros».
- **Una opción o varias**, **cierre opcional** con fecha, votos **secretos o públicos** (se ve quién vota qué) y
  resultados **siempre, al votar o al cerrar**.
- Votar y cambiar el voto mientras esté abierta.
- **Admin:** crear, editar, cerrar y borrar encuestas. Una encuesta de votos secretos no puede pasar a públicos.
- Aviso en el móvil al publicarse una encuesta nueva.

---

## 11. Reglas y FAQ
- Preguntas frecuentes copiadas del canal #preguntas-frecuentes de Discord. Se renuevan solas cada 6 horas.
- **Buscador** de preguntas.
- Versión en inglés traducida automáticamente.
- Enlace a los **estatutos** del club en PDF.

---

## 12. Administración (admin)
- **Página Admin:**
  - **Bot de Discord:** estado y registro de los comandos (`/publicar`, `/editar`, `/borrar`, `/añadir-post`,
    `/editar-post`, `/borrar-post`).
  - **Efectos de Navidad:** «Automático» (8 de diciembre – 7 de enero), «Siempre activados» o «Desactivados».
  - **FAQ:** estado y «Actualizar FAQ desde Discord».
  - **New Recruit:** estado de la copia local y sincronización manual del torneo y de los resultados, con 15 minutos
    de espera mínima.
  - **Socios importados del Excel:**
    - **«Vincular con Discord»:** cruza los alias del Excel con los miembros del servidor y crea sus fichas sin
      conectar.
    - **Sugerencias** de cuentas parecidas para confirmar con un botón.
    - Listas de quién falta por vincular y de quién está en Discord sin datos.
    - **Roles de Discord al día:** al vincular, y solos una vez a la semana. También se actualizan nombres y fotos, y
      sale la lista de quién ya no tiene rol o no está en el servidor.
  - Avisos de que los eventos se administran en el Calendario y los jugadores de la liga en Gran Liga.
- **«Ver la web como»** otro socio o como invitado: solo lectura, como mucho 2 horas, con una franja para volver.
- Botones de administración dentro de Calendario («Administrar eventos»), Gran Liga («Administrar liga») y
  Miembros («Editar datos y ficha», «Borrar perfil» y «Asignar trofeos»).

---

## 13. Bot de Discord
- **Galería:** `/publicar` (hasta 10 fotos), `/editar` y `/borrar`.
- **Noticias de Inicio:** `/añadir-post`, `/editar-post` y `/borrar-post` (admins).
- **Inscripciones:** mete a los aspirantes con el rol Externo, publica cada solicitud con «Aprobar» y «Rechazar»,
  cambia los roles y expulsa a los rechazados.
- **Recordatorios de la Gran Liga** por mensaje privado.
- **Avisos de mantenimiento** en #inner-circle-general: solo cuando algo falla y cuando se recupera.
- Lee la lista de miembros del servidor para vincular a los socios y actualizar sus roles.

---

## 14. Por dentro (lo que no se ve)
- **Privacidad:**
  - los datos personales (correo, teléfono…) solo los ven el propio socio y los admins;
  - las cuentas de la ficha, solo los socios con sesión;
  - cada socio puede borrar todos sus datos.
- **Permisos comprobados en el servidor**, no solo en la página.
- **Envíos por tandas** (notificaciones y recordatorios) para no pasar los límites del plan gratuito de Cloudflare.
  Un temporizador cada minuto vacía la cola, hace los recordatorios y la actualización semanal de roles.
- **Enlaces de Discord renovados** antes de que caduquen, para que las fotos de la galería no se rompan.
- **Mínimas peticiones a New Recruit:** las visitas nunca consultan New Recruit.
