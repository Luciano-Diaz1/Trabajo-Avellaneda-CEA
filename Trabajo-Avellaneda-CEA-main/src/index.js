const map = L.map(document.querySelector(".mapa"), { maxZoom: 19 })
  .setView([-34.66, -58.36], 12);
const capaZonas = L.featureGroup().addTo(map);
const capaPuntosInteres = L.layerGroup().addTo(map);
const capasPorZona = new Map();
const coloresZona = {
  azul: "#397fbd",
  verde: "#368264",
  amarillo: "#e2b630",
};
const iconosPorCategoria = {
  1: "LocacionEducacion1.png",
  2: "LocacionEstadio2.png",
  3: "LocacionPolideportivo3.png",
  4: "LocacionIglesia4.png",
  5: "LocacionMiscelaneo5.png",
  6: "LocacionServicio6.png",
  7: "LocacionComplejoHabitacional7.png",
  8: "LocacionEdificioMunicipal8.png",
  9: "LocacionEspacioVerde9.png",
  10: "LocacionClub10.png",
  11: "LocacionFabrica11.png",
  12: "LocacionHospital12.png",
  13: "LocacionViaPublica13.png",
};
const iconosLeafletPorCategoria = Object.fromEntries(
  Object.entries(iconosPorCategoria).map(([id, archivo]) => [
    id,
    L.icon({
      iconUrl: `MaterialVisualCea/${archivo}`,
      iconSize: [30, 40],
      iconAnchor: [15, 39],
      popupAnchor: [0, -36],
    }),
  ]),
);
const claveAlmacenamiento = "zonas-trabajo-avellaneda-v1";
const claveAlmacenamientoAnterior = "avellaneda-work-zones-v1";
const elementoEstado = document.querySelector(".estado-editor");
const elementoEstadoPuntos = document.querySelector(".estado-puntos");
const elementoContador = document.querySelector(".contador-zonas");
const botonDibujar = document.querySelector(".accion-principal");
const botonBorrar = document.querySelector(".accion-icono");
const botonesColor = [...document.querySelectorAll(".opcion-color")];
const botonExportar = document.querySelector(".accion-exportar");
let limiteMunicipal;
let zonas = [];
let colorActivo = "azul";
let zonaSeleccionada = null;
let herramientaDibujo;

// Agrega un mapa base (OpenStreetMap)
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19,
}).addTo(map);

fetch("datos/avellaneda.geojson")
  .then((response) => {
    if (!response.ok) {
      throw new Error(`No se pudo cargar el GeoJSON: ${response.status}`);
    }
    return response.json();
  })
  .then((collection) => {
    const feature = collection.features.find(
      (item) => item.properties.municipio_nombre === "Avellaneda",
    );

    if (!feature) {
      throw new Error("No se encontró el límite municipal de Avellaneda.");
    }
    limiteMunicipal = feature;

    const avellaneda = L.geoJSON(feature, {
      style: {
        color: "#b64632",
        weight: 2,
        fillColor: "#e89b61",
        fillOpacity: 0.25,
      },
    }).addTo(map);

    map.fitBounds(avellaneda.getBounds(), { padding: [20, 20] });
    cargarZonas();
    actualizarEditor();
    cargarPuntosInteres();
  })
  .catch((error) => console.error("Error al mostrar Avellaneda:", error));

