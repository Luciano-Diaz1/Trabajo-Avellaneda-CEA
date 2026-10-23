const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const initSqlJs = require('sql.js');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const ADMIN_EMAIL = 'admin@avellanedafilma.gob.ar';

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error('PORT debe ser un puerto válido.');
}

// ── Ruta de la base de datos ──────────────────────────────────────
const DB_DIR = path.join(__dirname, 'database');
const DB_PATH = path.join(DB_DIR, 'usuarios.db');

// Asegurar que el directorio exista
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let db;

async function initDatabase() {
  const SQL = await initSqlJs();

  // Cargar base de datos existente o crear una nueva
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
    console.log('  📂 Base de datos cargada desde archivo existente.');
  } else {
    db = new SQL.Database();
    console.log('  🆕 Base de datos nueva creada.');
  }

  // Crear tabla de usuarios si no existe
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      tipo TEXT DEFAULT 'general',
      fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  try {
    db.run(`ALTER TABLE usuarios ADD COLUMN tipo TEXT DEFAULT 'general'`);
  } catch (e) {}

  // Crear tabla de reservas / consultas si no existe
  db.run(`
    CREATE TABLE IF NOT EXISTS reservas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      tipo_solicitante TEXT NOT NULL,
      nombre TEXT NOT NULL,
      email TEXT NOT NULL,
      telefono TEXT,
      entidad TEXT,
      locacion TEXT NOT NULL,
      fechas TEXT,
      detalles TEXT,
      zonas_geojson TEXT,
      estado TEXT DEFAULT 'Pendiente',
      fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  try {
    db.run(`ALTER TABLE reservas ADD COLUMN zonas_geojson TEXT`);
  } catch (e) {}

  // Provisionar la cuenta administradora solo con una contraseña configurada fuera del código.
  const adminCheck = db.exec('SELECT id FROM usuarios WHERE email = ?', [ADMIN_EMAIL]);
  if (adminCheck.length === 0 || adminCheck[0].values.length === 0) {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminPassword) {
      if (adminPassword.length < 12) {
        throw new Error('ADMIN_PASSWORD debe tener al menos 12 caracteres.');
      }
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(adminPassword, salt);
      db.run(
        'INSERT INTO usuarios (nombre, email, password, tipo) VALUES (?, ?, ?, ?)',
        ['Administrador General CEA', ADMIN_EMAIL, hash, 'admin']
      );
      console.log(`  🛡️  Cuenta de administración creada: ${ADMIN_EMAIL}`);
    } else {
      console.warn('  ⚠️  ADMIN_PASSWORD no está definido; no se creó la cuenta de administración.');
    }
  }

  saveDatabase();
}

// Guardar la base de datos a disco
function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// ── Middleware ─────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir carpetas de imágenes y recursos del proyecto raíz (solo lectura)
app.use('/imagenes', express.static(path.join(__dirname, '..', 'imagenes')));
app.use('/img', express.static(path.join(__dirname, '..', 'img')));
app.use('/assets-root', express.static(path.join(__dirname, '..')));

// Keep links from the previous static site connected to the current portal.
const legacyPageRoutes = {
  '/index.html': '/',
  '/locaciones.html': '/locaciones',
  '/locaciones2.html': '/locaciones',
  '/hecho-en-avellaneda.html': '/hecho-en-avellaneda',
  '/reserva.html': '/reserva',
  '/form-empresa.html': '/reservar-empresa',
  '/form-estudiante.html': '/reservar-academico',
  '/form-productora.html': '/reservar-productora',
};

Object.entries(legacyPageRoutes).forEach(([legacyPath, currentPath]) => {
  app.get(legacyPath, (req, res) => {
    const query = req.originalUrl.slice(req.path.length);
    res.redirect(302, `${currentPath}${query}`);
  });
});

// Servir archivos estáticos del sistema login/portal
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 4 } // 4 horas
}));

// Middleware de verificación de rol administrador
function requireAdmin(req, res, next) {
  if (req.session.usuario && req.session.usuario.tipo === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador.' });
}

// ── Rutas API de Autenticación ─────────────────────────────────────

// Registro de usuario
app.post('/api/registro', (req, res) => {
  const { nombre, email, password } = req.body;
  const tipo = 'general';

  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
  }

  if (String(email).trim().toLowerCase() === ADMIN_EMAIL) {
    return res.status(400).json({ error: 'Este email está reservado para la cuenta de administración.' });
  }

  // Verificar si el email ya existe
  const existente = db.exec('SELECT id FROM usuarios WHERE email = ?', [email]);
  if (existente.length > 0 && existente[0].values.length > 0) {
    return res.status(400).json({ error: 'Este email ya está registrado.' });
  }

  // Hashear contraseña
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);

  // Insertar usuario
  db.run('INSERT INTO usuarios (nombre, email, password, tipo) VALUES (?, ?, ?, ?)', [nombre, email, hash, 'general']);
  const result = db.exec('SELECT last_insert_rowid() as id');
  const userId = result[0].values[0][0];
  saveDatabase();

  req.session.usuario = { id: userId, nombre, email, tipo };

  res.json({
    success: true,
    mensaje: 'Usuario registrado exitosamente.',
    usuario: { id: userId, nombre, email, tipo }
  });
});

// Login de usuario
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios.' });
  }

  const result = db.exec('SELECT * FROM usuarios WHERE email = ?', [email]);
  if (result.length === 0 || result[0].values.length === 0) {
    return res.status(401).json({ error: 'Email o contraseña incorrectos.' });
  }

  const row = result[0].values[0];
  const columns = result[0].columns;
  const usuario = {};
  columns.forEach((col, i) => { usuario[col] = row[i]; });

  const match = bcrypt.compareSync(password, usuario.password);
  if (!match) {
    return res.status(401).json({ error: 'Email o contraseña incorrectos.' });
  }

  req.session.usuario = {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    tipo: usuario.tipo || 'general'
  };

  res.json({
    success: true,
    mensaje: 'Inicio de sesión exitoso.',
    usuario: req.session.usuario
  });
});

// Verificar sesión
app.get('/api/sesion', (req, res) => {
  if (req.session.usuario) {
    res.json({ autenticado: true, usuario: req.session.usuario });
  } else {
    res.json({ autenticado: false });
  }
});

// Cerrar sesión
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error al cerrar sesión.' });
    }
    res.json({ success: true, mensaje: 'Sesión cerrada.' });
  });
});

// ── Rutas API de Puntos de Interés del Mapa ────────────────────────

app.get('/api/puntos-interes', (req, res) => {
  const puntosPath = path.join(__dirname, 'public', 'mapa', 'datos', 'puntos-interes.json');
  if (fs.existsSync(puntosPath)) {
    return res.sendFile(puntosPath);
  }
  res.status(404).json({ error: 'Puntos de interés no encontrados.' });
});

// ── Rutas API de Reservas y Consultas ──────────────────────────────

// Crear nueva consulta/reserva vinculada al mapa
app.post('/api/reservas', (req, res) => {
  const {
    tipo_solicitante = 'Empresa Privada',
    nombre,
    email,
    telefono = '',
    entidad = '',
    locacion,
    fechas = '',
    detalles = '',
    zonas_geojson = null
  } = req.body;

  if (!nombre || !email || !locacion) {
    return res.status(400).json({ error: 'Nombre, email y locación son campos obligatorios.' });
  }

  const usuarioId = req.session.usuario ? req.session.usuario.id : null;
  const geojsonStr = typeof zonas_geojson === 'object' && zonas_geojson !== null 
    ? JSON.stringify(zonas_geojson) 
    : (zonas_geojson || '');

  db.run(
    `INSERT INTO reservas (usuario_id, tipo_solicitante, nombre, email, telefono, entidad, locacion, fechas, detalles, zonas_geojson)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [usuarioId, tipo_solicitante, nombre, email, telefono, entidad, locacion, fechas, detalles, geojsonStr]
  );
  const result = db.exec('SELECT last_insert_rowid() as id');
  const reservaId = result[0].values[0][0];
  saveDatabase();

  res.json({
    success: true,
    mensaje: `¡Consulta y solicitud de reserva para "${locacion}" registrada exitosamente con el mapa vinculado!`,
    reservaId
  });
});

