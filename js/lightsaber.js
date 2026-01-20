import { animate, createDrawable } from 'https://esm.sh/animejs@4.2.2';
import { pathStarWars } from './constants.js';


// Initialise l'étape du sabre laser et du logo Star Wars
export function initLightsaberStep(vizData) {
    const saberContainer = document.getElementById('lightsaber-viz');
    const logoContainer = document.getElementById('logo-viz');
    if (!saberContainer || !logoContainer) return;

    // On vide les conteneurs pour repartir à 0
    saberContainer.innerHTML = '';
    logoContainer.innerHTML = '';
    saberContainer.style.opacity = 1;
    logoContainer.style.opacity = 1;

    // Création du Logo Star Wars Animé (contours)
    const logoPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    logoPath.setAttribute('d', pathStarWars);
    logoPath.classList.add('saber-logo');
    logoPath.setAttribute('stroke-width', '0.5');
    logoPath.setAttribute('transform', 'translate(300, 50) scale(4)'); // Logo réduit en haut
    logoContainer.appendChild(logoPath);

    const drawableLogo = createDrawable(logoPath);
    animate(drawableLogo, {
        draw: '0 1',
        duration: 15000,
        easing: 'easeInOutQuad'
    });

    // Création du Sabre Laser
    const domesticPct = parseFloat(vizData.avgDomestic) || 0;
    const foreignPct = parseFloat(vizData.avgForeign) || 0;
    const totalWidth = 600;
    const domesticWidth = (domesticPct / 100) * totalWidth;
    const foreignWidth = (foreignPct / 100) * totalWidth;

    // Groupe principal du sabre (centré)
    const gSaber = document.createElementNS("http://www.w3.org/2000/svg", "g");
    gSaber.setAttribute('transform', 'translate(150, 420)');
    saberContainer.appendChild(gSaber);

    // Les segments de la lame
    const bladeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    // On aligne la lame avec la sortie du manche
    bladeGroup.setAttribute('transform', 'translate(1, 0)');
    gSaber.appendChild(bladeGroup);

    // Le Manche (Handle) COMPLET - Extrait de icons8-sabre-laser.svg
    const handleGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    // On aligne précisément le point de sortie (émetteur) du manche avec le début de la lame (ajusté final)
    handleGroup.setAttribute('transform', 'translate(15, 0) scale(4) rotate(45) translate(-20, -28.5)');
    gSaber.appendChild(handleGroup);

    const handlePaths = [
        { d: "M8.3,38.3l1.4,1.4L6.4,43L5,41.6L8.3,38.3z", fill: "#90a4ae" },
        { d: "M14.5,30.7l2.8,2.8L7.8,43L5,40.2L14.5,30.7z", fill: "#90a4ae" },
        { d: "M12.1 33.1l2.8 2.8L7.8 43 5 40.2 12.1 33.1z M18 27.2l-3.9 3.9 2.8 2.8 1.1-1.1V27.2z", fill: "#37474f" },
        { d: "M11,32l3,3l-2,2l-3-3L11,32z", fill: "#37474f" }
    ];

    handlePaths.forEach(p => {
        const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
        pathEl.setAttribute('d', p.d);
        pathEl.setAttribute('fill', p.fill);
        handleGroup.appendChild(pathEl);
    });

    // Segment USA (Rouge)
    const rectUSA = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rectUSA.setAttribute('x', '0');
    rectUSA.setAttribute('y', '-5');
    rectUSA.setAttribute('height', '10');
    rectUSA.classList.add('saber-blade-usa');
    rectUSA.setAttribute('rx', '4');
    rectUSA.setAttribute('width', '0');
    bladeGroup.appendChild(rectUSA);

    // Segment Monde (Bleu)
    const rectWorld = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rectWorld.setAttribute('x', domesticWidth - 4);
    rectWorld.setAttribute('y', '-5');
    rectWorld.setAttribute('height', '10');
    rectWorld.classList.add('saber-blade-world');
    rectWorld.setAttribute('rx', '4');
    rectWorld.setAttribute('width', '0');
    bladeGroup.appendChild(rectWorld);

    // Animation d'allumage ("Ignition")
    animate(rectUSA, {
        width: domesticWidth,
        duration: 800,
        easing: 'easeOutExpo'
    });
    animate(rectWorld, {
        width: foreignWidth,
        duration: 800,
        delay: 200,
        easing: 'easeOutExpo'
    });

    // 3. Ajout des Labels et Lignes de rappel
    // Label USA
    const textUSA = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textUSA.textContent = `USA: ${vizData.avgDomestic}%`;
    textUSA.classList.add('saber-label-usa');
    textUSA.setAttribute('x', domesticWidth / 2);
    textUSA.setAttribute('y', '-70');
    textUSA.setAttribute('text-anchor', 'middle');
    textUSA.style.opacity = "0";
    bladeGroup.appendChild(textUSA);

    // Ligne USA
    const lineUSA = document.createElementNS("http://www.w3.org/2000/svg", "line");
    lineUSA.classList.add('saber-line-usa');
    lineUSA.setAttribute('x1', domesticWidth / 2);
    lineUSA.setAttribute('y1', '-60');
    lineUSA.setAttribute('x2', domesticWidth / 2);
    lineUSA.setAttribute('y2', '-60'); // Départ au même point pour l'anim
    bladeGroup.appendChild(lineUSA);

    // Label Monde
    const textWorld = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textWorld.textContent = `MONDE: ${vizData.avgForeign}%`;
    textWorld.classList.add('saber-label-world');
    textWorld.setAttribute('x', domesticWidth + foreignWidth / 2);
    textWorld.setAttribute('y', '-70');
    textWorld.setAttribute('text-anchor', 'middle');
    textWorld.style.opacity = "0";
    bladeGroup.appendChild(textWorld);

    // Ligne Monde
    const lineWorld = document.createElementNS("http://www.w3.org/2000/svg", "line");
    lineWorld.classList.add('saber-line-world');
    lineWorld.setAttribute('x1', domesticWidth + foreignWidth / 2);
    lineWorld.setAttribute('y1', '-60');
    lineWorld.setAttribute('x2', domesticWidth + foreignWidth / 2);
    lineWorld.setAttribute('y2', '-60');
    bladeGroup.appendChild(lineWorld);

    // Animations des labels et lignes
    animate(lineUSA, {
        y2: -15,
        duration: 600,
        delay: 800,
        easing: 'easeOutQuad'
    });
    animate(textUSA, {
        opacity: [0, 1],
        translateY: [10, 0],
        duration: 600,
        delay: 1000,
        easing: 'easeOutQuad'
    });

    animate(lineWorld, {
        y2: -15,
        duration: 600,
        delay: 1000,
        easing: 'easeOutQuad'
    });
    animate(textWorld, {
        opacity: [0, 1],
        translateY: [10, 0],
        duration: 600,
        delay: 1200,
        easing: 'easeOutQuad'
    });
}

// Cache les éléments du sabre laser
export function clearLightsaberStep() {
    const saberContainer = document.getElementById('lightsaber-viz');
    const logoContainer = document.getElementById('logo-viz');
    if (saberContainer) saberContainer.style.opacity = 0;
    if (logoContainer) logoContainer.style.opacity = 0;
}
