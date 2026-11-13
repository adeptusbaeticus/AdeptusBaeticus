-- Nuevo tipo de trofeo «pintura» (concursos de pintura, un ganador). SQLite no permite cambiar el CHECK,
-- así que se rehace la tabla trofeos conservando sus datos y los ganadores (copia de seguridad temporal).
CREATE TABLE trofeo_miembros_copia AS SELECT trofeo_id, discord_id FROM trofeo_miembros;
CREATE TABLE trofeos_nueva (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre     TEXT    NOT NULL,
  puesto     INTEGER NOT NULL CHECK (puesto BETWEEN 1 AND 3),
  modalidad  TEXT    NOT NULL CHECK (modalidad IN ('individual','parejas','equipo','pintura')),
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  fecha      TEXT
);
INSERT INTO trofeos_nueva (id, nombre, puesto, modalidad, created_at, fecha) SELECT id, nombre, puesto, modalidad, created_at, fecha FROM trofeos;
DROP TABLE trofeos;
ALTER TABLE trofeos_nueva RENAME TO trofeos;
INSERT OR IGNORE INTO trofeo_miembros (trofeo_id, discord_id) SELECT trofeo_id, discord_id FROM trofeo_miembros_copia;
DROP TABLE trofeo_miembros_copia;
