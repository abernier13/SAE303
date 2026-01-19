// Ce fichier gère l'animation dynamique du cornet de popcorn (le Top 5 Genres).
// On crée les textes à la volée et on fait grandir les bandes rouges.
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
        { id: 'Rectangle_1', rotation: -96.2 },
        { id: 'Rectangle_3', rotation: -93.7 },
        { id: 'Rectangle_5', rotation: -91.2 },
        { id: 'Rectangle_7', rotation: -88.7 },
        { id: 'Rectangle_9', rotation: -86.2 }
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

                polygon.style.transformOrigin = "center bottom";
                polygon.style.transformBox = "fill-box";
                polygon.style.opacity = "0";
                polygon.style.transform = "scaleY(0)";

                // Calcul du sommet et du centre
                const points = polygon.getAttribute('points').trim().split(/\s+/).map(Number);
                let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
                for (let i = 0; i < points.length; i += 2) {
                    const x = points[i]; const y = points[i + 1];
                    if (x < minX) minX = x; if (x > maxX) maxX = x;
                    if (y < minY) minY = y; if (y > maxY) maxY = y;
                }
                const centerX = (minX + maxX) / 2;
                const finalTopY = maxY - (maxY - minY) * scaleFactor;

                // 1. Étiquette REVENU (au sommet) - En BLANC avec FOND
                const revenueMillions = (genre.totalRevenue / 1000000).toLocaleString('en-US', {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1
                }) + "M";
                const revenueText = `$${revenueMillions}`;

                // Création du fond (rect) - Padding augmenté
                const bgW = revenueText.length * 11 + 20;
                const bgH = 34;
                const bgEl = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                bgEl.classList.add('popcorn-value-bg');
                bgEl.setAttribute("fill", "rgba(0, 0, 0, 0.5)");
                bgEl.setAttribute("rx", "8");
                bgEl.setAttribute("width", bgW);
                bgEl.setAttribute("height", bgH);
                bgEl.setAttribute("x", centerX - bgW / 2);
                bgEl.setAttribute("y", finalTopY - 15 - bgH + 8);
                bgEl.style.opacity = "0";
                if (labelsLayer) labelsLayer.appendChild(bgEl);

                const valueEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
                valueEl.classList.add('popcorn-value');
                valueEl.setAttribute("fill", "#fff");
                valueEl.setAttribute("text-anchor", "middle");
                valueEl.setAttribute("font-family", "'Outfit', sans-serif");
                valueEl.setAttribute("font-size", "22");
                valueEl.setAttribute("font-weight", "bold");
                valueEl.textContent = revenueText;

                valueEl.setAttribute("x", centerX);
                valueEl.setAttribute("y", finalTopY - 15);
                valueEl.style.opacity = "0";
                if (labelsLayer) labelsLayer.appendChild(valueEl);

                // 2. Étiquette GENRE + FILM (verticale dans la bande)
                const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
                textEl.classList.add('popcorn-text');
                textEl.setAttribute("fill", "rgba(255, 255, 255, 0.95)");
                textEl.setAttribute("text-anchor", "start");
                textEl.setAttribute("font-family", "'Outfit', sans-serif");
                textEl.setAttribute("font-size", "18");
                textEl.setAttribute("font-weight", "600");

                const textY = maxY - 30;
                // On stocke la rotation pour l'animation
                textEl.setAttribute('data-rotation', config.rotation);

                // Positionnement initial
                textEl.style.transform = `translate(${centerX}px, ${textY}px) rotate(${config.rotation}deg)`;
                textEl.style.transformOrigin = "left center";
                textEl.style.opacity = "0";

                textEl.textContent = `${genre.name.toUpperCase()} • ${genre.topMovie.title.toUpperCase()}`;
                if (labelsLayer) labelsLayer.appendChild(textEl);
            }
        }
    });
}

// Lance les animations Anime.js
export function animatePopcorn() {
    // 1. Les bandes grimpent
    animate('.popcorn-stripe', {
        scaleY: (el) => [0, el.getAttribute('data-target-scale') || 1],
        opacity: [0, 1],
        easing: 'easeOutExpo',
        duration: 800,
        delay: stagger(100)
    });

    // 2. Les valeurs de revenus et leurs fonds
    animate('.popcorn-value, .popcorn-value-bg', {
        translateY: [20, 0],
        opacity: [0, 1],
        delay: stagger(105, { start: 400 }),
        duration: 800,
        easing: 'easeOutExpo'
    });

    // 3. Les textes Genre/Film (maintien de leur rotation spécifique)
    animate('.popcorn-text', {
        translateY: [20, 0],
        rotate: (el) => parseFloat(el.getAttribute('data-rotation')),
        opacity: [0, 1],
        delay: stagger(105, { start: 450 }),
        duration: 800,
        easing: 'easeOutExpo'
    });
}
