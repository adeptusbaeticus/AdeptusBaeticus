-- Socios creados desde la web (importados del Excel antiguo) que todavía no han iniciado sesión: conectado = 0.
-- Se pone a 1 al iniciar sesión por primera vez. Los que ya existían ya habían entrado.
ALTER TABLE users ADD COLUMN conectado INTEGER NOT NULL DEFAULT 1;
