// Traitement du fichier JSON, pré-traitement des données et préparation des listes de films à afficher

import { CONTINENT_MAP } from './constants.js';

// Initialisation des variables
export let vizData = {
    totalRevenue: 0,
    avgDomestic: 0,
    avgForeign: 0,
    actionRevenue: 0,
    avgRating: 0,
    continents: {
        "Amerique": 0,
        "Europe": 0,
        "Asie": 0
    }
};

// Fonction principale pour charger le fichier et lancer les calculs
export async function loadData() {
    const response = await fetch('./json/box office cine.json');
    const data = await response.json();
    processAllData(data);
    return data;
}

// Parcour de tous les films pour récupérer leurs données
function processAllData(data) {
    if (!data) return;
    // On s'assure d'avoir un tableau, peu importe la structure du JSON
    const movies = Array.isArray(data) ? data : data.movies || [];

    // On initialise nos compteurs à zéro
    let totalWorldwide = 0;
    let totalDomesticPct = 0;
    let totalForeignPct = 0;
    let actionRevenue = 0;
    let totalRating = 0;
    let ratedMoviesCount = 0;
    let continentTotals = { "Amerique": 0, "Europe": 0, "Asie": 0 };

    const genreStats = {};
    const filmsAvecNotes = []; // Pour trouver les perles rares (bonne note, budget faible)

    movies.forEach(movie => {
        // On extrait les valeurs importantes 
        const world = parseInt(movie['$Worldwide']) || 0;
        const dom = parseFloat(movie['Domestic %']) || 0;
        const foreign = parseFloat(movie['Foreign %']) || 0;
        const genresStr = movie['Genres'] || "";
        const ratingStr = movie['Rating'] || "";
        const title = movie['Release Group'];

        // On cumule pour les stats mondiales
        totalWorldwide += world;
        totalDomesticPct += dom;
        totalForeignPct += foreign;

        // Focus sur l'action/ aventure pour l'étape 3
        if (genresStr.includes('Action') || genresStr.includes('Adventure')) {
            actionRevenue += world;
        }

        // Extraction de la note IMDB (format "X/10")
        let rating = 0;
        if (ratingStr) {
            const score = parseFloat(ratingStr.split('/')[0]);
            if (!isNaN(score)) {
                rating = score;
                totalRating += score;
                ratedMoviesCount++;

                // On stocke les films avec notes pour trouver les perles rares
                filmsAvecNotes.push({
                    title: title,
                    budget: world,
                    rating: rating,
                    genres: genresStr
                });
            }
        }

        // On regarde d'où vient le film pour le globe
        const countries = (movie['Production_Countries'] || "").split(', ');
        if (countries.length > 0) {
            const continent = CONTINENT_MAP[countries[0]];
            if (continent) {
                continentTotals[continent] += world;
            }
        }

        // On décompose les genres pour faire le top du cornet de popcorn
        const distinctGenres = genresStr.split(',').map(g => g.trim()).filter(g => g);
        distinctGenres.forEach(genre => {
            if (!genreStats[genre]) {
                genreStats[genre] = {
                    name: genre,
                    totalRevenue: 0,
                    allMovies: [] // On stocke tous les films pour pouvoir diversifier
                };
            }
            genreStats[genre].totalRevenue += world;
            genreStats[genre].allMovies.push({ title: title, revenue: world });
        });
    });

    // Une fois fini, on met à jour notre objet central avec les moyennes et calculs finaux
    vizData.totalRevenue = (totalWorldwide / 1000000000).toFixed(1);
    vizData.avgDomestic = (totalDomesticPct / movies.length).toFixed(0);
    vizData.avgForeign = (totalForeignPct / movies.length).toFixed(0);
    vizData.actionRevenue = (actionRevenue / 1000000000).toFixed(1);
    vizData.avgRating = (totalRating / ratedMoviesCount).toFixed(1);
    vizData.continents.Amerique = (continentTotals.Amerique / 1000000000).toFixed(1);
    vizData.continents.Europe = (continentTotals.Europe / 1000000000).toFixed(1);
    vizData.continents.Asie = (continentTotals.Asie / 1000000000).toFixed(1);

    // Chercher les 4 films avec les meilleures notes
    const topRatedFilms = [...filmsAvecNotes]
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 4);

    // Budget max parmi ces 4 pour servir de référence 100%
    const maxBudgetTopRated = Math.max(...topRatedFilms.map(f => f.budget));

    vizData.topRatedFilms = topRatedFilms;
    vizData.maxBudgetTopRated = maxBudgetTopRated;

    // On tire les 5 meilleurs genres pour le cornet
    const sortedGenres = Object.values(genreStats)
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 5);

    // Algorithme de diversification : un film unique par genre affiché
    const usedTitles = new Set();

    sortedGenres.forEach(genre => {
        // On trie les films de ce genre par revenu décroissant
        genre.allMovies.sort((a, b) => b.revenue - a.revenue);

        // On cherche le meilleur film qui n'a pas encore été utilisé
        let selectedMovie = genre.allMovies.find(m => !usedTitles.has(m.title));

        // Si par hasard tous les films du genre ont été utilisés (peu probable), 
        // on prend quand même le premier
        if (!selectedMovie) selectedMovie = genre.allMovies[0];

        genre.topMovie = selectedMovie;
        usedTitles.add(selectedMovie.title);

        // On nettoie l'objet pour ne pas trimballer des milliers de films inutilement
        delete genre.allMovies;
    });

    vizData.topGenres = sortedGenres;
}
