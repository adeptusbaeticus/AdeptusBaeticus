-- Copia local de los datos de New Recruit (API oficial). Las visitas a la web leen de aquí;
-- New Recruit solo se consulta al sincronizar, con un mínimo de 15 minutos entre consultas.
CREATE TABLE IF NOT EXISTS nr_cache (
  clave       TEXT PRIMARY KEY,  -- 'tournament:<id>' o 'reports:<id>'
  datos       TEXT,              -- JSON tal cual lo devuelve New Recruit
  actualizado TEXT,              -- última sincronización correcta
  intento     TEXT,              -- última consulta (reserva y espera mínima)
  error       TEXT
);
