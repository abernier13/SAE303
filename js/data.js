// C'est ici que toute la "cuisine" de données se passe.
// On récupère le JSON gros et moche, et on en sort des chiffres propres pour nos graphiques.
import { CONTINENT_MAP } from './constants.js';

// Cet objet est notre "source de vérité". Il est mis à jour après le chargement
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

// Le gros morceau : on parcourt tous les films pour accumuler les stats
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

    movies.forEach(movie => {
        // On extrait les valeurs importantes (avec une sécurité si c'est vide)
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

        // Focus sur l'Action/Aventure pour l'étape 3
        if (genresStr.includes('Action') || genresStr.includes('Adventure')) {
            actionRevenue += world;
        }

        // Extraction de la note IMDB (format "X/10")
        if (ratingStr) {
            const score = parseFloat(ratingStr.split('/')[0]);
            if (!isNaN(score)) {
                totalRating += score;
                ratedMoviesCount++;
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
                    topMovie: { title: "", revenue: 0 }
                };
            }
            genreStats[genre].totalRevenue += world;
            // On garde le film qui a rapporté le plus dans ce genre
            if (world > genreStats[genre].topMovie.revenue) {
                genreStats[genre].topMovie = { title: title, revenue: world };
            }
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

    // On tire les 4 meilleurs genres pour le cornet
    const sortedGenres = Object.values(genreStats)
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 4);

    vizData.topGenres = sortedGenres;
}
