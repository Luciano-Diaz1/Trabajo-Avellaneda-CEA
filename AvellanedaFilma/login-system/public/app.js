/* ══════════════════════════════════════════════════════════════════════
   Avellaneda Filma - Lógica Unificada (app.js)
   Manejo de Autenticación, Catálogo, Carrusel y Reservas
   ══════════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  initSharedFooter();
  hideFilmLeader();

  // ── Verificar y actualizar estado de sesión global ──────────────
  checkSessionStatus();

  // ── Inicializar Login / Registro si existen en la página ─────────
  initAuthForms();

  // ── Inicializar Catálogo de Películas & Peli Info ────────────────
  initHechoEnAvellaneda();

  // ── Inicializar Carrusel de Locaciones ───────────────────────────
  initLocacionCarousel();

  // ── Inicializar Ficha de Locación ─────────────────────────────────
  initLocacionInfo();

  // ── Conservar la locación al elegir un perfil de reserva ──────────
  initReservaPerfiles();

  // ── Inicializar Formularios de Reserva ──────────────────────────
  initReservaForms();
});

function initSharedFooter() {
  const footer = `
    <footer class="cea-footer" id="contacto">
      <div class="cea-colorbar" aria-hidden="true">
        <span></span><span></span><span></span><span></span>
      </div>
      <div class="cea-footer-inner">
        <div class="cea-footer-col cea-footer-brand">
          <a href="/" class="cea-footer-logo" aria-label="Avellaneda Filma, inicio">
            <img src="/imagenes/logofooter.png" alt="Centro de Experimentación Audiovisual" class="cea-footer-logo-img">
          </a>
          <p class="cea-footer-tag">Centro de Experimentación Audiovisual · Municipalidad de Avellaneda</p>
          <p class="cea-footer-desc">Cine, formación, producción y preservación de la memoria audiovisual de Avellaneda.</p>
        </div>
        <div class="cea-footer-col">
          <h4 class="cea-footer-title">Avellaneda Filma</h4>
          <ul class="cea-footer-list">
            <li><a href="/">Nosotros</a></li>
            <li><a href="/locaciones">Catálogo de locaciones</a></li>
            <li><a href="/hecho-en-avellaneda">Hecho en Avellaneda</a></li>
            <li><a href="/como-reservar">Cómo reservar</a></li>
          </ul>
        </div>
        <div class="cea-footer-col">
          <h4 class="cea-footer-title">Solicitudes</h4>
          <ul class="cea-footer-list">
            <li><a href="/reserva">Solicitar permiso de rodaje</a></li>
            <li><a href="/reservar-empresa">Empresas</a></li>
            <li><a href="/reservar-academico">Estudiantes e instituciones</a></li>
            <li><a href="/reservar-productora">Productoras independientes</a></li>
          </ul>
        </div>
        <div class="cea-footer-col">
          <h4 class="cea-footer-title">Contacto</h4>
          <ul class="cea-footer-list">
            <li><span class="cea-footer-label">Dirección</span>Colón 1133 · Avellaneda</li>
            <li><span class="cea-footer-label">Consultas</span><a href="mailto:cineavellaneda.cea@gmail.com">cineavellaneda.cea@gmail.com</a></li>
          </ul>
          <div class="cea-footer-social" aria-label="Redes sociales">
            <a href="https://www.instagram.com/cea.avellaneda" target="_blank" rel="noopener noreferrer" aria-label="Instagram del CEA">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
          </div>
        </div>
      </div>
      <div class="cea-footer-bottom">
        <p>© <span data-cea-year></span> CEA · Municipalidad de Avellaneda. Todos los derechos reservados.</p>
        <a href="https://mda.gob.ar" target="_blank" rel="noopener noreferrer">Municipalidad de Avellaneda</a>
      </div>
    </footer>`;

  const existingFooter = document.querySelector('footer');
  if (existingFooter) {
    existingFooter.outerHTML = footer;
  } else {
    document.body.insertAdjacentHTML('beforeend', footer);
  }
  document.querySelector('[data-cea-year]').textContent = new Date().getFullYear();
}

function hideFilmLeader() {
  const leader = document.getElementById('film-leader');
  if (leader) {
    window.setTimeout(() => leader.classList.add('is-hidden'), 1600);
  }
}

const LOCACIONES_DATA = {
  municipal: {
    titulo: 'Edificio Municipal de Avellaneda',
    subtitulo: 'Sede de gobierno comunal · Avellaneda Centro',
    solicitud: 'Edificio Municipal de Avellaneda',
    descripcion: 'Sede de gobierno comunal y edificio de valor histórico, con fachadas monumentales y espacios públicos aptos para escenas cívicas e institucionales.',
    condiciones: 'Condiciones de rodaje: la disponibilidad de espacios y los permisos deben coordinarse previamente con las áreas municipales correspondientes.',
    imagenes: [
      ['/imagenes/imagen4.png', 'Edificio Municipal de Avellaneda'],
      ['/imagenes/imagen1.JPG', 'Arquitectura de Avellaneda'],
      ['/imagenes/imagen2.JPG', 'Espacio urbano de Avellaneda']
    ],
    coordenadas: [-34.662, -58.366]
  },
  estadio: {
    titulo: 'Estadio Presidente Perón · Racing Club',
    subtitulo: 'Estadio Presidente Perón · Avellaneda',
    solicitud: 'Estadio Presidente Perón (Racing Club)',
    descripcion: 'El Cilindro de Avellaneda ofrece tribunas circulares, campo de juego y espacios exteriores para producciones audiovisuales.',
    condiciones: 'Condiciones de rodaje: se requiere autorización previa de la institución y coordinación de fechas, accesos y necesidades de producción.',
    imagenes: [
      ['/img/canchaavellaneda.jpe', 'Estadio Presidente Perón de Racing Club'],
      ['/imagenes/imagen1.JPG', 'Estadio y entorno de Avellaneda'],
      ['/imagenes/imagen3.JPG', 'Espacio urbano de Avellaneda']
    ],
    coordenadas: [-34.667456, -58.368603]
  },
  escuelas: {
    titulo: 'Instituciones educativas de Avellaneda',
    subtitulo: 'Escuelas e instituciones educativas · Municipio de Avellaneda',
    solicitud: 'Instituciones educativas de Avellaneda',
    descripcion: 'La categoría reúne escuelas e instituciones educativas del municipio, con distintos estilos arquitectónicos y espacios interiores y exteriores.',
    condiciones: 'Condiciones de rodaje: cada institución requiere autorización previa y coordinación de fechas, accesos y uso de sus instalaciones.',
    imagenes: [
      ['/imagenes/imagen2.JPG', 'Institución educativa de Avellaneda'],
      ['/imagenes/imagen3.JPG', 'Espacio de Avellaneda'],
      ['/imagenes/imagen4.png', 'Edificio municipal de Avellaneda']
    ],
    coordenadas: [-34.66, -58.36]
  },
  transbordador: {
    titulo: 'Puente Transbordador Nicolás Avellaneda',
    subtitulo: 'Monumento Histórico Nacional · Isla Maciel - La Boca',
    solicitud: 'Puente Transbordador Nicolás Avellaneda',
    descripcion: 'Inaugurado en 1914, este puente transbordador es un emblema de la historia industrial y portuaria de Avellaneda.',
    condiciones: 'Condiciones de rodaje: los permisos de filmación y cualquier coordinación de tránsito deben gestionarse previamente con las autoridades correspondientes.',
    imagenes: [
      ['/img/transbordador.jpe', 'Puente Transbordador Nicolás Avellaneda'],
      ['/imagenes/imagen1.JPG', 'Puente Transbordador y su entorno'],
      ['/img/puentegerli.webp', 'Estructura de puente en Avellaneda']
    ],
    coordenadas: [-34.6375, -58.355]
  },
  saladita: {
    titulo: 'La Saladita',
    subtitulo: 'Predio y entorno de la Reserva Ecológica · Sarandí',
    solicitud: 'Predio La Saladita',
    descripcion: 'Un entorno amplio y abierto con una identidad urbana característica del municipio, apto para distintos tipos de producciones.',
    condiciones: 'Condiciones de rodaje: la disponibilidad del predio y los requerimientos de seguridad deben coordinarse previamente.',
    imagenes: [
      ['/img/saladita.jpe', 'Predio La Saladita'],
      ['/img/sarandiestacion.webp', 'Entorno de Sarandí'],
      ['/imagenes/imagen3.JPG', 'Espacio urbano de Avellaneda']
    ],
    coordenadas: [-34.671293, -58.341172]
  },
  puentegerli: {
    titulo: 'Puente Gerli',
    subtitulo: 'Viaducto General Manuel Belgrano · Gerli',
    solicitud: 'Puente Gerli',
    descripcion: 'Estructura vial elevada que cruza las vías del ferrocarril Roca y ofrece vistas abiertas del entorno urbano.',
    condiciones: 'Condiciones de rodaje: cualquier intervención vial o corte de tránsito requiere coordinación y autorización previas.',
    imagenes: [
      ['/img/puentegerli.webp', 'Puente Gerli'],
      ['/img/sarandiestacion.webp', 'Entorno ferroviario de Avellaneda'],
      ['/imagenes/imagen1.JPG', 'Espacio urbano de Avellaneda']
    ],
    coordenadas: [-34.675, -58.366]
  },
  sarandi: {
    titulo: 'Estación Sarandí',
    subtitulo: 'Entorno ferroviario · Sarandí',
    solicitud: 'Estación Sarandí',
    descripcion: 'Entorno ferroviario con andenes, cruces peatonales y arquitectura característica del transporte suburbano.',
    condiciones: 'Condiciones de rodaje: se requiere coordinación previa con las autoridades ferroviarias y municipales para definir accesos y horarios.',
    imagenes: [
      ['/img/sarandiestacion.webp', 'Estación Sarandí'],
      ['/img/puentegerli.webp', 'Viaducto General Manuel Belgrano'],
      ['/imagenes/imagen2.JPG', 'Entorno urbano de Avellaneda']
    ],
    coordenadas: [-34.683, -58.35]
  }
};

function initLocacionInfo() {
  const titulo = document.getElementById('locacion-titulo');
  if (!titulo) return;

  const id = new URLSearchParams(window.location.search).get('id') || 'transbordador';
  const locacion = LOCACIONES_DATA[id];

  if (!locacion) {
    titulo.textContent = 'Locación no encontrada';
    document.getElementById('locacion-subtitulo').textContent =
      'Elegí una locación disponible en el catálogo.';
    document.getElementById('locacion-descripcion').textContent =
      'No encontramos esa ficha. Volvé al catálogo para elegir una locación disponible.';
    document.getElementById('locacion-condiciones').textContent = '';
    document.getElementById('locacion-reservar').href = '/locaciones';
    document.getElementById('locacion-reservar').querySelector('.big-text').textContent =
      'VOLVER AL CATÁLOGO';
    document.title = 'Locación no encontrada · Avellaneda Filma';
    return;
  }

  titulo.textContent = locacion.titulo;
  document.getElementById('locacion-subtitulo').textContent = locacion.subtitulo;
  document.getElementById('locacion-descripcion').textContent = locacion.descripcion;
  document.getElementById('locacion-condiciones').innerHTML =
    `<strong>Condiciones de rodaje:</strong> ${escapeHtml(locacion.condiciones.replace(/^Condiciones de rodaje:\s*/, ''))}`;
  document.title = `${locacion.titulo} · Avellaneda Filma`;

  locacion.imagenes.forEach(([src, alt], index) => {
    const image = document.getElementById(`slide-img-${index + 1}`);
    image.src = src;
    image.alt = alt;
  });

  const [latitud, longitud] = locacion.coordenadas;
  const margenLatitud = 0.004;
  const margenLongitud = 0.007;
  const bbox = [
    longitud - margenLongitud,
    latitud - margenLatitud,
    longitud + margenLongitud,
    latitud + margenLatitud
  ].map(valor => valor.toFixed(6)).join(',');
  const mapa = document.getElementById('locacion-mapa');
  mapa.src = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${latitud}%2C${longitud}`;
  mapa.title = `Mapa de ubicación de ${locacion.titulo}`;

  const botonReservar = document.getElementById('locacion-reservar');
  botonReservar.href = `/reserva?locacion=${encodeURIComponent(locacion.solicitud)}`;
}

