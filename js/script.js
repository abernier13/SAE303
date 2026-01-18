// Ce fichier importe les petits modules spécialisés (anime.js, globe 3D)

import { animate, createTimeline } from 'https://esm.sh/animejs@4.2.2';
import { pathStarWars, pathStar } from './constants.js';
import { vizData, loadData } from './data.js';
import { initGlobeController } from './globe.js';
import { updatePopcornUI, animatePopcorn } from './popcorn.js';

// Récupération des éléments HTML (DOM) dont on va avoir besoin
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
      // 1. On va chercher les données dans le JSON et on fait les calculs
      await loadData();

      // 2. On met à jour les premiers textes et le graphique popcorn (qui attend en coulisses)
      if (statDomestic) statDomestic.innerText = vizData.avgDomestic;
      updatePopcornUI(vizData.topGenres);

      // 3. On initialise les composants visuels
      vizPath.setAttribute('d', ""); // On vide le path SVG au début (car c'est le globe qui est là)
      setupObserver(); // On lance l'écouteur de scroll
      initGlobeController(globeCanvas, globeContainer, labelContinent, vizData); // On allume le globe
      initTitleAnimation(); // L'animation du titre qui défile

   } catch (error) {
      console.error("L'initialisation a planté :", error);
   }
}

// --- Animation Logic ---

function initTitleAnimation() {
   const titleElement = document.querySelector('h1');
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

// Cette fonction magique gère les transitions quand on change de section au scroll
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

      case 2: // Étape Star Wars (Domestic vs Foreign)
         if (labelGlobal) labelGlobal.textContent = "";
         if (labelContinent) labelContinent.style.opacity = 0;
         vizLabel.style.display = "block";
         targetPath = pathStarWars;
         targetVB = { x: 0, y: 0, w: 50, h: 50 }; // On zoome fort sur le logo
         labelText = `USA: ${vizData.avgDomestic}%  vs  Monde: ${vizData.avgForeign}%`;
         color = "#f5c518"; // Jaune Star Wars
         break;

      case 3: // Étape Popcorn (Les Genres)
         targetPath = ""; // Pas de forme SVG ici, c'est le cornet qui s'affiche
         targetVB = { x: 0, y: 0, w: 800, h: 600 };
         labelText = `Action & Aventure : $${vizData.actionRevenue} Mrd`;
         color = "#221f1f";
         break;

      case 4: // Étape Étoile (Notes IMDb)
         targetPath = pathStar;
         targetVB = { x: 0, y: 0, w: 800, h: 600 };
         labelText = `Note Moyenne IMDb : ${vizData.avgRating}/10`;
         color = "#e50914";
         break;
   }

   // 1. Visibilité du Globe : on l'allume seulement à l'étape 1
   if (stepIndex !== 1) {
      globeContainer.style.opacity = 0;
      globeContainer.style.pointerEvents = "none";
   } else {
      globeContainer.style.opacity = 1;
      globeContainer.style.pointerEvents = "auto";
   }

   // 2. Visibilité du Cornet de Popcorn : seulement à l'étape 3
   if (popcornContainer) {
      if (stepIndex === 3) {
         popcornContainer.style.opacity = 1;
         animatePopcorn(); // On lance l'animation de croissance
      } else {
         popcornContainer.style.opacity = 0;
      }
   }

   // 3. Logique de Morphing du chemin SVG (le fond rouge/noir qui change de forme)
   const isGlobeStep = (stepIndex === 1);
   if (isGlobeStep) {
      animate('#morph-path', { opacity: 0, duration: 500, easing: 'easeOutQuad' });
   } else {
      // Si on est à l'étape popcorn, on cache le morph par dessus
      let finalOpacity = (stepIndex === 3) ? 0 : 1;
      animate('#morph-path', {
         opacity: 0,
         duration: 200,
         easing: 'easeOutQuad',
         complete: () => {
            // Une fois qu'il est invisible, on change sa forme et sa couleur "en douce"
            if (vizPath && targetPath) {
               vizPath.setAttribute('d', targetPath);
               vizPath.setAttribute('fill', color);
            }
            // Et on le refait apparaître
            if (finalOpacity > 0) {
               animate('#morph-path', { opacity: finalOpacity, duration: 400, easing: 'easeInQuad' });
            }
         }
      });
   }

   // 4. Logique de Zoom (ViewBox) : on anime le rectangle de vue du SVG
   if (stepIndex !== 3) {
      animate(window.currentViewBox, {
         x: targetVB.x, y: targetVB.y, w: targetVB.w, h: targetVB.h,
         duration: 1500, easing: 'easeInOutQuad',
         onUpdate: () => {
            const vbString = `${window.currentViewBox.x} ${window.currentViewBox.y} ${window.currentViewBox.w} ${window.currentViewBox.h}`;
            vizElement.setAttribute("viewBox", vbString);
         }
      });
   }

   // 5. Mise à jour de l'étiquette texte en bas à gauche
   if (stepIndex !== 1 && stepIndex !== 3) {
      vizLabel.textContent = labelText;
      vizLabel.style.opacity = 0;
      animate('#viz-label', { opacity: 1, duration: 500, delay: 500 });
   } else {
      vizLabel.textContent = "";
   }
}

// L'écouteur qui détecte quand une section (".step") passe devant l'écran
function setupObserver() {
   const steps = document.querySelectorAll('.step');
   const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
         // Quand on voit au moins 60% d'un bloc de texte
         if (entry.isIntersecting) {
            // On enlève le style "actif" aux autres et on le met au nouveau
            document.querySelectorAll('.step.active').forEach(s => s.classList.remove('active'));
            entry.target.classList.add('active');

            // On récupère le numéro de l'étape et on lance la mise à jour visuelle
            const stepNum = parseInt(entry.target.getAttribute('data-step'));
            updateViz(stepNum);
         }
      });
   }, { threshold: 0.6 });

   steps.forEach(step => observer.observe(step));
}

init();
