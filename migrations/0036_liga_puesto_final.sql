-- Puesto final de cada jugador en una liga pasada, tal como sale en la clasificación final de New Recruit (si está, la
-- web ordena así esa liga en lugar de calcularlo).
ALTER TABLE liga_jugadores ADD COLUMN puesto_final INTEGER;

-- Gran Liga 2026: clasificación final de New Recruit («End of Round 4»).
UPDATE liga_jugadores SET puesto_final = CASE nr_nombre
    WHEN 'Pedro CJ' THEN 1 WHEN 'seikros' THEN 2 WHEN 'Aneg' THEN 3 WHEN 'Adrián gv' THEN 4 WHEN 'corvus_codex' THEN 5
    WHEN 'SirAres' THEN 6 WHEN 'Frambu' THEN 7 WHEN 'Vanesa' THEN 8 WHEN 'German' THEN 9 WHEN 'JoseRP93' THEN 10
    WHEN 'Iván' THEN 11 WHEN 'MaikelEdge' THEN 12 WHEN 'pedro96017' THEN 13 WHEN 'Miguel Angel Arias' THEN 14 END
  WHERE fase_id = (SELECT id FROM liga_fases WHERE edicion = '2026' AND fase = 1);

-- Gran Liga 2026: nombres y cuentas de la web de quienes no estaban en la liga actual (Miguel Angel Arias ya no es socio).
UPDATE liga_jugadores SET discord = 'JoseRP93', nombre = 'Jose', discord_id = '238644515408183296'
  WHERE nr_nombre = 'JoseRP93' AND fase_id = (SELECT id FROM liga_fases WHERE edicion = '2026' AND fase = 1);
UPDATE liga_jugadores SET discord = 'Gatosaurio', nombre = 'Iván', discord_id = '599676687382347780'
  WHERE nr_nombre = 'Iván' AND fase_id = (SELECT id FROM liga_fases WHERE edicion = '2026' AND fase = 1);
UPDATE liga_jugadores SET discord = 'pwent', nombre = 'German', discord_id = '1369107579698942045'
  WHERE nr_nombre = 'German' AND fase_id = (SELECT id FROM liga_fases WHERE edicion = '2026' AND fase = 1);
UPDATE liga_jugadores SET discord = 'Vanesa', nombre = NULL, discord_id = '1436000462439714826'
  WHERE nr_nombre = 'Vanesa' AND fase_id = (SELECT id FROM liga_fases WHERE edicion = '2026' AND fase = 1);
