import { animate } from 'https://esm.sh/animejs@4.2.2';
import { pathStar } from './constants.js';

let currentFilmIndex = 0;
let topFilms = [];

export function updateRatingsUI(avgRating, films = []) {
    const container = document.getElementById('ratings-layer');
    if (!container) return;
    container.innerHTML = '';

    topFilms = films;
    if (topFilms.length === 0) return;

    const film = topFilms[currentFilmIndex];
    if (!film) return;

    // Le budget max des 4 films pour servir de référence 100%
    const maxBudget = Math.max(...topFilms.map(f => f.budget));

    // Le remplissage (budget) : 100% pour le budget max
    const budgetFactor = film.budget / maxBudget;
    const minY = 100;
    const maxY = 589;
    const height = maxY - minY;
    const fillY = maxY - (height * budgetFactor);

    // Détermination de la couleur en fonction de l'efficience (Note / Budget)
    let liquidColorStart = "#ffed4e";
    let liquidColorEnd = "#f5c518";
    let strokeColor = "#444";
    let glowColor = "rgba(255, 215, 0, 0.4)";

    // Logique de couleur dynamique
    if (film.rating >= 8.5) {
        // Excellent : vert/doré
        liquidColorStart = "#d14120ff";
        liquidColorEnd = "#78ffd6";
        strokeColor = "#78ff9d";
        glowColor = "rgba(120, 255, 157, 0.4)";
    } else if (budgetFactor > 0.8) {
        // Gros budget, note "normale" pour le top : bleu 
        liquidColorStart = "#4facfe";
        liquidColorEnd = "#00f2fe";
        strokeColor = "#00f2fe";
        glowColor = "rgba(0, 242, 254, 0.3)";
    }

    // Créer les gradients (defs)
    const svgParent = container.closest('svg');
    let defs = svgParent.querySelector('defs');
    if (!defs) {
        defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        svgParent.insertBefore(defs, svgParent.firstChild);
    }

    // Nettoyage des anciens éléments de defs
    const oldGrad = defs.querySelector('#liquid-gradient');
    if (oldGrad) oldGrad.remove();
    const oldClip = defs.querySelector('#clip-star');
    if (oldClip) oldClip.remove();

    const liquidGradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    liquidGradient.setAttribute("id", "liquid-gradient");
    liquidGradient.setAttribute("x1", "0%");
    liquidGradient.setAttribute("y1", "0%");
    liquidGradient.setAttribute("x2", "0%");
    liquidGradient.setAttribute("y2", "100%");

    const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop1.setAttribute("offset", "0%");
    stop1.setAttribute("stop-color", liquidColorStart);

    const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop2.setAttribute("offset", "100%");
    stop2.setAttribute("stop-color", liquidColorEnd);

    liquidGradient.appendChild(stop1);
    liquidGradient.appendChild(stop2);
    defs.appendChild(liquidGradient);

    // Clip Path Liquide
    const clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
    clipPath.setAttribute("id", "clip-star");
    const wavePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const amplitude = 12;
    let d = `M 0 ${fillY} `;
    for (let x = 0; x <= 1600; x += 100) {
        d += `Q ${x + 25} ${fillY - amplitude}, ${x + 50} ${fillY} T ${x + 100} ${fillY} `;
    }
    d += `L 1600 600 L 0 600 Z`;
    wavePath.setAttribute("d", d);
    wavePath.setAttribute("id", "liquid-wave");
    wavePath.setAttribute("data-fill-y", fillY);
    clipPath.appendChild(wavePath);
    defs.appendChild(clipPath);

    // Étoile de fond
    const bgStar = document.createElementNS("http://www.w3.org/2000/svg", "path");
    bgStar.setAttribute("d", pathStar);
    bgStar.classList.add('rating-star-bg');
    bgStar.setAttribute("fill", "rgba(255, 255, 255, 0.05)");
    bgStar.setAttribute("stroke", strokeColor);
    bgStar.setAttribute("stroke-width", "3");
    bgStar.style.transition = "stroke 0.8s ease";
    container.appendChild(bgStar);

    // Étoile de remplissage
    const fgStar = document.createElementNS("http://www.w3.org/2000/svg", "path");
    fgStar.setAttribute("d", pathStar);
    fgStar.setAttribute("fill", "url(#liquid-gradient)");
    fgStar.setAttribute("clip-path", "url(#clip-star)");
    fgStar.style.filter = `drop-shadow(0 0 15px ${glowColor})`;
    container.appendChild(fgStar);

    // Titre du film
    const textTitle = createSVGText(400, 310, film.title, "rating-film-title", "#fff", "28px", "bold");
    container.appendChild(textTitle);

    const textNote = createSVGText(400, 370, `IMDb: ${film.rating.toFixed(1)}/10`, "rating-number", liquidColorStart, "50px", "bold");
    container.appendChild(textNote);

    const budgetMrd = (film.budget / 1000000000).toFixed(2);
    const textBudget = createSVGText(400, 420, `Budget: $${budgetMrd} Mrd`, "rating-budget", "#ffffffff", "20px");
    container.appendChild(textBudget);

    // Flèches de navigation
    const arrowLeft = createArrow(100, 350, true);
    const arrowRight = createArrow(700, 350, false);

    arrowLeft.onclick = (e) => {
        e.stopPropagation();
        currentFilmIndex = (currentFilmIndex - 1 + topFilms.length) % topFilms.length;
        updateRatingsUI(0, topFilms);
        animateRatings(0);
    };

    arrowRight.onclick = (e) => {
        e.stopPropagation();
        currentFilmIndex = (currentFilmIndex + 1) % topFilms.length;
        updateRatingsUI(0, topFilms);
        animateRatings(0);
    };

    container.appendChild(arrowLeft);
    container.appendChild(arrowRight);

    // Indicateur de position (1 / 4)
    const stepText = createSVGText(400, 50, `${currentFilmIndex + 1} / ${topFilms.length}`, "rating-step", "#555", "14px");
    container.appendChild(stepText);
}

