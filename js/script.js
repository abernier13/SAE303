import { animate, createTimeline, stagger } from 'https://esm.sh/animejs@4.2.2';
import createGlobe from 'https://esm.sh/cobe';

console.log("Anime.js loaded:", { animate, createTimeline, stagger });

const vizPath = document.getElementById('morph-path');
const vizLabel = document.getElementById('viz-label');
const statDomestic = document.getElementById('stat-domestic');
const chartLabels = document.getElementById('chart-labels');
const globeCanvas = document.getElementById('globe-canvas');
const globeContainer = document.getElementById('globe-container');
const labelContinent = document.getElementById('label-continent');
const labelGlobal = document.getElementById('label-global');

let cinemaData = null;
let globe = null;

// État Interaction Globe
let pointerInteracting = null; // Stocke la position X de la souris
let pointerCurrentX = 0;       // Stocke la position courante pour calculer le delta
let phi = 0;                   // Rotation principale
let theta = 0;
let rotationVelocity = 0.005;  // Vitesse de rotation (rad/frame)
let currentFocus = null;
let isHoveringGlobe = false;

// Points pour l'effet "Néon" (Lat, Lon)
// Un nuage de points qui dessine grossièrement le continent
const CONTINENT_DOTS = {
   "Amerique": [
      // Amérique du Nord
      [60, -100], [50, -100], [40, -100], [30, -100],
      [60, -120], [50, -120], [40, -120], [35, -115],
      [45, -80], [40, -80], [35, -90], [30, -95],
      [20, -100], [10, -85],
      // Amérique du Sud
      [0, -60], [-10, -60], [-20, -60], [-30, -65],
      [-10, -75], [-20, -70], [-40, -70], [-50, -70],
      [5, -75], [-5, -50], [-15, -50], [-25, -55]
   ],
   "Europe": [
      [55, -3], [52, 0], [48, 2], [45, 4], // UK/France
      [52, 13], [50, 10], [48, 11], [46, 12], // Allemagne/Italie
      [40, -3], [42, -4], // Espagne
      [60, 10], [60, 20], [55, 25], [45, 25], // Nord/Est
      [42, 12], [41, 15] // Sud de l'Italie
   ],
   "Asie": [
      [35, 100], [30, 105], [25, 110], [22, 114], // China Coast
      [40, 90], [35, 80], [30, 75], // China Inland/India
      [20, 80], [15, 80], [10, 78], // Sud de l'Inde
      [36, 138], [34, 135], // Japon
      [-25, 135], [-30, 140], [-20, 130], // Australie
      [5, 110], [0, 115] // SE Asia
   ]
};

// Centroides approximatifs pour les marqueurs (Lat, Lon)
const CONTINENT_CENTERS = {
   "Amerique": [30, -90],
   "Europe": [50, 15],
   "Asie": [35, 100]
};

// Mapping Pays -> Continent (Basé sur les données observées rapidements)
const CONTINENT_MAP = {
   "United States of America": "Amerique",
   "Canada": "Amerique",
   "United Kingdom": "Europe",
   "Germany": "Europe",
   "France": "Europe",
   "Italy": "Europe",
   "Spain": "Europe",
   "Japan": "Asie",
   "China": "Asie",
   "Hong Kong": "Asie",
   "Taiwan": "Asie",
   "South Korea": "Asie",
   "India": "Asie",
   "Australia": "Asie" // Simplification pour le regroupement
};