// ══════════════════════════════════════════════════════════════════════
// 1. GESTIÓN DE SESIÓN
// ══════════════════════════════════════════════════════════════════════

async function checkSessionStatus() {
  try {
    const res = await fetch('/api/sesion');
    const data = await res.json();
    const userBarRight = document.getElementById('user-bar-right');

    if (!userBarRight) return;

    if (data.autenticado && data.usuario) {
      const u = data.usuario;
      const adminLink = u.tipo === 'admin'
        ? `<a href="/admin" style="color: #f87171; font-weight: 700; margin-right: 4px;">🛡️ Panel Admin</a>` 
        : '';

      userBarRight.innerHTML = `
        <div class="user-logged-info">
          <span>👋 Hola, <strong>${escapeHtml(u.nombre)}</strong> <span class="user-bar-badge">${escapeHtml(u.tipo || 'Usuario')}</span></span>
          ${adminLink}
          <a href="/reserva" style="color: var(--green-filma); font-weight: 600;">Mis Reservas</a>
          <button type="button" class="btn-logout-small" id="btn-global-logout">Salir</button>
        </div>
      `;

      const logoutBtn = document.getElementById('btn-global-logout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
      }

      // Autocompletar campos si hay formulario de reserva en pantalla
      autoFillUserData(u);
    } else {
      userBarRight.innerHTML = `
        <a href="/login">Iniciar Sesión</a>
        <a href="/registro" style="color: var(--green-filma); font-weight: 600;">Registrarse</a>
      `;
    }
  } catch (err) {
    console.error('Error al verificar sesión:', err);
  }
}

