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
- Sale si hay encuestas abiertas o si te faltan datos de socio.
- Muestra un número con lo que tienes pendiente: encuestas sin votar y el aviso de datos.
- Al pulsarla se despliega la lista: «Completa tus datos de socio», las encuestas abiertas (votada o pendiente) y
  «Ver todas las encuestas».

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
    estado (publicado, borrador o cancelado) y descripción;
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
  - Con los votos, la publicación gana un **aura de llamas** (doradas a la izquierda; del Caos a la derecha, que se
    oscurecen).
  - Desde 5 votos gana un **marco**, que se disputan las dos facciones según el porcentaje.
- **Subir fotos** (miembro, admin): hasta 10 fotos con una descripción. El navegador las reduce antes de enviarlas y
  el bot las publica en Discord. Desde Discord también se puede, con `/publicar`, `/editar` y `/borrar`.
- **Borrar** una publicación (su autor o un admin). Se borra también en Discord.
- Ficha rápida del autor al pasar el ratón por su nombre.

---

## 6. Gran Liga Adeptus
- Cada edición tiene **Fase I** (ida) y **Fase II** (vuelta). Se juega todos contra todos en rondas de 2 semanas, y
  después de la última ronda hay una ronda de **aplazadas**.
- **Selector de fase.**
- **Clasificación:** victorias, puntos de victoria a favor y diferencia.
- **Rondas y emparejamientos:** las partidas de cada ronda con su mesa (en la ronda de aplazadas, la ronda de
  origen), con el resultado, la facción de cada jugador y el enlace a la partida en New Recruit.
- **Tu partida** destacada y «Recuerda subir el resultado a New Recruit antes del cierre».
- **Aplazar una partida** a la ronda de aplazadas, o quitar el aplazamiento. «Subir resultado» solo sale en la ronda
  final.
- **Listas** de cada jugador. Se guardan, pero de momento no se publican.
- **Resultados de New Recruit:** se leen solos, como mucho cada 6 horas durante la fase y una vez tras cada cierre
  de ronda. La web nunca escribe en New Recruit.
- **Ranking ELO** de la liga de New Recruit, que se muestra en la ficha de Miembros.
- **Calendario de la liga** para el móvil.
- **Recordatorios por Discord** (mensaje privado del bot): tu partida de cada ronda y el aviso antes del cierre.
- Ficha rápida de cada jugador al pasar el ratón por su nombre.

### Administración de jugadores (admin)
- Botón **«Administrar jugadores»**, que abre un panel con dos pestañas:
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
- **Buscar** por nombre y **filtrar** por rol, por facción, **«Con trofeos»** y **«Desconectados»** (socios creados
  que aún no han entrado en la web).
- **Ficha completa** de cada socio:
  - facciones;
  - estadísticas en la Gran Liga (puesto, partidas, victorias y derrotas, puntos de victoria, diferencia y facciones
    usadas);
  - ranking ELO;
  - **trofeos** (en cascada si se repiten);
  - «En el club desde» la fecha de registro.
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
- Botones de administración dentro de Calendario («Administrar eventos»), Gran Liga («Administrar jugadores») y
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
