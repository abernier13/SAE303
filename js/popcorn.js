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

                // Calcul des limites et du centre de la base
                const points = polygon.getAttribute('points').trim().split(/\s+/).map(Number);
                let minX = Infinity, maxX = -Infinity, minY = Infinity, maxYVal = -Infinity;

                for (let i = 0; i < points.length; i += 2) {
                    const x = points[i];
                    const y = points[i + 1];
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxYVal) maxYVal = y;
                }

                let sumX = 0, countX = 0;
                for (let i = 0; i < points.length; i += 2) {
                    if (Math.abs(points[i + 1] - maxYVal) < 1) { // Tolérance de 1px
                        sumX += points[i];
                        countX++;
                    }
                }
                const centerX = countX > 0 ? sumX / countX : (minX + maxX) / 2;
                const finalTopY = maxYVal - (maxYVal - minY) * scaleFactor;

                // Étiquette REVENU au sommet
                const revenueMillions = (genre.totalRevenue / 1000000).toLocaleString('en-US', {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1
                }) + "M";
                const revenueText = `$${revenueMillions}`;

                // Création du fond (rect) 
                const bgW = revenueText.length * 11 + 20;
                const bgH = 34;
                const bgEl = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                bgEl.classList.add('popcorn-value-bg');
                bgEl.setAttribute("rx", "8");
                bgEl.setAttribute("width", bgW);
                bgEl.setAttribute("height", bgH);
                bgEl.setAttribute("x", centerX - bgW / 2);
                bgEl.setAttribute("y", finalTopY - 15 - bgH + 8);
                if (labelsLayer) labelsLayer.appendChild(bgEl);

                const valueEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
                valueEl.classList.add('popcorn-value');
                valueEl.setAttribute("text-anchor", "middle");
                valueEl.textContent = revenueText;

                valueEl.setAttribute("x", centerX);
                valueEl.setAttribute("y", finalTopY - 15);
                if (labelsLayer) labelsLayer.appendChild(valueEl);

                // Étiquette GENRE + FILM (verticale dans la bande)
                const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
                textEl.classList.add('popcorn-text');

                // Calcul de l'angle d'inclinaison de la bande
                // Les points sont : [x1, y1, x2, y2, x3, y3, x4, y4, x5, y5]
                // Les côtés verticaux principaux sont P2->P3 et P1->P4 (approximativement)
                // Rectangle_1 points: 427.28 713.39 (P1), 385.51 713.37 (P2), 313 105.94 (P3), 367.98 105.95 (P4)
                // Calcul de l'angle d'inclinaison de la bande (en degrés)
                // On utilise atan(dx/dy). Comme dy est négatif (vers le haut), 
                // une bande qui s'évase vers la gauche aura dx < 0, donc dx/dy > 0, angle > 0.
                const angle1 = Math.atan((points[4] - points[2]) / (points[5] - points[3])) * 180 / Math.PI;
                const angle2 = Math.atan((points[6] - points[0]) / (points[7] - points[1])) * 180 / Math.PI;
                const rotation = (angle1 + angle2) / 2;

                const textY = maxYVal - 30;

                // Positionnement
                textEl.setAttribute("x", centerX);
                textEl.setAttribute("y", textY);
                // On applique l'inverse de l'angle pour redresser le texte par rapport à l'axe vertical penché
                textEl.style.transform = `rotate(${-rotation}deg)`;
                textEl.style.transformOrigin = `${centerX}px ${textY}px`;

                const labelText = `${genre.name.toUpperCase()} • ${genre.topMovie.title.toUpperCase()}`;
                textEl.textContent = labelText;

                // Calcul dynamique de la taille de police pour que ça rentre dans la bande
                const stripeHeight = (maxYVal - minY) * scaleFactor;
                const availableHeight = stripeHeight - 60; // Marge de sécurité
                const numChars = labelText.length;

                let fontSize = 14;
                if (numChars * fontSize > availableHeight) {
                    fontSize = availableHeight / numChars;
                }

                fontSize = Math.max(9, fontSize);
                textEl.style.fontSize = `${fontSize}px`;

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

    // 3. Les textes Genre/Film (maintien de leur orientation verticale)
    animate('.popcorn-text', {
        translateY: [20, 0],
        opacity: [0, 1],
        delay: stagger(105, { start: 450 }),
        duration: 800,
        easing: 'easeOutExpo'
    });
}
