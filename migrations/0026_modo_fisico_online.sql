-- Físico (en una mesa) u online (Tabletop Simulator). Las quedadas son siempre físicas; los torneos y las
-- partidas pueden ser de los dos tipos. En las partidas físicas se puede indicar el lugar (vacío = en el club,
-- con mesa asignada); las online no llevan mesa.
ALTER TABLE events ADD COLUMN modo TEXT NOT NULL DEFAULT 'fisico' CHECK (modo IN ('fisico', 'online'));
ALTER TABLE partidas ADD COLUMN modo TEXT NOT NULL DEFAULT 'fisico' CHECK (modo IN ('fisico', 'online'));
ALTER TABLE partidas ADD COLUMN lugar TEXT;
