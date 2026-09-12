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

/* ---------- Interlineado del eyebrow al pasar a 2 renglones ----------
   "EXPANDIENDO LOS LÍMITES DEL ARTE DIGITAL" usa el interlineado
   normal mientras entra en un renglón; en cuanto el ancho de pantalla
   lo obliga a partirse en 2 (o más), se le duplica el interlineado. */
const eyebrow = document.querySelector('.logo-section .eyebrow');
if (eyebrow) {
  function updateEyebrowSpacing(){
    const range = document.createRange();
    range.selectNodeContents(eyebrow);
    const lines = range.getClientRects().length;
    eyebrow.style.lineHeight = lines > 1 ? '1.54' : ''; /* 2.2 - 30% */
  }
  updateEyebrowSpacing();
  window.addEventListener('resize', updateEyebrowSpacing);
}

/* ---------- Feedback al tap en touch (sin hover) ---------- */
document.querySelectorAll('.item').forEach(item => {
  item.addEventListener('touchstart', () => {
    item.classList.add('tap-active');
    setTimeout(() => item.classList.remove('tap-active'), 350);
  }, { passive: true });
});

/* ---------- Loop infinito para carruseles con swipe ----------
   Mismo criterio que el hero del Home: se clona la primera y la
   última foto (a los costados de las reales) para que el swipe nunca
   choque contra un borde; al llegar a un clon, apenas se asienta el
   scroll, salta sin animación a la foto real equivalente, ya fuera de
   pantalla. Solo aplica donde la galería realmente funciona como
   carrusel horizontal (display:flex): duo-gallery lo es nada más que
   en celular (en desktop/tablet es grid, se ven todas las fotos
   juntas, no hay nada que loopear); el lightbox es carrusel en los 3
   formatos. Excepción: trio-gallery (Escultura, Arte Digital) queda
   afuera — sus fotos de ancho disparejo (angosta-ancha-angosta) no
   admiten el padding de centrado sin dejar un hueco negro/cortar la
   foto central, así que ahí el swipe sigue sin loop. */
function setupLoopingCarousel(gallery){
  if (gallery.classList.contains('trio-gallery')) return null;
  if (getComputedStyle(gallery).display !== 'flex') return null;
  const realItems = [...gallery.children];
  const total = realItems.length;
  if (total < 2) return null;

  const firstClone = realItems[0].cloneNode(true);
  const lastClone = realItems[total - 1].cloneNode(true);
  firstClone.setAttribute('aria-hidden', 'true');
  lastClone.setAttribute('aria-hidden', 'true');
  gallery.appendChild(firstClone);
  gallery.insertBefore(lastClone, realItems[0]);
  const allItems = [...gallery.children]; // [clon-último, real-0..N-1, clon-primero]

  // Si las fotos no ocupan todo el ancho del carrusel (ej: trio-gallery,
  // angosta-ancha-angosta), centrar la primera/última foto pide un
  // scroll que no entra dentro del ancho real de contenido — el
  // navegador lo recorta y nunca llega a centrar el clon, así que el
  // swipe jamás lo alcanza. Se agrega el padding que falte a cada
  // lado para que ese centrado sea alcanzable. Donde las fotos ya
  // ocupan el 100% (duo-gallery, lightbox) da 0 y no cambia nada.
  const cw = gallery.clientWidth;
  const padStart = Math.max(0, (cw - lastClone.offsetWidth) / 2);
  const padEnd = Math.max(0, (cw - firstClone.offsetWidth) / 2);
  gallery.style.paddingLeft = padStart + 'px';
  gallery.style.paddingRight = padEnd + 'px';

  function closestIndex(){
    const center = gallery.scrollLeft + gallery.clientWidth / 2;
    let closest = 0, dist = Infinity;
    allItems.forEach((item, i) => {
      const itemCenter = item.offsetLeft + item.offsetWidth / 2;
      const distance = Math.abs(itemCenter - center);
      if (distance < dist) { dist = distance; closest = i; }
    });
    return closest;
  }
  function jump(index, behavior){
    // apunta al centro real del ítem (no a su borde izquierdo): con
    // fotos de ancho disparejo (angosta-ancha-angosta), apuntar al
    // borde hace que el navegador enganche (snap) con la foto vecina
    // en vez de la buscada.
    const item = allItems[index];
    const left = item.offsetLeft + item.offsetWidth / 2 - gallery.clientWidth / 2;
    gallery.scrollTo({ left, behavior: behavior || 'auto' });
  }
  jump(1, 'auto'); // arranca en la foto real 0 (índice 1, después del clon del último)

  let scrollEndTimer = null;
  gallery.addEventListener('scroll', () => {
    clearTimeout(scrollEndTimer);
    scrollEndTimer = setTimeout(() => {
      const idx = closestIndex();
      if (idx === 0) jump(total, 'auto');          // llegó al clon del último -> salta a la real
      else if (idx === total + 1) jump(1, 'auto'); // llegó al clon del primero -> salta a la real
    }, 120); // espera a que el scroll/snap se asiente antes de decidir si hay que saltar
  }, { passive: true });

  window.addEventListener('resize', () => {
    jump(closestIndex(), 'auto'); // reacomoda sin animar, sin perder la foto actual
  });

  return { allItems, total, jump, closestIndex };
}

