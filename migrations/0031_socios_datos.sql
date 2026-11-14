-- Datos de inscripción de los socios que no entraron por el formulario de la web: los importados del Excel antiguo
-- (origen 'excel') y los que los completan al entrar por primera vez (origen 'web'). Los que se inscriben con la web
-- tienen sus datos en `solicitudes`.
-- discord_alias: el alias del Excel, para vincularlo con su cuenta de Discord (discord_id) con el bot o al entrar.
-- completado_at: cuando el socio revisó y completó sus datos (hasta entonces se le pide al entrar).
CREATE TABLE IF NOT EXISTS socios_datos (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  discord_id          TEXT UNIQUE,
  discord_alias       TEXT,
  nombre              TEXT,
  email               TEXT,
  telefono            TEXT,
  mayor_edad          INTEGER CHECK (mayor_edad IN (0, 1)),
  juegos              TEXT,
  experiencia_juego   TEXT,
  experiencia_pintura TEXT,
  como_conocio        TEXT,
  acepta_estatutos    INTEGER CHECK (acepta_estatutos IN (0, 1)),
  consentimiento      INTEGER CHECK (consentimiento IN (0, 1)),
  instagram           TEXT,
  alta                TEXT,             -- fecha de registro en el club (YYYY-MM-DD)
  origen              TEXT NOT NULL DEFAULT 'web' CHECK (origen IN ('excel', 'web')),
  completado_at       TEXT,
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);
-- Fecha de registro de cada socio en el club (YYYY-MM-DD).
ALTER TABLE users ADD COLUMN alta TEXT;
