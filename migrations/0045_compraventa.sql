-- Compraventa: anuncios de los socios (vendo, busco o cambio) y servicios de los miembros (pintura, clases,
-- impresión 3D u otros). Las fotos viven en mensajes del bot en #fotos-compraventa; aquí solo la referencia.
CREATE TABLE IF NOT EXISTS mercado (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  clase       TEXT NOT NULL CHECK (clase IN ('anuncio', 'servicio')),
  autor       TEXT NOT NULL,
  tipo        TEXT NOT NULL,
  categoria   TEXT,
  juego       TEXT,
  titulo      TEXT NOT NULL,
  descripcion TEXT,
  precio      INTEGER NOT NULL DEFAULT 0,
  tarifas     TEXT,
  enlace      TEXT,
  estado      TEXT NOT NULL DEFAULT 'disponible' CHECK (estado IN ('disponible', 'reservado', 'vendido', 'pausado')),
  imagenes    TEXT NOT NULL DEFAULT '[]',
  channel_id  TEXT,
  message_id  TEXT,
  creado      TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS mercado_autor ON mercado (autor);
CREATE INDEX IF NOT EXISTS mercado_clase ON mercado (clase, estado);