async function handleLogout() {
  try {
    const res = await fetch('/api/logout', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      window.location.reload();
    }
  } catch (err) {
    alert('Error al cerrar sesión');
  }
}

function autoFillUserData(usuario) {
  const nombreInput = document.getElementById('reserva-nombre') || document.getElementById('campo-nombre');
  const emailInput = document.getElementById('reserva-email') || document.getElementById('campo-email');
  if (nombreInput && !nombreInput.value) nombreInput.value = usuario.nombre;
  if (emailInput && !emailInput.value) emailInput.value = usuario.email;
}

// ══════════════════════════════════════════════════════════════════════
// 2. FORMULARIOS DE AUTENTICACIÓN
// ══════════════════════════════════════════════════════════════════════

function initAuthForms() {
  const loginForm = document.getElementById('form-login');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const alertBox = document.getElementById('alert-box');

      showAlert(alertBox, 'Verificando datos...', 'success');

      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (data.success) {
          showAlert(alertBox, `¡Bienvenido/a ${data.usuario.nombre}! Redirigiendo...`, 'success');
          setTimeout(() => {
            if (data.usuario.tipo === 'admin') {
              window.location.href = '/admin';
            } else {
              window.location.href = '/reserva';
            }
          }, 1100);
        } else {
          showAlert(alertBox, data.error || 'Credenciales incorrectas.', 'error');
        }
      } catch (err) {
        showAlert(alertBox, 'Error de conexión con el servidor.', 'error');
      }
    });
  }

  const registroForm = document.getElementById('form-registro');
  if (registroForm) {
    registroForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nombre = document.getElementById('registro-nombre').value.trim();
      const email = document.getElementById('registro-email').value.trim();
      const password = document.getElementById('registro-password').value;
      const confirm = document.getElementById('registro-confirm').value;
      const tipo = document.getElementById('registro-tipo') ? document.getElementById('registro-tipo').value : 'general';
      const alertBox = document.getElementById('alert-box');

      if (password !== confirm) {
        showAlert(alertBox, 'Las contraseñas no coinciden.', 'error');
        return;
      }

      showAlert(alertBox, 'Creando tu cuenta...', 'success');

      try {
        const res = await fetch('/api/registro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre, email, password, tipo })
        });
        const data = await res.json();

        if (data.success) {
          showAlert(alertBox, '¡Cuenta creada con éxito! Redirigiendo al portal...', 'success');
          setTimeout(() => {
            window.location.href = '/';
          }, 1300);
        } else {
          showAlert(alertBox, data.error || 'Error al registrar usuario.', 'error');
        }
      } catch (err) {
        showAlert(alertBox, 'Error de conexión con el servidor.', 'error');
      }
    });
  }
}

