import { animate } from 'https://esm.sh/animejs@4.2.2';
import { pathStar } from './constants.js';

export function updateRatingsUI(avgRating, hiddenGems = []) {
    const container = document.getElementById('ratings-layer');
    if (!container) return;
    container.innerHTML = '';

    const ratingFactor = avgRating / 10;
    const minY = 100;
    const maxY = 589;
    const height = maxY - minY;
    const fillY = maxY - (height * ratingFactor);

    // 0. Créer les gradients (defs) au niveau du SVG parent
    const svgParent = container.closest('svg');
    let defs = svgParent.querySelector('defs');
    
    if (!defs) {
        defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        svgParent.insertBefore(defs, svgParent.firstChild);
    }
    
    // Nettoyer les anciens gradients
    const oldGradient = defs.querySelector('#gold-gradient');
    if (oldGradient) oldGradient.remove();
    const oldClip = defs.querySelector('#clip-star');
    if (oldClip) oldClip.remove();
    
    // Gradient or pour l'étoile remplie
    const goldGradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    goldGradient.setAttribute("id", "gold-gradient");
    goldGradient.setAttribute("x1", "0%");
    goldGradient.setAttribute("y1", "0%");
    goldGradient.setAttribute("x2", "100%");
    goldGradient.setAttribute("y2", "100%");
    
    const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop1.setAttribute("offset", "0%");
    stop1.setAttribute("stop-color", "#ffd700");
    stop1.setAttribute("stop-opacity", "1");
    
    const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop2.setAttribute("offset", "50%");
    stop2.setAttribute("stop-color", "#f5c518");
    stop2.setAttribute("stop-opacity", "1");
    
    const stop3 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop3.setAttribute("offset", "100%");
    stop3.setAttribute("stop-color", "#ffed4e");
    stop3.setAttribute("stop-opacity", "1");
    
    goldGradient.appendChild(stop1);
    goldGradient.appendChild(stop2);
    goldGradient.appendChild(stop3);
    defs.appendChild(goldGradient);
    
    // Masque de découpe pour le remplissage
    const clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
    clipPath.setAttribute("id", "clip-star");
    const clipRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    clipRect.setAttribute("x", "140");
    clipRect.setAttribute("y", maxY);
    clipRect.setAttribute("width", "520");
    clipRect.setAttribute("height", "0");
    clipRect.classList.add('rating-clip-rect');
    clipRect.setAttribute("data-y-start", maxY);
    clipRect.setAttribute("data-target-y", fillY);
    clipRect.setAttribute("data-target-h", maxY - fillY);
    
    clipPath.appendChild(clipRect);
    defs.appendChild(clipPath);

    // 1. Étoile de fond (vide)
    const bgStar = document.createElementNS("http://www.w3.org/2000/svg", "path");
    bgStar.setAttribute("d", pathStar);
    bgStar.classList.add('rating-star-bg');
    bgStar.setAttribute("fill", "none");
    bgStar.setAttribute("stroke", "#444");
    bgStar.setAttribute("stroke-width", "3");
    container.appendChild(bgStar);

    // 2. Étoile de remplissage (Gradient Or)
    const fgStar = document.createElementNS("http://www.w3.org/2000/svg", "path");
    fgStar.setAttribute("d", pathStar);
    fgStar.setAttribute("fill", "url(#gold-gradient)");
    fgStar.setAttribute("clip-path", "url(#clip-star)");
    fgStar.style.filter = "drop-shadow(0 0 15px rgba(255, 215, 0, 0.6)) drop-shadow(0 0 25px rgba(245, 197, 24, 0.3))";
    container.appendChild(fgStar);

    // 3. Texte de la note principale
    const textScore = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textScore.setAttribute("x", "400");
    textScore.setAttribute("y", "380");
    textScore.setAttribute("text-anchor", "middle");
    textScore.classList.add('rating-number');
    textScore.style.fill = "#ffd700";
    textScore.style.fontSize = "80px";
    textScore.style.fontWeight = "bold";
    textScore.style.fontFamily = "'Outfit', sans-serif";
    textScore.style.opacity = "0";
    textScore.textContent = "0.0";
    container.appendChild(textScore);

    // 4. Afficher les films exceptionnels (haute critique, budget modéré)
    if (hiddenGems && hiddenGems.length > 0) {
        // Titre pour les films
        const titleText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        titleText.setAttribute("x", "400");
        titleText.setAttribute("y", "480");
        titleText.setAttribute("text-anchor", "middle");
        titleText.style.fill = "#aaa";
        titleText.style.fontSize = "14px";
        titleText.style.fontFamily = "'Outfit', sans-serif";
        titleText.style.opacity = "0";
        titleText.textContent = "💎 Perles Rares : Excellentes critiques, budgets modérés";
        container.appendChild(titleText);

        // Afficher jusqu'à 4 films exceptionnels
        let yPos = 510;
        hiddenGems.slice(0, 4).forEach((film, index) => {
            const filmText = document.createElementNS("http://www.w3.org/2000/svg", "text");
            filmText.setAttribute("x", "400");
            filmText.setAttribute("y", yPos);
            filmText.setAttribute("text-anchor", "middle");
            filmText.style.fill = "#f5c518";
            filmText.style.fontSize = "12px";
            filmText.style.fontFamily = "'Outfit', sans-serif";
            filmText.style.opacity = "0";
            
            // Troncate le titre s'il est trop long
            const maxLen = 50;
            const displayTitle = film.title.length > maxLen ? film.title.substring(0, maxLen) + "..." : film.title;
            filmText.textContent = `⭐ ${film.rating.toFixed(1)}/10 - ${displayTitle}`;
            
            container.appendChild(filmText);
            yPos += 18;
        });
    }
}

export function animateRatings(targetRating) {
    // Animation du remplissage
    animate('.rating-clip-rect', {
        y: [el => el.getAttribute('data-y-start'), el => el.getAttribute('data-target-y')],
        height: [0, el => el.getAttribute('data-target-h')],
        duration: 1500,
        easing: 'easeOutExpo'
    });

    // Animation du compteur textuel
    const textEl = document.querySelector('.rating-number');
    animate({
        targets: { val: 0 },
        val: parseFloat(targetRating),
        round: 10,
        duration: 1500,
        easing: 'easeOutExpo',
        update: (anim) => {
            if (textEl) textEl.textContent = anim.animatables[0].target.val.toFixed(1);
        }
    });

    // Animations des textes
    animate('.rating-number', { opacity: [0, 1], scale: [0.5, 1], duration: 800 });
    
    // Animer les films exceptionnels avec délai
    const filmTexts = document.querySelectorAll('#ratings-layer text:not(.rating-number):not([y="480"])');
    animate(filmTexts, { 
        opacity: [0, 1], 
        translateX: [-20, 0],
        duration: 800,
        delay: (el, i) => 600 + (100 * i),
        easing: 'easeOutQuad'
    });

    // Titre des films
    const titleText = document.querySelector('#ratings-layer text[y="480"]');
    if (titleText) {
        animate(titleText, { opacity: [0, 0.8], duration: 600, delay: 500 });
    }
}