/* ==========================
   Variables globales
   ========================== */
let movies = []; // Liste de films chargés sur la page
let currentCollection = "movies_halloween.json"; // Fichier JSON chargé en cours

/* ==========================
   Fonction principale
   ========================== */

/**
 * Méthode principale appelée au chargement de la page
 * Charge les films et initialise les écouteurs d'événements
 */
async function initApp() {
    await loadMovies(currentCollection);
    setupEventListeners();
}

/* ==========================
   Chargement et rendu des films
   ========================== */

/**
 * Charge le fichier JSON correspondant à la collection courante
 * et stocke le résultat dans la variable globale "movies"
 */
async function loadMovies() {
    const res = await fetch(`json_tmp/${currentCollection}`);
    movies = await res.json();
    console.info(movies);
    renderMovies(movies);
}

/**
 * Affiche l'ensemble des Cards dans le DOM
 * @param {Array} list Liste de films à afficher
 */
function renderMovies(list) {
    const stage = document.querySelector(".stage");
    stage.innerHTML = ""; // Vide le conteneur avant rendu
    list.forEach((movie, i) => createCard(movie, i));
}

/* ==========================
   Création de Card et images
   ========================== */

/**
 * Crée une Card pour un film
 * @param {Object} movie Objet contenant les données du film
 * @param {number} index Index de la Card (utilisé pour le sélecteur CSS)
 */
function createCard(movie, index) {
    const li = document.createElement("li");
    li.classList.add("scene");

    const movieDiv = document.createElement("div");
    movieDiv.classList.add("movie");
    movieDiv.setAttribute("onclick", "return true");

    const posterDiv = document.createElement("div");
    posterDiv.classList.add("poster");

    const infoDiv = document.createElement("div");
    infoDiv.classList.add("info");

    const header = document.createElement("header");

    // Title
    const h1 = document.createElement("h1");
    h1.textContent = movie.title;

    // Year
    const spanYear = document.createElement("span");
    spanYear.classList.add("year");
    spanYear.textContent = `${movie.year} - `;

    // Duration
    const spanDuration = document.createElement("span");
    spanDuration.classList.add("duration");
    spanDuration.textContent = `${movie.duration}`;

    // Genres
    const spanGenres = document.createElement("span");
    spanGenres.classList.add("genres");
    spanGenres.innerHTML = `<br>${movie.genres}`;

    header.appendChild(h1);
    header.appendChild(spanYear);
    header.appendChild(spanDuration);
    header.appendChild(spanGenres);

    // Synopsis
    const synopsis = document.createElement("p");
    synopsis.textContent = movie.synopsis;

    // Trailer link
    const trailer = document.createElement("a");
    trailer.textContent = "Voir le trailer";
    trailer.href = movie.trailer;
    trailer.target = "_blank";
    trailer.classList.add("trailer-link");

    infoDiv.appendChild(header);
    infoDiv.appendChild(synopsis);
    infoDiv.appendChild(trailer);

    movieDiv.appendChild(posterDiv);
    movieDiv.appendChild(infoDiv);

    li.appendChild(movieDiv);
    document.querySelector(".stage").appendChild(li);

    addPictures(movie.title, index + 1);
}

/**
 * Ajoute les images poster et back à la Card correspondante
 * @param {string} movieTitle Titre du film
 * @param {number} index Index de la Card
 */
function addPictures(movieTitle, index) {
    movieTitle = normalizeTitle(movieTitle);

    const posterElem = document.querySelector(`.scene:nth-child(${index}) .movie .poster`);
    const backElem = document.querySelector(`.scene:nth-child(${index}) .info header`);
    const posterImage = 'data/' + movieTitle + '_poster.jpg';
    const backImage = 'data/' + movieTitle + '.jpg';

    posterElem.style.backgroundImage = `url(${posterImage})`;
    backElem.style.backgroundImage = `url(${backImage})`;
}

/**
 * Normalise un titre pour créer des noms de fichiers cohérents
 * @param {string} title Titre à normaliser
 * @returns {string} Titre normalisé
 */
function normalizeTitle(title) {
    return title
        .toLowerCase()
        .normalize("NFD") // Retire les accents
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[\u2019\u2018\u201B\u0027\u02BC]/g, "_") // Apostrophes → "_"
        .replace(/[^a-z0-9]+/gi, "_") // Non-alphanumérique → "_"
        .replace(/^_+|_+$/g, ""); // Supprime les "_" en début/fin
}

/* ==========================
   Gestion des événements
   ========================== */

/**
 * Initialise les listeners sur les éléments interactifs
 */
function setupEventListeners() {
    // Changement de collection
    document.querySelector('#collection-select').addEventListener('change', (e) => {
        currentCollection = e.target.value;
        loadMovies();
    });

    // Tri
    document.querySelectorAll('input[name="sort"]').forEach(radio => {
        radio.addEventListener('change', applyFilters);
    });

    // Filtrage par genre
    document.querySelector('#genre-select').addEventListener('change', applyFilters);
}

/**
 * Applique le filtre par genre et le tri
 * Puis relance le rendu des Cards
 */
function applyFilters() {
    let filtered = [...movies];

    // Filtre par genre
    const genre = document.querySelector('#genre-select').value;
    if (genre !== 'all') {
        filtered = filtered.filter(m => m.genres.toLowerCase().includes(genre.toLowerCase()));
    }

    // Tri
    const sort = document.querySelector('input[name="sort"]:checked').value;
    filtered.sort((a, b) => sort === 'yearAsc' ? a.year - b.year : b.year - a.year);

    renderMovies(filtered);
}
