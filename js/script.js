// Ce fichier importe les petits modules spécialisés (anime.js, globe 3D)

import { animate, createTimeline, createDrawable } from 'https://esm.sh/animejs@4.2.2';
import { pathStarWars, pathStar, pathWolverineClaws, pathWolverineMask } from './constants.js';
import { vizData, loadData } from './data.js';
import { initGlobeController } from './globe.js';
import { updatePopcornUI, animatePopcorn } from './popcorn.js';
import { updateRatingsUI, animateRatings } from './ratings.js';
import { initLightsaberStep, clearLightsaberStep, primeAudio } from './lightsaber.js';
import { initWolverineUI } from './wolverine.js';

// Récupération des éléments HTML (DOM) dont on va avoir besoin
const experienceOverlay = document.getElementById('experience-overlay');
const btnStart = document.getElementById('btn-start-experience');
const vizPath = document.getElementById('morph-path');
const vizLabel = document.getElementById('viz-label');
const statDomestic = document.getElementById('stat-domestic');
const globeCanvas = document.getElementById('globe-canvas');
const globeContainer = document.getElementById('globe-container');
const labelContinent = document.getElementById('label-continent');
const labelGlobal = document.getElementById('label-global');
const popcornContainer = document.getElementById('popcorn-container');

// Variable pour suivre à quelle étape du scroll on est (0 à 5)
let currentStep = 0;

// La fonction qui lance tout au chargement de la page
async function init() {
   try {
      // On va chercher les données dans le JSON et on fait les calculs
      await loadData();

      // On met à jour les premiers textes et le graphique popcorn (qui attend en coulisses)
      if (statDomestic) statDomestic.innerText = vizData.avgDomestic;
      updatePopcornUI(vizData.topGenres);

      // On initialise les composants visuels
      vizPath.setAttribute('d', ""); // On vide le path SVG au début (car c'est le globe qui est là)
      setupObserver(); // On lance l'écouteur de scroll
      initGlobeController(globeCanvas, globeContainer, labelContinent, vizData); // On allume le globe
      initWolverineUI(); // On prépare le calque Wolverine
      initHeroTitleAnimation(); // L'animation du titre Hero
      initSplashTitleAnimation(); // L'animation du titre de l'overlay

      // Gestion de l'overlay de démarrage
      if (btnStart && experienceOverlay) {
         btnStart.addEventListener('click', () => {
            // On mémorise que l'expérience a commencé
            sessionStorage.setItem('experienceStarted', 'true');

            // On déverrouille l'audio
            primeAudio();

            // On lance l'animation de sortie
            experienceOverlay.style.opacity = '0';
            experienceOverlay.style.visibility = 'hidden';

            // On autorise le scroll
            document.body.classList.add('experience-started');
         });
      }

   } catch (error) {
      console.error("L'initialisation a planté :", error);
   }
}

// Animation du titre de l'écran d'accueil
function initSplashTitleAnimation() {
   const splashTitle = document.getElementById('titleFirst');
   if (splashTitle) {
      const text = splashTitle.textContent;
      splashTitle.innerHTML = '';

      // On découpe le texte en lettres
      for (let char of text) {
         const span = document.createElement('span');
         span.textContent = char === ' ' ? '\u00A0' : char;
         span.style.display = 'inline-block';
         span.style.opacity = '0';
         splashTitle.appendChild(span);
      }

      animate(splashTitle.querySelectorAll('span'), {
         opacity: [0, 1],
         translateY: [20, 0],
         translateZ: 0,
         duration: 1000,
         easing: 'easeOutExpo',
         delay: (el, i) => 700 + (30 * i) // Petit délai pour laisser l'image de fond apparaître
      });
   }
}

// Animation du titre H1 de l'accueil
function initHeroTitleAnimation() {
   // On cible spécifiquement le H1 de la section hero
   const titleElement = document.querySelector('.hero h1');
   if (titleElement) {
      const textContainer = titleElement.querySelector('span') || titleElement;
      const text = textContainer.textContent;
      textContainer.innerHTML = '';

      for (let char of text) {
         const span = document.createElement('span');
         span.textContent = char === ' ' ? '\u00A0' : char;
         span.className = 'letter';
         textContainer.appendChild(span);
      }

      const tl = createTimeline({ loop: true, alternate: true });
      tl.add(textContainer.querySelectorAll('.letter'), {
         translateY: ["1.1em", 0],
         translateZ: 0,
         duration: 750,
         delay: (el, i) => 50 * i
      });
      tl.add(titleElement, {
         duration: 100,
         easing: "easeOutExpo",
         delay: 100
      });
   }
}

