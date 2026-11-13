-- Resultados y sanciones que pone el admin a mano en la Gran Liga. Mientras «manual» tenga valor,
-- la sincronización con New Recruit no toca esa partida.
--   manual: 'resultado' (resultado corregido), '50-25a' / '50-25b' (victoria 50–25 para A / B),
--           '0-0' (doble derrota). nota: motivo opcional, visible en la liga.
ALTER TABLE liga_partidas ADD COLUMN manual TEXT;
ALTER TABLE liga_partidas ADD COLUMN nota TEXT;
