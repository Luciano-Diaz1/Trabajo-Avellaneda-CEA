/* ══════════════════════════════════════════════════════════════════════
   Avellaneda Filma - Widget de Mapa Interactivo y Vinculación a Formularios
   Basado en el Mapa Oficial de Trabajo de Avellaneda (CEA)
   ══════════════════════════════════════════════════════════════════════ */

let mapInstance = null;
let capaZonasGroup = null;
let capaPuntosGroup = null;
let zonasDibujadas = [];
let colorZonaActivo = 'amarillo'; // por defecto zona de filmación
let herramientaDibujo = null;
let limiteMunicipalGeoJson = null;

const COLORES_ZONA = {
  amarillo: { hex: '#e2b630', label: 'Zona de Filmación' },
  verde:    { hex: '#368264', label: 'Zona de Corte de Calle' },
  azul:     { hex: '#397fbd', label: 'Zona de Parking / Equipos' }
};

const ICONOS_CATEGORIA = {
  1:  '/mapa/MaterialVisualCea/LocacionEducacion1.png',
  2:  '/mapa/MaterialVisualCea/LocacionEstadio2.png',
  3:  '/mapa/MaterialVisualCea/LocacionPolideportivo3.png',
  4:  '/mapa/MaterialVisualCea/LocacionIglesia4.png',
  5:  '/mapa/MaterialVisualCea/LocacionMiscelaneo5.png',
  6:  '/mapa/MaterialVisualCea/LocacionServicio6.png',
  7:  '/mapa/MaterialVisualCea/LocacionComplejoHabitacional7.png',
  8:  '/mapa/MaterialVisualCea/LocacionEdificioMunicipal8.png',
  9:  '/mapa/MaterialVisualCea/LocacionEspacioVerde9.png',
  10: '/mapa/MaterialVisualCea/LocacionClub10.png',
  11: '/mapa/MaterialVisualCea/LocacionFabrica11.png',
  12: '/mapa/MaterialVisualCea/LocacionHospital12.png',
  13: '/mapa/MaterialVisualCea/LocacionViaPublica13.png'
};

document.addEventListener('DOMContentLoaded', () => {
  initMapaWidgetToggle();
});

function initMapaWidgetToggle() {
  const btnToggle = document.getElementById('btn-toggle-mapa');
  const wrapper = document.getElementById('mapa-contenedor-wrapper');

  if (!btnToggle || !wrapper) return;

  btnToggle.addEventListener('click', () => {
    const isHidden = wrapper.style.display === 'none';
    if (isHidden) {
      wrapper.style.display = 'block';
      btnToggle.innerHTML = '<span>Ocultar Mapa</span> ▴';
      btnToggle.classList.add('activo');
      
      if (!mapInstance) {
        initLeafletMap();
      } else {
        setTimeout(() => mapInstance.invalidateSize(), 150);
      }
    } else {
      wrapper.style.display = 'none';
      btnToggle.innerHTML = '<span>Abrir Mapa</span> ▾';
      btnToggle.classList.remove('activo');
    }
  });

  const btnLimpiar = document.getElementById('btn-limpiar-mapa');
  if (btnLimpiar) {
    btnLimpiar.addEventListener('click', limpiarZonasMapa);
  }
}

function initLeafletMap() {
  const mapElement = document.getElementById('mapa-leaf');
  if (!mapElement) return;

  // 1. Instanciar Mapa
  mapInstance = L.map(mapElement, { maxZoom: 19 }).setView([-34.66, -58.36], 13);

  // 2. Capa base OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors | CEA Avellaneda',
    maxZoom: 19
  }).addTo(mapInstance);

  capaZonasGroup = L.featureGroup().addTo(mapInstance);
  capaPuntosGroup = L.layerGroup().addTo(mapInstance);

  // 3. Cargar GeoJSON de Avellaneda
  fetch('/mapa/datos/avellaneda.geojson')
    .then(r => r.json())
    .then(data => {
      const feature = data.features.find(f => f.properties?.municipio_nombre === 'Avellaneda') || data.features[0];
      if (feature) {
        limiteMunicipalGeoJson = feature;
        const geoLayer = L.geoJSON(feature, {
          style: {
            color: '#83bc00',
            weight: 2.5,
            fillColor: '#83bc00',
            fillOpacity: 0.08
          }
        }).addTo(mapInstance);
        mapInstance.fitBounds(geoLayer.getBounds(), { padding: [15, 15] });
      }
    })
    .catch(err => console.warn('Error al cargar límite municipal:', err));

  // 4. Cargar Puntos de Interés
  cargarPuntosInteresEnMapa();

  // 5. Configurar selector de colores y dibujo de zonas
  configurarControlesDibujo();
}

