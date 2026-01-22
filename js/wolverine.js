import { animate } from 'https://esm.sh/animejs@4.2.2';
import { svgLoganUnmasked, svgWolverineAction } from './constants.js';

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
