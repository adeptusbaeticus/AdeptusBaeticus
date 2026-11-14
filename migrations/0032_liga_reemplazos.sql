-- Reemplazos en la Gran Liga: cuando un jugador sustituye a otro, se queda con su fila (partidas y resultados).
-- nr_anteriores: JSON con los id_participant de New Recruit de los jugadores a los que sustituyó, para que los
-- resultados que ya jugaron sigan asignándose a esta fila al sincronizar.
ALTER TABLE liga_jugadores ADD COLUMN nr_anteriores TEXT;
