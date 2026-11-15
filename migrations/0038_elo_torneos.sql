-- Torneos puntuales de New Recruit añadidos al ELO del club (desde el ranking ELO, solo admin). Sus partidas cuentan en
-- el momento en que se añadieron (`anadido`, hora de Madrid), intercaladas con las de la Gran Liga.
CREATE TABLE IF NOT EXISTS elo_torneos (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  nr_torneo TEXT NOT NULL UNIQUE,   -- id del torneo en New Recruit
  nombre    TEXT NOT NULL,
  fecha     TEXT,                   -- fecha del torneo en New Recruit (solo informativa)
  anadido   TEXT NOT NULL           -- 'YYYY-MM-DD HH:MM' (Madrid): su sitio en el orden del ELO
);
-- Jugadores del torneo: su socio de la web, o NULL si es un jugador antiguo («REDACTED»).
CREATE TABLE IF NOT EXISTS elo_torneo_jugadores (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  torneo_id       INTEGER NOT NULL REFERENCES elo_torneos(id) ON DELETE CASCADE,
  nr_participante TEXT NOT NULL,
  nr_nombre       TEXT NOT NULL,
  discord_id      TEXT,
  UNIQUE (torneo_id, nr_participante)
);
CREATE TABLE IF NOT EXISTS elo_torneo_partidas (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  torneo_id INTEGER NOT NULL REFERENCES elo_torneos(id) ON DELETE CASCADE,
  ronda     INTEGER NOT NULL,
  mesa      INTEGER NOT NULL,
  jugador_a INTEGER NOT NULL REFERENCES elo_torneo_jugadores(id) ON DELETE CASCADE,
  jugador_b INTEGER NOT NULL REFERENCES elo_torneo_jugadores(id) ON DELETE CASCADE,
  pv_a      INTEGER NOT NULL,
  pv_b      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_elo_torneo_partidas ON elo_torneo_partidas (torneo_id);