// Cette fonction gère les transitions quand on change de section au scroll
function updateViz(stepIndex) {
   // Si on est déjà sur l'étape, on ne fait rien
   if (stepIndex === currentStep) return;
   currentStep = stepIndex;

   // On initialise l'objet viewBox qui gère le "zoom" de la zone SVG
   if (!window.currentViewBox) {
      window.currentViewBox = { x: 0, y: 0, w: 800, h: 600 };
   }

   const vizElement = document.getElementById('viz');
   let targetPath = "";
   let targetVB = { x: 0, y: 0, w: 800, h: 600 };
   let labelText = "";
   let color = "#e50914";

   // Configuration de chaque étape (forme, texte, couleur, zoom)
   switch (stepIndex) {
      case 1: // Étape Globe (Intro)
         clearLightsaberStep();
         vizPath.style.opacity = 0;
         if (labelGlobal) {
            labelGlobal.style.opacity = 1;
            labelGlobal.textContent = `Box Office Mondial : $${vizData.totalRevenue} Milliards`;
         }
         vizLabel.style.display = "none";
         targetPath = "";
         targetVB = { x: 0, y: 0, w: 800, h: 600 };
         color = "#e50914";
         break;

      case 2: // Étape Sabre Laser (USA vs Monde)
         if (labelGlobal) labelGlobal.textContent = "";
         if (labelContinent) labelContinent.style.opacity = 0;
         vizLabel.style.display = "block";
         targetPath = "";
         targetVB = { x: 0, y: 0, w: 800, h: 600 };
         color = "#f5c518";

         // Affichage du sabre laser et du logo
         initLightsaberStep(vizData);
         break;

      case 3: // Étape Popcorn (Les Genres)
         clearLightsaberStep();
         targetPath = ""; // Pas de forme SVG ici, c'est le cornet qui s'affiche
         targetVB = { x: 0, y: 0, w: 800, h: 600 };
         labelText = `Action & Aventure : $${vizData.actionRevenue} Mrd`;
         color = "#221f1f";
         break;

      case 4: // Étape Étoile (Notes IMDb)
         clearLightsaberStep();
         targetPath = pathStar;
         targetVB = { x: 0, y: 0, w: 800, h: 600 };
         labelText = `Note Moyenne IMDb : ${vizData.avgRating}/10`;
         color = "#e50914";

         // Synchronisation : on donne à vizPath la forme de l'étoile en coulisses
         // pour que le prochain morphing (vers Wolverine) parte du bon endroit.
         vizPath.setAttribute('d', pathStar);
         vizPath.setAttribute('fill', color);

         // Affichage de la note et des films
         updateRatingsUI(vizData.avgRating, vizData.topRatedFilms);
         break;
      case 5: // Étape Wolverine (Fin)
         clearLightsaberStep();
         targetPath = ""; // On n'utilise plus vizPath ici
         targetVB = { x: 0, y: 0, w: 800, h: 600 };
         labelText = "Ciné-Mutant : X-Men & Logan";
         color = "#ffca28";
         break;
   }

   // Visibilité du Globe : on l'allume seulement à l'étape 1
   if (stepIndex !== 1) {
      globeContainer.style.opacity = 0;
      globeContainer.style.pointerEvents = "none";
   } else {
      globeContainer.style.opacity = 1;
      globeContainer.style.pointerEvents = "auto";
   }

   // Visibilité du Cornet de Popcorn : seulement à l'étape 3
   if (popcornContainer) {
      if (stepIndex === 3) {
         popcornContainer.style.opacity = 1;
         animatePopcorn(); // On lance l'animation de croissance
      } else {
         popcornContainer.style.opacity = 0;
      }
   }

   // Visibilité du Ratings Layer (Étoile) : seulement à l'étape 4
   const ratingsLayer = document.getElementById('ratings-layer');
   if (ratingsLayer) {
      if (stepIndex === 4) {
         ratingsLayer.style.opacity = 1;
         ratingsLayer.style.pointerEvents = "auto";
         animateRatings(vizData.avgRating);
      } else {
         ratingsLayer.style.opacity = 0;
         ratingsLayer.style.pointerEvents = "none";
      }
   }

   // Visibilité du Wolverine Layer : seulement à l'étape 5
   const wolverineLayer = document.getElementById('wolverine-layer');
   if (wolverineLayer) {
      if (stepIndex === 5) {
         wolverineLayer.style.opacity = 1;
         wolverineLayer.style.pointerEvents = "auto";
      } else {
         wolverineLayer.style.opacity = 0;
         wolverineLayer.style.pointerEvents = "none";
      }
   }

   // Logique de Morphing du chemin SVG
   // On cache le morph-path si on est sur les étapes avec des graphiques complexes
   const hideMorphPath = (stepIndex === 1 || stepIndex === 2 || stepIndex === 3 || stepIndex === 4);
   if (hideMorphPath) {
      animate(vizPath, { opacity: 0, duration: 500, easing: 'linear' });
      // Reset cursor
      vizPath.style.cursor = "default";
   } else {
      let finalOpacity = 1;

      // Si le path est déjà invisible (opacity < 0.1) on change direct le path
      // Sinon on fait un fondu sortant on change et on fait un fondu entrant
      const currentOpacity = parseFloat(window.getComputedStyle(vizPath).opacity);

      // On désactive le morphing complexe pour l'étape 5 au profit d'un fondu
      if (stepIndex === 5) {
         animate(vizPath, { opacity: 0, duration: 400, easing: 'linear' });
      }
      else if ((stepIndex === 4 && currentOpacity > 0.5)) {
         animate(vizPath, {
            d: targetPath,
            fill: color,
            opacity: 1,
            duration: 1000,
            easing: 'easeInOutQuad'
         });
      }

      else if (currentOpacity < 0.1) {
         vizPath.style.filter = 'none';
         if (targetPath) {
            vizPath.setAttribute('d', targetPath);
            vizPath.setAttribute('fill', color);
         }
         animate(vizPath, { opacity: finalOpacity, duration: 400, easing: 'linear' });
      } else {
         animate(vizPath, {
            opacity: 0,
            duration: 200,
            easing: 'linear',
            complete: () => {
               if (targetPath) {
                  vizPath.setAttribute('d', targetPath);
                  vizPath.setAttribute('fill', color);
               }
               animate(vizPath, { opacity: finalOpacity, duration: 400, easing: 'linear' });
            }
         });
      }
   }

   // Logique de Zoom (ViewBox)
   if (stepIndex !== 3) {
      // Ajustement pour mobile : on "zoom" en rognant les marges latérales inutiles
      // et on centre spécifiquement chaque graphique
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
         // Largeur visible de 600unités -> Zoom ~1.33x
         // On ajuste X et Y pour centrer l'élément principal
         let mobileX = 100;
         let mobileY = 0;

         if (stepIndex === 2) {
            // Sabre Laser : centre approx à x=450 -> offset x=150, y=120
            mobileX = 150;
            mobileY = 120;
         } else if (stepIndex === 4) {
            // Étoile
            mobileX = 100;
            mobileY = 50;
         } else if (stepIndex === 5) {
            // Caméra : centre approx à x=375 -> offset x=75, y=50
            mobileX = 75;
            mobileY = 50;
         }

         targetVB = { x: mobileX, y: mobileY, w: 600, h: 600 };
      }

      animate(window.currentViewBox, {
         x: targetVB.x, y: targetVB.y, w: targetVB.w, h: targetVB.h,
         duration: 1000, easing: 'linear',
         onUpdate: () => {
            const vbString = `${window.currentViewBox.x} ${window.currentViewBox.y} ${window.currentViewBox.w} ${window.currentViewBox.h}`;
            vizElement.setAttribute("viewBox", vbString);
         }
      });
   }

   // Mise à jour de l'étiquette texte
   if (stepIndex !== 1 && stepIndex !== 3) {
      vizLabel.textContent = labelText;
      vizLabel.style.opacity = 0;
      animate(vizLabel, { opacity: 1, duration: 500, delay: 500 });
   } else {
      vizLabel.textContent = "";
   }
}

// L'écouteur qui détecte quand une section (".step") passe devant l'écran
function setupObserver() {
   const steps = document.querySelectorAll('.step');
   const observerOptions = {
      threshold: 0.6,
      rootMargin: "0px"
   };

   const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
         if (entry.isIntersecting) {
            document.querySelectorAll('.step.active').forEach(s => s.classList.remove('active'));
            entry.target.classList.add('active');

            const stepNum = parseInt(entry.target.getAttribute('data-step'));
            updateViz(stepNum);
         }
      });
   }, observerOptions);

   steps.forEach(step => observer.observe(step));
}

init();
