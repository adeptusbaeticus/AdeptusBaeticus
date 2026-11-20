-- Foro de sugerencias (solo socios con sesión, siempre con su nombre, solo texto).
CREATE TABLE IF NOT EXISTS sugerencias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  autor TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'otros' CHECK (categoria IN ('web','club','torneos','liga','quedadas','otros')),
  titulo TEXT NOT NULL,
  texto TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','estudio','aceptada','hecha','descartada')),
  nota TEXT,
  cerrada INTEGER NOT NULL DEFAULT 0,
  creada TEXT NOT NULL DEFAULT (datetime('now')),
  editada TEXT,
  actividad TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sug_autor ON sugerencias(autor);
CREATE TABLE IF NOT EXISTS sugerencia_votos (
  sugerencia_id INTEGER NOT NULL REFERENCES sugerencias(id) ON DELETE CASCADE,
  discord_id TEXT NOT NULL,
  PRIMARY KEY (sugerencia_id, discord_id)
);
CREATE INDEX IF NOT EXISTS idx_sugv_socio ON sugerencia_votos(discord_id);
CREATE TABLE IF NOT EXISTS sugerencia_respuestas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sugerencia_id INTEGER NOT NULL REFERENCES sugerencias(id) ON DELETE CASCADE,
  autor TEXT NOT NULL,
  texto TEXT NOT NULL,
  creada TEXT NOT NULL DEFAULT (datetime('now')),
  editada TEXT
);
CREATE INDEX IF NOT EXISTS idx_sugr_sug ON sugerencia_respuestas(sugerencia_id);
CREATE INDEX IF NOT EXISTS idx_sugr_autor ON sugerencia_respuestas(autor);
