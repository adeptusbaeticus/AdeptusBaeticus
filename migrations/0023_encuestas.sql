-- Encuestas del club: las crea y edita el admin; votan los socios con sesión (un voto por socio, o varias
-- opciones si la encuesta lo permite). Los resultados se muestran solo como totales, nunca quién votó qué.
CREATE TABLE IF NOT EXISTS encuestas (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  pregunta    TEXT    NOT NULL,
  descripcion TEXT,
  multiple    INTEGER NOT NULL DEFAULT 0 CHECK (multiple IN (0, 1)),
  resultados  TEXT    NOT NULL DEFAULT 'al_votar' CHECK (resultados IN ('al_votar', 'al_cerrar')),
  cierra      TEXT    NOT NULL,          -- hora de Madrid, AAAA-MM-DDTHH:MM
  created_by  TEXT    REFERENCES users(discord_id) ON DELETE SET NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS encuesta_opciones (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  encuesta_id INTEGER NOT NULL REFERENCES encuestas(id) ON DELETE CASCADE,
  texto       TEXT    NOT NULL,
  orden       INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_encuesta_opciones ON encuesta_opciones (encuesta_id, orden);
CREATE TABLE IF NOT EXISTS encuesta_votos (
  encuesta_id INTEGER NOT NULL REFERENCES encuestas(id) ON DELETE CASCADE,
  opcion_id   INTEGER NOT NULL REFERENCES encuesta_opciones(id) ON DELETE CASCADE,
  discord_id  TEXT    NOT NULL REFERENCES users(discord_id) ON DELETE CASCADE,
  PRIMARY KEY (encuesta_id, opcion_id, discord_id)
);
CREATE INDEX IF NOT EXISTS idx_encuesta_votos_user ON encuesta_votos (encuesta_id, discord_id);
