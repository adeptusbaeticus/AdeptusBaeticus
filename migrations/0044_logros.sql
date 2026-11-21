-- Asistencia a quedadas (la marca el admin después de la fecha): NULL = sin marcar, 1 = asistió, 0 = no asistió.
ALTER TABLE registrations ADD COLUMN asistio INTEGER CHECK (asistio IN (0, 1));

-- Partida marcada como jugada por un jugador, con foto del resultado (mensaje del bot en #publicaciones-web),
-- pendiente de que un admin la verifique.
ALTER TABLE partidas ADD COLUMN jugada TEXT CHECK (jugada IN ('pendiente', 'verificada', 'rechazada'));
ALTER TABLE partidas ADD COLUMN jugada_por TEXT;
ALTER TABLE partidas ADD COLUMN jugada_at TEXT;
ALTER TABLE partidas ADD COLUMN jugada_texto TEXT;
ALTER TABLE partidas ADD COLUMN jugada_canal TEXT;
ALTER TABLE partidas ADD COLUMN jugada_msg TEXT;
ALTER TABLE partidas ADD COLUMN verificada_por TEXT;
ALTER TABLE partidas ADD COLUMN verificada_at TEXT;
ALTER TABLE partidas ADD COLUMN jugada_motivo TEXT;

-- Logros conseguidos (nivel: 1 bronce, 2 plata, 3 oro; 1 en los de un solo nivel). Nunca se quitan.
CREATE TABLE IF NOT EXISTS logros (
  discord_id TEXT NOT NULL,
  logro      TEXT NOT NULL,
  nivel      INTEGER NOT NULL DEFAULT 1,
  conseguido TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (discord_id, logro)
);
CREATE INDEX IF NOT EXISTS logros_logro ON logros (logro);
