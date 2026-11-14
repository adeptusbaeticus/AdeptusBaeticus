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
- **Datos personales:** no guardar más datos personales de los necesarios; preguntar antes de
  añadir datos nuevos.

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
- Se publica con `/publicar` en Discord o con «Subir fotos» en la web (solo miembros, veteranos y admin): el navegador
  reduce cada foto y las envía de una en una (`/api/galeria/publicar`, `/api/galeria/:id/foto`, `/fin` para el aviso).
  Borrar en la web (autor o admin) borra también el mensaje de Discord. Lo común está en `pubCrear`, `pubAnadir` y
  `pubBorrar`.

- Bendiciones (Emperador / Poderes Ruinosos): cada publicación gana un aura según sus votos (1-10): llamas que
  suben por fuera de los lados desde las esquinas de abajo (doradas a la izquierda; del Caos a la derecha, que se
  oscurecen hacia el negro) y un marco: con 5 de una facción aparece entero de ella (dorado o negro del Caos);
  con 5 o más de las dos, se lo disputan según el porcentaje de votos. La parte del Caos es gris acero oscuro con un filo
  exterior de los cuatro dioses muy oscuros (rojo, verde, azul y morado: excepción a «nunca azul»). Por encima de 10
  solo cambia el reparto del marco.

## Inscripción

- `inscripcion.html` sustituye al formulario de Google; la pestaña «Inscripción» solo sale a los invitados (`auth.js`),
  y el aviso a quien entra sin ser socio enlaza aquí. El aspirante conecta su cuenta con «Conectar con Discord»
  (`/auth/registro`, mismo callback que el login, scope `identify guilds.join`; si ya tiene rol del club se le avisa)
  y rellena: nombre, correo, teléfono (WhatsApp), mayor de edad, intereses (opcional), experiencia de juego y de
  pintura, cómo nos conoció (opcional), estatutos y consentimiento. Tabla `solicitudes` (migración 0028).
- Steam (opcional) se conecta con OpenID de Steam (`/auth/steam` → `/auth/steam/vuelta`, se verifica con
  `check_authentication`; el nombre sale del perfil público en XML) y queda en una cookie firmada (`ab_steam`, 1 h);
  el servidor solo acepta la cuenta de esa cookie, nunca del formulario. Columna `steam` (migración 0029); al
  aprobarse, en su primer inicio de sesión pasa a `users.steam` si estaba vacío. En Miembros, al editar su propia
  ficha, el socio también puede «Conectar con Steam» (`/auth/steam?para=ficha`, con sesión; se guarda la dirección
  personalizada del perfil o el SteamID64) o escribirlo a mano; todas las cuentas de la ficha son opcionales.
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
  Al pulsar el botón se guarda en `nr_cache` (`discord:sin-datos`) la lista de cuentas del servidor sin datos (cuenta,
  usuario, nombre visible, apodo y rol) para revisar las parejas a mano.
- Datos obligatorios al entrar: todo socio menos el admin que no se inscribió con la web y aún no ha completado sus datos
  (`faltanDatos`, `completar` en `/api/me`) va a `inscripcion.html?completar=1` (`auth.js`) hasta guardarlos
  (`/api/socio/datos`, misma validación que la inscripción, `validaDatosSocio`); vienen rellenos con lo del Excel.
  Los que no están en el Excel son nuevos y lo rellenan entero.
  También lo exige el servidor: mientras le falten, toda la API le responde 403 salvo `SIN_DATOS_PERMITIDO`
  (`/api/me`, `/api/socio/datos`, `/api/ver-como/salir`, `/api/push/baja`) y `/api/inscripcion*`.
- Fecha de registro: `users.alta` (del Excel, de la solicitud aprobada o de cuando completa sus datos); en la ficha de
  Miembros, «En el club desde».
- Socios creados desde la web sin haber iniciado sesión (los que se importen del Excel antiguo): `users.conectado = 0`
  (migración 0030); en Miembros salen con la etiqueta «Desconectado» hasta su primer inicio de sesión, que lo pone a 1.

## Encuestas

- Página `encuestas.html` (menú de usuario y tarjeta en Inicio); el admin las crea, edita, cierra y borra ahí
  mismo (migraciones 0023 a 0025). Solo para socios con sesión (los invitados no las ven).
  Cada encuesta es para `aspirantes` (aspirantes y miembros) o `miembros` (miembros, veteranos y admin), sin
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
  Todos contra todos, rondas de 2 semanas (domingo 22:00 → domingo de cierre 14:00, hora de Madrid);
  la ronda siguiente a la última es la de aplazadas.
- **El calendario (rondas y mesas) es el del club**, no el de New Recruit: en New Recruit las partidas
  son un «pod» sin orden y su campo `round` es un correlativo sin significado. De New Recruit solo se
  toman el enlace de cada partida y los resultados, asignados **por la pareja de jugadores**
  (`id_participant`), que es única en cada fase.
- Datos de New Recruit con su API oficial (secretos `NR_LOGIN`/`NR_PASSWORD`) y **el mínimo de
  peticiones**: las visitas nunca consultan New Recruit; actualización automática como mucho cada 6 h
  durante la fase y una tras cada cierre; manual con 15 min de espera mínima; sin reintentos en bucle.
- **Los resultados solo vienen de New Recruit** (única fuente de verdad): la web no puede escribir allí, así
  que no se editan ni se ponen resultados desde la web (se probó y se quitó, migración 0017).
  Las sanciones no se reflejan en la web (ni en la clasificación ni en los avisos del bot).
- Las listas se guardan pero de momento no se publican (`LIGA_LISTAS_PUBLICAS = false`).
- Excepción autorizada por el propietario: el **ranking ELO** de la liga de New Recruit (no está en la API
  oficial) se lee con la llamada interna `ladder_get_paginated` de su web, solo junto a la sincronización de
  resultados (mismas esperas) y nunca en una visita. Se muestra en la ficha de Miembros.
