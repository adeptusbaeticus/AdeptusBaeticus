-- Partidas «handshake» (acordadas entre los jugadores): se marcan a mano (admin, en la Gran Liga), se muestran con su
-- etiqueta y no cuentan para el ELO del club (en el ranking ELO salen apagadas).
ALTER TABLE liga_partidas ADD COLUMN handshake INTEGER NOT NULL DEFAULT 0;