// 2. Part de camembert (Génération dynamique basée sur les données) -> REPLACED BY STAR WARS
const pathStarWars = "M 9.300781 14 C 8 14 7 15 7 16.402344 C 7 17 7.199219 17.199219 7.300781 17.402344 C 7.578125 17.90625 8.859375 20 8.859375 20 C 8.925781 20.097656 8.9375 20.167969 8.957031 20.300781 C 9.058594 20.699219 8.757813 21 8.359375 21 L 2 21 L 2 24 L 10.800781 24 C 12.101563 24 13.199219 23 13.199219 21.597656 C 13.199219 21 13 20.800781 12.902344 20.597656 L 11.234375 18 C 11.175781 17.925781 11.132813 17.800781 11.132813 17.699219 C 11.132813 17.300781 11.433594 17 11.832031 17 L 16 17 L 16 24 L 20 24 L 20 17 L 24 17 L 24 14 Z M 26.300781 14 L 23.078125 24 L 26.300781 24 L 27 22 L 30.152344 22 L 30.847656 24 L 34 24 L 30.667969 14 Z M 35 14 L 35 24 L 38 24 L 38 20.890625 C 38.65625 21.515625 40.21875 23 41 23.699219 C 41.097656 23.800781 41.398438 24 41.796875 24 L 48 24 L 48 21 L 43.597656 21 C 43.371094 21 43.210938 20.933594 43.078125 20.839844 C 43.011719 20.777344 42.96875 20.738281 42.917969 20.691406 C 44.140625 20.144531 45 18.921875 45 17.5 C 45 15.574219 43.425781 14 41.5 14 Z M 38 17 L 41 17 C 41.277344 17 41.5 17.222656 41.5 17.5 C 41.5 17.777344 41.277344 18 41 18 L 38 18 Z M 28.566406 17.402344 L 29.574219 20 L 27.699219 20 Z M 2.398438 27 L 5.734375 37 L 8.101563 37 L 9.671875 32.449219 L 11.246094 37 L 13.597656 37 L 16.933594 27 L 13 27 L 12.03125 29.902344 L 11.066406 27 L 7.601563 27 L 6.546875 29.9375 L 5.566406 27 Z M 19.300781 27 L 16.078125 37 L 19.300781 37 L 20 35 L 23.152344 35 L 23.847656 37 L 27 37 L 23.667969 27 Z M 28 27 L 28 37 L 31 37 L 31 33.886719 C 31.65625 34.507813 33.222656 36 34 36.699219 C 34.101563 36.800781 34.402344 37 34.800781 37 L 44.097656 37 C 45.398438 37 46.5 36.097656 46.5 34.597656 C 46.5 34 46.300781 33.800781 46.199219 33.597656 L 44.53125 31.097656 C 44.5 31.03125 44.433594 30.902344 44.433594 30.800781 C 44.433594 30.402344 44.730469 30 45.03125 30 L 48 30 L 48 27 L 42.300781 27 C 41 27 39.902344 28.101563 39.902344 29.5 C 39.902344 30.101563 40.097656 30.300781 40.199219 30.5 C 40.480469 30.882813 42 33 42 33 C 42.042969 33.101563 42.097656 33.199219 42.097656 33.300781 C 42.097656 33.699219 41.800781 34 41.5 34 L 36.597656 34 C 36.425781 34 36.292969 33.957031 36.179688 33.898438 C 36.09375 33.804688 36.023438 33.730469 35.964844 33.667969 C 37.160156 33.109375 38 31.902344 38 30.5 C 38 28.574219 36.425781 27 34.5 27 Z M 31 30 L 34 30 C 34.277344 30 34.5 30.222656 34.5 30.5 C 34.5 30.777344 34.277344 31 34 31 L 31 31 Z M 21.566406 30.402344 L 22.574219 33 L 20.699219 33 Z";

// 4. Étoile/Irrégulier (Notes)
const pathStar = "M 400 100 L 479 261 L 657 287 L 528 412 L 559 589 L 400 505 L 241 589 L 271 412 L 143 287 L 321 261 Z";

// Gestion de l'état
let currentStep = 0;

async function init() {
   try {
      // 1. Récupération des données
      const response = await fetch('./json/box office cine.json');
      cinemaData = await response.json();

      // 2. Traitement des données (Optimisé en un seul passage)
      processAllData(cinemaData);

      // 3. Initialisation des visuels
      vizPath.setAttribute('d', ""); // Pas de forme initiale, le globe s'affiche en premier
      setupObserver();
      initGlobe(); // Initialisation du globe

      // Initialiser l'animation du titre après le chargement des données ou immédiatement
      initTitleAnimation();

   } catch (error) {
      console.error("Échec du chargement des données :", error);
   }
}

