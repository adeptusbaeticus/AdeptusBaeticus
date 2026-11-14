-- Se quitan las encuestas públicas: solo para aspirantes y miembros, o solo para miembros.
-- (El valor 'publico' sigue admitido por el CHECK de la tabla, pero el servidor ya no lo usa.)
UPDATE encuestas SET para = 'aspirantes' WHERE para = 'publico';
