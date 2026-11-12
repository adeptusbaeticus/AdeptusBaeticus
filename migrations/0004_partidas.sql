-- Partidas: un socio busca partida, indica cuándo puede y otros se unen.
-- (Tabla aparte de events porque events.type tiene un CHECK que no se puede ampliar sin recrearla.)
CREATE TABLE IF NOT EXISTS partidas (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  created_by   TEXT    NOT NULL REFERENCES users(discord_id) ON DELETE CASCADE,
  activity     TEXT    NOT NULL CHECK (activity IN ('combat_patrol','40k_1000','40k_2000','necromunda','bloodbowl')),
  format       TEXT    CHECK (format IN ('1v1','1v2','2v2')),
  players      INTEGER CHECK (players BETWEEN 2 AND 9),
  -- Tamaño de cada bando (A = quien la crea). En Necromunda: 1 y participantes-1.
  team_a       INTEGER NOT NULL CHECK (team_a BETWEEN 1 AND 2),
  team_b       INTEGER NOT NULL CHECK (team_b BETWEEN 1 AND 8),
  -- JSON: [{"date":"YYYY-MM-DD","from":"HH:MM","to":"HH:MM"}, ...]
  availability TEXT    NOT NULL,
  -- Lo fija el primer jugador que se une, dentro de la disponibilidad.
  starts_at    TEXT,
  mesa         INTEGER CHECK (mesa BETWEEN 1 AND 5),
  status       TEXT    NOT NULL DEFAULT 'abierta' CHECK (status IN ('abierta','completa','cancelada')),
  last_day     TEXT    NOT NULL,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_partidas_last_day ON partidas (last_day);

CREATE TABLE IF NOT EXISTS partida_players (
  partida_id INTEGER NOT NULL REFERENCES partidas(id) ON DELETE CASCADE,
  discord_id TEXT    NOT NULL REFERENCES users(discord_id) ON DELETE CASCADE,
  side       TEXT    NOT NULL CHECK (side IN ('A','B')),
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (partida_id, discord_id)
);
CREATE INDEX IF NOT EXISTS idx_partida_players_user ON partida_players (discord_id);