function processAllData(data) {
   if (!data) return;
   const movies = Array.isArray(data) ? data : data.movies || [];

   // Variables pour Stats Globales & Globe
   let totalWorldwide = 0;
   let totalDomesticPct = 0;
   let totalForeignPct = 0;
   let actionRevenue = 0;
   let totalRating = 0;
   let ratedMoviesCount = 0;
   let continentTotals = { "Amerique": 0, "Europe": 0, "Asie": 0 };
   let continentCounts = { "Amerique": 0, "Europe": 0, "Asie": 0 };

   // Variables pour Popcorn Graphic
   const genreStats = {};

   movies.forEach(movie => {
      const world = parseInt(movie['$Worldwide']) || 0;
      const dom = parseFloat(movie['Domestic %']) || 0;
      const foreign = parseFloat(movie['Foreign %']) || 0;
      const genresStr = movie['Genres'] || "";
      const ratingStr = movie['Rating'] || "";
      const title = movie['Release Group'];

      // 1. Accumulation Globe/Stats
      totalWorldwide += world;
      totalDomesticPct += dom;
      totalForeignPct += foreign;

      if (genresStr.includes('Action') || genresStr.includes('Adventure')) {
         actionRevenue += world;
      }

      if (ratingStr) {
         const score = parseFloat(ratingStr.split('/')[0]);
         if (!isNaN(score)) {
            totalRating += score;
            ratedMoviesCount++;
         }
      }

      const countries = (movie['Production_Countries'] || "").split(', ');
      if (countries.length > 0) {
         const continent = CONTINENT_MAP[countries[0]];
         if (continent) {
            continentTotals[continent] += world;
            continentCounts[continent]++;
         }
      }

      // 2. Accumulation Popcorn (Genres)
      const distinctGenres = genresStr.split(',').map(g => g.trim()).filter(g => g);
      distinctGenres.forEach(genre => {
         if (!genreStats[genre]) {
            genreStats[genre] = {
               name: genre,
               totalRevenue: 0,
               topMovie: { title: "", revenue: 0 }
            };
         }
         genreStats[genre].totalRevenue += world;
         if (world > genreStats[genre].topMovie.revenue) {
            genreStats[genre].topMovie = { title: title, revenue: world };
         }
      });
   });

   // Mise à jour de vizData (Globe)
   vizData.totalRevenue = (totalWorldwide / 1000000000).toFixed(1);
   vizData.avgDomestic = (totalDomesticPct / movies.length).toFixed(0);
   vizData.avgForeign = (totalForeignPct / movies.length).toFixed(0);
   vizData.actionRevenue = (actionRevenue / 1000000000).toFixed(1);
   vizData.avgRating = (totalRating / ratedMoviesCount).toFixed(1);
   vizData.continents.Amerique = (continentTotals.Amerique / 1000000000).toFixed(1);
   vizData.continents.Europe = (continentTotals.Europe / 1000000000).toFixed(1);
   vizData.continents.Asie = (continentTotals.Asie / 1000000000).toFixed(1);

   // Mise à jour du texte HTML existant si besoin
   if (statDomestic) statDomestic.innerText = vizData.avgDomestic;

   // Préparation du Top 4 Genres (Popcorn)
   const sortedGenres = Object.values(genreStats)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 4);

   updatePopcornUI(sortedGenres);

   console.log("Optimisation : Données traitées en un seul passage.");
}

