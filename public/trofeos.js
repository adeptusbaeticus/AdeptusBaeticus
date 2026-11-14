// Trofeos del club (Miembros y ficha rápida). window.abCopa(puesto, modalidad) devuelve el SVG del trofeo;
// el color sale de la clase «copa p1/p2/p3» (oro, plata y bronce) que define cada página.
(function () {
// Trofeo de Adeptus Baeticus, basado en el logo del club: aro de engranaje con púas, calavera encapuchada,
// espada vertical (que hace de pie, clavada en la peana) y pinceles cruzados. Calaveras: 1 (individual),
// 2 (parejas) o 5 (equipo). Color según el puesto.
function copa(puesto, modalidad) {
  const ns = "http://www.w3.org/2000/svg";
  const sv = document.createElementNS(ns, "svg");
  sv.setAttribute("viewBox", "0 0 32 36");
  sv.setAttribute("class", "copa p" + puesto); sv.setAttribute("aria-hidden", "true");
  const F = "#1F2328"; // color del fondo, para separar las piezas
  const add = (tag, at) => { const e = document.createElementNS(ns, tag); for (const k in at) e.setAttribute(k, at[k]); sv.appendChild(e); return e; };
  const C = "currentColor";
  const cx = 16, cy = 14;
  // Pinceles cruzados (detrás), como en el logo; el trofeo de pintura no los lleva (ya tiene sus pinceles).
  for (const [x1, y1, x2, y2] of modalidad === "pintura" ? [] : [[5.5, 4.5, 26.5, 25.5], [26.5, 4.5, 5.5, 25.5]]) {
    add("path", { d: `M${x1} ${y1}L${x2} ${y2}`, stroke: F, "stroke-width": "3.2", "stroke-linecap": "round" });
    add("path", { d: `M${x1} ${y1}L${x2} ${y2}`, stroke: C, "stroke-width": "1.6", "stroke-linecap": "round" });
    // Punta del pincel (pelo) en el extremo inferior.
    const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l;
    add("path", { d: `M${x2 - ux * 3.2 - uy * 1.4} ${y2 - uy * 3.2 + ux * 1.4}L${x2 + ux * 1.6} ${y2 + uy * 1.6}L${x2 - ux * 3.2 + uy * 1.4} ${y2 - uy * 3.2 - ux * 1.4}Z`, fill: C, stroke: F, "stroke-width": "0.6" });
  }
  // Espada: hoja hacia abajo (pie del trofeo) y empuñadura con pomo en punta arriba.
  add("path", { d: "M14.7 20L17.3 20L16.9 30.5L16 32L15.1 30.5Z", fill: C, stroke: F, "stroke-width": "0.7" });
  // Aro de engranaje con púas (como en el logo, abierto por abajo donde cruzan los pinceles).
  const r = 8.6;
  add("circle", { cx, cy, r, fill: "none", stroke: F, "stroke-width": "3.6" });
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (Math.PI * 2 * i) / 10;
    if (i === 0 || Math.sin(a) > 0.5) continue; // sin púa arriba (va la espada) ni abajo (pinceles)
    const p = (rr, da) => `${(cx + rr * Math.cos(a + da)).toFixed(2)} ${(cy + rr * Math.sin(a + da)).toFixed(2)}`;
    add("path", { d: `M${p(r - 0.4, -0.27)}L${p(r + 4.6, 0)}L${p(r - 0.4, 0.27)}Z`, fill: C, stroke: F, "stroke-width": "0.6", "stroke-linejoin": "round" });
  }
  add("circle", { cx, cy, r, fill: "none", stroke: C, "stroke-width": "2.3" });
  // Empuñadura de la espada por encima del aro: pomo en punta y anillas.
  add("path", { d: "M16 0.3L17.2 4L14.8 4Z", fill: C, stroke: F, "stroke-width": "0.5" });
  add("rect", { x: "14.9", y: "3.8", width: "2.2", height: "3.6", rx: "0.5", fill: C, stroke: F, "stroke-width": "0.6" });
  add("path", { d: "M14.9 5.1H17.1M14.9 6.3H17.1", stroke: F, "stroke-width": "0.45" });
  // Calavera encapuchada.
  const encapuchada = (x, y, s) => {
    const P = (px, py) => `${(x + px * s).toFixed(2)} ${(y + py * s).toFixed(2)}`;
    // Capucha (con el borde inferior en pico, como el manto del logo).
    add("path", { d: `M${P(-4.6, 5)}L${P(-4.6, 0.2)}C${P(-4.6, -4.2)} ${P(-2.4, -5.8)} ${P(0, -5.8)}C${P(2.4, -5.8)} ${P(4.6, -4.2)} ${P(4.6, 0.2)}L${P(4.6, 5)}L${P(2.2, 3.6)}L${P(0, 5.6)}L${P(-2.2, 3.6)}Z`, fill: C, stroke: F, "stroke-width": (0.8 * s).toFixed(2) });
    // Hueco de la cara y calavera dentro.
    add("ellipse", { cx: x, cy: y + 0.7 * s, rx: 2.9 * s, ry: 3.4 * s, fill: F });
    add("circle", { cx: x, cy: y + 0.3 * s, r: 2.25 * s, fill: C });
    add("rect", { x: x - 1.2 * s, y: y + 1.9 * s, width: 2.4 * s, height: 1.6 * s, rx: 0.3 * s, fill: C });
    add("circle", { cx: x - 0.9 * s, cy: y + 0.4 * s, r: 0.62 * s, fill: F });
    add("circle", { cx: x + 0.9 * s, cy: y + 0.4 * s, r: 0.62 * s, fill: F });
    if (s > 0.6) add("path", { d: `M${P(0, 1.2)}l${-0.35 * s} ${0.6 * s}h${0.7 * s}z`, fill: F });
  };
  // Pincel: mango, virola y pelo (con la punta de pintura), girado un ángulo (grados) desde la vertical.
  const pincel = (x, y, ang, l, w) => {
    const g = add("g", { transform: `rotate(${ang} ${x} ${y})` });
    const sub = (tag, at) => { const e = document.createElementNS(ns, tag); for (const k in at) e.setAttribute(k, at[k]); g.appendChild(e); return e; };
    sub("path", { d: `M${x - w * 0.42} ${y - l * 0.36}L${x + w * 0.42} ${y - l * 0.36}L${x + w * 0.26} ${y + l * 0.05}L${x - w * 0.26} ${y + l * 0.05}Z`, fill: C, stroke: F, "stroke-width": "0.6" }); // mango
    sub("rect", { x: x - w * 0.55, y: y - l * 0.52, width: w * 1.1, height: l * 0.17, rx: 0.3, fill: C, stroke: F, "stroke-width": "0.6" });                                // virola
    sub("path", { d: `M${x - w * 0.55} ${y - l * 0.52}C${x - w * 0.75} ${y - l * 0.72} ${x - w * 0.2} ${y - l * 0.9} ${x} ${y - l}C${x + w * 0.2} ${y - l * 0.9} ${x + w * 0.75} ${y - l * 0.72} ${x + w * 0.55} ${y - l * 0.52}Z`, fill: C, stroke: F, "stroke-width": "0.6" }); // pelo
    sub("path", { d: `M${x - w * 0.2} ${y - l * 0.6}Q${x} ${y - l * 0.86} ${x + w * 0.16} ${y - l * 0.62}`, fill: "none", stroke: F, "stroke-width": "0.45", opacity: ".8" }); // trazo del pelo
  };
  if (modalidad === "pintura") {
    // Fondo del medallón para que los pinceles se lean sobre el aro, y abanico de tres pinceles.
    add("circle", { cx, cy, r: r - 1.2, fill: F });
    pincel(cx - 0.4, cy + 6.2, -38, 11.5, 2.4); pincel(cx + 0.4, cy + 6.2, 38, 11.5, 2.4); pincel(cx, cy + 6.4, 0, 12.6, 2.6);
  }
  else if (modalidad === "individual") encapuchada(cx, cy, 1.05);
  else if (modalidad === "parejas") { encapuchada(cx - 3.4, cy + 0.6, 0.72); encapuchada(cx + 3.4, cy + 0.6, 0.72); }
  else {
    encapuchada(cx - 4.3, cy - 1.6, 0.5); encapuchada(cx, cy - 3.2, 0.5); encapuchada(cx + 4.3, cy - 1.6, 0.5);
    encapuchada(cx - 2.2, cy + 2.9, 0.5); encapuchada(cx + 2.2, cy + 2.9, 0.5);
  }
  // Peana.
  add("path", { d: "M11 31.5H21L22.5 33.6H9.5Z", fill: C, stroke: F, "stroke-width": "0.6" });
  add("rect", { x: "8.5", y: "33.4", width: "15", height: "2.4", rx: "0.6", fill: C, stroke: F, "stroke-width": "0.6" });
  return sv;
}
  window.abCopa = copa;
})();
