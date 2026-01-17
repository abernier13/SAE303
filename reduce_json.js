const fs = require('fs');
const path = require('path');

const inputPath = '/Volumes/Elements/EtudeSUP/BUTMMI/2eme_annee/S3/SAE/SAE3D03/SAE303/json/box office cine.json';
const outputPath = '/Volumes/Elements/EtudeSUP/BUTMMI/2eme_annee/S3/SAE/SAE3D03/SAE303/json/box office cine.json'; // Overwriting for the site to pick it up
const backupPath = '/Volumes/Elements/EtudeSUP/BUTMMI/2eme_annee/S3/SAE/SAE3D03/SAE303/json/box office cine.bak.json';

try {
    console.log('Reading JSON...');
    const rawData = fs.readFileSync(inputPath, 'utf8');
    const movies = JSON.parse(rawData);

    console.log(`Original count: ${movies.length} movies`);

    // 1. Trie par revenu du box-office (décroissant)
    movies.sort((a, b) => {
        const revA = parseInt(a['$Worldwide']) || 0;
        const revB = parseInt(b['$Worldwide']) || 0;
        return revB - revA;
    });

    // 2. Keep Top 5000 and filter columns
    const reducedMovies = movies.slice(0, 5000).map(m => ({
        'Release Group': m['Release Group'],
        '$Worldwide': m['$Worldwide'],
        'Domestic %': m['Domestic %'],
        'Foreign %': m['Foreign %'],
        'Genres': m['Genres'],
        'Rating': m['Rating'],
        'Production_Countries': m['Production_Countries']
    }));

    console.log(`New count: ${reducedMovies.length} movies`);

    // Backup original
    fs.writeFileSync(backupPath, rawData);
    console.log(`Backup created at ${backupPath}`);

    // Version  allégé
    fs.writeFileSync(outputPath, JSON.stringify(reducedMovies, null, 2));
    console.log(`Reduced JSON saved to ${outputPath}`);

} catch (err) {
    console.error('Error processing JSON:', err);
}
