-- Vincular cada jugador de la liga con su cuenta de Discord en la web (users.discord_id).
-- discord_id: vínculo confirmado (automático si coinciden apodo de Discord y usuario de New Recruit,
-- o puesto por un admin). sugerido_id: posible vínculo pendiente de que un admin lo confirme.
ALTER TABLE liga_jugadores ADD COLUMN discord_id TEXT;
ALTER TABLE liga_jugadores ADD COLUMN sugerido_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_liga_jugadores_vinculo ON liga_jugadores (fase_id, discord_id) WHERE discord_id IS NOT NULL;
