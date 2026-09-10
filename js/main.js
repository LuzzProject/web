/* ============================================
   JS compartido — Luzz Project
   Se usa en index.html y en todas las páginas de /productos/.
   Cada bloque se protege por si la página actual no tiene esos
   elementos (ej: el hero-slideshow solo existe en el Home).
   ============================================ */

/* ---------- Menú mobile ---------- */
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
if (burger && mobileMenu) {
  burger.addEventListener('click', () => {
    burger.classList.toggle('open');
    mobileMenu.classList.toggle('open');
  });
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      burger.classList.remove('open');
      mobileMenu.classList.remove('open');
    });
  });
}

/* ---------- Acordeón de PRODUCTOS dentro del menú mobile ----------
   Tocar "Productos" despliega/cierra la lista de productos, sin
   navegar (a diferencia del resto de los links del menú mobile). */
document.querySelectorAll('.mobile-menu-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.mobile-menu-item');
    if (!item) return;
    const isOpen = item.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(isOpen));
  });
});

/* ---------- Hero slideshow (loop infinito + arrastre con el dedo) ----------
   Solo corre si la página actual tiene un hero-slideshow (hoy, solo el Home). */
const heroEl = document.getElementById('hero');
const track = document.getElementById('heroTrack');
const dotsWrap = document.getElementById('heroDots');

if (heroEl && track && dotsWrap) {
  const realSlides = [...track.children];
  const total = realSlides.length;
  let autoplayTimer = null;

  // clones para el efecto de loop infinito: [clon-último, real-0, real-1, ..., real-N, clon-primero]
  const firstClone = realSlides[0].cloneNode(true);
  const lastClone = realSlides[total - 1].cloneNode(true);
  track.appendChild(firstClone);
  track.insertBefore(lastClone, realSlides[0]);

  let index = 1;          // arranca en el slide real 0, que ahora está en la posición 1
  let containerWidth = heroEl.clientWidth;
  const TRANSITION = 'transform 2.1s cubic-bezier(0.76, 0, 0.24, 1)';
  const DRAG_SNAP_TRANSITION = 'transform 0.2s ease-out'; // "enganche" rápido al soltar el drag

  function setPosition(px, transitionValue){
    track.style.transition = transitionValue;
    track.style.transform = `translateX(${px}px)`;
  }
  setPosition(-index * containerWidth, 'none');

  for(let i=0; i<total; i++){
    const d = document.createElement('span');
    if(i===0) d.classList.add('active');
    dotsWrap.appendChild(d);
  }
  const dots = dotsWrap.children;

  function updateDots(){
    const realIndex = ((index - 1) + total) % total;
    [...dots].forEach((d,i) => d.classList.toggle('active', i === realIndex));
  }

  function goTo(newIndex, transitionValue = TRANSITION){
    index = newIndex;
    setPosition(-index * containerWidth, transitionValue);
    updateDots();
  }

  function next(){ goTo(index + 1); }
  function prev(){ goTo(index - 1); }

  // Al terminar la transición, si estamos parados sobre un clon, saltamos
  // sin animación al slide real equivalente. Esto ocurre ya fuera de pantalla.
  track.addEventListener('transitionend', () => {
    if(index === total + 1){        // llegó al clon del primero
      goTo(1, 'none');
    } else if(index === 0){         // llegó al clon del último
      goTo(total, 'none');
    }
  });

  window.addEventListener('resize', () => {
    containerWidth = heroEl.clientWidth;
    setPosition(-index * containerWidth, 'none'); // reacomoda sin animar, sin saltos visibles
  });

  function startAutoplay(){
    autoplayTimer = setInterval(next, 5000);
  }
  startAutoplay();

  function stopAutoplay(){
    clearInterval(autoplayTimer);
  }

  const zoneLeft = document.getElementById('zoneLeft');
  const zoneRight = document.getElementById('zoneRight');
  if (zoneLeft) zoneLeft.addEventListener('click', () => { prev(); stopAutoplay(); });
  if (zoneRight) zoneRight.addEventListener('click', () => { next(); stopAutoplay(); });

  /* ---------- Arrastre con el dedo: la foto sigue al dedo 1:1, y al soltar
     "engancha" (con la misma transición) al slide más cercano ---------- */
  let dragging = false;
  let dragDecided = false; // ya determinamos si es un gesto horizontal o vertical
  let startX = 0, startY = 0, lastX = 0;
  let dragStartPx = 0;

  function currentTranslateX(){
    const m = new DOMMatrixReadOnly(getComputedStyle(track).transform);
    return m.m41; // componente de traslación X de la matriz
  }

  heroEl.addEventListener('touchstart', (e) => {
    stopAutoplay();
    startX = lastX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    dragStartPx = currentTranslateX();
    dragging = true;
    dragDecided = false;
    track.style.transition = 'none'; // sigue al dedo sin demora
  }, { passive: true });

  heroEl.addEventListener('touchmove', (e) => {
    if(!dragging) return;
    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;
    const dx = x - startX;
    const dy = y - startY;

    if(!dragDecided){
      if(Math.abs(dx) < 10 && Math.abs(dy) < 10) return; // aún no se sabe la dirección
      dragDecided = true;
      if(Math.abs(dy) > Math.abs(dx)){
        dragging = false; // gesto vertical: se lo dejamos al scroll de la página
        track.style.transition = '';
        return;
      }
    }

    e.preventDefault(); // gesto horizontal: no scrollear la página mientras se arrastra
    lastX = x;
    track.style.transform = `translateX(${dragStartPx + dx}px)`;
  }, { passive: false });

  heroEl.addEventListener('touchend', () => {
    if(!dragging) return;
    dragging = false;
    const dx = lastX - startX;
    const threshold = containerWidth * 0.25; // hay que arrastrar 25% del ancho para que "enganche"
    if(dx <= -threshold){
      goTo(index + 1, DRAG_SNAP_TRANSITION); // engancha con la siguiente, rápido (0.2s)
    } else if(dx >= threshold){
      goTo(index - 1, DRAG_SNAP_TRANSITION); // engancha con la anterior, rápido (0.2s)
    } else {
      goTo(index, DRAG_SNAP_TRANSITION); // no llegó al umbral: vuelve magnéticamente a la foto actual
    }
  });
}