function createSVGText(x, y, content, className, color, size, weight = "normal") {
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", x);
    text.setAttribute("y", y);
    text.setAttribute("text-anchor", "middle");
    if (className) text.classList.add(className);
    text.style.fill = color;
    text.style.fontSize = size;
    text.style.fontWeight = weight;
    text.style.fontFamily = "'Outfit', sans-serif";
    text.style.pointerEvents = "none";
    text.textContent = content;
    return text;
}

function createArrow(x, y, isLeft) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.style.cursor = "pointer";
    g.style.pointerEvents = "auto";

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", "30");
    circle.setAttribute("fill", "rgba(255,255,255,0.05)");
    circle.classList.add('arrow-bg');
    circle.style.transition = "fill 0.3s ease";

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const d = isLeft ? `M ${x + 5} ${y - 15} L ${x - 10} ${y} L ${x + 5} ${y + 15}` : `M ${x - 5} ${y - 15} L ${x + 10} ${y} L ${x - 5} ${y + 15}`;
    path.setAttribute("d", d);
    path.setAttribute("stroke", "#fff");
    path.setAttribute("stroke-width", "4");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");

    g.appendChild(circle);
    g.appendChild(path);

    g.onmouseenter = () => circle.setAttribute("fill", "rgba(255,255,255,0.2)");
    g.onmouseleave = () => circle.setAttribute("fill", "rgba(255,255,255,0.05)");

    return g;
}

export function animateRatings(targetRating) {
    const waveEl = document.getElementById('liquid-wave');
    if (!waveEl) return;
    const fillY = parseFloat(waveEl.getAttribute('data-fill-y'));

    // Animation de la montée
    animate(waveEl, {
        translateY: [600 - fillY, 0],
        duration: 1200,
        easing: 'easeOutQuart'
    });

    // Animation horizontale continue
    animate(waveEl, {
        translateX: [0, -800],
        duration: 3000,
        easing: 'linear',
        loop: true
    });

    // Fade in des textes d'infos
    animate('.rating-film-title, .rating-number, .rating-budget', {
        opacity: [0, 1],
        translateY: [20, 0],
        delay: (el, i) => 100 + (100 * i),
        duration: 800,
        easing: 'easeOutExpo'
    });
}