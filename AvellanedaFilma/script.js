// Arrays separados por categoría (puedes agregar la propiedad 'descripcion' a cada objeto)
const peliculas = [
  { 
    id: 1, 
    titulo: "Relatos Salvajes", 
    tipo: "película", 
    año: 2014, 
    poster: "imagenes/relatosalvajes.webp",
    descripcion: "Seis relatos de comedia negra y drama que exploran el comportamiento humano bajo estrés."
  },
  { 
    id: 7, 
    titulo: "Papeles En El Viento", 
    tipo: "película", 
    año: 2015, 
    poster: "imagenes/papelesenelviento.webp",
    descripcion: "Tres amigos intentan recuperar la inversión de su difunto amigo en un jugador de fútbol."
  },
];

const series = [
  { 
    id: 2, 
    titulo: "El Marginal", 
    tipo: "serie", 
    año: 2016, 
    poster: "imagenes/elmarginal3.webp",
    descripcion: "Un expolicía ingresa a una prisión bajo una identidad falsa para infiltrarse en una banda."
  },
];

const videoclips = [
  { 
    id: 3, 
    titulo: "Acru", 
    tipo: "videoclip", 
    año: 2021, 
    poster: "imagenes/acru.jpg",
    descripcion: "Videoclip oficial de la canción de Acru."
  },  
];

// Referencia al contenedor HTML donde se insertarán las tarjetas
const contenedor = document.getElementById("catalogo");

// Función para renderizar las tarjetas en pantalla
function renderizarContenido(lista) {
  // Limpiamos el contenedor antes de dibujar
  contenedor.innerHTML = "";

  lista.forEach(item => {
    // Crear el elemento de la tarjeta
    const card = document.createElement("div");
    card.classList.add("movie-card");

    // Estructura HTML agregando el elemento del globo de información
    card.innerHTML = `
      <div class="poster-container">
        <img src="${item.poster}" alt="Póster de ${item.titulo}" loading="lazy">
      </div>
      <div class="card-info">
        <h3>${item.titulo}</h3>
        <p class="meta">${item.año} • <strong class="badge">${item.tipo.toUpperCase()}</strong></p>
      </div>

      <!-- Globo de información flotante -->
      <div class="globo">
        <h4>${item.titulo}</h4>
        <p>${item.descripcion || 'Sin información disponible.'}</p>
      </div>
    `;

    // Evento para alternar el globo al hacer clic en la tarjeta
    card.addEventListener("click", (e) => {
      e.stopPropagation(); // Evita que el clic se propague al documento
      
      // Cerrar otros globos abiertos en pantalla
      document.querySelectorAll(".movie-card").forEach(c => {
        if (c !== card) c.classList.remove("activo");
      });

      // Muestra u oculta el globo de la tarjeta clickeada
      card.classList.toggle("activo");
    });

    contenedor.appendChild(card);
  });
}

// Cierra los globos activos si se hace clic en cualquier otra parte fuera de una tarjeta
document.addEventListener("click", () => {
  document.querySelectorAll(".movie-card").forEach(c => c.classList.remove("activo"));
});

// Función para filtrar según la categoría seleccionada
function filtrarCategoria(categoria) {
  if (categoria === 'película') {
    renderizarContenido(peliculas);
  } else if (categoria === 'serie') {
    renderizarContenido(series);
  } else if (categoria === 'videoclip') {
    renderizarContenido(videoclips);
  } else {
    // Si la categoría es 'todas', unimos los tres arrays en uno solo
    const todas = [...peliculas, ...series, ...videoclips];
    renderizarContenido(todas);
  }
}

// Carga inicial: Muestra todo el contenido al abrir la página
document.addEventListener("DOMContentLoaded", () => {
  const todas = [...peliculas, ...series, ...videoclips];
  renderizarContenido(todas);
});