function updatePopcornUI(genres) {
   // Calculer le revenu max pour l'échelle (le premier est le plus grand car trié)
   const maxRevenue = genres.length > 0 ? genres[0].totalRevenue : 1;

   // Cibles : Les bandes rouges du motif (Rectangle 3, 5, 7, 9 de gauche à droite)
   // Nous utilisons les IDs des groupes SVG existants
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
         // Calcul du centre approximatif pour le placement
         // On cherche le polygone enfant
         const polygon = rectGroup.querySelector('polygon');
         if (polygon) {

            // Préparation Animation Bande
            polygon.classList.add('popcorn-stripe');

            // Calcul de l'échelle dynamique
            const scaleFactor = (genre.totalRevenue / maxRevenue);
            polygon.setAttribute('data-target-scale', scaleFactor.toFixed(3));
            // Origin au centre bas du bounding box du polygone pour qu'il "pousse" vers le haut
            // Nota: TransformOrigin SVG est complexe. Anime.js gère bien si on définit en CSS ou style.
            // On va essayer de définir via style, mais il faut les coords du center bottom.

            // On a besoin des BBox pour bien placer l'origin. 
            // Ici on a des points bruts.
            const points = polygon.getAttribute('points').trim().split(/\s+/).map(Number);
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

            // Les points sont [x, y, x, y...]
            for (let i = 0; i < points.length; i += 2) {
               const x = points[i];
               const y = points[i + 1];
               if (x < minX) minX = x;
               if (x > maxX) maxX = x;
               if (y < minY) minY = y;
               if (y > maxY) maxY = y;
            }
            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;
            // const bottomY = maxY; // Le bas du rectangle (pas strictement utilisé si on fait center bottom CSS)

            // Nous allons setter l'origin via style pour que le scaleY parte du bas
            // Problème : SVG transform-origin est relatif au viewport user space par défaut.
            // "center bottom" en keywords CSS marche souvent bien même en SVG moderne.
            polygon.style.transformOrigin = "center bottom";
            polygon.style.transformBox = "fill-box"; // Important pour que center bottom soit relatif au path

            // État initial (caché)
            polygon.style.opacity = "0";
            polygon.style.transform = "scaleY(0)";

            // Création du texte
            const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
            textEl.classList.add('popcorn-text'); // Ajout pour ciblage animation
            textEl.setAttribute("fill", "rgba(255, 255, 255, 0.9)");
            textEl.setAttribute("text-anchor", "middle");
            textEl.setAttribute("font-family", "'Outfit', sans-serif");
            textEl.setAttribute("font-size", "28"); // Taille visible
            textEl.setAttribute("font-weight", "600");

            // Rotation pour suivre la bande (lecture bas vers haut)
            textEl.setAttribute("transform", `translate(${centerX}, ${centerY}) rotate(${config.rotation})`);

            textEl.style.pointerEvents = "none";
            textEl.style.textShadow = "0px 2px 4px rgba(0,0,0,0.3)";

            // Styles initiaux pour l'animation (sera animé par JS)
            textEl.style.opacity = "0";

            // Formatage: Genre • Titre • $Revenus
            // "Au dessus" = Fin de la chaine (Haut)
            const revenueBillions = (genre.totalRevenue / 1000000000).toFixed(1) + " Mrd";
            const fullString = `${genre.name.toUpperCase()}  •  ${genre.topMovie.title}  •  $${revenueBillions}`;

            textEl.textContent = fullString;

            rectGroup.appendChild(textEl);
         }
      }
   });
}

// Données calculées pour la visualisation
let vizData = {
   totalRevenue: 0,
   avgDomestic: 0,
   avgForeign: 0,
   actionRevenue: 0,
   avgRating: 0,
   continents: {
      "Amerique": 0,
      "Europe": 0,
      "Asie": 0
   }
};

// Animation du titre H1
function initTitleAnimation() {
   const titleElement = document.querySelector('h1');
   if (titleElement) {
      console.log("Titre trouvé, initialisation de l'animation V4...");

      // Cible le conteneur de texte
      const textContainer = titleElement.querySelector('span') || titleElement;

      // Séparer le texte en lettres
      const text = textContainer.textContent;
      textContainer.innerHTML = '';

      for (let char of text) {
         const span = document.createElement('span');
         span.textContent = char === ' ' ? '\u00A0' : char;
         span.className = 'letter';
         textContainer.appendChild(span);
      }

      // La syntaxe Timeline V4 utilise createTimeline
      const tl = createTimeline({ loop: true });

      tl.add(textContainer.querySelectorAll('.letter'), {
         translateY: ["1.1em", 0],
         translateZ: 0,
         duration: 750,
         delay: (el, i) => 50 * i
      });

      tl.add(titleElement, {
         duration: 1000,
         easing: "easeOutExpo",
         delay: 1000
      });
   }
}

