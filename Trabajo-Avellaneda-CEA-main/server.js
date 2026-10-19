const path = require("node:path");
const express = require("express");
const mysql = require("mysql2/promise");
require("dotenv").config();

const requiredConfig = ["MYSQL_HOST", "MYSQL_DATABASE", "MYSQL_USER"];
const missingConfig = requiredConfig.filter((key) => !process.env[key]);

if (missingConfig.length > 0) {
  throw new Error(`Faltan variables de entorno: ${missingConfig.join(", ")}`);
}

const port = Number(process.env.PORT || 3000);
const mysqlPort = Number(process.env.MYSQL_PORT || 3306);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT debe ser un puerto válido.");
}
if (!Number.isInteger(mysqlPort) || mysqlPort < 1 || mysqlPort > 65535) {
  throw new Error("MYSQL_PORT debe ser un puerto válido.");
}

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: mysqlPort,
  database: process.env.MYSQL_DATABASE,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD || "",
  waitForConnections: true,
  connectionLimit: 10,
});

const app = express();

app.get("/api/puntos-interes", async (_request, response) => {
  try {
    const [puntos] = await pool.query(`
      SELECT
        p.idPuntosInteres,
        p.nombre,
        p.latitud,
        p.longitud,
        c.idCategorias,
        c.nombre AS categoria,
        l.idLocalidades,
        l.nombre AS localidad
      FROM puntosinteres AS p
      INNER JOIN categorias AS c
        ON c.idCategorias = p.Categorias_idCategorias
      INNER JOIN localidades AS l
        ON l.idLocalidades = p.Localidades_idLocalidades
      ORDER BY l.nombre, p.nombre
    `);

    response.json(puntos.map((punto) => ({
      ...punto,
      latitud: Number(punto.latitud),
      longitud: Number(punto.longitud),
    })));
  } catch (error) {
    console.error("No se pudieron consultar los puntos de interés:", error);
    response.status(503).json({
      error: "No se pudieron cargar los puntos de interés desde MySQL.",
    });
  }
});

app.use(express.static(path.join(__dirname)));

async function start() {
  await pool.query("SELECT 1");
  app.listen(port, () => {
    console.log(`App disponible en http://localhost:${port}`);
  });
}

start().catch(async (error) => {
  console.error("No se pudo iniciar la aplicación o conectar con MySQL:", error);
  await pool.end();
  process.exitCode = 1;
});