// ══════════════════════════════════════════════════════════════════════
// 3. HECHO EN AVELLANEDA & PELI INFO
// ══════════════════════════════════════════════════════════════════════

const PELICULAS_DATA = [
  {
    id: 'cuando-oscurece',
    titulo: 'Cuando Oscurece',
    categoria: 'película',
    numero: 'Pelicula 3',
    poster: '/imagenes/papelesenelviento.webp',
    grabadoEn: 'Avellaneda Centro y Dock Sud',
    elenco: 'Cesar Troncoso, Andrea Carballo, Matilde Creimer Chiabrando',
    direccion: 'Nestor Mazzini',
    dondeVer: 'Cine.ar Play / Funciones especiales CEA',
    sintesis: 'Flor cree que está de vacaciones con su papá, pero en realidad, él la raptó, pues teme no poder verla más luego del conflicto judicial con su madre. Un viaje tenso filmado en las calles y rincones de Avellaneda.'
  },
  {
    id: 'bajo-mi-piel-morena',
    titulo: 'Bajo mi Piel Morena',
    categoria: 'película',
    numero: 'Pelicula 1',
    poster: '/imagenes/relatosalvajes.webp',
    grabadoEn: 'Avellaneda y alrededores del conurbano',
    elenco: 'Morena Yfrán, Maryanne Sandoval, Malena Rolón',
    direccion: 'José Celestino Campusano',
    dondeVer: 'Cine.ar Play / YouTube',
    sintesis: 'Retrata las vivencias y vicisitudes laborales y afectivas de tres mujeres trans que conviven en el sur del conurbano bonaerense, defendiendo su dignidad y trabajo diario.'
  },
  {
    id: 'covert-affairs',
    titulo: 'Covert Affairs',
    categoria: 'serie',
    numero: 'Pelicula 2',
    poster: '/imagenes/elmarginal3.webp',
    grabadoEn: 'Puente Transbordador y Puerto de Dock Sud',
    elenco: 'Piper Perabo, Christopher Gorham, Kari Matchett',
    direccion: 'Matt Corman, Chris Ord',
    dondeVer: 'Amazon Prime Video',
    sintesis: 'Serie internacional de espionaje que rodó secuencias clave de persecución y misterio utilizando los puentes industriales y el patrimonio portuario de Avellaneda como escenario cinematográfico.'
  },
  {
    id: 'el-marginal',
    titulo: 'El Marginal',
    categoria: 'serie',
    numero: 'Serie 1',
    poster: '/imagenes/elmar.jpg',
    grabadoEn: 'Isla Maciel y Ex-fábricas de Avellaneda',
    elenco: 'Juan Minujín, Nicolás Furtado, Claudio Rissi, Martina Gusmán',
    direccion: 'Luis Ortega, Alejandro Ciancio',
    dondeVer: 'Netflix / Cont.ar',
    sintesis: 'Un expolicía se infiltra como convicto en la cárcel de San Onofre. Diversas escenas exteriores y de escape fueron rodadas en locaciones ribereñas de Avellaneda.'
  },
  {
    id: 'relatos-salvajes',
    titulo: 'Relatos Salvajes',
    categoria: 'película',
    numero: 'Película 4',
    poster: '/imagenes/relatoss.jpg',
    grabadoEn: 'Calles de Avellaneda y accesos viales',
    elenco: 'Ricardo Darín, Érica Rivas, Leonardo Sbaraglia, Oscar Martínez',
    direccion: 'Damián Szifron',
    dondeVer: 'Max / HBO',
    sintesis: 'Seis relatos independientes que exploran la pérdida de control y la violencia cotidiana. Escenas viales y técnicas fueron filmadas en los accesos del municipio.'
  },
  {
    id: 'papeles-en-el-viento',
    titulo: 'Papeles en el Viento',
    categoria: 'película',
    numero: 'Película 5',
    poster: '/imagenes/papelesenelvi.jpg',
    grabadoEn: 'Estadio Presidente Perón (Cancha de Racing) y calles de Avellaneda',
    elenco: 'Diego Peretti, Pablo Echarri, Pablo Rago, Diego Torres',
    direccion: 'Juan Taratuto',
    dondeVer: 'Star+ / Disney+',
    sintesis: 'Basada en la novela de Eduardo Sacheri. Tras la muerte de un amigo, tres hinchas intentan recuperar la inversión que su compañero hizo en una promesa futbolística en Avellaneda.'
  }
];