function updateViz(stepIndex) {
   if (stepIndex === currentStep) return;
   currentStep = stepIndex;

   // État global du viewBox pour l'animation fluide
   // On stocke l'état actuel ici pour qu'Anime.js puisse partir de ces valeurs
   if (!window.currentViewBox) {
      window.currentViewBox = { x: 0, y: 0, w: 800, h: 600 };
   }

   const vizElement = document.getElementById('viz');
   let targetPath = "";
   // Cibles pour le viewBox (x, y, width, height)
   let targetVB = { x: 0, y: 0, w: 800, h: 600 };
   let labelText = "";
   let color = "#e50914";

   switch (stepIndex) {
      case 1: // Intro + Globe
         vizPath.style.opacity = 0;
         globeContainer.style.opacity = 1;

         // Labels Globe UI
         if (labelGlobal) {
            labelGlobal.style.opacity = 1;
            labelGlobal.textContent = `Box Office Mondial : $${vizData.totalRevenue} Milliards`;
         }

         vizLabel.style.display = "none";

         targetPath = "";
         targetVB = { x: 0, y: 0, w: 800, h: 600 };
         color = "#e50914";
         break;
      case 2: // Star Wars
         if (labelGlobal) labelGlobal.textContent = "";
         if (labelContinent) labelContinent.style.opacity = 0;
         vizLabel.style.display = "block";

         targetPath = pathStarWars;
         targetVB = { x: 0, y: 0, w: 50, h: 50 };
         labelText = `USA: ${vizData.avgDomestic}%  vs  Monde: ${vizData.avgForeign}%`;
         color = "#f5c518";
         break;
      case 3: // Wolverine
         targetPath = pathWolverine;
         targetVB = { x: 0, y: 0, w: 512, h: 512 };
         labelText = `Action & Aventure : $${vizData.actionRevenue} Mrd`;
         color = "#221f1f";
         break;
      case 4: // Notes
         targetPath = pathStar;
         targetVB = { x: 0, y: 0, w: 800, h: 600 };
         labelText = `Note Moyenne IMDb : ${vizData.avgRating}/10`;
         color = "#e50914";
         break;
      default:
         targetPath = "";
         targetVB = { x: 0, y: 0, w: 800, h: 600 };
   }

   // Gestion visibilité Globe vs Path/Popcorn
   if (stepIndex !== 1) {
      globeContainer.style.opacity = 0;
   }

   const popcornContainer = document.getElementById('popcorn-container');
   if (popcornContainer) {
      if (stepIndex === 3) { // STEP 3: Popcorn Display
         popcornContainer.style.opacity = 1;

         // Animation du texte Popcorn (si pas déjà joué récemment ?)
         // On relance l'animation à chaque entrée pour l'effet wow

         // 1. Les bandes rouges poussent (Scale Y)
         animate('.popcorn-stripe', {
            scaleY: (el) => [0, el.getAttribute('data-target-scale') || 1],
            opacity: [0, 1],
            easing: 'easeOutExpo',
            duration: 800,
            delay: stagger(100)
         });

         // 2. Le texte apparait ensuite
         animate('.popcorn-text', {
            translateY: [20, 0],
            opacity: [0, 1],
            delay: stagger(100, { start: 300 }), // Petit délai après les bandes
            duration: 800,
            easing: 'easeOutExpo'
         });

      } else {
         popcornContainer.style.opacity = 0;
      }
   }

   // 1. Gestion Opacité / Morphing
   const isGlobeStep = (stepIndex === 1);

   // Si on va vers le globe, on fade out le path SVG
   if (isGlobeStep) {
      animate('#morph-path', {
         opacity: 0,
         duration: 500,
         easing: 'easeOutQuad'
      });
      // Le globe apparaît (géré au dessus par globeContainer.style.opacity = 1)
   } else {
      // Si on vient d'une autre étape, on fade out, sauf si step 3 (Popcorn prend le relais)
      // Pour le step 3, on peut masquer le path SVG standard pour éviter superposition inutile

      let finalOpacity = 1;
      if (stepIndex === 3) finalOpacity = 0; // Masquer la forme abstraite si on voit le Popcorn

      animate('#morph-path', {
         opacity: 0,
         duration: 200,
         easing: 'easeOutQuad',
         complete: () => {
            // Changement du chemin & couleur
            if (vizPath && targetPath) {
               vizPath.setAttribute('d', targetPath);
               vizPath.setAttribute('fill', color);
            }

            // Fade In (Si pas step 3)
            if (finalOpacity > 0) {
               animate('#morph-path', {
                  opacity: finalOpacity,
                  duration: 400,
                  easing: 'easeInQuad'
               });
            }
         }
      });
   }

   // 2. Animation du viewBox (Via Proxy Object)
   // Anime.js anime les propriétés de cet objet
   // Si step 3, on ignore peut-être ce zoom pour laisser le popcorn static
   if (stepIndex !== 3) {
      animate(window.currentViewBox, {
         x: targetVB.x,
         y: targetVB.y,
         w: targetVB.w,
         h: targetVB.h,
         duration: 1500,
         easing: 'easeInOutQuad',
         onUpdate: () => {
            const vbString = `${window.currentViewBox.x} ${window.currentViewBox.y} ${window.currentViewBox.w} ${window.currentViewBox.h}`;
            vizElement.setAttribute("viewBox", vbString);
         }
      });
   }

   console.log(`Step ${stepIndex}: Morphing to`, targetPath.substring(0, 20) + "...", "ViewBox target:", targetVB);

   // Mise à jour de l'étiquette standard
   if (stepIndex !== 1 && stepIndex !== 3) {
      vizLabel.textContent = labelText;
      vizLabel.style.opacity = 0;
      animate('#viz-label', {
         opacity: 1,
         easing: 'linear',
         duration: 500,
         delay: 500
      });
   } else {
      vizLabel.textContent = ""; // Pas de label texte standard pour le step 3
   }
}

