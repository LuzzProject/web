# Luzz Project — Sitio web

Sitio estático (HTML / CSS / JavaScript) de Luzz Project: arte, luz y tecnología.

## Estructura

```
.
├── index.html                 # Home / Portada
├── bio.html                   # Bio
├── exhibiciones.html          # Exhibiciones
├── trabajos.html              # Trabajos
├── desarrollos-a-medida.html  # Desarrollos a medida
├── productos/
│   ├── infinity.html
│   ├── omni.html
│   ├── trinity.html
│   └── light-mirage.html
├── css/
│   └── styles.css             # Estilos globales (tema oscuro)
├── js/
│   └── main.js                # Menú móvil, año del footer, enlace activo
└── assets/
    ├── img/                   # Imágenes por sección
    │   ├── home/  bio/  desarrollos/  exhibiciones/  trabajos/
    │   └── productos/{infinity,omni,trinity,light-mirage}/
    ├── fonts/                 # Tipografías propias (opcional)
    └── icons/                 # Íconos / favicon
```

## Cómo trabajar

1. **Ver la web localmente:** abrí `index.html` en el navegador, o levantá un servidor:
   ```bash
   python3 -m http.server 8000
   ```
   y entrá a http://localhost:8000

2. **Agregar imágenes:** colocá tus fotos en la carpeta de `assets/img/` correspondiente
   y referencialas desde el HTML (ej: `assets/img/exhibiciones/mi-foto.jpg`).

3. **Publicar:** este sitio se puede subir tal cual a GitHub Pages, Netlify o Vercel.

## Páginas pendientes de contenido

Cada página interior tiene tarjetas de ejemplo con comentarios `<!-- TODO -->`
indicando dónde reemplazar por el contenido y las imágenes reales.
