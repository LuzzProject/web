/* ==========================================================================
   Luzz Project — JavaScript principal
   Comportamiento compartido por todas las páginas.
   ========================================================================== */

(function () {
  "use strict";

  // --- Menú móvil ---------------------------------------------------------
  const toggle = document.querySelector(".nav__toggle");
  const menu = document.querySelector(".nav__menu");

  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      const isOpen = !menu.hidden;
      menu.hidden = isOpen;
      toggle.setAttribute("aria-expanded", String(!isOpen));
    });
  }

  // --- Marca el enlace de la página actual --------------------------------
  const path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav__link").forEach(function (link) {
    const href = link.getAttribute("href");
    if (href && href.split("/").pop() === path) {
      link.setAttribute("aria-current", "page");
    }
  });

  // --- Año actual en el footer --------------------------------------------
  const yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
