-- Qué va a hacer cada inscrito en la quedada y con quién juega.
-- Aplicar después de 0002_registrations.sql.

-- Una partida agrupa a los jugadores que se apuntan juntos (bando A = quien inscribe y sus
-- compañeros, bando B = rivales; en Necromunda todos los demás son participantes).
CREATE TABLE IF NOT EXISTS matches (
  id         TEXT    PRIMARY KEY,
  event_id   INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  activity   TEXT    NOT NULL,
  format     TEXT,
  players    INTEGER,
  created_by TEXT,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

ALTER TABLE registrations ADD COLUMN activity TEXT
  CHECK (activity IN ('ver','pintar','combat_patrol','40k_1000','40k_2000','necromunda','bloodbowl'));
ALTER TABLE registrations ADD COLUMN format TEXT CHECK (format IN ('1v1','1v2','2v2'));
ALTER TABLE registrations ADD COLUMN players INTEGER CHECK (players BETWEEN 1 AND 9);
ALTER TABLE registrations ADD COLUMN looking INTEGER NOT NULL DEFAULT 0;
ALTER TABLE registrations ADD COLUMN match_id TEXT REFERENCES matches(id) ON DELETE SET NULL;
ALTER TABLE registrations ADD COLUMN side TEXT CHECK (side IN ('A','B'));
-- discord_id de quien hizo la inscripción cuando no fue el propio jugador.
ALTER TABLE registrations ADD COLUMN added_by TEXT;

CREATE INDEX IF NOT EXISTS idx_registrations_match ON registrations (match_id);
CREATE INDEX IF NOT EXISTS idx_matches_event ON matches (event_id);