function setupObserver() {
   const steps = document.querySelectorAll('.step');

   const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
         if (entry.isIntersecting) {
            // Ajouter la classe active
            document.querySelectorAll('.step.active').forEach(s => s.classList.remove('active'));
            entry.target.classList.add('active');

            const stepNum = parseInt(entry.target.getAttribute('data-step'));
            updateViz(stepNum);
         }
      });
   }, {
      threshold: 0.6 // Déclencher lorsque 60% de l'élément est visible
   });

   steps.forEach(step => observer.observe(step));
}

// --- Globe Logic ---

function initGlobe() {
   let width = 0;
   const onResize = () => width = globeContainer.offsetWidth;
   window.addEventListener('resize', onResize);
   onResize();

   globe = createGlobe(globeCanvas, {
      devicePixelRatio: 2,
      width: 600 * 2,
      height: 600 * 2,
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
         // Gestion Rotation & Physique
         if (pointerInteracting !== null) {
            // Si on grab, le curseur contrôle direct la rotation (via pointermove qui update phi)
            // On ne fait rien ici sur phi
         } else {
            // Si on ne grab pas : Inertie ou Auto-rotation

            if (isHoveringGlobe) {
               // Pause : On freine fort
               rotationVelocity *= 0.9;
            } else {
               // Pas de hover : On laisse l'inertie ou on reprend la vitesse de croisière
               if (rotationVelocity > 0.005) {
                  rotationVelocity *= 0.95; // On ralentit l'élan
               } else if (rotationVelocity < 0.005) {
                  // On accélère doucement vers 0.005 (si on est allé en arrière ou arrété)
                  rotationVelocity += 0.0005;
                  // Cap à 0.005
                  if (rotationVelocity > 0.005) rotationVelocity = 0.005;
               }
            }
            phi += rotationVelocity;
         }

         state.phi = phi;
         state.theta = theta;
         state.width = width * 2;
         state.height = width * 2;

         // Gestion des marqueurs (Highlights Néon)
         if (currentFocus && CONTINENT_DOTS[currentFocus]) {
            // On génère des marqueurs pour chaque point du "nuage"
            state.markers = CONTINENT_DOTS[currentFocus].map(coords => ({
               location: coords,
               size: 0.05 // Taille des points néon
            }));
         } else {
            state.markers = [];
         }
      }
   });

   // Events Highlight & Tooltip
   globeContainer.addEventListener('pointerenter', () => {
      isHoveringGlobe = true;
   });

   globeContainer.addEventListener('pointerleave', () => {
      isHoveringGlobe = false;
      currentFocus = null;
      if (labelContinent) labelContinent.style.opacity = 0;
   });

   globeContainer.addEventListener('pointerdown', (e) => {
      pointerInteracting = e.clientX;
      pointerCurrentX = e.clientX;
      globeContainer.style.cursor = 'grabbing';
   });

   window.addEventListener('pointerup', () => {
      pointerInteracting = null;
      globeContainer.style.cursor = 'grab';
   });

   globeContainer.addEventListener('pointermove', (e) => {
      // 1. Drag Logic
      if (pointerInteracting !== null) {
         const delta = e.clientX - pointerCurrentX;
         pointerCurrentX = e.clientX;

         // Sensibilité de rotation
         const speed = 0.005;
         phi += delta * speed;

         // On capture l'inertie pour le lâcher
         rotationVelocity = delta * speed;
      }

      // Hover Logic
      const rect = globeCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const r = rect.width / 2;

      // Check distance from center
      const dist = Math.sqrt((x - r) ** 2 + (y - r) ** 2);

      if (dist < r) {
         const globeX = (x - r) / r;
         let currentRotation = phi % (2 * Math.PI); // springPhi n'est plus utilisé
         if (currentRotation < 0) currentRotation += 2 * Math.PI;

         // 1. Longitude calculation (UNCHANGED)
         let mouseLonRad = -currentRotation + Math.asin(globeX);
         mouseLonRad = (mouseLonRad % (2 * Math.PI));
         if (mouseLonRad > Math.PI) mouseLonRad -= 2 * Math.PI;
         if (mouseLonRad < -Math.PI) mouseLonRad += 2 * Math.PI;
         const mouseLonDeg = mouseLonRad * (180 / Math.PI);

         // 2. Latitude calculation (NEW for Precision)
         // y is distance from center top-down. 
         // globeY goes from -1 (top) to 1 (bottom)
         const globeY = (y - (rect.height / 2)) / r;
         // Theta = 0 (Center/Equator in default Cobe view?) depends on implementation.
         // Usually center Y is equator if theta=0?
         // Asin gives angle from equator.
         // Note: Screen Y is positive downwards. Globe Lat is positive upwards.
         const mouseLatRad = -Math.asin(globeY); // Invert Y
         const mouseLatDeg = mouseLatRad * (180 / Math.PI);

         // Detection Continent Precise with Bounding Boxes
         let hovered = null;

         // Amerique: Lon ~ -130 to -30, Lat ~ -60 to 70
         if (mouseLonDeg > -130 && mouseLonDeg < -35 && mouseLatDeg > -55 && mouseLatDeg < 70) {
            hovered = "Amerique";
         }
         // Europe: Lon ~ -10 to 45, Lat ~ 35 to 70
         else if (mouseLonDeg > -10 && mouseLonDeg < 45 && mouseLatDeg > 35 && mouseLatDeg < 70) {
            hovered = "Europe";
         }
         // Asie (+Oceania): Lon ~ 60 to 180, Lat ~ -50 to 55
         else if (mouseLonDeg > 60 && mouseLonDeg < 170 && mouseLatDeg > -50 && mouseLatDeg < 55) {
            hovered = "Asie";
         }

         // On vérifie que vizData.continents[hovered] est défini (même si 0)
         if (hovered && vizData.continents[hovered] !== undefined) {
            if (currentFocus !== hovered && labelContinent) {
               currentFocus = hovered;
               labelContinent.innerHTML = `<strong>${hovered}</strong><br>$${vizData.continents[hovered]} Mrd`;
               labelContinent.style.opacity = 1;
            }

            // Mise à jour position Tooltip
            // On décale un peu pour ne pas être sous la souris
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
}

// Démarrer
init();
