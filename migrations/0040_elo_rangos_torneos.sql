-- ELO por rangos fijos, Novel/Veterano, puntos y formato de los torneos previos, e inscripción a torneos de New Recruit.

-- Experiencia del socio: «novel» (empieza de cero, por defecto) o «veterano» (viene con experiencia). La cambia el admin
-- desde el ranking ELO; sirve para filtrar quién puede inscribirse en un torneo.
ALTER TABLE users ADD COLUMN experiencia TEXT NOT NULL DEFAULT 'novel' CHECK (experiencia IN ('novel', 'veterano'));

-- Torneos previos en el ELO: formato (1v1, 2v2, equipos de 3 o más) y puntos por persona (Combat Patrol, 1k, 2k), que
-- deciden el multiplicador del cambio de ELO. Los ya añadidos: 2v2 si eran por parejas y 2k (estándar, como hasta ahora).
ALTER TABLE elo_torneos ADD COLUMN formato TEXT NOT NULL DEFAULT '1v1' CHECK (formato IN ('1v1', '2v2', 'equipos'));
ALTER TABLE elo_torneos ADD COLUMN puntos TEXT NOT NULL DEFAULT '2k' CHECK (puntos IN ('cp', '1k', '2k'));
UPDATE elo_torneos SET formato = '2v2' WHERE parejas = 1;

-- Torneos del calendario con inscripción en la web (si `formato` está vacío, el torneo se muestra como antes).
-- rangos / experiencias: listas JSON de lo permitido (["instructor","iniciado","aprendiz"] / ["novel","veterano"]).
ALTER TABLE events ADD COLUMN formato TEXT CHECK (formato IN ('1v1', '2v2', 'equipos'));
ALTER TABLE events ADD COLUMN tam_equipo INTEGER CHECK (tam_equipo BETWEEN 1 AND 20);
ALTER TABLE events ADD COLUMN puntos TEXT CHECK (puntos IN ('cp', '1k', '2k'));
ALTER TABLE events ADD COLUMN rangos TEXT;
ALTER TABLE events ADD COLUMN experiencias TEXT;

-- Inscripciones a esos torneos: cada inscripción es un equipo (en 1v1, de un solo jugador y sin nombre); el capitán la
-- hace y sus compañeros la confirman (hasta entonces, «pendiente»).
CREATE TABLE IF NOT EXISTS torneo_equipos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id   INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  nombre     TEXT,
  capitan    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS torneo_miembros (
  equipo_id  INTEGER NOT NULL REFERENCES torneo_equipos(id) ON DELETE CASCADE,
  event_id   INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  discord_id TEXT NOT NULL,
  confirmado INTEGER NOT NULL DEFAULT 0,
  UNIQUE (event_id, discord_id)
);
CREATE INDEX IF NOT EXISTS idx_torneo_equipos_event ON torneo_equipos (event_id);
CREATE INDEX IF NOT EXISTS idx_torneo_miembros_equipo ON torneo_miembros (equipo_id);

-- Notificaciones tipo anuncio con enlace (p. ej. la invitación a un equipo lleva al torneo).
ALTER TABLE anuncios ADD COLUMN enlace TEXT;