/* ---------- Tocar la pantalla también cambia de foto ----------
   Igual que las historias de Instagram: además de deslizar (swipe),
   un toque en la mitad derecha de la foto avanza y en la mitad
   izquierda retrocede. Un swipe real no dispara "click" (el
   navegador lo distingue solo), así que conviven sin pisarse. Usa el
   loop si la galería lo tiene (da la vuelta al llegar al final/
   principio); si no lo tiene (trio-gallery, ver más arriba), navega
   entre las fotos reales nada más, sin dar la vuelta. */
function setupTapToAdvance(gallery){
  if (getComputedStyle(gallery).display !== 'flex') return;
  gallery.addEventListener('click', (e) => {
    const rect = gallery.getBoundingClientRect();
    const goNext = (e.clientX - rect.left) > rect.width / 2;
    const loop = gallery.__loop;
    if (loop) {
      loop.jump(loop.closestIndex() + (goNext ? 1 : -1), 'smooth');
      return;
    }
    const items = [...gallery.children];
    const center = gallery.scrollLeft + gallery.clientWidth / 2;
    let closest = 0, dist = Infinity;
    items.forEach((item, i) => {
      const itemCenter = item.offsetLeft + item.offsetWidth / 2;
      const d = Math.abs(itemCenter - center);
      if (d < dist) { dist = d; closest = i; }
    });
    const targetIndex = Math.max(0, Math.min(items.length - 1, closest + (goNext ? 1 : -1)));
    const target = items[targetIndex];
    gallery.scrollTo({
      left: target.offsetLeft + target.offsetWidth / 2 - gallery.clientWidth / 2,
      behavior: 'smooth',
    });
  });
}

/* ---------- Puntitos de las galerías con swipe (páginas de producto) ----------
   Cualquier .trio-gallery/.duo-gallery/.lightbox__track seguida de un
   <div class="gallery-dots"> recibe un punto por foto, y el punto
   activo se recalcula según qué foto está más cerca del centro del
   scroll (sirve tanto en celular, donde de verdad scrollea, como si
   algún día no scrollea — ahí simplemente queda fijo en el primero).
   Los puntos mismos solo se muestran en celular, salvo dentro del
   lightbox, donde siempre se ven (ver CSS). Cuentan las fotos reales
   nada más: los clones del loop no suman puntito propio. */
