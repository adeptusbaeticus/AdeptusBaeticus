-- Notificaciones en el móvil (Web Push). Una fila por dispositivo que las activa; se borra al desactivarlas
-- (o sola cuando el navegador la da por caducada). Con permiso del propietario.
CREATE TABLE IF NOT EXISTS push_subs (
  endpoint   TEXT PRIMARY KEY,                       -- dirección de avisos del navegador
  discord_id TEXT NOT NULL REFERENCES users(discord_id) ON DELETE CASCADE,
  p256dh     TEXT NOT NULL,                          -- clave pública del navegador (cifrado)
  auth       TEXT NOT NULL,                          -- secreto de autenticación del navegador
  tipos      TEXT NOT NULL DEFAULT '["eventos","partidas","liga","galeria"]',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subs (discord_id);
