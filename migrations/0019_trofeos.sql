-- Trofeos del club (palmarés): los asigna el admin desde Miembros. Cada trofeo tiene nombre, puesto
-- (1 oro, 2 plata, 3 bronce) y modalidad; sus ganadores van en trofeo_miembros (1, 2 o los del equipo).
CREATE TABLE IF NOT EXISTS trofeos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre     TEXT    NOT NULL,
  puesto     INTEGER NOT NULL CHECK (puesto BETWEEN 1 AND 3),
  modalidad  TEXT    NOT NULL CHECK (modalidad IN ('individual','parejas','equipo')),
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS trofeo_miembros (
  trofeo_id  INTEGER NOT NULL REFERENCES trofeos(id) ON DELETE CASCADE,
  discord_id TEXT    NOT NULL REFERENCES users(discord_id) ON DELETE CASCADE,
  PRIMARY KEY (trofeo_id, discord_id)
);
CREATE INDEX IF NOT EXISTS idx_trofeo_miembros_user ON trofeo_miembros (discord_id);