function initHechoEnAvellaneda() {
  const searchInput = document.getElementById('buscar-pelicula');
  const filterSelect = document.getElementById('filtro-categoria');
  const catalogContainer = document.getElementById('peliculas-grid');

  if (!catalogContainer) return;

  renderPeliculas(PELICULAS_DATA);

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      filtrarCatalogo();
    });
  }

  if (filterSelect) {
    filterSelect.addEventListener('change', () => {
      filtrarCatalogo();
    });
  }
}

let peliculaSeleccionadaId = null;

function filtrarCatalogo() {
  const query = (document.getElementById('buscar-pelicula')?.value || '').toLowerCase().trim();
  const cat = document.getElementById('filtro-categoria')?.value || 'todas';

  const filtradas = PELICULAS_DATA.filter(p => {
    const matchQuery = p.titulo.toLowerCase().includes(query) ||
                       p.elenco.toLowerCase().includes(query) ||
                       p.direccion.toLowerCase().includes(query) ||
                       p.sintesis.toLowerCase().includes(query);
    const matchCat = cat === 'todas' || p.categoria === cat;
    return matchQuery && matchCat;
  });

  renderPeliculas(filtradas);
}

function renderPeliculas(lista) {
  const container = document.getElementById('peliculas-grid');
  if (!container) return;
  const infoSection = document.getElementById('peli-info-section');

  if (peliculaSeleccionadaId && !lista.some((pelicula) => pelicula.id === peliculaSeleccionadaId)) {
    peliculaSeleccionadaId = null;
    if (infoSection) infoSection.hidden = true;
  }

  const resultCount = document.getElementById('catalog-result-count');
  if (resultCount) {
    resultCount.textContent = `${lista.length} ${lista.length === 1 ? 'título' : 'títulos'}`;
  }

  if (lista.length === 0) {
    container.innerHTML = '<p class="catalog-empty-state">No se encontraron títulos que coincidan con la búsqueda. Probá con otra palabra o formato.</p>';
    return;
  }

  container.innerHTML = lista.map(p => `
    <button type="button" class="card-pelicula-cea${p.id === peliculaSeleccionadaId ? ' seleccionada' : ''}" data-pelicula-id="${escapeHtml(p.id)}" aria-label="Ver detalles de ${escapeHtml(p.titulo)}" aria-pressed="${p.id === peliculaSeleccionadaId}">
      <span class="card-pelicula-poster">
        <img src="${escapeHtml(p.poster)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='/imagenes/LogoCremaESTAESLAPOSTA.jpg'">
        <span class="pelicula-badge">${escapeHtml(p.categoria)}</span>
      </span>
      <span class="card-pelicula-meta">
        <span class="pelicula-label">${escapeHtml(p.titulo)}</span>
        <span class="pelicula-numero">${escapeHtml(p.numero)}</span>
      </span>
    </button>
  `).join('');

  container.querySelectorAll('[data-pelicula-id]').forEach((card) => {
    card.addEventListener('click', () => window.mostrarPeliInfo(card.dataset.peliculaId));
  });
}

