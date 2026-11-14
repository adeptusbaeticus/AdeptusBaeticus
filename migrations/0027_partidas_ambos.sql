-- Al buscar partida se puede marcar físico y online a la vez («ambos»): quien se une elige cómo se juega.
-- SQLite no permite cambiar el CHECK, así que se rehace la tabla partidas conservando sus datos y sus
-- jugadores (copia de seguridad temporal, como en la migración 0021).
CREATE TABLE partida_players_copia AS SELECT partida_id, discord_id, side, created_at FROM partida_players ORDER BY rowid;
CREATE TABLE partidas_nueva (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  created_by   TEXT    NOT NULL REFERENCES users(discord_id) ON DELETE CASCADE,
  activity     TEXT    NOT NULL CHECK (activity IN ('combat_patrol','40k_1000','40k_2000','necromunda','bloodbowl')),
  format       TEXT    CHECK (format IN ('1v1','1v2','2v2')),
  players      INTEGER CHECK (players BETWEEN 2 AND 9),
  team_a       INTEGER NOT NULL CHECK (team_a BETWEEN 1 AND 2),
  team_b       INTEGER NOT NULL CHECK (team_b BETWEEN 1 AND 8),
  availability TEXT    NOT NULL,
  starts_at    TEXT,
  mesa         INTEGER CHECK (mesa BETWEEN 1 AND 5),
  status       TEXT    NOT NULL DEFAULT 'abierta' CHECK (status IN ('abierta','completa','cancelada')),
  last_day     TEXT    NOT NULL,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  -- fisico (en el club, o en «lugar»), online (Tabletop Simulator) o ambos (lo elige quien se une).
  modo         TEXT    NOT NULL DEFAULT 'fisico' CHECK (modo IN ('fisico','online','ambos')),
  lugar        TEXT
);
INSERT INTO partidas_nueva (id, created_by, activity, format, players, team_a, team_b, availability, starts_at, mesa, status, last_day, created_at, modo, lugar)
  SELECT id, created_by, activity, format, players, team_a, team_b, availability, starts_at, mesa, status, last_day, created_at, modo, lugar FROM partidas;
DROP TABLE partidas;
ALTER TABLE partidas_nueva RENAME TO partidas;
CREATE INDEX IF NOT EXISTS idx_partidas_last_day ON partidas (last_day);
INSERT OR IGNORE INTO partida_players (partida_id, discord_id, side, created_at) SELECT partida_id, discord_id, side, created_at FROM partida_players_copia;
DROP TABLE partida_players_copia;
