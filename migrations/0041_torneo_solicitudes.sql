-- Torneos con inscripción: un socio puede pedir unirse a un equipo con huecos libres («abierto»); el capitán lo acepta
-- o lo rechaza. Mientras, su fila en torneo_miembros lleva solicitud = 1 (no ocupa plaza ni hueco del equipo).
ALTER TABLE torneo_miembros ADD COLUMN solicitud INTEGER NOT NULL DEFAULT 0;