// Obtener reservas del usuario en sesión
app.get('/api/reservas', (req, res) => {
  try {
    let result;
    if (req.session.usuario) {
      result = db.exec('SELECT * FROM reservas WHERE usuario_id = ? ORDER BY id DESC', [req.session.usuario.id]);
    } else {
      result = db.exec('SELECT * FROM reservas ORDER BY id DESC LIMIT 5');
    }

    if (result.length === 0 || result[0].values.length === 0) {
      return res.json({ reservas: [] });
    }

    const cols = result[0].columns;
    const reservas = result[0].values.map(row => {
      const obj = {};
      cols.forEach((c, i) => { obj[c] = row[i]; });
      return obj;
    });

    res.json({ reservas });
  } catch (err) {
    res.status(500).json({ error: 'Error al consultar reservas.' });
  }
});

// ── Rutas API de Administración ────────────────────────────────────

// Obtener todas las consultas y registros (para la cuenta de administración)
app.get('/api/admin/consultas', requireAdmin, (req, res) => {
  try {
    const result = db.exec(`
      SELECT r.*, u.tipo as usuario_tipo 
      FROM reservas r
      LEFT JOIN usuarios u ON r.usuario_id = u.id
      ORDER BY r.id DESC
    `);

    if (result.length === 0 || result[0].values.length === 0) {
      return res.json({ consultas: [] });
    }

    const cols = result[0].columns;
    const consultas = result[0].values.map(row => {
      const obj = {};
      cols.forEach((c, i) => { obj[c] = row[i]; });
      return obj;
    });

    res.json({ consultas });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener registros de consultantes.' });
  }
});

