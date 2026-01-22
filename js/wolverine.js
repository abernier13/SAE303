import { animate } from 'https://esm.sh/animejs@4.2.2';
import { svgLoganUnmasked, svgWolverineAction } from './constants.js';

// Initialisation du son des griffes
const wolverineSound = new Audio('./son/wolverine/WEAPSwrd_Epee (ID 0129)_LaSonotheque.fr.wav');

// Fonction pour "amorcer" l'audio (appelée au clic sur le bouton start)
export function primeWolverineAudio() {
    wolverineSound.play().then(() => {
        wolverineSound.pause();
        wolverineSound.currentTime = 0;
    }).catch(e => console.log("Wolverine audio priming pending..."));
}

let isShowingAction = false;

export function initWolverineUI() {
    const container = document.getElementById('wolverine-layer');
    if (!container) return;

    container.innerHTML = `
        <g class="wolverine-state-logan" transform="translate(256, 175) scale(6)">
            ${svgLoganUnmasked}
        </g>
        <g class="wolverine-state-action" transform="translate(256, 175) scale(6)" style="opacity: 0;">
            ${svgWolverineAction}
        </g>
    `;

    container.style.cursor = "pointer";
    container.style.pointerEvents = "auto";

    container.onclick = (e) => {
        e.stopPropagation();
        toggleWolverineState();
    };
}

export function toggleWolverineState() {
    isShowingAction = !isShowingAction;

    // On lance le son
    wolverineSound.currentTime = 0;
    wolverineSound.play().catch(e => console.log("Sound play failed:", e));

    const logan = document.querySelector('.wolverine-state-logan');
    const action = document.querySelector('.wolverine-state-action');

    if (isShowingAction) {
        animate(logan, { opacity: 0, duration: 400, easing: 'easeInOutQuad' });
        animate(action, { opacity: 1, duration: 400, easing: 'easeInOutQuad' });
    } else {
        animate(logan, { opacity: 1, duration: 400, easing: 'easeInOutQuad' });
        animate(action, { opacity: 0, duration: 400, easing: 'easeInOutQuad' });
    }
}
