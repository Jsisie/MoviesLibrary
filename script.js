/* ==========================
   Variables globales
   ========================== */
let allMovies = []; // Tous les films (chargé une seule fois)
let movies = []; // Films de la collection affichée
let currentCollection; // Collection courante (halloween, watchlist, ...)

/* ==========================
   Fonction principale
   ========================== */

/**
 * Méthode principale appelée au chargement de la page
 * Charge les films et initialise les écouteurs d'événements
 */
async function initApp() {
    currentCollection = document.querySelector('#collection-select').value; // Récupère la collection par défaut
    updateTitleFromCollection();
    await loadAllMovies();
    loadMovies();
    setupEventListeners();
}

function updateTitleFromCollection() {
    const select = document.querySelector('#collection-select');
    const selectedText = select.options[select.selectedIndex].text;

    const title = document.querySelector('#titre_principal');
    title.innerHTML = `<b>${selectedText}</b>`;
}


/* ==========================
   Chargement et rendu des films
   ========================== */

/**
 * Charge une seule fois le fichier JSON unique contenant tous les films
 */
async function loadAllMovies() {
    const res = await fetch('json_tmp/movies.json');
    allMovies = await res.json();
    console.info(allMovies);
}

/**
 * Filtre allMovies pour ne garder que les films de la collection courante
 * et stocke le résultat dans la variable globale "movies"
 */
function loadMovies() {
    movies = allMovies.filter(movie =>
        movie.collections.includes(currentCollection)
    );
    console.info(movies);

    const genres = computeGenres(movies);
    console.log(genres);

    updateGenreSelect(genres);
    renderMovies(movies);

    applyFilters(); // Applique le filtre par défaut (year asc)
}

/**
 * Calcule les genres à partir des champs "variables" du json
 * @param {*} movies 
 * @returns 
 */
function computeGenres(movies) {
    return [...new Set( // "Set" supprime les doublons et "..new" retransforme en tableau
        movies.flatMap(movie => movie.genres) // Récupère les genres du json
    )].sort((a, b) => a.localeCompare(b, 'fr')); // tri propre en français
}

/**
 * Charge les genres dans le tri de genres de la page
 * @param {*} genres 
 */
function updateGenreSelect(genres) {
    const select = document.querySelector('#genre-select');

    // Supprime tout sauf "Tous"
    select.querySelectorAll('option:not([value="all"])')
          .forEach(o => o.remove());

    genres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre;
        option.textContent = genre;
        select.appendChild(option);
    });
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

    // Plateformes de streaming (sous les genres, verso de la Card)
    const platforms = movie.platforms || [];
    if (platforms.length > 0) {
        const platformsDiv = document.createElement("div");
        platformsDiv.classList.add("platforms");
        platforms.forEach(name => {
            const badge = document.createElement("span");
            badge.classList.add("platform", platformClassName(name));
            badge.textContent = name;
            platformsDiv.appendChild(badge);
        });
        header.appendChild(platformsDiv);
    }

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
 * Transforme le nom d'une plateforme en classe CSS normalisée
 * (ex. "Disney+" → "platform-disneyplus", "Prime Video" → "platform-prime")
 * @param {string} name Nom affiché de la plateforme
 * @returns {string} Classe CSS associée
 */
function platformClassName(name) {
    let slug = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\+/g, "plus")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    // 1. Simplification pour Prime Video
    if (slug === "prime-video") {
        slug = "prime";
    }

    // 2. Regroupement des plateformes sous Canal+
    const canalGroup = ["apple-tv", "apple", "hbo-max", "max", "ocs", "paramountplus", "paramount", "insomnia"];
    if (canalGroup.includes(slug)) {
        slug = "canalplus";
    }

    return `platform-${slug}`;
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
    // Changement de collection (filtre local, sans recharger le JSON)
    document.querySelector('#collection-select').addEventListener('change', (e) => {
        currentCollection = e.target.value;
        updateTitleFromCollection();
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
        filtered = filtered.filter(m =>
            m.genres.includes(genre) // m.genres.toLowerCase().includes(genre.toLowerCase())
        );
    }

    // Tri
    const sort = document.querySelector('input[name="sort"]:checked').value;
    filtered.sort((a, b) => sort === 'yearAsc' ? a.year - b.year : b.year - a.year);

    renderMovies(filtered);
}
