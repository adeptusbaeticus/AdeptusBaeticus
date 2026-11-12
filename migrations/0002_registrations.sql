-- Inscripciones a quedadas (los torneos no usan esta tabla).
-- Aplicar con: npx wrangler d1 migrations apply adeptus-db --remote
CREATE TABLE IF NOT EXISTS registrations (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id   INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  discord_id TEXT    NOT NULL REFERENCES users(discord_id) ON DELETE CASCADE,
  status     TEXT    NOT NULL CHECK (status IN ('inscrito', 'espera')),
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (event_id, discord_id)
);

-- Recuentos por evento y orden de la lista de espera.
CREATE INDEX IF NOT EXISTS idx_registrations_event_status ON registrations (event_id, status, id);
-- "Mis inscripciones".
CREATE INDEX IF NOT EXISTS idx_registrations_discord ON registrations (discord_id);
