import { animate, stagger } from 'https://esm.sh/animejs@4.2.2';

export function updatePopcornUI(genres) {
    const maxRevenue = genres.length > 0 ? genres[0].totalRevenue : 1;
    const configs = [
        { id: 'Rectangle_3', rotation: -94 },
        { id: 'Rectangle_5', rotation: -91.5 },
        { id: 'Rectangle_7', rotation: -88.5 },
        { id: 'Rectangle_9', rotation: -86 }
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

                const existingText = rectGroup.querySelector('.popcorn-text');
                if (existingText) existingText.remove();

                const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
                textEl.classList.add('popcorn-text');
                textEl.setAttribute("fill", "rgba(255, 255, 255, 0.9)");
                textEl.setAttribute("text-anchor", "middle");
                textEl.setAttribute("font-family", "'Outfit', sans-serif");
                textEl.setAttribute("font-size", "28");
                textEl.setAttribute("font-weight", "600");

                const points = polygon.getAttribute('points').trim().split(/\s+/).map(Number);
                let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
                for (let i = 0; i < points.length; i += 2) {
                    const x = points[i]; const y = points[i + 1];
                    if (x < minX) minX = x; if (x > maxX) maxX = x;
                    if (y < minY) minY = y; if (y > maxY) maxY = y;
                }
                const centerX = (minX + maxX) / 2;
                const centerY = (minY + maxY) / 2;

                textEl.setAttribute("transform", `translate(${centerX}, ${centerY}) rotate(${config.rotation})`);
                textEl.style.pointerEvents = "none";
                textEl.style.textShadow = "0px 2px 4px rgba(0,0,0,0.3)";
                textEl.style.opacity = "0";

                const revenueBillions = (genre.totalRevenue / 1000000000).toFixed(1) + " Mrd";
                textEl.textContent = `${genre.name.toUpperCase()}  •  ${genre.topMovie.title}  •  $${revenueBillions}`;
                rectGroup.appendChild(textEl);
            }
        }
    });
}

export function animatePopcorn() {
    animate('.popcorn-stripe', {
        scaleY: (el) => [0, el.getAttribute('data-target-scale') || 1],
        opacity: [0, 1],
        easing: 'easeOutExpo',
        duration: 800,
        delay: stagger(100)
    });

    animate('.popcorn-text', {
        translateY: [20, 0],
        opacity: [0, 1],
        delay: stagger(100, { start: 300 }),
        duration: 800,
        easing: 'easeOutExpo'
    });
}
