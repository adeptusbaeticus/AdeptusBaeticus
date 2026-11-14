-- Solicitudes de inscripción al club (sustituyen al formulario de Google). El aspirante conecta su cuenta de
-- Discord y rellena sus datos; el bot publica la solicitud en #inner-circle-general con «Aprobar»/«Rechazar» y,
-- al aprobarla un admin, le mete en el servidor con el rol de Aspirante.
-- token_cifrado: permiso de Discord (refresh token, cifrado con AES-GCM) para añadirle al servidor; se borra al
-- decidir la solicitud.
CREATE TABLE IF NOT EXISTS solicitudes (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  discord_id          TEXT    NOT NULL,
  discord_usuario     TEXT    NOT NULL,
  nombre              TEXT    NOT NULL,
  email               TEXT    NOT NULL,
  telefono            TEXT    NOT NULL,
  mayor_edad          INTEGER NOT NULL CHECK (mayor_edad IN (0, 1)),
  juegos              TEXT,             -- JSON: lista de juegos que le interesan (opcional)
  experiencia_juego   TEXT    NOT NULL,
  experiencia_pintura TEXT    NOT NULL,
  como_conocio        TEXT,
  acepta_estatutos    INTEGER NOT NULL CHECK (acepta_estatutos = 1),
  consentimiento      INTEGER NOT NULL CHECK (consentimiento = 1),
  estado              TEXT    NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
  token_cifrado       TEXT,
  canal_id            TEXT,
  mensaje_id          TEXT,
  decidido_por        TEXT,
  decidido_at         TEXT,
  created_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);
-- Una sola solicitud pendiente por cuenta de Discord.
CREATE UNIQUE INDEX IF NOT EXISTS idx_solicitud_pendiente ON solicitudes (discord_id) WHERE estado = 'pendiente';
