-- Fecha de la última conexión de cada socio a la web (se actualiza como mucho una vez por hora).
ALTER TABLE users ADD COLUMN ultima_conexion TEXT;
