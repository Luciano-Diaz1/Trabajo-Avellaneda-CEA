# Mapa de áreas de trabajo de Avellaneda

Aplicación Leaflet para dibujar zonas de trabajo y consultar puntos de interés almacenados en MySQL. El servidor Node.js sirve la web y expone `GET /api/puntos-interes`; el navegador no se conecta directamente a la base de datos.

## Requisitos

- Node.js y npm
- MySQL local iniciado

## Preparar la base de datos

Desde esta carpeta, abrir **Símbolo del sistema (cmd.exe)** y crear las tablas:

```bash
"C:\Program Files\MySQL\MySQL Server 26.7\bin\mysql.exe" -u root -p < database\schema.sql
```

Luego cargar los datos incluidos de categorías, localidades y puntos de interés, una sola vez y en este orden:

```bash
"C:\Program Files\MySQL\MySQL Server 26.7\bin\mysql.exe" -u root -p avellanedamapa < database\seed\categorias.sql
"C:\Program Files\MySQL\MySQL Server 26.7\bin\mysql.exe" -u root -p avellanedamapa < database\seed\localidades.sql
"C:\Program Files\MySQL\MySQL Server 26.7\bin\mysql.exe" -u root -p avellanedamapa < database\seed\puntosinteres.sql
```

La ruta de ejemplo corresponde a MySQL Server 26.7; si está instalado en otra ubicación, reemplázala por la ruta local a `mysql.exe` o agrega su carpeta `bin` al `PATH`. Si el usuario local de MySQL no tiene contraseña, se puede omitir `-p`. Los archivos de `database/seed` contienen las cargas SQL sincronizadas: 13 categorías, 7 localidades y 206 puntos de interés.

La carga inicial debe ejecutarse después de crear el esquema y sobre tablas vacías. Si ya tienes puntos cargados en MySQL, haz una copia de seguridad antes de importar la nueva lista para evitar duplicados; Live Server usa directamente `datos/puntos-interes.json` y no requiere MySQL.

Se corrigieron dos errores de sintaxis del SQL recibido: faltaba una coma en el registro `Parque Avellaneda Shopping` y se usaron comillas dobles para `Cancha de Hockey Racing Club`. También se completó la coma entre las categorías 15 y 16.

## Ejecutar la aplicación

Instalar las dependencias:

```bash
npm install
```

Para abrir el mapa con **Live Server**, primero ejecuta `npm install` para disponer de las librerías cartográficas locales. Leaflet, Leaflet Draw y Turf se sirven desde `node_modules`, así que Live Server solo requiere acceso a internet para los mosaicos del mapa base de OpenStreetMap. Live Server muestra los puntos de `datos/puntos-interes.json`; con `npm start`, la app consulta MySQL y usa ese JSON como respaldo si la API no está disponible. Cada marcador usa el icono PNG de `MaterialVisualCea` correspondiente al ID de categoría 1–13 de `categorias.sql`.

En PowerShell, copiar `.env.example` como `.env` y editar allí el usuario, contraseña, host y puerto de MySQL:

```powershell
Copy-Item .env.example .env
```

No compartas ni publiques el contenido de `.env`. Luego iniciar:

```bash
npm start
```

Abrir <http://localhost:3000>. Cada establecimiento tiene su propio marcador con el icono de su categoría y un popup que muestra sus datos en las coordenadas especificadas en el SQL. El encuadre inicial se limita al municipio para evitar que coordenadas externas alejen y compriman el mapa; esos marcadores conservan sus coordenadas exactas y pueden encontrarse al navegar por el mapa. Los puntos coincidentes no se desplazan artificialmente.

Las zonas dibujadas continúan guardándose en el almacenamiento local del navegador; los puntos de interés se consultan desde MySQL.
