-- Ajustes generales de la web (p. ej. 'navidad' = '1' con los efectos de Navidad activados).
CREATE TABLE IF NOT EXISTS ajustes (
  clave TEXT PRIMARY KEY,
  valor TEXT
);
-- Notificaciones tipo anuncio: salen en la servocalavera hasta que el socio las acepta.
CREATE TABLE IF NOT EXISTS anuncios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  discord_id TEXT NOT NULL,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  texto TEXT NOT NULL,
  creado TEXT NOT NULL DEFAULT (datetime('now')),
  aceptado TEXT
);
CREATE INDEX IF NOT EXISTS anuncios_socio ON anuncios (discord_id, aceptado);