document.querySelectorAll('.trio-gallery, .duo-gallery, .lightbox__track, .swipe-grid').forEach(gallery => {
  const loop = setupLoopingCarousel(gallery);
  gallery.__loop = loop; // el lightbox lo reusa para sus zonas de clic

  // el lightbox ya tiene su propia zona de clic (.lightbox__zones, ver
  // CSS/HTML), que además queda por encima del track: no hace falta
  // (ni funcionaría) sumarle este mismo mecanismo genérico.
  if (!gallery.classList.contains('lightbox__track')) {
    setupTapToAdvance(gallery);
  }

  // el lightbox envuelve su track (junto a las zonas de clic) en
  // .lightbox__stage, así que ahí los puntitos son hermanos del stage,
  // no del track mismo — en trio/duo-gallery, que no tienen ese
  // envoltorio, .closest() no encuentra nada y usa el propio gallery.
  const anchor = gallery.closest('.lightbox__stage') || gallery;
  const dotsEl = anchor.nextElementSibling;
  if (!dotsEl || !dotsEl.classList.contains('gallery-dots')) return;

  const items = loop ? loop.allItems.slice(1, -1) : [...gallery.children];
  if (items.length < 2) return;

  items.forEach((_, i) => {
    const d = document.createElement('span');
    if (i === 0) d.classList.add('active');
    dotsEl.appendChild(d);
  });
  const dots = dotsEl.children;

  function updateActiveDot(){
    let realIndex;
    if (loop) {
      // los clones (índice 0 y total+1) mapean a la última y la
      // primera foto real, respectivamente
      realIndex = ((loop.closestIndex() - 1) + loop.total) % loop.total;
    } else {
      const center = gallery.scrollLeft + gallery.clientWidth / 2;
      let closest = 0, dist = Infinity;
      items.forEach((item, i) => {
        const itemCenter = item.offsetLeft + item.offsetWidth / 2;
        const distance = Math.abs(itemCenter - center);
        if (distance < dist) { dist = distance; closest = i; }
      });
      realIndex = closest;
    }
    [...dots].forEach((d, i) => d.classList.toggle('active', i === realIndex));
  }

  let dotsTickScheduled = false;
  gallery.addEventListener('scroll', () => {
    if (dotsTickScheduled) return;
    dotsTickScheduled = true;
    requestAnimationFrame(() => {
      updateActiveDot();
      dotsTickScheduled = false;
    });
  }, { passive: true });
});

/* La posición inicial del loop (jump(1) dentro de setupLoopingCarousel)
   se calcula con el ancho de las fotos en ese momento, que todavía
   puede no ser el real si las imágenes no terminaron de cargar.
   Al terminar de cargar todo, se reacomoda cada carrusel en su
   primera foto real, ya con las medidas definitivas. */
window.addEventListener('load', () => {
  document.querySelectorAll('.trio-gallery, .duo-gallery, .lightbox__track, .swipe-grid').forEach(gallery => {
    if (gallery.__loop) gallery.__loop.jump(1, 'auto');
  });
});

/* ---------- Lightbox de la galería final ----------
   Tocar/cliquear cualquier foto de .final-gallery la abre en grande,
   ya centrada en esa foto, y se puede deslizar para ver las demás
   (mismo carrusel + puntitos que el resto del sitio, ver arriba). */
const lightbox = document.getElementById('lightbox');
const lightboxTrack = document.getElementById('lightboxTrack');
const lightboxClose = document.getElementById('lightboxClose');
const finalThumbs = document.querySelectorAll('.final-gallery .thumb');

if (lightbox && lightboxTrack && lightboxClose && finalThumbs.length) {
  // el track es carrusel (flex) en los 3 formatos, así que siempre
  // tiene loop armado (ver setupLoopingCarousel más arriba); los
  // índices reales (0..3) se corren +1 en allItems por el clon inicial
  const loop = lightboxTrack.__loop;

  function openLightbox(index){
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // no scrollear la página de atrás mientras está abierto
    if (loop) loop.jump(index + 1, 'auto');
    lightboxTrack.dispatchEvent(new Event('scroll')); // recalcula el puntito activo de una
  }
  function closeLightbox(){
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  finalThumbs.forEach((thumb, i) => {
    thumb.setAttribute('tabindex', '0');
    thumb.setAttribute('role', 'button');
    thumb.setAttribute('aria-label', 'Ver foto en grande');
    thumb.addEventListener('click', () => openLightbox(i));
    thumb.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(i); }
    });
  });

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox(); // tocar el fondo, fuera de la foto, también cierra
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
  });

  /* Navegación por clic (desktop/tablet, sin touch para hacer swipe):
     dos zonas invisibles a los costados de la foto, mismo criterio que
     los zoneLeft/zoneRight del hero del Home. */
  const lightboxZoneLeft = document.getElementById('lightboxZoneLeft');
  const lightboxZoneRight = document.getElementById('lightboxZoneRight');

  // clic en la zona derecha estando en la última foto (o en la
  // izquierda estando en la primera) desliza suave hacia el clon
  // correspondiente; setupLoopingCarousel lo detecta al asentarse el
  // scroll y salta sin animación a la foto real — así el clic también
  // da la vuelta en loop, igual que el swipe.
  if (loop) {
    if (lightboxZoneLeft) {
      lightboxZoneLeft.addEventListener('click', () => loop.jump(loop.closestIndex() - 1, 'smooth'));
    }
    if (lightboxZoneRight) {
      lightboxZoneRight.addEventListener('click', () => loop.jump(loop.closestIndex() + 1, 'smooth'));
    }
  }
}
