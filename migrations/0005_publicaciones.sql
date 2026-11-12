-- Galería: fotos publicadas desde Discord con /publicar en #publicaciones-web.
-- La imagen vive en el mensaje que el bot deja en el canal; aquí se guarda la referencia.
CREATE TABLE IF NOT EXISTS publicaciones (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  discord_id  TEXT    NOT NULL,
  autor       TEXT    NOT NULL,
  texto       TEXT,
  channel_id  TEXT    NOT NULL,
  message_id  TEXT,
  image_url   TEXT,
  width       INTEGER,
  height      INTEGER,
  status      TEXT    NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente','publicada')),
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT
);
CREATE INDEX IF NOT EXISTS idx_publicaciones_status ON publicaciones (status, id);
