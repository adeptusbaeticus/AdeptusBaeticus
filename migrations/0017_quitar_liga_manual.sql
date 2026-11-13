-- Se quitan los resultados a mano de la Gran Liga (0016): los resultados solo vienen de New Recruit,
-- que es la única fuente de verdad (la web no puede escribir allí).
ALTER TABLE liga_partidas DROP COLUMN manual;
ALTER TABLE liga_partidas DROP COLUMN nota;
