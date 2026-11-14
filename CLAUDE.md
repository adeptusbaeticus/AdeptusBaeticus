# Web del club Adeptus Baeticus

Cloudflare Worker (`src/index.js`) + D1 (`adeptus-db`) + estáticos en `public/`. JS vanilla, sin frameworks. Interfaz en español.

## Normas de trabajo

- **Traducción (obligatorio):** toda la web está en español y en inglés (`public/i18n.js`).
  Cada vez que se añada o cambie un texto visible de la interfaz (HTML estático, textos creados
  desde JS, `aria-label`/`title`/`placeholder`, avisos de `confirm`, mensajes de error que el
  servidor devuelve a la web), añade su traducción en `i18n.js`:
  - texto fijo → `EXACT`;
  - texto con números o nombres → una regla en `RULES` (patrón completo);
  - frase de la interfaz dentro de textos compuestos → `PHRASES`.
  El contenido que escriben los socios (títulos, descripciones, posts, nombres…) debe llevar
  `translate="no"` para no traducirlo. Toda página nueva carga `<script src="/i18n.js"></script>`
  antes de `/auth.js`. Antes de terminar, comprueba la página en inglés (sin restos en español).
  Los mensajes del bot en Discord se quedan en español.
- **Rama:** se trabaja y se sube directamente a `main` (sin ramas ni PR). Cloudflare despliega
  al subir a `main`, pero el aviso de GitHub a veces se pierde: tras cada subida, lanzar la compilación
  a mano (API de Workers Builds, rama `main`) y comprobar su estado en la API, sin esperar a que cambie
  la web (desde la sesión remota no se puede abrir `*.workers.dev`).
- **Base de datos:** cada cambio de esquema va en `migrations/NNNN_nombre.sql` y se aplica en
  producción **antes** de subir el código que lo usa.
- **Seguridad:** validación y permisos siempre en el servidor; en el cliente `textContent`/DOM,
  nunca `innerHTML`. No tocar `wrangler.jsonc` ni secretos sin permiso expreso.
- **Colores:** nunca azul. Paleta del club: dorado `#D9B25A`, rojo `#A3211B` y el verde Adeptus del logo
  `#343B20` (con icono o texto claro `#DCD8C2` y borde `#7C8A4C` cuando va sobre fondo oscuro).
  Los colores de los tipos de evento están en `public/colores.css` (variables, con la paleta anterior para volver
  atrás): quedadas rojas, torneos verdes, partidas doradas; físico en hueso y online en grafito. Usar siempre esas
  variables, no colores sueltos.
- **Direcciones:** Cloudflare sirve las páginas sin `.html` (`/inscripcion.html` → `/inscripcion`): al comparar
  `location.pathname` aceptar las dos formas (`/^\/inscripcion(\.html)?$/`), o una redirección puede entrar en bucle.
- **Roles en la web:** admin, miembro y aspirante. En las fichas (Miembros y ficha rápida) la foto lleva una corona de
  laurel verde (miembro) o roja (admin) (`window.abLaurel` en `public/trofeos.js`); los aspirantes no llevan. No hay «veterano»: el rol de Discord de veterano cuenta como miembro
  (`roleOf`, y las sesiones antiguas en `leeSesion`); no mostrar «veterano» en ningún sitio.
- **Lista de funciones:** `FUNCIONES.md` describe todo lo que hace la web; al añadir, cambiar o quitar una función,
  actualizarla.
- **Datos personales:** no guardar más datos personales de los necesarios; preguntar antes de
  añadir datos nuevos.
  La política de privacidad y el aviso legal están en `privacidad.html` (enlazada en el pie de todas las páginas, en el
  consentimiento de la inscripción y en «Mis datos»): si cambia qué datos se guardan, quién los ve, los servicios usados
  o cuánto se conservan, actualizarla (y su traducción). Las solicitudes rechazadas se borran al rechazarlas.

## Avisos

- **Notificaciones en el móvil (Web Push):** cada socio las activa por dispositivo desde su menú y elige
  tipos (`eventos`, `partidas`, `liga`, `galeria`, `encuestas`); tabla `push_subs` (migración 0018), clave privada en el
  secreto `VAPID_PRIVATE` (la pública está en `src/index.js`). Al añadir un aviso nuevo, usar `notifica()`.
- **Discord:** recordatorios de la liga por mensaje privado y avisos de mantenimiento en
  #inner-circle-general (solo al fallar y al recuperarse).