async function cargarPuntosInteres() {
  try {
    let puntos;
    let origen = "MySQL";
    let respuestaApi;

    try {
      respuestaApi = await fetch("/api/puntos-interes");
    } catch (error) {
      console.warn("API MySQL no disponible; se cargarán los datos incluidos para vista previa.", error);
    }

    if (respuestaApi?.ok) {
      puntos = await respuestaApi.json();
    } else {
      if (respuestaApi) {
        console.warn(`API MySQL respondió ${respuestaApi.status}; se cargarán los datos incluidos para vista previa.`);
      }
      const respuestaLocal = await fetch("datos/puntos-interes.json");
      if (!respuestaLocal.ok) {
        throw new Error(`No se pudieron cargar los puntos locales: ${respuestaLocal.status}.`);
      }
      puntos = await respuestaLocal.json();
      origen = "datos locales";
    }

    if (!Array.isArray(puntos)) {
      throw new Error("La respuesta de puntos de interés no tiene el formato esperado.");
    }

    const puntosPorUbicacion = new Map();
    puntos.forEach((punto) => {
      if (![punto.latitud, punto.longitud].every(Number.isFinite)) {
        throw new Error(`Coordenadas no válidas para el punto ${punto.idPuntosInteres}.`);
      }
      if (!iconosLeafletPorCategoria[punto.idCategorias]) {
        throw new Error(
          `No hay un icono para la categoría ${punto.idCategorias} del punto ${punto.nombre}.`,
        );
      }

      const claveUbicacion = `${punto.latitud},${punto.longitud}`;
      const puntosEnUbicacion = puntosPorUbicacion.get(claveUbicacion) || [];
      puntosEnUbicacion.push(punto);
      puntosPorUbicacion.set(claveUbicacion, puntosEnUbicacion);
    });

    puntos.forEach((punto) => {
      const puntosEnUbicacion = puntosPorUbicacion.get(
        `${punto.latitud},${punto.longitud}`,
      );
      const indiceEnUbicacion = puntosEnUbicacion.indexOf(punto);
      const marcador = L.marker([punto.latitud, punto.longitud], {
        title: punto.nombre,
        riseOnHover: true,
        icon: iconosLeafletPorCategoria[punto.idCategorias],
      });
      marcador.bindPopup(crearPopupPunto(
        punto,
        puntosEnUbicacion,
        indiceEnUbicacion,
        marcador,
      ));
      capaPuntosInteres.addLayer(marcador);
    });

    const ubicacionesCompartidas = [...puntosPorUbicacion.values()]
      .filter((puntosEnUbicacion) => puntosEnUbicacion.length > 1).length;
    elementoEstadoPuntos.textContent =
      `${puntos.length} establecimientos en ${puntosPorUbicacion.size} coordenadas (${origen}). `
      + `${ubicacionesCompartidas} ubicaciones tienen puntos coincidentes; usa Anterior/Siguiente en sus popups.`;
  } catch (error) {
    console.error("No se pudieron cargar los puntos de interés:", error);
    elementoEstadoPuntos.textContent = "No se pudieron cargar los puntos. Revisa la conexión y los datos.";
  }
}

function crearPopupPunto(punto, puntosEnUbicacion, indiceEnUbicacion, marcador) {
  const contenido = document.createElement("div");
  contenido.className = "popup-punto";

  const titulo = document.createElement("h2");
  titulo.textContent = punto.nombre;
  contenido.append(titulo);

  const detalles = document.createElement("dl");
  [
    ["Categoría", punto.categoria],
    ["Localidad", punto.localidad],
    ["Coordenadas", `${punto.latitud}, ${punto.longitud}`],
  ].forEach(([etiqueta, valor]) => {
    const termino = document.createElement("dt");
    termino.textContent = etiqueta;
    const descripcion = document.createElement("dd");
    descripcion.textContent = valor;
    detalles.append(termino, descripcion);
  });
  contenido.append(detalles);

  if (puntosEnUbicacion.length > 1) {
    const navegacion = document.createElement("div");
    navegacion.className = "navegacion-puntos";

    const anterior = document.createElement("button");
    anterior.type = "button";
    anterior.className = "opcion-punto";
    anterior.textContent = "Anterior";
    anterior.addEventListener("click", () => {
      const indiceAnterior = (indiceEnUbicacion - 1 + puntosEnUbicacion.length)
        % puntosEnUbicacion.length;
      const puntoAnterior = puntosEnUbicacion[indiceAnterior];
      marcador.setPopupContent(crearPopupPunto(
        puntoAnterior,
        puntosEnUbicacion,
        indiceAnterior,
        marcador,
      ));
      marcador.openPopup();
    });

    const contador = document.createElement("span");
    contador.textContent = `${indiceEnUbicacion + 1} de ${puntosEnUbicacion.length}`;
    contador.setAttribute("aria-live", "polite");

    const siguiente = document.createElement("button");
    siguiente.type = "button";
    siguiente.className = "opcion-punto";
    siguiente.textContent = "Siguiente";
    siguiente.addEventListener("click", () => {
      const indiceSiguiente = (indiceEnUbicacion + 1) % puntosEnUbicacion.length;
      const puntoSiguiente = puntosEnUbicacion[indiceSiguiente];
      marcador.setPopupContent(crearPopupPunto(
        puntoSiguiente,
        puntosEnUbicacion,
        indiceSiguiente,
        marcador,
      ));
      marcador.openPopup();
    });

    navegacion.append(anterior, contador, siguiente);
    contenido.append(navegacion);
  }

  return contenido;
}

