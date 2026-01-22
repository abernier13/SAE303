// Ce fichier gère l'animation dynamique du cornet de popcorn (le top 5 des genres de film les plus rentables)
import { animate, stagger } from 'https://esm.sh/animejs@4.2.2';

// Met à jour les éléments du SVG avec les données réelles
export function updatePopcornUI(genres) {
    // On a besoin du max pour faire une échelle proportionnelle (la plus grande barre = 100%)
    const maxRevenue = genres.length > 0 ? genres[0].totalRevenue : 1;

    // Nettoyage du calque de labels (toujours au premier plan)
    const labelsLayer = document.getElementById('popcorn-labels-layer');
    if (labelsLayer) labelsLayer.innerHTML = '';

    // Les IDs des bandes rouges dans le SVG (de gauche à droite)
    // Rotations calculées précisément pour être parallèles aux bords inclinés
    const configs = [
        { id: 'Rectangle_1' },
        { id: 'Rectangle_3' },
        { id: 'Rectangle_5' },
        { id: 'Rectangle_7' },
        { id: 'Rectangle_9' }
    ];

    genres.forEach((genre, index) => {
        if (index >= configs.length) return;
        const config = configs[index];
        const rectGroup = document.getElementById(config.id);

        if (rectGroup) {
            const polygon = rectGroup.querySelector('polygon');
            if (polygon) {
                polygon.classList.add('popcorn-stripe');
                const scaleFactor = (genre.totalRevenue / maxRevenue);
                polygon.setAttribute('data-target-scale', scaleFactor.toFixed(3));

                // --- CALCULS DE POSITION ---
                const points = polygon.getAttribute('points').trim().split(/\s+/).map(Number);
                let minX = Infinity, maxX = -Infinity, minY = Infinity, maxYVal = -Infinity;

                for (let i = 0; i < points.length; i += 2) {
                    const x = points[i]; const y = points[i + 1];
                    if (x < minX) minX = x; if (x > maxX) maxX = x;
                    if (y < minY) minY = y; if (y > maxYVal) maxYVal = y;
                }

                let sumX = 0, countX = 0;
                for (let i = 0; i < points.length; i += 2) {
                    if (Math.abs(points[i + 1] - maxYVal) < 1) {
                        sumX += points[i]; countX++;
                    }
                }
                const centerX = countX > 0 ? sumX / countX : (minX + maxX) / 2;
                const finalTopY = maxYVal - (maxYVal - minY) * scaleFactor;

                // --- 1. ÉTIQUETTE REVENU (AU SOMMET) ---
                const revenueMillions = (genre.totalRevenue / 1000000).toLocaleString('en-US', {
                    minimumFractionDigits: 1, maximumFractionDigits: 1
                }) + "M";
                const revenueText = `$${revenueMillions}`;

                const bgW = revenueText.length * 11 + 20;
                const bgH = 34;
                const bgEl = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                bgEl.classList.add('popcorn-value-bg');
                bgEl.setAttribute("rx", "8");
                bgEl.setAttribute("width", bgW);
                bgEl.setAttribute("height", bgH);
                bgEl.setAttribute("x", centerX - bgW / 2);
                bgEl.setAttribute("y", finalTopY - 25); 
                if (labelsLayer) labelsLayer.appendChild(bgEl);

                const valueEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
                valueEl.classList.add('popcorn-value');
                valueEl.setAttribute("text-anchor", "middle");
                valueEl.setAttribute("x", centerX);
                valueEl.setAttribute("y", finalTopY - 7);
                valueEl.textContent = revenueText;
                if (labelsLayer) labelsLayer.appendChild(valueEl);

                // --- 2. LE GENRE (DANS LA BANDE) ---
                const genreText = document.createElementNS("http://www.w3.org/2000/svg", "text");
                genreText.classList.add('popcorn-text');
                
                const angle1 = Math.atan((points[4] - points[2]) / (points[5] - points[3])) * 180 / Math.PI;
                const angle2 = Math.atan((points[6] - points[0]) / (points[7] - points[1])) * 180 / Math.PI;
                const rotation = (angle1 + angle2) / 2;

                const genreY = maxYVal - 30;
                genreText.setAttribute("x", centerX);
                genreText.setAttribute("y", genreY);
                genreText.style.transform = `rotate(${-rotation}deg)`;
                genreText.style.transformOrigin = `${centerX}px ${genreY}px`;
                genreText.textContent = genre.name.toUpperCase();
                
                // Taille de police adaptative pour le genre
                genreText.style.fontSize = "14px";
                genreText.style.fontWeight = "bold";

                if (labelsLayer) labelsLayer.appendChild(genreText);

                // --- 3. LE FILM (À DROITE DU GRAPHIQUE) ---
                const movieGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
                movieGroup.classList.add('popcorn-movie-right');

                const listX = 980; // Position X fixe à droite du cornet

                // Ligne de liaison pointillée
                const connector = document.createElementNS("http://www.w3.org/2000/svg", "line");
                connector.setAttribute("x1", centerX + 10);
                connector.setAttribute("y1", finalTopY);
                connector.setAttribute("x2", listX - 10);
                connector.setAttribute("y2", finalTopY);
                connector.setAttribute("stroke", "white");
                connector.setAttribute("stroke-width", "0.5");
                connector.setAttribute("stroke-dasharray", "4");
                connector.setAttribute("opacity", "0.3");
                movieGroup.appendChild(connector);

                const movieTitle = document.createElementNS("http://www.w3.org/2000/svg", "text");
                movieTitle.setAttribute("x", listX);
                movieTitle.setAttribute("y", finalTopY + 5);
                movieTitle.textContent = genre.topMovie.title.toUpperCase();
                movieTitle.style.fontSize = "13px";
                movieTitle.style.fill = "white";
                movieTitle.style.fontFamily = "'Outfit', sans-serif";
                
                movieGroup.appendChild(movieTitle);
                if (labelsLayer) labelsLayer.appendChild(movieGroup);
            }
        }
    });
}

export function animatePopcorn() {
    // 1. Les bandes grimpent
    animate('.popcorn-stripe', {
        scaleY: (el) => [0, el.getAttribute('data-target-scale') || 1],
        opacity: [0, 1],
        easing: 'easeOutExpo',
        duration: 800,
        delay: stagger(100)
    });

    // 2. Les valeurs de revenus
    animate('.popcorn-value, .popcorn-value-bg', {
        translateY: [20, 0],
        opacity: [0, 1],
        delay: stagger(105, { start: 400 }),
        duration: 800,
        easing: 'easeOutExpo'
    });

    // 3. Les Genres (dans les bandes)
    animate('.popcorn-text', {
        opacity: [0, 1],
        delay: stagger(100, { start: 500 }),
        duration: 800,
        easing: 'easeOutExpo'
    });

    // 4. Les Films (à droite)
    animate('.popcorn-movie-right', {
        translateX: [20, 0],
        opacity: [0, 1],
        delay: stagger(100, { start: 600 }),
        duration: 1000,
        easing: 'easeOutExpo'
    });
}