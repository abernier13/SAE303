import createGlobe from 'https://esm.sh/cobe';
import { CONTINENT_DOTS } from './constants.js';

let phi = 0;
let theta = 0;
let rotationVelocity = 0.005;
let pointerInteracting = null;
let pointerCurrentX = 0;
let isHoveringGlobe = false;
let currentFocus = null;

export function initGlobeController(canvas, container, labelContinent, vizData) {
    let width = 0;
    const onResize = () => width = container.offsetWidth;
    window.addEventListener('resize', onResize);
    onResize();

    const globe = createGlobe(canvas, {
        devicePixelRatio: 2,
        width: 500 * 2,
        height: 500 * 2,
        phi: 0,
        theta: 0,
        dark: 1,
        diffuse: 1.2,
        mapSamples: 8000,
        mapBrightness: 6,
        baseColor: [0.3, 0.3, 0.3],
        markerColor: [0.9, 0.1, 0.1],
        glowColor: [1, 1, 1],
        markers: [],
        onRender: (state) => {
            if (pointerInteracting !== null) {
            } else {
                if (isHoveringGlobe) {
                    rotationVelocity *= 0.9;
                } else {
                    if (rotationVelocity > 0.005) {
                        rotationVelocity *= 0.95;
                    } else if (rotationVelocity < 0.005) {
                        rotationVelocity += 0.0005;
                        if (rotationVelocity > 0.005) rotationVelocity = 0.005;
                    }
                }
                phi += rotationVelocity;
            }

            state.phi = phi;
            state.theta = theta;
            state.width = width * 2;
            state.height = width * 2;

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

    container.addEventListener('pointerenter', () => isHoveringGlobe = true);
    container.addEventListener('pointerleave', () => {
        isHoveringGlobe = false;
        currentFocus = null;
        if (labelContinent) labelContinent.style.opacity = 0;
    });

    container.addEventListener('pointerdown', (e) => {
        pointerInteracting = e.clientX;
        pointerCurrentX = e.clientX;
        container.style.cursor = 'grabbing';
    });

    window.addEventListener('pointerup', () => {
        pointerInteracting = null;
        container.style.cursor = 'grab';
    });

    container.addEventListener('pointermove', (e) => {
        if (pointerInteracting !== null) {
            const delta = e.clientX - pointerCurrentX;
            pointerCurrentX = e.clientX;
            const speed = 0.005;
            phi += delta * speed;
            rotationVelocity = delta * speed;
        }

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const r = rect.width / 2;
        const dist = Math.sqrt((x - r) ** 2 + (y - r) ** 2);

        if (dist < r) {
            const globeX = (x - r) / r;
            let currentRotation = phi % (2 * Math.PI);
            if (currentRotation < 0) currentRotation += 2 * Math.PI;

            let mouseLonRad = -currentRotation + Math.asin(globeX);
            mouseLonRad = (mouseLonRad % (2 * Math.PI));
            if (mouseLonRad > Math.PI) mouseLonRad -= 2 * Math.PI;
            if (mouseLonRad < -Math.PI) mouseLonRad += 2 * Math.PI;
            const mouseLonDeg = mouseLonRad * (180 / Math.PI);

            const globeY = (y - (rect.height / 2)) / r;
            const mouseLatRad = -Math.asin(globeY);
            const mouseLatDeg = mouseLatRad * (180 / Math.PI);

            let hovered = null;
            if (mouseLonDeg > -130 && mouseLonDeg < -35 && mouseLatDeg > -55 && mouseLatDeg < 70) {
                hovered = "Amerique";
            } else if (mouseLonDeg > -10 && mouseLonDeg < 45 && mouseLatDeg > 35 && mouseLatDeg < 70) {
                hovered = "Europe";
            } else if (mouseLonDeg > 60 && mouseLonDeg < 170 && mouseLatDeg > -50 && mouseLatDeg < 55) {
                hovered = "Asie";
            }

            if (hovered && vizData.continents[hovered] !== undefined) {
                if (currentFocus !== hovered && labelContinent) {
                    currentFocus = hovered;
                    labelContinent.innerHTML = `<strong>${hovered}</strong><br>$${vizData.continents[hovered]} Mrd`;
                    labelContinent.style.opacity = 1;
                }
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
