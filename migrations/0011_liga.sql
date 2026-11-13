-- Gran Liga Adeptus: fases (ida/vuelta de cada edición), jugadores, calendario y resultados.
-- Los resultados vienen de New Recruit (API oficial); la web solo lee de aquí.
CREATE TABLE IF NOT EXISTS liga_fases (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  edicion   TEXT    NOT NULL,                           -- p. ej. '2026-2028'
  fase      INTEGER NOT NULL CHECK (fase IN (1, 2)),    -- 1 = ida, 2 = vuelta
  nombre    TEXT    NOT NULL,                           -- p. ej. 'Fase I 2026–2027'
  nr_torneo TEXT,                                       -- id del torneo en New Recruit
  inicio    TEXT    NOT NULL,                           -- inicio de la ronda 1, hora de Madrid 'YYYY-MM-DDTHH:MM'
  rondas    INTEGER NOT NULL DEFAULT 19,
  UNIQUE (edicion, fase)
);

CREATE TABLE IF NOT EXISTS liga_jugadores (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  fase_id         INTEGER NOT NULL REFERENCES liga_fases(id) ON DELETE CASCADE,
  discord         TEXT    NOT NULL,   -- usuario de Discord (nombre que se muestra)
  nombre          TEXT,               -- nombre de pila
  nr_participante TEXT,               -- id_participant en New Recruit (identifica al jugador)
  nr_nombre       TEXT,               -- usuario en New Recruit
  UNIQUE (fase_id, discord)
);

CREATE TABLE IF NOT EXISTS liga_partidas (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  fase_id    INTEGER NOT NULL REFERENCES liga_fases(id) ON DELETE CASCADE,
  ronda      INTEGER NOT NULL,
  mesa       INTEGER NOT NULL,
  stream     INTEGER NOT NULL DEFAULT 0,
  jugador_a  INTEGER NOT NULL REFERENCES liga_jugadores(id),
  jugador_b  INTEGER NOT NULL REFERENCES liga_jugadores(id),
  nr_partida TEXT,                     -- id_match en New Recruit
  aplazada   INTEGER NOT NULL DEFAULT 0, -- se juega en la ronda de aplazadas (la última + 1)
  -- Resultado (de New Recruit)
  pv_a INTEGER, pv_b INTEGER, jugada TEXT, nr_informe TEXT,
  faccion_a TEXT, faccion_b TEXT, destac_a TEXT, destac_b TEXT,
  lista_a TEXT, lista_b TEXT,
  UNIQUE (fase_id, ronda, mesa)
);
CREATE INDEX IF NOT EXISTS idx_liga_partidas_fase ON liga_partidas (fase_id, ronda);
