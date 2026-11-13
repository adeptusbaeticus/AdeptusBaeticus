-- Año y mes de cada trofeo (AAAA-MM). Los ya existentes toman el mes en que se asignaron.
ALTER TABLE trofeos ADD COLUMN fecha TEXT;
UPDATE trofeos SET fecha = substr(created_at, 1, 7) WHERE fecha IS NULL;