window.mostrarPeliInfo = function(id) {
  const peli = PELICULAS_DATA.find(p => p.id === id);
  if (!peli) return;
  peliculaSeleccionadaId = peli.id;

  const infoSection = document.getElementById('peli-info-section');
  const posterEl = document.getElementById('peli-info-poster-img');
  const titleEl = document.getElementById('peli-info-titulo-display');
  const grabadoEnEl = document.getElementById('peli-info-grabado');
  const elencoEl = document.getElementById('peli-info-elenco');
  const direccionEl = document.getElementById('peli-info-direccion');
  const dondeVerEl = document.getElementById('peli-info-donde-ver');
  const sintesisEl = document.getElementById('peli-info-sintesis');

  if (posterEl) posterEl.src = peli.poster;
  if (posterEl) posterEl.alt = `Afiche de ${peli.titulo}`;
  if (titleEl) titleEl.textContent = peli.titulo;
  if (grabadoEnEl) grabadoEnEl.textContent = peli.grabadoEn;
  if (elencoEl) elencoEl.textContent = peli.elenco;
  if (direccionEl) direccionEl.textContent = peli.direccion;
  if (dondeVerEl) dondeVerEl.textContent = peli.dondeVer;
  if (sintesisEl) sintesisEl.textContent = peli.sintesis;

  if (infoSection) {
    infoSection.hidden = false;
    infoSection.scrollIntoView({ behavior: 'smooth' });
  }

  document.querySelectorAll('.card-pelicula-cea').forEach((card) => {
    const selected = card.dataset.peliculaId === peli.id;
    card.classList.toggle('seleccionada', selected);
    card.setAttribute('aria-pressed', String(selected));
  });
};

