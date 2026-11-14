-- Encuestas: a quién van dirigidas (público, aspirantes y miembros, o solo miembros), cierre opcional, votos
-- secretos o públicos (se ve quién vota qué) y resultados siempre visibles, al votar o solo al cerrar.
-- Las tablas estaban vacías en producción, así que se rehacen desde cero.
DROP TABLE IF EXISTS encuesta_votos;
DROP TABLE IF EXISTS encuesta_opciones;
DROP TABLE IF EXISTS encuestas;
CREATE TABLE encuestas (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  pregunta    TEXT    NOT NULL,
  descripcion TEXT,
  para        TEXT    NOT NULL DEFAULT 'miembros' CHECK (para IN ('publico', 'aspirantes', 'miembros')),
  multiple    INTEGER NOT NULL DEFAULT 0 CHECK (multiple IN (0, 1)),
  votos       TEXT    NOT NULL DEFAULT 'secretos' CHECK (votos IN ('secretos', 'publicos')),
  resultados  TEXT    NOT NULL DEFAULT 'al_votar' CHECK (resultados IN ('siempre', 'al_votar', 'al_cerrar')),
  cierra      TEXT,                     -- "YYYY-MM-DDTHH:MM" hora de Madrid; NULL = abierta hasta que el admin la cierre
  created_by  TEXT REFERENCES users(discord_id) ON DELETE SET NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE encuesta_opciones (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  encuesta_id INTEGER NOT NULL REFERENCES encuestas(id) ON DELETE CASCADE,
  texto       TEXT    NOT NULL,
  orden       INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE encuesta_votos (
  encuesta_id INTEGER NOT NULL REFERENCES encuestas(id) ON DELETE CASCADE,
  opcion_id   INTEGER NOT NULL REFERENCES encuesta_opciones(id) ON DELETE CASCADE,
  discord_id  TEXT    NOT NULL REFERENCES users(discord_id) ON DELETE CASCADE,
  PRIMARY KEY (encuesta_id, opcion_id, discord_id)
);
CREATE INDEX IF NOT EXISTS idx_encuesta_opciones ON encuesta_opciones(encuesta_id);