// Actualizar estado de una consulta (Aprobado, Pendiente, En Revisión, Rechazado)
app.put('/api/admin/consultas/:id/estado', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  if (!estado) {
    return res.status(400).json({ error: 'El estado es obligatorio.' });
  }

  try {
    db.run('UPDATE reservas SET estado = ? WHERE id = ?', [estado, id]);
    saveDatabase();
    res.json({ success: true, mensaje: `Consulta #${id} actualizada a "${estado}".` });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar estado.' });
  }
});

// ── Rutas de páginas del portal ────────────────────────────────────

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/nosotros', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/locaciones', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'locaciones.html'));
});

app.get('/locacion-info', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'locacion-info.html'));
});

app.get('/hecho-en-avellaneda', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'hecho-en-avellaneda.html'));
});

app.get('/reserva', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reserva.html'));
});

app.get('/reservar-empresa', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reservar-empresa.html'));
});

app.get('/reservar-academico', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reservar-academico.html'));
});

app.get('/reservar-productora', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reservar-productora.html'));
});

app.get('/como-reservar', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'como-reservar.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/registro', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'registro.html'));
});

// Panel de Administración
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ── Iniciar servidor ──────────────────────────────────────────────
async function start() {
  await initDatabase();

  app.listen(PORT, () => {
    console.log('');
    console.log('  ╔══════════════════════════════════════════════╗');
    console.log('  ║   🎬 Avellaneda Filma - Portal & Login       ║');
    console.log('  ║   Servidor corriendo en:                     ║');
    console.log(`  ║   http://localhost:${PORT}                      ║`);
    console.log('  ║   Panel Admin: http://localhost:3000/admin   ║');
    console.log('  ╚══════════════════════════════════════════════╝');
    console.log('');
  });
}

start();
