-- Torneos por parejas (equipos de 2) en el ELO: cada cruce es una sola partida 2 contra 2 (jugador_a y jugador_a2 contra
-- jugador_b y jugador_b2), con el resultado de la primera mesa del cruce en New Recruit.
ALTER TABLE elo_torneo_partidas ADD COLUMN jugador_a2 INTEGER REFERENCES elo_torneo_jugadores(id) ON DELETE CASCADE;
ALTER TABLE elo_torneo_partidas ADD COLUMN jugador_b2 INTEGER REFERENCES elo_torneo_jugadores(id) ON DELETE CASCADE;
ALTER TABLE elo_torneos ADD COLUMN parejas INTEGER NOT NULL DEFAULT 0;
