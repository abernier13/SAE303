// La logique du Globe 3D (librairie Cobe)
// Ce fichier gère l'affichage de la Terre, la rotation, et la détection d'où se trouve la souris.
import createGlobe from 'https://esm.sh/cobe';
import { CONTINENT_DOTS } from './constants.js';

// Variables d'état pour la rotation et les interactions
let phi = 0;
let theta = 0;
let rotationVelocity = 0.005;
let pointerInteracting = null;
let pointerCurrentX = 0;
let isHoveringGlobe = false;
let currentFocus = null;

// Initialise le globe et ses événements
export function initGlobeController(canvas, container, labelContinent, vizData) {
    let width = 0;
    // On adapte la résolution du globe à la taille réelle de son conteneur
    const onResize = () => width = container.offsetWidth;
    window.addEventListener('resize', onResize);
    onResize();

    const globe = createGlobe(canvas, {
        devicePixelRatio: 2,
        width: 500 * 2,
        height: 500 * 2,
        phi: 0,
        theta: 0,
        dark: 1, // On est sur un thème sombre
        diffuse: 1.2,
        mapSamples: 8000,
        mapBrightness: 6,
        baseColor: [0.3, 0.3, 0.3], // Gris foncé pour la base
        markerColor: [0.9, 0.1, 0.1], // Rouge pour les points
        glowColor: [1, 1, 1], // Aura blanche
        markers: [],
        onRender: (state) => {
            // Si on ne touche à rien le globe tourne tout seul 
            if (pointerInteracting !== null) {
                // On est en train de "grabber" le globe, la rotation est gérée par la souris
            } else {
                if (isHoveringGlobe) {
                    // Si on survole on met en pause l'animation
                    rotationVelocity *= 0.9;
                } else {
                    // Sinon on maintient une vitesse douce
                    if (rotationVelocity > 0.005) {
                        rotationVelocity *= 0.95;
                    } else if (rotationVelocity < 0.005) {
                        rotationVelocity += 0.0005;
                    }
                }
                phi += rotationVelocity;
            }

            state.phi = phi;
            state.theta = theta;
            state.width = width * 2;
            state.height = width * 2;

            // On ajoute les points néons si un continent est survolé
            if (currentFocus && CONTINENT_DOTS[currentFocus]) {
                state.markers = CONTINENT_DOTS[currentFocus].map(coords => ({
                    location: coords,
                    size: 0.05
                }));
            } else {
                state.markers = [];
            }
        }
    });

    // Gestion du survol pour la pause
    container.addEventListener('pointerenter', () => isHoveringGlobe = true);
    container.addEventListener('pointerleave', () => {
        isHoveringGlobe = false;
        currentFocus = null;
        if (labelContinent) labelContinent.style.opacity = 0;
    });

    // Début du "drag" (grab)
    container.addEventListener('pointerdown', (e) => {
        pointerInteracting = e.clientX;
        pointerCurrentX = e.clientX;
        container.style.cursor = 'grabbing';
    });

    // Fin du "drag"
    window.addEventListener('pointerup', () => {
        pointerInteracting = null;
        container.style.cursor = 'grab';
    });

    // Calcule où la souris se trouve sur la sphère
    container.addEventListener('pointermove', (e) => {
        // Rotation manuelle
        if (pointerInteracting !== null) {
            const delta = e.clientX - pointerCurrentX;
            pointerCurrentX = e.clientX;
            const speed = 0.005;
            phi += delta * speed;
            rotationVelocity = delta * speed;
        }

        // Calcul mathématique pour projeter la souris (2D) sur le globe (3D)
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const r = rect.width / 2;
        const dist = Math.sqrt((x - r) ** 2 + (y - r) ** 2);

        if (dist < r) {
            const globeX = (x - r) / r;
            let currentRotation = phi % (2 * Math.PI);
            if (currentRotation < 0) currentRotation += 2 * Math.PI;

            // Longitude (Est-Ouest)
            let mouseLonRad = -currentRotation + Math.asin(globeX);
            mouseLonRad = (mouseLonRad % (2 * Math.PI));
            if (mouseLonRad > Math.PI) mouseLonRad -= 2 * Math.PI;
            if (mouseLonRad < -Math.PI) mouseLonRad += 2 * Math.PI;
            const mouseLonDeg = mouseLonRad * (180 / Math.PI);

            // Latitude (Nord-Sud)
            const globeY = (y - (rect.height / 2)) / r;
            const mouseLatRad = -Math.asin(globeY);
            const mouseLatDeg = mouseLatRad * (180 / Math.PI);

            // On vérifie si on est dans les zones de nos continents
            let hovered = null;
            if (mouseLonDeg > -130 && mouseLonDeg < -35 && mouseLatDeg > -55 && mouseLatDeg < 70) {
                hovered = "Amerique";
            } else if (mouseLonDeg > -10 && mouseLonDeg < 45 && mouseLatDeg > 35 && mouseLatDeg < 70) {
                hovered = "Europe";
            } else if (mouseLonDeg > 60 && mouseLonDeg < 170 && mouseLatDeg > -50 && mouseLatDeg < 55) {
                hovered = "Asie";
            }

            // Si on survole quelque chose, on affiche l'étiquette (Tooltip)
            if (hovered && vizData.continents[hovered] !== undefined) {
                if (currentFocus !== hovered && labelContinent) {
                    currentFocus = hovered;
                    labelContinent.innerHTML = `<strong>${hovered}</strong><br>$${vizData.continents[hovered]} Mrd`;
                    labelContinent.style.opacity = 1;
                }
                // On fait suivre la souris à l'étiquette
                if (labelContinent) {
                    labelContinent.style.transform = `translate(${e.clientX + 15}px, ${e.clientY + 15}px)`;
                }
            } else {
                if (labelContinent) labelContinent.style.opacity = 0;
                currentFocus = null;
            }
        } else {
            if (labelContinent) labelContinent.style.opacity = 0;
            currentFocus = null;
        }
    });

    return globe;
}
