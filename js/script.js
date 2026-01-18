import { animate, createTimeline } from 'https://esm.sh/animejs@4.2.2';
import { pathStarWars, pathStar } from './constants.js';
import { vizData, loadData } from './data.js';
import { initGlobeController } from './globe.js';
import { updatePopcornUI, animatePopcorn } from './popcorn.js';

// DOM References
const vizPath = document.getElementById('morph-path');
const vizLabel = document.getElementById('viz-label');
const statDomestic = document.getElementById('stat-domestic');
const globeCanvas = document.getElementById('globe-canvas');
const globeContainer = document.getElementById('globe-container');
const labelContinent = document.getElementById('label-continent');
const labelGlobal = document.getElementById('label-global');
const popcornContainer = document.getElementById('popcorn-container');

let currentStep = 0;

async function init() {
   try {
      // 1. Load and process data
      await loadData();

      // 2. Update UI with initial data
      if (statDomestic) statDomestic.innerText = vizData.avgDomestic;
      updatePopcornUI(vizData.topGenres);

      // 3. Initialize Visuals
      vizPath.setAttribute('d', "");
      setupObserver();
      initGlobeController(globeCanvas, globeContainer, labelContinent, vizData);
      initTitleAnimation();

   } catch (error) {
      console.error("Initialization failed:", error);
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

function updateViz(stepIndex) {
   if (stepIndex === currentStep) return;
   currentStep = stepIndex;

   if (!window.currentViewBox) {
      window.currentViewBox = { x: 0, y: 0, w: 800, h: 600 };
   }

   const vizElement = document.getElementById('viz');
   let targetPath = "";
   let targetVB = { x: 0, y: 0, w: 800, h: 600 };
   let labelText = "";
   let color = "#e50914";

   switch (stepIndex) {
      case 1: // Globe
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

      case 2: // Star Wars
         if (labelGlobal) labelGlobal.textContent = "";
         if (labelContinent) labelContinent.style.opacity = 0;
         vizLabel.style.display = "block";
         targetPath = pathStarWars;
         targetVB = { x: 0, y: 0, w: 50, h: 50 };
         labelText = `USA: ${vizData.avgDomestic}%  vs  Monde: ${vizData.avgForeign}%`;
         color = "#f5c518";
         break;

      case 3: // Popcorn
         targetPath = "";
         targetVB = { x: 0, y: 0, w: 800, h: 600 };
         labelText = `Action & Aventure : $${vizData.actionRevenue} Mrd`;
         color = "#221f1f";
         break;

      case 4: // Notes
         targetPath = pathStar;
         targetVB = { x: 0, y: 0, w: 800, h: 600 };
         labelText = `Note Moyenne IMDb : ${vizData.avgRating}/10`;
         color = "#e50914";
         break;
   }

   // visibility & pointer-events
   if (stepIndex !== 1) {
      globeContainer.style.opacity = 0;
      globeContainer.style.pointerEvents = "none";
   } else {
      globeContainer.style.opacity = 1;
      globeContainer.style.pointerEvents = "auto";
   }

   if (popcornContainer) {
      if (stepIndex === 3) {
         popcornContainer.style.opacity = 1;
         animatePopcorn();
      } else {
         popcornContainer.style.opacity = 0;
      }
   }

   // Path Morphing logic
   const isGlobeStep = (stepIndex === 1);
   if (isGlobeStep) {
      animate('#morph-path', { opacity: 0, duration: 500, easing: 'easeOutQuad' });
   } else {
      let finalOpacity = (stepIndex === 3) ? 0 : 1;
      animate('#morph-path', {
         opacity: 0,
         duration: 200,
         easing: 'easeOutQuad',
         complete: () => {
            if (vizPath && targetPath) {
               vizPath.setAttribute('d', targetPath);
               vizPath.setAttribute('fill', color);
            }
            if (finalOpacity > 0) {
               animate('#morph-path', { opacity: finalOpacity, duration: 400, easing: 'easeInQuad' });
            }
         }
      });
   }

   // ViewBox Zoom logic
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

   // Standard Label Update
   if (stepIndex !== 1 && stepIndex !== 3) {
      vizLabel.textContent = labelText;
      vizLabel.style.opacity = 0;
      animate('#viz-label', { opacity: 1, duration: 500, delay: 500 });
   } else {
      vizLabel.textContent = "";
   }
}

function setupObserver() {
   const steps = document.querySelectorAll('.step');
   const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
         if (entry.isIntersecting) {
            document.querySelectorAll('.step.active').forEach(s => s.classList.remove('active'));
            entry.target.classList.add('active');
            const stepNum = parseInt(entry.target.getAttribute('data-step'));
            updateViz(stepNum);
         }
      });
   }, { threshold: 0.6 });

   steps.forEach(step => observer.observe(step));
}

init();
