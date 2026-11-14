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
  // Devuelve un <span class="ij"> con el icono; con texto (aria-label/title) salvo que sea decorativo.
  window.iconoJuego = function (activity, decorativo) {
    const def = JUEGOS_ICONO[activity];
    if (!def) return null;
    const w = document.createElement("span");
    w.className = "ij";
    if (decorativo) w.setAttribute("aria-hidden", "true");
    else { w.setAttribute("role", "img"); w.setAttribute("aria-label", def[0]); w.title = def[0]; }
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 16 16");
    svg.setAttribute("aria-hidden", "true");
    def[1].forEach(([d, relleno, y, tam, ancho]) => {
      const grosor = d !== "texto" && typeof y === "number" ? y : null;
      if (d === "texto") {
        // Texto dentro del icono (no se traduce: va en el SVG).
        const t = document.createElementNS(NS, "text");
        t.textContent = relleno;
        t.setAttribute("x", "8"); t.setAttribute("y", String(y));
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