async function cargarPuntosInteresEnMapa() {
  try {
    let puntos = [];
    const res = await fetch('/api/puntos-interes');
    if (res.ok) {
      puntos = await res.json();
    } else {
      const resLocal = await fetch('/mapa/datos/puntos-interes.json');
      puntos = await resLocal.json();
    }

    if (!Array.isArray(puntos)) return;

    puntos.forEach(punto => {
      if (!Number.isFinite(punto.latitud) || !Number.isFinite(punto.longitud)) return;

      const iconUrl = ICONOS_CATEGORIA[punto.idCategorias] || '/mapa/MaterialVisualCea/LocacionEdificioMunicipal8.png';
      const markerIcon = L.icon({
        iconUrl: iconUrl,
        iconSize: [28, 38],
        iconAnchor: [14, 37],
        popupAnchor: [0, -34]
      });

      const marker = L.marker([punto.latitud, punto.longitud], {
        icon: markerIcon,
        title: punto.nombre,
        riseOnHover: true
      });

      // Contenido del Popup con botón para transferir al formulario
      const popupHtml = `
        <div class="popup-mapa-cea">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <img src="${iconUrl}" style="height: 24px; width: auto;" alt="Icono">
            <h4 style="margin: 0; font-size: 0.95rem; font-weight: 700; color: #111;">${escapeHtml(punto.nombre)}</h4>
          </div>
          <p style="margin: 0 0 4px; font-size: 0.82rem; color: #555;">
            <strong>Categoría:</strong> ${escapeHtml(punto.categoria || 'Patrimonio')}
          </p>
          <p style="margin: 0 0 8px; font-size: 0.82rem; color: #555;">
            <strong>Localidad:</strong> ${escapeHtml(punto.localidad || 'Avellaneda')}
          </p>
          <button type="button" class="btn-seleccionar-punto-form" onclick="seleccionarPuntoParaFormulario('${escapeJsString(punto.nombre)}', '${escapeJsString(punto.localidad || 'Avellaneda')}')">
            📌 Seleccionar esta locación para el formulario
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);
      capaPuntosGroup.addLayer(marker);
    });

    const estadoPuntos = document.getElementById('estado-puntos-mapa');
    if (estadoPuntos) {
      estadoPuntos.textContent = `${puntos.length} puntos de interés y locaciones cargadas.`;
    }
  } catch (err) {
    console.error('Error al cargar puntos de interés:', err);
  }
}

function configurarControlesDibujo() {
  const botonesColor = document.querySelectorAll('.btn-color-zona');
  const btnDibujar = document.getElementById('btn-dibujar-zona');
  const btnBorrar = document.getElementById('btn-borrar-zona');
  const btnConfirmar = document.getElementById('btn-confirmar-zonas');

  botonesColor.forEach(btn => {
    btn.addEventListener('click', () => {
      botonesColor.forEach(b => b.classList.remove('activo'));
      btn.classList.add('activo');
      colorZonaActivo = btn.dataset.color || 'amarillo';
    });
  });

  if (btnDibujar) {
    btnDibujar.addEventListener('click', () => {
      if (herramientaDibujo) {
        herramientaDibujo.disable();
        herramientaDibujo = null;
        btnDibujar.classList.remove('activo');
        btnDibujar.textContent = '✏️ Dibujar Zona';
        return;
      }

      const colorData = COLORES_ZONA[colorZonaActivo] || COLORES_ZONA.amarillo;
      herramientaDibujo = new L.Draw.Polygon(mapInstance, {
        allowIntersection: false,
        shapeOptions: {
          color: colorData.hex,
          fillColor: colorData.hex,
          fillOpacity: 0.45,
          weight: 3
        }
      });

      herramientaDibujo.enable();
      btnDibujar.classList.add('activo');
      btnDibujar.textContent = '❌ Cancelar Dibujo';
    });
  }

  // Evento cuando se completa el dibujo de un polígono
  mapInstance.on(L.Draw.Event.CREATED, (e) => {
    const layer = e.layer;
    const colorData = COLORES_ZONA[colorZonaActivo] || COLORES_ZONA.amarillo;
    layer.options.color = colorData.hex;
    layer.options.fillColor = colorData.hex;

    const geoJsonFeature = layer.toGeoJSON();
    geoJsonFeature.properties = {
      tipo_zona: colorData.label,
      color: colorZonaActivo,
      fecha_marcado: new Date().toISOString()
    };

    layer.zonaData = geoJsonFeature;

    layer.bindPopup(`
      <strong>${colorData.label}</strong><br>
      <small>Delimitada por el solicitante</small>
    `);

    capaZonasGroup.addLayer(layer);
    zonasDibujadas.push(geoJsonFeature);

    if (herramientaDibujo) {
      herramientaDibujo.disable();
      herramientaDibujo = null;
    }

    if (btnDibujar) {
      btnDibujar.classList.remove('activo');
      btnDibujar.textContent = '✏️ Dibujar Zona';
    }

    actualizarContadorZonas();
  });

  if (btnBorrar) {
    btnBorrar.addEventListener('click', () => {
      limpiarZonasMapa();
    });
  }

  if (btnConfirmar) {
    btnConfirmar.addEventListener('click', () => {
      confirmarZonasYTransferir();
    });
  }
}

function actualizarContadorZonas() {
  const contador = document.getElementById('contador-zonas-texto');
  if (contador) {
    contador.textContent = `${zonasDibujadas.length} zona(s) delimitada(s)`;
  }
}

function limpiarZonasMapa() {
  if (capaZonasGroup) {
    capaZonasGroup.clearLayers();
  }
  zonasDibujadas = [];
  actualizarContadorZonas();

  const hiddenGeoJson = document.getElementById('campo-zonas-geojson');
  if (hiddenGeoJson) hiddenGeoJson.value = '';

  const tag = document.getElementById('mapa-resumen-tag');
  if (tag) tag.style.display = 'none';
}

// Función expuesta globalmente para popups de Leaflet
window.seleccionarPuntoParaFormulario = function(nombre, localidad) {
  const inputLocacion = document.getElementById('campo-locacion');
  if (inputLocacion) {
    // Si es un <select>, buscar si existe la opción o agregarla
    let found = false;
    for (let i = 0; i < inputLocacion.options.length; i++) {
      if (inputLocacion.options[i].value.toLowerCase().includes(nombre.toLowerCase())) {
        inputLocacion.selectedIndex = i;
        found = true;
        break;
      }
    }
    if (!found) {
      const opt = new Option(`${nombre} (${localidad})`, `${nombre} (${localidad})`, true, true);
      inputLocacion.add(opt);
    }
  }

  // Notificar al usuario
  actualizarResumenTag(`${nombre} (${localidad})`, zonasDibujadas.length);

  // Cerrar popup
  if (mapInstance) mapInstance.closePopup();

  // Scroll suave al formulario
  const formElement = document.getElementById('form-reserva-perfil');
  if (formElement) {
    formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

function confirmarZonasYTransferir() {
  const locacionVal = document.getElementById('campo-locacion')?.value || 'Locación seleccionada en mapa';
  const geojsonCollection = {
    type: 'FeatureCollection',
    name: 'zonas-solicitud-rodaje-avellaneda',
    features: zonasDibujadas
  };

  const hiddenGeoJson = document.getElementById('campo-zonas-geojson');
  if (hiddenGeoJson) {
    hiddenGeoJson.value = JSON.stringify(geojsonCollection);
  }

  actualizarResumenTag(locacionVal, zonasDibujadas.length);

  // Ocultar mapa tras confirmación
  const wrapper = document.getElementById('mapa-contenedor-wrapper');
  const btnToggle = document.getElementById('btn-toggle-mapa');
  if (wrapper) wrapper.style.display = 'none';
  if (btnToggle) {
    btnToggle.innerHTML = '<span>Ver Mapa Marcado</span> ▾';
    btnToggle.classList.remove('activo');
  }

  // Scroll suave al formulario
  const form = document.getElementById('form-reserva-perfil');
  if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function actualizarResumenTag(locacion, cantZonas) {
  const tag = document.getElementById('mapa-resumen-tag');
  const texto = document.getElementById('mapa-resumen-texto');

  if (!tag || !texto) return;

  tag.style.display = 'flex';
  texto.innerHTML = `
    <strong>📍 Locación:</strong> ${escapeHtml(locacion)} &nbsp;&middot;&nbsp; 
    <strong>🎨 Zonas marcadas:</strong> ${cantZonas} delimitación(es) en el mapa
  `;
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

function escapeJsString(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
