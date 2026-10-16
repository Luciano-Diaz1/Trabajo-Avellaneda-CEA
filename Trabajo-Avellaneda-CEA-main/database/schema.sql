CREATE DATABASE IF NOT EXISTS avellanedamapa
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE avellanedamapa;

CREATE TABLE IF NOT EXISTS categorias (
  idCategorias INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  PRIMARY KEY (idCategorias),
  UNIQUE KEY uq_categorias_nombre (nombre)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS localidades (
  idLocalidades INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  PRIMARY KEY (idLocalidades),
  UNIQUE KEY uq_localidades_nombre (nombre)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS puntosinteres (
  idPuntosInteres INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(255) NOT NULL,
  latitud DECIMAL(18, 15) NOT NULL,
  longitud DECIMAL(18, 15) NOT NULL,
  Categorias_idCategorias INT NOT NULL,
  Localidades_idLocalidades INT NOT NULL,
  PRIMARY KEY (idPuntosInteres),
  KEY ix_puntosinteres_categoria (Categorias_idCategorias),
  KEY ix_puntosinteres_localidad (Localidades_idLocalidades),
  CONSTRAINT fk_puntosinteres_categoria
    FOREIGN KEY (Categorias_idCategorias)
    REFERENCES categorias (idCategorias),
  CONSTRAINT fk_puntosinteres_localidad
    FOREIGN KEY (Localidades_idLocalidades)
    REFERENCES localidades (idLocalidades)
) ENGINE=InnoDB;