/* ---------- Fade-in atado al scroll ----------
   progreso 0 = el elemento recién empieza a entrar por abajo de la pantalla
   progreso 1 = el centro del elemento llegó al centro de la pantalla
   (se aplica a cualquier página: si no hay elementos que matcheen, no hace nada) */
const revealItems = document.querySelectorAll(
  '.logo-section .star, .logo-section .fade-text, section.grid-section > h2, section.grid-section .item, footer.contact .contact-block > a, [data-reveal]'
);

function updateReveal(){
  const vh = window.innerHeight;
  revealItems.forEach(el => {
    const rect = el.getBoundingClientRect();
    const elCenter = rect.top + rect.height / 2;
    const startCenter = vh + rect.height / 2; // el objeto recién asoma por abajo
    // Punto de llegada (100%): todo llega al 100% al recorrer el 25% de la altura de pantalla.
    const endFraction = el.dataset.revealEnd ? parseFloat(el.dataset.revealEnd) : 0.25;
    const endCenter = startCenter - (endFraction * vh);
    let progress = (startCenter - elCenter) / (startCenter - endCenter);
    progress = Math.max(0, Math.min(1, progress));
    el.style.opacity = progress;
    el.style.transform = `translateY(${(1 - progress) * 18}px)`;
  });
}

let tickScheduled = false;
function onScrollOrResize(){
  if(!tickScheduled){
    tickScheduled = true;
    requestAnimationFrame(() => {
      updateReveal();
      tickScheduled = false;
    });
  }
}
window.addEventListener('scroll', onScrollOrResize, { passive: true });
window.addEventListener('resize', onScrollOrResize);
updateReveal(); // estado inicial al cargar

/* ---------- Feedback al tap en touch (sin hover) ---------- */
document.querySelectorAll('.item').forEach(item => {
  item.addEventListener('touchstart', () => {
    item.classList.add('tap-active');
    setTimeout(() => item.classList.remove('tap-active'), 350);
  }, { passive: true });
});
