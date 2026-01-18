import { CONTINENT_MAP } from './constants.js';

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

export async function loadData() {
    const response = await fetch('./json/box office cine.json');
    const data = await response.json();
    processAllData(data);
    return data;
}

function processAllData(data) {
    if (!data) return;
    const movies = Array.isArray(data) ? data : data.movies || [];

    let totalWorldwide = 0;
    let totalDomesticPct = 0;
    let totalForeignPct = 0;
    let actionRevenue = 0;
    let totalRating = 0;
    let ratedMoviesCount = 0;
    let continentTotals = { "Amerique": 0, "Europe": 0, "Asie": 0 };

    const genreStats = {};

    movies.forEach(movie => {
        const world = parseInt(movie['$Worldwide']) || 0;
        const dom = parseFloat(movie['Domestic %']) || 0;
        const foreign = parseFloat(movie['Foreign %']) || 0;
        const genresStr = movie['Genres'] || "";
        const ratingStr = movie['Rating'] || "";
        const title = movie['Release Group'];

        totalWorldwide += world;
        totalDomesticPct += dom;
        totalForeignPct += foreign;

        if (genresStr.includes('Action') || genresStr.includes('Adventure')) {
            actionRevenue += world;
        }

        if (ratingStr) {
            const score = parseFloat(ratingStr.split('/')[0]);
            if (!isNaN(score)) {
                totalRating += score;
                ratedMoviesCount++;
            }
        }

        const countries = (movie['Production_Countries'] || "").split(', ');
        if (countries.length > 0) {
            const continent = CONTINENT_MAP[countries[0]];
            if (continent) {
                continentTotals[continent] += world;
            }
        }

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
            if (world > genreStats[genre].topMovie.revenue) {
                genreStats[genre].topMovie = { title: title, revenue: world };
            }
        });
    });

    vizData.totalRevenue = (totalWorldwide / 1000000000).toFixed(1);
    vizData.avgDomestic = (totalDomesticPct / movies.length).toFixed(0);
    vizData.avgForeign = (totalForeignPct / movies.length).toFixed(0);
    vizData.actionRevenue = (actionRevenue / 1000000000).toFixed(1);
    vizData.avgRating = (totalRating / ratedMoviesCount).toFixed(1);
    vizData.continents.Amerique = (continentTotals.Amerique / 1000000000).toFixed(1);
    vizData.continents.Europe = (continentTotals.Europe / 1000000000).toFixed(1);
    vizData.continents.Asie = (continentTotals.Asie / 1000000000).toFixed(1);

    // Trigger an event or return sorted genres for popcorn
    const sortedGenres = Object.values(genreStats)
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 4);

    vizData.topGenres = sortedGenres;
}
