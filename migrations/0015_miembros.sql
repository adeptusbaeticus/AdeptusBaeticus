-- Ficha de miembro: facciones que juega y cuentas (con el consentimiento de los socios).
-- Discord ya está (discord_id, name, avatar) y New Recruit en nr_username.
ALTER TABLE users ADD COLUMN facciones TEXT;  -- JSON: lista de facciones
ALTER TABLE users ADD COLUMN instagram TEXT;  -- usuario de Instagram (sin @)
ALTER TABLE users ADD COLUMN steam TEXT;      -- id o nombre de perfil de Steam
ALTER TABLE users ADD COLUMN bcp TEXT;        -- nombre en Best Coast Pairings