// ══════════════════════════════════════════════════════════════════════
// 4. CARRUSEL DE LOCACIÓN INFO
// ══════════════════════════════════════════════════════════════════════

function initLocacionCarousel() {
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');
  const thumbs = document.querySelectorAll('.carousel-slide-thumb');

  if (!thumbs.length) return;

  let currentIndex = 0;

  function setSlide(index) {
    currentIndex = (index + thumbs.length) % thumbs.length;
    thumbs.forEach((t, i) => {
      t.classList.toggle('active', i === currentIndex);
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => setSlide(currentIndex - 1));
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => setSlide(currentIndex + 1));
  }

  thumbs.forEach((t, idx) => {
    t.addEventListener('click', () => setSlide(idx));
  });
}

function obtenerLocacionSolicitada() {
  const valor = new URLSearchParams(window.location.search).get('locacion');
  return LOCACIONES_DATA[valor]?.solicitud || valor;
}

function initReservaPerfiles() {
  const locacion = obtenerLocacionSolicitada();
  if (!locacion) return;

  document.querySelectorAll('.tarjeta-perfil-cea').forEach((enlace) => {
    const destino = new URL(enlace.href, window.location.href);
    destino.searchParams.set('locacion', locacion);
    enlace.href = destino.pathname + destino.search;
  });
}

// ══════════════════════════════════════════════════════════════════════
// 5. FORMULARIOS DE RESERVA
// ══════════════════════════════════════════════════════════════════════

function initReservaForms() {
  const formReserva = document.getElementById('form-reserva-perfil');
  if (!formReserva) return;

  const locacionSolicitada = obtenerLocacionSolicitada();
  const selectorLocacion = document.getElementById('campo-locacion');
  if (locacionSolicitada && selectorLocacion) {
    const opcionExistente = [...selectorLocacion.options]
      .find((opcion) => opcion.value === locacionSolicitada);
    if (!opcionExistente) {
      selectorLocacion.add(new Option(locacionSolicitada, locacionSolicitada));
    }
    selectorLocacion.value = locacionSolicitada;
  }

  formReserva.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = formReserva.querySelector('button[type="submit"]');
    const alertBox = document.getElementById('alert-box');

    const tipo_solicitante = document.getElementById('tipo-solicitante')?.value || 'General';
    const nombre = document.getElementById('campo-nombre')?.value.trim();
    const email = document.getElementById('campo-email')?.value.trim();
    const telefono = document.getElementById('campo-telefono')?.value.trim() || '';
    const entidad = document.getElementById('campo-entidad')?.value.trim() || '';
    const locacion = document.getElementById('campo-locacion')?.value || '';
    const fechas = document.getElementById('campo-fechas')?.value.trim() || '';
    const detalles = document.getElementById('campo-detalles')?.value.trim() || '';
    const zonas_geojson = document.getElementById('campo-zonas-geojson')?.value || null;

    if (!nombre || !email || !locacion) {
      showAlert(alertBox, 'Por favor completá los campos obligatorios: Nombre, Email y Locación.', 'error');
      return;
    }

    if (btn) btn.disabled = true;
    showAlert(alertBox, 'Enviando solicitud de reserva y consulta a Avellaneda Filma...', 'success');

    try {
      const res = await fetch('/api/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo_solicitante,
          nombre,
          email,
          telefono,
          entidad,
          locacion,
          fechas,
          detalles,
          zonas_geojson
        })
      });
      const data = await res.json();

      if (data.success) {
        showAlert(alertBox, data.mensaje, 'success');
        formReserva.reset();
        setTimeout(() => {
          window.location.href = '/como-reservar';
        }, 2500);
      } else {
        showAlert(alertBox, data.error || 'No se pudo registrar la reserva.', 'error');
      }
    } catch (err) {
      showAlert(alertBox, 'Error de conexión al enviar la reserva.', 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  });
}

// ══════════════════════════════════════════════════════════════════════
// UTILIDADES
// ══════════════════════════════════════════════════════════════════════

function showAlert(el, msg, type) {
  if (!el) return;
  el.textContent = msg;
  el.className = `alert-box show ${type}`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
