USE avellanedamapa;

-- Ubicaciones contrastadas con OpenStreetMap; no se desplazan coordenadas sin coincidencia.
START TRANSACTION;

UPDATE puntosinteres
SET latitud = -34.6783905, longitud = -58.3406051
WHERE nombre = 'Arsenal Fútbol Club' AND Localidades_idLocalidades = 2;

UPDATE puntosinteres
SET latitud = -34.6783905, longitud = -58.3406051
WHERE nombre = 'Estadio Julio Humberto Grondona' AND Localidades_idLocalidades = 2;

UPDATE puntosinteres
SET latitud = -34.6577774, longitud = -58.343944
WHERE nombre = 'Club Sportivo Dock Sud' AND Localidades_idLocalidades = 3;

UPDATE puntosinteres
SET latitud = -34.6577491, longitud = -58.3444391
WHERE nombre = 'Estadio de Los Inmigrantes' AND Localidades_idLocalidades = 3;

UPDATE puntosinteres
SET latitud = -34.6652109, longitud = -58.311365
WHERE nombre = 'Eco Área Municipal';

DELETE FROM puntosinteres
WHERE Localidades_idLocalidades = 1
  AND nombre IN (
    'Bodegón de Barrio',
    'Cine Amado Nervo',
    'Club El Porvenir',
    'Plaza San Martín',
    'Centro Cultural Gerli',
    'Biblioteca Popular Joaquín V. González'
  );

UPDATE puntosinteres
SET latitud = -34.6611704, longitud = -58.3311462
WHERE nombre = 'Villa Inflamable' AND Localidades_idLocalidades = 3;

UPDATE puntosinteres
SET latitud = -34.6527183, longitud = -58.3592682
WHERE nombre = 'Villa Tranquila' AND Localidades_idLocalidades = 3;

UPDATE puntosinteres
SET latitud = -34.695685, longitud = -58.315567
WHERE nombre = 'Hospital Zonal General de Agudos Doctor Eduardo Wilde'
  AND Localidades_idLocalidades = 4;

UPDATE puntosinteres
SET latitud = -34.6626371, longitud = -58.3643126
WHERE nombre = 'Pertutti' AND Localidades_idLocalidades = 7;

UPDATE puntosinteres
SET latitud = -34.6622409, longitud = -58.3632174
WHERE nombre = 'Teatro Municipal Roma' AND Localidades_idLocalidades = 7;

UPDATE puntosinteres
SET latitud = -34.6581316, longitud = -58.3715406
WHERE nombre = 'Teatro Colonial' AND Localidades_idLocalidades = 7;

UPDATE puntosinteres
SET latitud = -34.6675758, longitud = -58.3685308
WHERE nombre = 'Racing Club' AND Localidades_idLocalidades = 7;

UPDATE puntosinteres
SET latitud = -34.6800947, longitud = -58.3597093
WHERE nombre = 'Polideportivo Municipal Delfo Cabrera'
  AND Localidades_idLocalidades = 7;

UPDATE puntosinteres
SET latitud = -34.6667513, longitud = -58.3658378
WHERE nombre = 'Hospital Interzonal General de Agudos Dr. Pedro Fiorito'
  AND Localidades_idLocalidades = 7;

UPDATE puntosinteres
SET latitud = -34.6662777, longitud = -58.3511554
WHERE nombre = 'Hospital Materno Infantil Ana Goitia'
  AND Localidades_idLocalidades = 7;

COMMIT;
