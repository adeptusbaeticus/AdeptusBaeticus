-- Partidas perdidas por abandono: 'a' o 'b' es el jugador que abandonó (la partida cuenta como derrota suya).
ALTER TABLE liga_partidas ADD COLUMN abandono TEXT CHECK (abandono IN ('a', 'b'));
-- Gran Liga 2026, ronda 1: German y Vanesa abandonaron (0 – 50).
UPDATE liga_partidas SET abandono = 'a'
WHERE fase_id = (SELECT id FROM liga_fases WHERE edicion = '2026' AND fase = 1) AND ronda = 1 AND pv_a = 0 AND pv_b = 50
  AND jugador_a IN (SELECT id FROM liga_jugadores WHERE fase_id = (SELECT id FROM liga_fases WHERE edicion = '2026' AND fase = 1)
                      AND discord IN ('German', 'Vanesa'));
