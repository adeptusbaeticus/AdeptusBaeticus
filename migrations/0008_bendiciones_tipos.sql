-- Dos tipos de bendición: del Emperador y de los Poderes Ruinosos.
-- Cada socio puede dar una de cada tipo por publicación (como las reacciones de Discord).
-- SQLite no permite cambiar la clave primaria, así que se recrea la tabla conservando las existentes.
CREATE TABLE bendiciones_nueva (
  publicacion_id INTEGER NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
  discord_id     TEXT    NOT NULL REFERENCES users(discord_id) ON DELETE CASCADE,
  tipo           TEXT    NOT NULL DEFAULT 'emperador' CHECK (tipo IN ('emperador','ruinosos')),
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (publicacion_id, discord_id, tipo)
);
INSERT INTO bendiciones_nueva (publicacion_id, discord_id, tipo, created_at)
  SELECT publicacion_id, discord_id, 'emperador', created_at FROM bendiciones;
DROP TABLE bendiciones;
ALTER TABLE bendiciones_nueva RENAME TO bendiciones;