function estiloZona(zona, seleccionada = false) {
  return {
    color: seleccionada ? "#20332e" : "#fff",
    weight: seleccionada ? 3 : 1.5,
    fillColor: coloresZona[zona.properties.color] || coloresZona.azul,
    fillOpacity: seleccionada ? 0.68 : 0.52,
  };
}

function estaDentroDelMunicipio(elemento) {
  return turf.booleanWithin(elemento, limiteMunicipal);
}

function agregarZona(zona) {
  const capa = L.geoJSON(zona, {
    style: () => estiloZona(zona, zona === zonaSeleccionada),
    onEachFeature: (_, shape) => {
      shape.on("click", (event) => {
        L.DomEvent.stopPropagation(event);
        zonaSeleccionada = zona;
        actualizarEstilos();
        actualizarEditor();
      });
    },
  }).addTo(capaZonas);
  capasPorZona.set(zona, capa);
}

function actualizarEstilos() {
  zonas.forEach((zona) => {
    capasPorZona.get(zona)?.setStyle(
      estiloZona(zona, zona === zonaSeleccionada),
    );
  });
}

function actualizarEditor(mensaje) {
  botonesColor.forEach((boton) => {
    boton.setAttribute("aria-pressed", String(boton.dataset.color === colorActivo));
  });
  botonBorrar.disabled = zonaSeleccionada === null;
  elementoContador.textContent = `${zonas.length} ${zonas.length === 1 ? "zona" : "zonas"}`;

  if (mensaje) {
    elementoEstado.textContent = mensaje;
  } else if (zonaSeleccionada) {
    elementoEstado.textContent = zonas.includes(zonaSeleccionada)
      ? `Zona ${zonaSeleccionada.properties.color}. Elige otro color para cambiarla.`
      : "Elige un color y dibuja una zona.";
  } else {
    elementoEstado.textContent = "Elige un color y dibuja una zona.";
  }
}

function guardarZonas() {
  try {
    localStorage.setItem(claveAlmacenamiento, JSON.stringify({
      type: "FeatureCollection",
      features: zonas,
    }));
    localStorage.removeItem(claveAlmacenamientoAnterior);
  } catch (error) {
    console.error("No se pudieron guardar las zonas:", error);
    actualizarEditor("No se pudieron guardar los cambios en este navegador.");
  }
}

function cargarZonas() {
  try {
    const guardado = JSON.parse(
      localStorage.getItem(claveAlmacenamiento)
        || localStorage.getItem(claveAlmacenamientoAnterior)
        || "null",
    );
    if (guardado?.type !== "FeatureCollection" || !Array.isArray(guardado.features)) {
      return;
    }

    zonas = guardado.features.filter((zona) => {
      try {
        if (zona.type !== "Feature" || !coloresZona[zona.properties?.color]) {
          return false;
        }
        delete zona.properties.id;
        return estaDentroDelMunicipio(zona);
      } catch {
        return false;
      }
    });
    zonas.forEach(agregarZona);
    guardarZonas();
  } catch (error) {
    console.error("No se pudieron cargar las zonas guardadas:", error);
  }
}

