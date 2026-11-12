-- Numeración consecutiva de publicaciones (sin saltos al borrar) y bendiciones del Emperador.
-- numero: el que se ve y usan /editar y /borrar. numero_discord: el que muestra ahora el
-- mensaje del bot en Discord (si no coincide, la web lo corrige).
ALTER TABLE publicaciones ADD COLUMN numero INTEGER;
ALTER TABLE publicaciones ADD COLUMN numero_discord INTEGER;
UPDATE publicaciones
   SET numero_discord = id,
       numero = (SELECT COUNT(*) FROM publicaciones q WHERE q.id <= publicaciones.id);
CREATE INDEX IF NOT EXISTS idx_publicaciones_numero ON publicaciones (numero);

-- Una bendición por socio y publicación.
CREATE TABLE IF NOT EXISTS bendiciones (
  publicacion_id INTEGER NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
  discord_id     TEXT    NOT NULL REFERENCES users(discord_id) ON DELETE CASCADE,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (publicacion_id, discord_id)
);