- **Límites del plan gratuito de Cloudflare** (50 llamadas externas y 50 consultas a D1 por ejecución, 10 ms
  de CPU): los envíos en grupo (notificaciones y recordatorios) van a la tabla `cola_avisos` (migración 0022)
  y se envían por tandas (`procesaCola`, ~25 llamadas como máximo); el temporizador corre cada minuto y la
  vacía. No enviar en bucle a muchos destinatarios dentro de una misma petición.

## Galería

- Las fotos se guardan en Discord: cada publicación es un mensaje del bot en #publicaciones-web (hasta 10 fotos) y la
  web solo guarda la referencia (`publicaciones`) y renueva los enlaces de Discord antes de que caduquen. Cada una tiene
  su número (#N), el mismo en la web y en Discord (baja si se borra una anterior).
- Se publica con `/publicar` en Discord o con «Subir fotos» en la web (solo miembros y admin): el navegador
  reduce cada foto y las envía de una en una (`/api/galeria/publicar`, `/api/galeria/:id/foto`, `/fin` para el aviso).
  Borrar en la web (autor o admin) borra también el mensaje de Discord. Lo común está en `pubCrear`, `pubAnadir` y
  `pubBorrar`.

- Bendiciones (Emperador / Poderes Ruinosos): sellos de lacre colgados de los bordes de la tarjeta, un puñado (3) por
  voto, de arriba abajo, en zigzag y algo girados: con 10 votos cubren el lateral entero (`sellos()`, `sello()`; dibujo
  propio, con relieve de luz y sombra). Izquierda: **sellos de pureza** (grimdark: lacre rojo sangre oscuro y sucio, con calavera en relieve y pergamino envejecido). Derecha: **sellos del
  Caos** (grimdark: cera apagada y sucia del color de cada dios por turnos —sangre seca, verde pútrido, azul casi negro
  y morado amoratado—, con hollín y la estrella de hierro ennegrecido, con la estrella de ocho puntas en relieve y pergamino chamuscado, que
  se oscurecen hacia el negro con más votos). Los pergaminos se mecen ligeramente (pausados fuera de pantalla y con
  «reducir movimiento»). La rejilla deja hueco amplio entre publicaciones para que los sellos no se solapen. Marco: con
  5 de una facción aparece entero de ella; con 5 o más de las dos, se lo disputan según el porcentaje de votos. La
  parte del Emperador es dorada y la del Caos es de un color entero que va alternando rojo, verde, azul y morado (los
  cuatro dioses: excepción a «nunca azul»; `--cc` animada con `@property`). Por encima de 10 solo cambia el reparto.

## Inscripción

- `inscripcion.html` sustituye al formulario de Google; la pestaña «Inscripción» solo sale a los invitados (`auth.js`),
  y el aviso a quien entra sin ser socio enlaza aquí. El aspirante conecta su cuenta con «Conectar con Discord»
  (`/auth/registro`, mismo callback que el login, scope `identify guilds.join`; si ya tiene rol del club se le avisa)
  y rellena: nombre, correo, teléfono (WhatsApp), mayor de edad, intereses (opcional), experiencia de juego y de
  pintura, cómo nos conoció (opcional), estatutos y consentimiento. Tabla `solicitudes` (migración 0028).
- Steam (opcional) lo escribe cada uno a mano (sin iniciar sesión con Steam; se quitó el OpenID): se recomienda el
  ID de Steam de 17 cifras (Steam → tu nombre → «Detalles de la cuenta»), aunque vale el enlace o el nombre de perfil
  (`cuentaLimpia`). No se puede verificar. En la inscripción va a `solicitudes.steam` (migración 0029) y, al aprobarse,
  en su primer inicio de sesión pasa a `users.steam` si estaba vacío; luego se edita en «Mis datos».
- Al enviar, el bot mete al aspirante en el servidor con el rol «Externo» (se busca por su nombre; no ve nada en
  Discord y en la web sigue siendo invitado) y publica la solicitud en #inner-circle-general con «Aprobar»/«Rechazar»
  (solo admins, interacción `insc:`, `decideInscripcion`): al aprobar se le quita Externo y se le da Aspirante; al
  rechazar se le saca del servidor. El permiso de Discord (refresh token) va cifrado (AES-GCM con clave derivada de
  `SESSION_SECRET`) y se borra en cuanto entra en el servidor (o al decidir). El bot necesita «Gestionar roles»,
  «Crear invitación» y «Expulsar miembros», y su rol por encima de Externo y Aspirante.

- Socios del Excel antiguo (formulario de Google; sin los eliminados): tabla `socios_datos` (migración 0031, origen
  `excel`) con nombre, correo, teléfono, estatutos, Instagram, fecha de registro y el alias de Discord. No se importaron
  municipio, facción, nivel, Steam, correo de BCP ni comentarios. En Admin, «Vincular con Discord» cruza los alias con
  la lista de miembros del servidor (una llamada; el bot necesita «Server Members Intent») y crea su ficha sin conectar;
  al iniciar sesión también se vincula por su usuario, nombre visible o apodo, también sin lo que va entre paréntesis
  («Silvermane (Sergio)» → «Silvermane», `sinParentesis`), solo con una coincidencia única.
  Para los que quedan sin vincular, el bot propone hasta 3 cuentas parecidas (`sugerenciasSocio`: alias sin números ni
  signos, contenido o con 1-2 letras distintas, o su nombre real en el apodo) que el admin confirma en Admin
  (`/api/admin/socios/vincula`); nunca se vinculan solas.
  Al vincular se actualizan también el rol, el nombre y la foto de todos los socios con la misma lista de miembros
  (`actualizaRoles`); y el temporizador lo repite solo una vez a la semana (`rolesSemanal`, resumen en `nr_cache`
  `discord:roles`; si Discord falla, vuelve a probar al día siguiente). A quien ya no está en el servidor o no tiene
  rol del club no se le cambia nada: sale en Admin en «Sin rol del club en Discord o fuera del servidor».
  Al pulsar el botón se guarda en `nr_cache` (`discord:sin-datos`) la lista de cuentas del servidor sin datos (cuenta,
  usuario, nombre visible, apodo y rol) para revisar las parejas a mano.
- Datos obligatorios al entrar: todo socio menos el admin que no se inscribió con la web y aún no ha completado sus datos
  (`faltanDatos`, `completar` en `/api/me`) va a `inscripcion.html?completar=1` (`auth.js`) hasta guardarlos
  (`/api/socio/datos`, misma validación que la inscripción, `validaDatosSocio`); vienen rellenos con lo del Excel.
  Los que no están en el Excel son nuevos y lo rellenan entero.
  También lo exige el servidor: mientras le falten, toda la API le responde 403 salvo `SIN_DATOS_PERMITIDO`
  (`/api/me`, `/api/socio/datos`, `/api/ver-como/salir`, `/api/push/baja`) y `/api/inscripcion*`.
  Además, a quien le falten (también al admin, `datos_pendientes` en `/api/me`), la servocalavera de las encuestas muestra
  el aviso «Completa tus datos de socio» (cuenta en el número y enlaza al formulario).
- «Mis datos» (menú del usuario, `inscripcion.html?completar=1`): el socio revisa y edita cuando quiera sus datos (los
  suyos en `socios_datos` o, si se inscribió con la web, los de su solicitud aprobada) y su ficha de Miembros
  (facciones, Instagram, Steam, New Recruit y BCP), que es lo que muestra Miembros; se guarda
  todo junto (`/api/socio/datos` con `ficha`, `guardaFicha`). «Editar mi ficha» en Miembros lleva aquí. Abajo,
  «Borrar todos mis datos» (con confirmación, `/api/socio/borrar`): borra su perfil y cierra la sesión.
- Admin en Miembros (ficha de otro socio): «Editar datos y ficha» abre la misma página con `?socio=ID`
  (`/api/admin/miembros/:id/datos`; el admin no toca las condiciones ni marca los datos como completados) y «Borrar
  perfil» (con confirmación, `DELETE /api/admin/miembros/:id`). `borraPerfil` borra ficha, datos, solicitudes,
  inscripciones, partidas que creó, votos, bendiciones, trofeos y avisos, y quita su vínculo con la liga; las fotos de
  la galería y los posts se quedan. Si su sesión sigue abierta, `/api/me` la cierra.
- Fecha de registro: `users.alta` (del Excel, de la solicitud aprobada o de cuando completa sus datos). Antigüedad (contada desde la inscripción; solo se muestra a miembros y admin, `/api/miembros` no envía `alta` de aspirantes) en la
  ficha de Miembros («En el club desde mayo de 2025 · 1 año y 6 meses») y en la ficha rápida, y en la corona de laurel
  cada medio año completo dora un par de hojas (una por lado), de abajo hacia arriba (`window.abLaurel(rol, alta)`,
  `window.abAntiguedad` y `window.abAniosClub` en `public/trofeos.js`; solo con sesión).
- Socios creados desde la web sin haber iniciado sesión (los que se importen del Excel antiguo): `users.conectado = 0`
  (migración 0030); en Miembros salen con la etiqueta «Desconectado» hasta su primer inicio de sesión, que lo pone a 1.

## Ficha rápida

- En Galería (autor de cada publicación) y Gran Liga (jugadores vinculados) el nombre muestra la ficha del socio al
  pasar el ratón, con el foco del teclado o al tocarlo en el móvil (`public/ficha-hover.js`, `window.abFicha(el, id)`;
  datos de `/api/miembros`, guardados 5 minutos en `sessionStorage`). «Ver ficha completa» abre `miembros.html#m<ID>`.
  Los trofeos salen en iconos abajo a la derecha, en la fila de liga y ELO (iguales en cascada de hasta 4, «×N» si hay más); el dibujo del trofeo es común (`public/trofeos.js`, `window.abCopa`).

## Administración

- `admin.html`: efectos de Navidad, bot de Discord, FAQ, sincronización con New Recruit y socios del Excel. Los eventos se administran en
  el Calendario («Administrar eventos») y los vínculos de los jugadores de la liga en Gran Liga («Administrar
  jugadores»): botones que solo ve el admin (`public/admin-paneles.js`, que abre un panel; el servidor comprueba el rol).

## Navidad y anuncios

- **Efectos de Navidad:** en Admin, modo `auto` (por defecto: del 8 de diciembre a las 00:00 al 8 de enero a las 00:00,
  hora de Madrid; lo decide `auth.js` con la fecha, `enTemporada()`, y lo revisa cada minuto), `si` (siempre) o `no`
  (`/api/admin/navidad`, tabla `ajustes` clave `navidad`, migración 0033; `modoNavidad()` acepta los antiguos `1`/`0`).
  Iguales para todos: nadie puede quitarlos para sí y no se envía ningún anuncio.
  `auth.js` lee `/api/ajustes` (público, sin caché del navegador; guardado 2 min en `sessionStorage`, y Admin guarda ahí
  el valor nuevo al cambiarlo) y, si están activos, carga `public/navidad.js` (`window.abNavidad.aplica`): nieve en un
  lienzo fijo (z-index 35, sin clics, parada con la pestaña oculta, sin caída con «reducir movimiento»), nieve acumulada
  sobre las tarjetas de `TARJETAS` (blog, galería —bajo los sellos—, miembros, encuestas de Inicio, rondas, eventos del
  calendario —fina en los del mes—, desplegables de la FAQ —en su `summary`— y el reglamento) y luces bajo `.nav`
  (dorado del Emperador y los 4 dioses del Caos: excepción a «nunca azul»).
  Con los efectos activados, del 1 al 7 de enero (hora de Madrid) sale solo «¡Feliz año AAAA!» colgado de las luces
  (`anioNuevo()`, comprobado cada minuto).
- **Notificaciones tipo anuncio** (preparadas, sin uso ahora): tabla `anuncios` (migración 0033), una fila por socio;
  salen arriba en la servocalavera (`me.anuncios` en `/api/me`) hasta que pulsa «Aceptar» (`/api/anuncios/:id/acepta`).
  La lista se abre sola una vez por visita. Para enviar uno a todos: `anunciaATodos(env, tipo, titulo, texto)` (una
  sola consulta; no duplica si ya tiene uno de ese tipo sin aceptar). Traducir su texto en `i18n.js` (`EXACT`).

## Encuestas

- Página `encuestas.html` (menú de usuario y tarjeta en Inicio); el admin las crea, edita, cierra y borra ahí
  mismo (migraciones 0023 a 0025). Solo para socios con sesión (los invitados no las ven).
  Cada encuesta es para `aspirantes` (aspirantes y miembros) o `miembros` (miembros y admin), sin
  encuestas públicas; cierre opcional; votos `secretos` o `publicos` (se ve quién vota qué) y resultados
  `siempre`, `al_votar` o `al_cerrar`. Una encuesta con votos secretos no puede pasar a votos públicos.
- Si hay encuestas abiertas, junto al usuario sale una servocalavera con una papeleta (`auth.js`) con el número
  de las que faltan por votar; al pulsarla se despliega la lista. En Inicio y Encuestas usa los datos de la
  propia página (evento `ab-encuestas`); en las demás, los guarda 2 minutos en `sessionStorage`.

## Calendario: físico u online

- Eventos y partidas tienen `modo` `fisico` u `online` (Tabletop Simulator), migración 0026, con su icono (mesa u
  ordenador, `iconoModo()` en `calendario.html`; en el mes, en el ordenador un cuadrado sobre la esquina de cada evento y en el móvil en la esquina del día). Las quedadas son siempre físicas (lo fuerza el servidor); los
  torneos los elige el admin. En las partidas físicas se puede indicar `lugar`; vacío = «A decidir» (lo acuerdan
  los jugadores). Las partidas ya no reciben mesa automáticamente (las antiguas conservan la suya).
- Al buscar partida se puede marcar físico y online a la vez (`modo` `ambos`, migración 0027): icono partido por la
  mitad (mesa en dorado y ordenador en verde) y quien se une elige cómo se juega, que queda fijado para todos.

- Cada modalidad de partida tiene su icono (`public/iconos-juego.js`, `iconoJuego()`): placas de esquinas cortadas
  con letra Cinzel para Combat Patrol, 40k 1K y 40k 2K, máscara de gas (Necromunda) y balón con pinchos (Blood
  Bowl). Dibujo propio: no usar logos, ilustraciones ni tipografías de Games Workshop (son marcas registradas).

## Gran Liga Adeptus

- Edición = Fase I (ida) + Fase II (vuelta, cruces sorteados de nuevo); campeón de cada fase y global.
  Cada fase se llama igual que su torneo en New Recruit: la actual, «Gran Liga 2026/27» (`liga_fases.nombre`; `edicion` =
  `2026/27`).
  Todos contra todos, rondas de 2 semanas (domingo 22:00 → domingo de cierre 14:00, hora de Madrid);
  la ronda siguiente a la última es la de aplazadas.
- **El calendario (rondas y mesas) es el del club**, no el de New Recruit: en New Recruit las partidas
  son un «pod» sin orden y su campo `round` es un correlativo sin significado. De New Recruit solo se
  toman el enlace de cada partida y los resultados, asignados **por la pareja de jugadores**
  (`id_participant`), que es única en cada fase.
- Datos de New Recruit con su API oficial (secretos `NR_LOGIN`/`NR_PASSWORD`) y **el mínimo de
  peticiones**: las visitas nunca consultan New Recruit; actualización automática desde el temporizador
  (`scheduled` → `ligaAuto`) como mucho cada hora durante la fase y una tras cada cierre (si falla, espera 1 h); manual con 15 min de espera mínima; sin reintentos en bucle.
- **Los resultados solo vienen de New Recruit** (única fuente de verdad): la web no puede escribir allí, así
  que no se editan ni se ponen resultados desde la web (se probó y se quitó, migración 0017).
  Las sanciones no se reflejan en la web (ni en la clasificación ni en los avisos del bot).
- «Administrar jugadores» (Gran Liga, solo admin; `admin-paneles.js`):
  - **Jugadores:** cuenta de la web de cada jugador (con «Emparejar automáticamente», `ligaEmpareja`: nombre de
    Discord = apodo sin paréntesis o alias del Excel, o usuario de New Recruit, solo con un candidato único); añadir
    jugador; «Reemplazar» (el sustituto se queda con la fila, sus partidas y resultados; el `id_participant` del
    anterior pasa a `nr_anteriores`, migración 0032, y el del nuevo se toma de su primer informe por su usuario de
    New Recruit en `ligaProcesa`); «Quitar» solo si no tiene partidas.
  - **Cruces:** por ronda, cambiar, añadir o quitar partidas sin resultado (`/api/admin/liga/partida`); un jugador
    no puede jugar dos veces en la misma ronda y cada pareja una sola vez por fase. Al cambiar un cruce se borra su
    enlace de New Recruit (se reasigna por la pareja al sincronizar).
- Las listas se guardan pero de momento no se publican (`LIGA_LISTAS_PUBLICAS = false`).
- Excepción autorizada por el propietario: el **ranking ELO** de la liga de New Recruit (no está en la API
  oficial) se lee con la llamada interna `ladder_get_paginated` de su web, solo junto a la sincronización de
  resultados (mismas esperas) y nunca en una visita. Se muestra en la ficha de Miembros.
