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
    applyCollectionTheme();
}

/**
 * Applique le thème CSS de la collection (classe sur <body>)
 */
function applyCollectionTheme() {
    document.body.classList.remove(
        'theme-halloween',
        'theme-watchlist',
        'theme-louison_et_leo',
        'theme-christmas'
    );
    document.body.classList.add(`theme-${currentCollection}`);
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
    const platforms = computePlatforms(movies);

    updateGenreSelect(genres);
    updatePlatformSelect(platforms);
    resetExtraFilters();
    applyFilters();
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
    fillSelectOptions('#genre-select', genres);
}

function computePlatforms(movies) {
    return [...new Set(
        movies.flatMap(movie => movie.platforms || [])
    )].sort((a, b) => a.localeCompare(b, 'fr'));
}

function updatePlatformSelect(platforms) {
    fillSelectOptions('#platform-select', platforms);
}

/**
 * Remplit un <select> en gardant la 1re option ("Tous" / "Toutes")
 */
function fillSelectOptions(selector, values) {
    const select = document.querySelector(selector);
    select.querySelectorAll('option:not([value="all"])')
          .forEach(o => o.remove());

    values.forEach(value => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
    });
}

function resetExtraFilters() {
    document.querySelector('#genre-select').value = 'all';
    document.querySelector('#platform-select').value = 'all';
    document.querySelector('#duration-select').value = 'all';
}

/**
 * Convertit une durée "2h06" / "1h37" en minutes
 */
function durationToMinutes(duration) {
    const match = String(duration).match(/(\d+)\s*h\s*(\d+)?/i);
    if (!match) return 0;
    return Number(match[1]) * 60 + Number(match[2] || 0);
}

function matchesDurationFilter(movie, bucket) {
    const minutes = durationToMinutes(movie.duration);
    if (bucket === 'short') return minutes < 90;
    if (bucket === 'medium') return minutes >= 90 && minutes <= 120;
    if (bucket === 'long') return minutes > 120;
    return true;
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
    document.querySelector('#collection-select').addEventListener('change', (e) => {
        currentCollection = e.target.value;
        updateTitleFromCollection();
        loadMovies();
    });

    ['#genre-select', '#platform-select', '#duration-select', '#sort-select']
        .forEach(selector => {
            document.querySelector(selector).addEventListener('change', applyFilters);
        });

    setupFiltersToggle();
}

/**
 * Ouvre / ferme le panneau de filtres (même comportement ordi et téléphone)
 */
function setupFiltersToggle() {
    const button = document.querySelector('#filters-toggle');
    const panel = document.querySelector('#filters-panel');

    button.addEventListener('click', () => {
        const willOpen = panel.hasAttribute('hidden');
        setFiltersPanelOpen(willOpen);
    });

    document.addEventListener('click', (e) => {
        if (!document.querySelector('#main-controls').contains(e.target)) {
            setFiltersPanelOpen(false);
        }
    });

    setFiltersPanelOpen(false);
}

function setFiltersPanelOpen(open) {
    const button = document.querySelector('#filters-toggle');
    const panel = document.querySelector('#filters-panel');

    panel.toggleAttribute('hidden', !open);
    panel.classList.toggle('is-open', open);
    button.setAttribute('aria-expanded', String(open));
    updateFiltersToggleLabel();
}

function updateFiltersToggleLabel() {
    const button = document.querySelector('#filters-toggle');
    const open = button.getAttribute('aria-expanded') === 'true';
    const activeCount = ['#genre-select', '#platform-select', '#duration-select']
        .filter(selector => document.querySelector(selector).value !== 'all')
        .length;
    const arrow = open ? '▴' : '▾';
    button.textContent = activeCount ? `Filtres (${activeCount}) ${arrow}` : `Filtres ${arrow}`;
}

/**
 * Applique les filtres + le tri, puis relance le rendu des Cards
 */
function applyFilters() {
    let filtered = [...movies];

    const genre = document.querySelector('#genre-select').value;
    const platform = document.querySelector('#platform-select').value;
    const duration = document.querySelector('#duration-select').value;
    const sort = document.querySelector('#sort-select').value;

    if (genre !== 'all') {
        filtered = filtered.filter(m => m.genres.includes(genre));
    }
    if (platform !== 'all') {
        filtered = filtered.filter(m => (m.platforms || []).includes(platform));
    }
    if (duration !== 'all') {
        filtered = filtered.filter(m => matchesDurationFilter(m, duration));
    }

    filtered.sort((a, b) => {
        if (sort === 'yearAsc') return a.year - b.year;
        if (sort === 'yearDesc') return b.year - a.year;
        if (sort === 'titleAsc') return a.title.localeCompare(b.title, 'fr');
        if (sort === 'titleDesc') return b.title.localeCompare(a.title, 'fr');
        if (sort === 'durationAsc') return durationToMinutes(a.duration) - durationToMinutes(b.duration);
        if (sort === 'durationDesc') return durationToMinutes(b.duration) - durationToMinutes(a.duration);
        return 0;
    });

    renderMovies(filtered);
    updateFiltersToggleLabel();
}
