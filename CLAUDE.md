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
  al subir a `main`.
- **Base de datos:** cada cambio de esquema va en `migrations/NNNN_nombre.sql` y se aplica en
  producción **antes** de subir el código que lo usa.
- **Seguridad:** validación y permisos siempre en el servidor; en el cliente `textContent`/DOM,
  nunca `innerHTML`. No tocar `wrangler.jsonc` ni secretos sin permiso expreso.
- **Datos personales:** no guardar más datos personales de los necesarios; preguntar antes de
  añadir datos nuevos.
