// Iconos de las modalidades de partida: dibujo propio de estética grimdark (sin logos ni tipografías de
// Games Workshop). viewBox 16×16, en el color del texto. Combat Patrol y 40k llevan su nombre en una placa
// de esquinas cortadas con letra Cinzel (la de los títulos de la web); Necromunda, máscara de gas de
// pandillero; Blood Bowl, balón con pinchos. Cada parte: [d, relleno (true) o trazo (false)] o
// ["texto", texto, y, tamaño, ancho].
(function () {
  // Placa con las esquinas cortadas (estilo gótico-militar), de trazo fino.
  const MARCO = "M3.5 .7h9l2.8 2.8v9l-2.8 2.8h-9L.7 12.5v-9z";
  const JUEGOS_ICONO = {
    // Combat Patrol: placa con «COMBAT PATROL» en dos líneas (Cinzel, ajustada al ancho).
    combat_patrol: ["Combat Patrol", [[MARCO, false, 1.1], ["texto", "COMBAT", 7.4, 4, 11], ["texto", "PATROL", 12.1, 4, 11]]],
    // 40k: placa con «40K» y, debajo, los puntos («1K» o «2K»).
    "40k_1000": ["40k a 1K", [[MARCO, false, 1.1], ["texto", "40K", 7.5, 5.2, 9.4], ["texto", "1K", 13, 5.2, 6.6]]],
    // 40k a secas (en el móvil; los puntos van en el texto).
    "40k": ["40k", [[MARCO, false, 1.1], ["texto", "40K", 10.3, 6.4, 11]]],
    "40k_2000": ["40k a 2K", [[MARCO, false, 1.1], ["texto", "40K", 7.5, 5.2, 9.4], ["texto", "2K", 13, 5.2, 6.6]]],
    // Necromunda: máscara de gas angulosa de pandillero de la colmena, con cresta de púas.
    necromunda: ["Necromunda", [
      ["M4 6.4 5.6 4.6h4.8L12 6.4v3.8l-1.8 2.6L8 14.6l-2.2-1.8L4 10.2z", false],
      ["M5.6 4.6 6.3 1.4 7.2 4.2 8 .9l.8 3.3.9-2.8.7 3.2z", true],
      ["M5 7.2h2.6l.2 2.3H5.4zM8.4 7.2H11l-.4 2.3H8.2z", true],
      ["M6.9 11.4h2.2v2.2H6.9z", true],
    ]],
    // Blood Bowl: balón en punta con pinchos y cordones.
    bloodbowl: ["Blood Bowl", [
      ["M2.2 13.8c.3-3.6 1.8-6.8 4.4-9.2s5.8-3.6 7.2-2.6c1 1.4-.2 4.6-2.6 7.2s-5.6 4.1-9 4.6zM6.6 9.4l3.4-3.4M7 7.4l1.6 1.6M8.4 6l1.6 1.6", false],
      ["M4.1 7.3 2.6 6.2l2.2-.1zM6.6 4.4 6.2 2.6l1.8 1zM11.6 11.6l1.5 1.1-2.2.1zM9.4 12.4l.4 1.8-1.8-1z", true],
    ]],
  };
  // Versión vertical (viewBox 14×20) para la columna izquierda de las etiquetas del calendario en el
  // ordenador: placa alta con el texto más grande. Las que no tienen versión alta usan la cuadrada.
  const MARCO_ALTO = "M3.2 .7h7.6l2.5 2.5v13.6l-2.5 2.5H3.2L.7 16.8V3.2z";
  const JUEGOS_ALTO = {
    combat_patrol: [[MARCO_ALTO, false, 1], ["texto", "COMBAT", 5.6, 3.1, 9.6], ["texto", "CP", 12.9, 7.4, 9.8], ["texto", "PATROL", 17, 3.1, 9.6]],
    "40k_1000": [[MARCO_ALTO, false, 1], ["texto", "40K", 8.2, 4.8, 10], ["M3.4 10.2h7.2", false, .8], ["texto", "1K", 16.6, 6.6, 9]],
    "40k_2000": [[MARCO_ALTO, false, 1], ["texto", "40K", 8.2, 4.8, 10], ["M3.4 10.2h7.2", false, .8], ["texto", "2K", 16.6, 6.6, 9]],
    // Máscara de gas alargada con cresta de púas.
    necromunda: [
      ["M1.8 8 4 5.4h6L12.2 8v5.4l-2.4 3.4L7 19.3l-2.8-2.5-2.4-3.4z", false, 1.1],
      ["M3.9 5.4l.9-4 1.2 3.3L7 .6l1 4.1 1.2-3.3.9 4z", true],
      ["M2.9 9.2h3.4l.2 3.1H3.4zM7.5 9.2h3.4l-.5 3.1H7.3z", true],
      ["M5.7 14.6h2.6v3.2H5.7z", true],
    ],
    // Balón de pie, con cordones y pinchos a los lados.
    bloodbowl: [
      ["M7 .8c3.1 2.5 4.7 5.6 4.7 9.2S10.1 16.7 7 19.2C3.9 16.7 2.3 13.6 2.3 10S3.9 3.3 7 .8zM7 5.4v9.2M5.3 7.5h3.4M5.3 10h3.4M5.3 12.5h3.4", false, 1.1],
      ["M2.6 6.9.5 6.2l2.4-1zM11.4 6.9l2.1-.7-2.4-1zM2.6 13.1l-2.1.7 2.4 1zM11.4 13.1l2.1.7-2.4 1z", true],
    ],
  };
  // Devuelve un <span class="ij"> con el icono; con texto (aria-label/title) salvo que sea decorativo.
  // alto = versión vertical si la hay.
  window.iconoJuego = function (activity, decorativo, alto) {
    const def0 = JUEGOS_ICONO[activity];
    if (!def0) return null;
    const vertical = alto && JUEGOS_ALTO[activity];
    const def = vertical ? [def0[0], JUEGOS_ALTO[activity]] : def0;
    const w = document.createElement("span");
    w.className = "ij";
    if (decorativo) w.setAttribute("aria-hidden", "true");
    else { w.setAttribute("role", "img"); w.setAttribute("aria-label", def[0]); w.title = def[0]; }
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", vertical ? "0 0 14 20" : "0 0 16 16");
    if (vertical) w.classList.add("ij-alto");
    svg.setAttribute("aria-hidden", "true");
    def[1].forEach(([d, relleno, y, tam, ancho]) => {
      const grosor = d !== "texto" && typeof y === "number" ? y : null;
      if (d === "texto") {
        // Texto dentro del icono (no se traduce: va en el SVG).
        const t = document.createElementNS(NS, "text");
        t.textContent = relleno;
        t.setAttribute("x", vertical ? "7" : "8"); t.setAttribute("y", String(y));
        t.setAttribute("text-anchor", "middle");
        t.setAttribute("fill", "currentColor"); t.setAttribute("stroke", "none");
        t.setAttribute("style", "font:700 " + (tam || 5.6) + "px Cinzel,Georgia,serif");
        if (ancho) { t.setAttribute("textLength", String(ancho)); t.setAttribute("lengthAdjust", "spacingAndGlyphs"); }
        svg.appendChild(t);
        return;
      }
      const p = document.createElementNS(NS, "path");
      p.setAttribute("d", d);
      if (grosor) p.setAttribute("stroke-width", String(grosor));
      if (relleno) { p.setAttribute("fill", "currentColor"); p.setAttribute("fill-rule", "evenodd"); p.setAttribute("stroke", "none"); }
      svg.appendChild(p);
    });
    w.appendChild(svg);
    return w;
  };
  window.JUEGOS_ICONO = JUEGOS_ICONO;
})();