botonesColor.forEach((boton) => {
  boton.addEventListener("click", () => {
    colorActivo = boton.dataset.color;
    if (zonaSeleccionada && zonas.includes(zonaSeleccionada)) {
      zonaSeleccionada.properties.color = colorActivo;
      guardarZonas();
      actualizarEstilos();
      actualizarEditor(`Zona actualizada a ${colorActivo}.`);
      return;
    }
    actualizarEditor(`Color ${colorActivo} seleccionado para la próxima zona.`);
  });
});

botonDibujar.addEventListener("click", () => {
  if (herramientaDibujo?._enabled) {
    herramientaDibujo.disable();
    herramientaDibujo = null;
    botonDibujar.setAttribute("aria-pressed", "false");
    botonDibujar.textContent = "Dibujar zona";
    actualizarEditor("Dibujo cancelado.");
    return;
  }

  zonaSeleccionada = null;
  actualizarEstilos();
  herramientaDibujo = new L.Draw.Polygon(map, {
    allowIntersection: false,
    showArea: true,
    shapeOptions: {
      color: coloresZona[colorActivo],
      fillColor: coloresZona[colorActivo],
      fillOpacity: 0.45,
      weight: 2,
    },
  });
  herramientaDibujo.enable();
  botonDibujar.setAttribute("aria-pressed", "true");
  botonDibujar.textContent = "Cancelar dibujo";
  actualizarEditor(`Dibuja el contorno y vuelve al primer punto para cerrar. Color: ${colorActivo}.`);
});

map.on(L.Draw.Event.CREATED, (event) => {
  const zona = event.layer.toGeoJSON();
  if (!estaDentroDelMunicipio(zona)) {
    actualizarEditor("La zona debe quedar completamente dentro de Avellaneda.");
    return;
  }

  zona.properties = { color: colorActivo };
  zonas.push(zona);
  zonaSeleccionada = zona;
  agregarZona(zona);
  guardarZonas();
  actualizarEstilos();
  actualizarEditor(`Zona ${colorActivo} guardada.`);
  herramientaDibujo = null;
  botonDibujar.setAttribute("aria-pressed", "false");
  botonDibujar.textContent = "Dibujar zona";
});

map.on(L.Draw.Event.DRAWSTOP, () => {
  if (herramientaDibujo?._enabled) {
    return;
  }
  herramientaDibujo = null;
  botonDibujar.setAttribute("aria-pressed", "false");
  botonDibujar.textContent = "Dibujar zona";
});

map.on("click", () => {
  if (herramientaDibujo?._enabled) {
    return;
  }
  zonaSeleccionada = null;
  actualizarEstilos();
  actualizarEditor();
});

botonBorrar.addEventListener("click", () => {
  if (!zonaSeleccionada) {
    return;
  }
  capaZonas.removeLayer(capasPorZona.get(zonaSeleccionada));
  capasPorZona.delete(zonaSeleccionada);
  zonas = zonas.filter((zona) => zona !== zonaSeleccionada);
  zonaSeleccionada = null;
  guardarZonas();
  actualizarEditor("Zona borrada.");
});

botonExportar.addEventListener("click", () => {
  const collection = {
    type: "FeatureCollection",
    name: "zonas-de-trabajo-avellaneda",
    features: zonas,
  };
  const file = new Blob([JSON.stringify(collection, null, 2)], {
    type: "application/geo+json",
  });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = "zonas-de-trabajo-avellaneda.geojson";
  link.click();
  URL.revokeObjectURL(url);
});