-- Cuenta de Steam (opcional) en las solicitudes de inscripción: para partidas online (Tabletop Simulator). Al entrar
-- por primera vez en la web, pasa a la ficha de Miembros si no tiene ninguna.
ALTER TABLE solicitudes ADD COLUMN steam TEXT;
