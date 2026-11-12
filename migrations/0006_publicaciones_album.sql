-- Publicaciones con varias fotos (hasta 10): JSON [{"url":..,"width":..,"height":..}, ...].
-- image_url/width/height se mantienen como portada (la primera foto).
ALTER TABLE publicaciones ADD COLUMN imagenes TEXT;
UPDATE publicaciones
   SET imagenes = json_array(json_object('url', image_url, 'width', width, 'height', height))
 WHERE image_url IS NOT NULL AND imagenes IS NULL;
