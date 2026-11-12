-- Posts de la web (Inicio), publicados por admins con /añadir-post en #publicaciones-post-web.
-- Cada post: una imagen, un título y una descripción con el formato de Discord.
-- La imagen vive en el mensaje del bot en el canal; aquí se guarda la referencia.
CREATE TABLE IF NOT EXISTS posts (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  discord_id     TEXT    NOT NULL,
  autor          TEXT    NOT NULL,
  titulo         TEXT,
  descripcion    TEXT,
  channel_id     TEXT    NOT NULL,
  message_id     TEXT,
  image_src      TEXT,   -- adjunto original mientras se rellena el formulario
  image_tipo     TEXT,
  image_filename TEXT,
  image_url      TEXT,
  width          INTEGER,
  height         INTEGER,
  status         TEXT    NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente','publicado')),
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT
);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts (status, id);
