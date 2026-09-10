# Luzz Project — sitio web

Contexto para trabajar en este proyecto. Leer esto completo antes de tocar código.

## Qué es

Sitio web de **Luzz Project**, marca de arte lumínico/instalaciones inmersivas de Church
(Buenos Aires). Productos: Trinity, Omni, Infinity, Light Mirage. El dueño es diseñador
gráfico (Illustrator), no programador — necesita control fino de detalle visual
(grosor de línea al medio píxel, radios exactos, degradés) pero explicado en sus términos,
no en jerga técnica.

Contacto: hello@luzzproject.com · +54 911 3365 1652 · @luzzproject

## Stack y estructura de archivos

- HTML/CSS/JS plano. **Nada de frameworks, nada de build step.** Se sube directo a
  hosting compartido tipo cPanel (Hostinger o similar) por FTP/File Manager.
- Hoy vive como **un solo `index.html`** con el logo embebido en base64 adentro (para que
  el archivo viaje solo sin depender de una carpeta). Cuando entren las fotos reales en
  alta resolución, **pasar a estructura de carpetas real**: `index.html`, `/img/`, y si
  hace falta separar, `/css/` y `/js/`. Un archivo de varios MB con todo embebido no es
  sostenible.
- Fuente system font para "SF Pro" — **no se puede licenciar ni alojar la fuente real de
  Apple para web**. Se usa el stack `-apple-system, BlinkMacSystemFont, ...`, que
  muestra SF Pro real en Mac/iPhone y cae a Segoe UI/Roboto en otros sistemas. Esto es
  intencional, no un bug.
- Los títulos de sección ("Productos", "Desarrollos a Medida", "Trabajos") usan
  **Archivo** (Google Fonts, variable, eje `wdth`) para lograr el efecto "Expanded" que
  pidió el cliente. Sintaxis necesaria:
  `family=Archivo:wdth,wght@125,400` + `font-stretch:125%` +
  `font-variation-settings:"wdth" 125` en el CSS (el nombre "Archivo Expanded" NO existe
  como familia separada en Google Fonts, es un error fácil de cometer).

## Reglas de oro (rotas y aprendidas a los golpes — no reintroducir estos bugs)

1. **Todo elemento visible declara `background:#000000` explícito, propio.** Nunca
   depender de heredarlo de un padre. El motivo: el cliente revisa en el visor rápido
   de archivos de iOS (Quick Look), que tiene bugs de renderizado reales con
   herencia de fondo, `border-image`, y otras cosas — bugs que NO existen en Safari
   real. Ante cualquier fondo raro, sospechar del visor antes que del CSS, pero
   igual blindar con negro explícito porque es gratis y evita el problema de raíz.

2. **El fondo negro de un bloque nunca vive en el mismo elemento que anima
   `opacity`/`transform`.** Si un contenedor hace fade-in y también tiene el
   `background`, el fondo se desvanece junto con el contenido (se ve gris en vez de
   negro sólido mientras anima). El fondo va en el contenedor; el fade va en los
   hijos de adentro.

3. **Nunca usar `margin` grande (top/bottom) para separar secciones grandes.** Ese
   espacio queda "flotando" fuera de cualquier caja pintada, y en Quick Look se
   renderiza gris. Usar `padding` de un elemento que ya tiene fondo negro propio.

4. **Cualquier variable CSS que dependa del tamaño de la nav (`--nav-h`) tiene que
   actualizarse junta en cada media query donde cambie el alto real de la barra.**
   Ya pasó un bug real: la barra medía 64px en mobile pero la variable seguía en
   84px, dejando 20px de hueco gris sin pintar. Buscar todo uso de `--nav-h` al
   tocar el alto de la nav.

5. **El espacio para la barra fija (nav `position:fixed`) se reserva con
   `padding-top` en el `body`, nunca con `margin-top` en el primer elemento de
   contenido.** Mismo motivo que la regla 3.

6. **El fade-in de scroll es por-ítem, no por-contenedor.** Si varios elementos
   (ej. las 4 tarjetas de una grilla) comparten un solo contenedor animado, el
   contenedor completo (con photos apiladas en mobile, mucha altura) hace que el
   cálculo de "centro en pantalla" quede muy retrasado respecto a los ítems que
   están arriba — esos ítems aparecen "siempre al 100%" aunque el usuario recién
   los esté viendo entrar. Cada tarjeta/elemento debe ser su propio target de
   animación.

7. **Antes de dar un bug del visor de iOS por sentado, probar en Safari real.** El
   cliente suele revisar en el visor rápido de archivos de iOS (Quick Look, no
   Safari) — varias veces lo que parecía un bug de CSS era una limitación de ese
   visor. Preguntar o sugerir la verificación en Safari cuando algo no tenga
   explicación en el código.

## Sistema de fade-in (scroll-linked, no IntersectionObserver)

No usa umbrales fijos con `transition` de CSS. La opacidad se recalcula en cada frame
de scroll según la posición real del elemento:

- Progreso 0 = el elemento recién asoma por el borde inferior de la pantalla.
- Progreso 1 (100% opacidad) = por defecto, al recorrer el **25% de la altura de
  pantalla** desde que entra (no hace falta llegar al centro).
- Un elemento puede pedir un punto de llegada distinto con
  `data-reveal-end="0.35"` (fracción de vh), si en algún momento hace falta
  diferenciarlo.
- Selector actual de elementos animados: `.logo-section .star`,
  `.logo-section .fade-text`, `section.grid-section > h2`,
  `section.grid-section .item` (cada tarjeta, no el grid entero — ver regla 6),
  `footer.contact .contact-block > a`.
- Implementación: función `updateReveal()` en el JS, atada a `scroll`/`resize` con
  `requestAnimationFrame` para no saturar.

## Hero (slideshow principal)

- Loop infinito real: se clona el primer y el último slide (uno al final, otro al
  principio) para que el deslizamiento nunca "salte" hacia atrás al dar la vuelta —
  al llegar al clon, se salta sin transición al slide real equivalente, ya fuera de
  pantalla.
- Autoplay cada 5s. Se detiene apenas el usuario interactúa (click en las zonas
  izquierda/derecha, o arrastre) y no se reanuda solo.
- **Arrastre (drag) con el dedo**: la imagen sigue al dedo 1:1 en tiempo real, sin
  transición durante el gesto. Al soltar: si se arrastró más del 25% del ancho de
  pantalla, engancha con la foto siguiente/anterior en **0.2s** (transición rápida,
  `DRAG_SNAP_TRANSITION`). Si no llega al umbral, vuelve a la foto actual, también
  en 0.2s. La navegación por autoplay/click usa una transición distinta y más lenta:
  **2.1s**, con curva `cubic-bezier(0.76, 0, 0.24, 1)` (símil "Ease" de After
  Effects, pedido explícito del cliente).
- Formato de imagen por breakpoint: **16:9 en desktop, cuadrado 1:1 en tablet, 9:16
  en celular.** Las fotos pueden subirse en cualquier resolución/proporción — se
  recortan solas con `object-fit:cover` centrado. Avisar si hace falta reencuadre
  puntual (`object-position`) para alguna foto donde el sujeto no esté centrado.
- Puntitos indicadores: solo referenciales (cantidad de fotos), no son clickeables.

## Grillas (Productos / Desarrollos a Medida / Trabajos)

- Cada tarjeta: foto + título + texto. El botón entero (la tarjeta completa) es
  clickeable, no solo la foto.
- Fotos: **siempre cuadradas (1:1)**, esquina viva (`border-radius:0`), sin gutter
  entre columnas (van pegadas). Cualquier resolución de origen sirve, se recortan
  centradas.
- Hover: la foto está al 75% de opacidad en reposo, sube a 100% en 0.3s al pasar
  el mouse. En touch (sin mouse), un tap dispara el mismo efecto por 350ms
  (clase `.tap-active`).
- Desktop: 4 columnas. Tablet: 2×2. Celular: 1 columna apilada.
- En celular, el título de cada sección (h2) es **sticky**: queda pegado debajo de
  la nav mientras se scrollea esa sección, y lo empuja el título de la sección
  siguiente. Requiere suficiente `padding` en la sección/footer siguiente para que
  el título llegue a despegarse antes de que aparezca contenido nuevo (ver
  problema real ya resuelto: el footer necesitó más padding-top del esperado).

## Breakpoints

- Desktop: > 819px
- Tablet: 641px – 819px (corrido a propósito desde el estándar 1024px, un 20%
  hacia abajo, para que el layout de desktop se sostenga más tiempo antes de
  pasar a tablet — pedido explícito del cliente)
- Celular: ≤ 640px

La barra de nav usa `clamp()` en paddings y gaps (no reduce el tamaño de letra) para
no colapsar/superponerse en anchos intermedios cercanos al breakpoint de tablet.

## Logo

Viene de un archivo `.ai`/`.svg` provisto por el cliente que combina estrella +
wordmark "Luzz Project" + bajada "when light becomes form" en un solo archivo. Se
separó en tres PNG independientes (transparencia) porque el sitio necesita usarlos
en tamaños y combinaciones distintas (nav chico vs. sección hero grande). Las tres
piezas comparten una sola escala relativa real del archivo original: el wordmark y
la bajada miden 1.64× el ancho de la estrella. Si se reescala una, reescalar las
tres juntas con esa proporción (variable CSS `--star-w` ya centraliza esto).

## Estilo de trabajo con el cliente

- Es diseñador gráfico, no programador. Explicar en términos de diseño (grosor,
  radio, degradé, interlineado), no en jerga de código.
- Pide números exactos y porcentajes de cambio sobre valores actuales
  ("aumentar un 20%") — mostrar siempre el valor actual antes de aplicar un
  cambio relativo, para que pueda corregir con criterio.
- Revisa mucho desde el iPhone. Ante artefactos visuales raros, considerar el
  visor de Quick Look como sospechoso primero (ver regla de oro #7).
- Prefiere iterar en chico (una sección a la vez) antes de aprobar y pasar a la
  siguiente.
