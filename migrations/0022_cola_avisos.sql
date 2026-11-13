-- Cola de avisos (notificaciones del móvil y mensajes privados de la liga), para repartir los envíos entre
-- ejecuciones y no pasar los límites del plan gratuito (50 llamadas externas por ejecución).
CREATE TABLE IF NOT EXISTS cola_avisos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo       TEXT    NOT NULL CHECK (tipo IN ('push','liga','canal')),
  datos      TEXT    NOT NULL,           -- JSON con lo necesario para el envío
  lote       TEXT,                       -- agrupa los avisos de un mismo recordatorio (para su resumen)
  coste      INTEGER NOT NULL DEFAULT 1, -- llamadas externas estimadas
  intentos   INTEGER NOT NULL DEFAULT 0,
  despues    TEXT,                       -- no antes de esta hora (UTC); reserva o reintento
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_cola_avisos_despues ON cola_avisos (despues, id);
CREATE INDEX IF NOT EXISTS idx_cola_avisos_lote ON cola_avisos (lote);
-- Canal de mensajes privados de Discord de cada socio (así cada mensaje cuesta una llamada en vez de dos).
CREATE TABLE IF NOT EXISTS dm_canales (
  discord_id TEXT PRIMARY KEY REFERENCES users(discord_id) ON DELETE CASCADE,
  canal_id   TEXT NOT NULL
);
