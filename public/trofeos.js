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

  // Corona de laurel alrededor de la foto del socio: verde para los miembros y roja para el admin (los aspirantes no
  // llevan). Dos ramas de hojas que suben desde un lazo abajo hasta casi arriba, dejando libre la parte de arriba.
  function laurel(rol) {
    const colores = { miembro: ["#9DB05C", "#5E6B36"], admin: ["#E0574C", "#7A1712"] }[rol];
    if (!colores) return null;
    const [hoja, oscuro] = colores;
    const ns = "http://www.w3.org/2000/svg";
    const sv = document.createElementNS(ns, "svg");
    sv.setAttribute("viewBox", "0 0 100 100");
    sv.setAttribute("class", "laurel");
    sv.setAttribute("aria-hidden", "true");
    const add = (tag, at, padre) => { const e = document.createElementNS(ns, tag); for (const k in at) e.setAttribute(k, at[k]); (padre || sv).appendChild(e); return e; };
    const R = 45, cx = 50, cy = 50, rad = (g) => (g * Math.PI) / 180;
    const pto = (g, r) => [cx + r * Math.cos(rad(g)), cy + r * Math.sin(rad(g))];
    for (const lado of [-1, 1]) {
      // Ángulos en grados (0 = derecha, 90 = abajo): de abajo (cerca del lazo) hacia arriba por cada lado.
      const g0 = 90 + lado * 12, g1 = 90 + lado * 140;
      const [x0, y0] = pto(g0, R), [x1, y1] = pto(g1, R);
      add("path", { d: `M${x0.toFixed(1)} ${y0.toFixed(1)}A${R} ${R} 0 0 ${lado > 0 ? 1 : 0} ${x1.toFixed(1)} ${y1.toFixed(1)}`, fill: "none", stroke: oscuro, "stroke-width": "1.6", "stroke-linecap": "round" });
      const n = 9;
      for (let i = 0; i < n; i++) {
        const g = g0 + ((g1 - g0) * (i + 0.5)) / n;
        const tam = 1 - i * 0.045; // hojas algo más pequeñas hacia la punta
        for (const fuera of [1, -1]) {
          const [x, y] = pto(g + lado * 3, R + fuera * 3.2);
          // Hoja: elipse inclinada hacia la punta de la rama y hacia fuera o hacia dentro.
          const giro = g + (lado > 0 ? 90 : -90) + fuera * lado * 32;
          add("ellipse", { cx: x.toFixed(1), cy: y.toFixed(1), rx: (5.4 * tam).toFixed(2), ry: (2.3 * tam).toFixed(2), fill: hoja, stroke: oscuro, "stroke-width": "0.7",
            transform: `rotate(${giro.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})` });
        }
      }
      // Hoja de la punta.
      const [xp, yp] = pto(g1 + lado * 4, R);
      add("ellipse", { cx: xp.toFixed(1), cy: yp.toFixed(1), rx: "4.6", ry: "2", fill: hoja, stroke: oscuro, "stroke-width": "0.7", transform: `rotate(${(g1 + (lado > 0 ? 90 : -90)).toFixed(1)} ${xp.toFixed(1)} ${yp.toFixed(1)})` });
    }
    // Lazo abajo.
    add("path", { d: "M50 95L44 99.5L45.5 93.5Z M50 95L56 99.5L54.5 93.5Z", fill: oscuro });
    add("circle", { cx: "50", cy: "95", r: "2.6", fill: hoja, stroke: oscuro, "stroke-width": "0.8" });
    return sv;
  }
  window.abLaurel = laurel;

  // Antigüedad en el club a partir de la fecha de registro («YYYY-MM-DD»): { anios, meses } hasta hoy.
  function antiguedad(alta) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(alta || "");
    if (!m) return null;
    const hoy = new Date();
    let meses = (hoy.getFullYear() - +m[1]) * 12 + (hoy.getMonth() + 1 - +m[2]);
    if (hoy.getDate() < +m[3]) meses--;
    meses = Math.max(0, meses);
    return { anios: Math.floor(meses / 12), meses: meses % 12 };
  }
  // «1 año y 7 meses», «3 meses» o «menos de un mes».
  function textoAntiguedad(alta) {
    const a = antiguedad(alta);
    if (!a) return "";
    const y = a.anios ? a.anios + (a.anios === 1 ? " año" : " años") : "", mm = a.meses ? a.meses + (a.meses === 1 ? " mes" : " meses") : "";
    return y && mm ? y + " y " + mm : y || mm || "menos de un mes";
  }
  // Tachuelas de servicio («service studs»): una tachuela de metal abombada por cada año completo en el club, en fila
  // sobre una pletina de hierro (hasta 5 dibujadas, «×N» si hay más). null si no lleva ninguna.
  function galones(alta, grande) {
    const a = antiguedad(alta);
    if (!a || !a.anios) return null;
    const ns = "http://www.w3.org/2000/svg", n = Math.min(a.anios, 5), mas = a.anios > 5;
    const W = 4 + n * 9 + (mas ? 12 : 0), H = 12, esc = grande ? 1.5 : 1.15;
    const sv = document.createElementNS(ns, "svg");
    const add = (tag, at, padre) => { const e = document.createElementNS(ns, tag); for (const k in at) e.setAttribute(k, at[k]); (padre || sv).appendChild(e); return e; };
    sv.setAttribute("viewBox", "0 0 " + W + " " + H);
    sv.setAttribute("width", (W * esc).toFixed(1));
    sv.setAttribute("height", (H * esc).toFixed(1));
    sv.setAttribute("aria-hidden", "true");
    const id = "t" + Math.random().toString(36).slice(2, 8);
    const defs = add("defs", {});
    const g = add("radialGradient", { id, cx: "35%", cy: "30%", r: "70%" }, defs);
    add("stop", { offset: "0", "stop-color": "#FFF4CF" }, g); add("stop", { offset: ".35", "stop-color": "#E3B95A" }, g);
    add("stop", { offset: ".8", "stop-color": "#8A6416" }, g); add("stop", { offset: "1", "stop-color": "#4A3208" }, g);
    // Pletina de hierro con dos remaches pequeños en los extremos.
    add("rect", { x: "0.5", y: "1.5", width: W - 1, height: "9", rx: "2.2", fill: "#2A2C30", stroke: "#0E0F11", "stroke-width": "0.8" });
    add("rect", { x: "1.2", y: "2.1", width: W - 2.4, height: "1.3", rx: "0.6", fill: "#5A5E66", opacity: ".55" });
    for (let i = 0; i < n; i++) {
      const cx = 6.5 + i * 9;
      add("circle", { cx: cx + 0.5, cy: "6.9", r: "3.5", fill: "#000", opacity: ".55" }); // sombra
      add("circle", { cx, cy: "6", r: "3.5", fill: `url(#${id})`, stroke: "#3A2808", "stroke-width": "0.5" });
      add("circle", { cx: cx - 1.1, cy: "4.9", r: "0.9", fill: "#FFFBEA", opacity: ".85" }); // brillo
    }
    if (mas) {
      const tx = add("text", { x: W - 6.5, y: "8.6", "text-anchor": "middle", "font-size": "6.5", "font-weight": "700", fill: "#E3B95A", "font-family": "Inter,sans-serif" });
      tx.textContent = "×" + a.anios;
    }
    // El texto va en un envoltorio (fuera del SVG) para que se traduzca.
    const w = document.createElement("span");
    w.className = "galones";
    w.setAttribute("role", "img");
    w.title = a.anios === 1 ? "1 año en el club" : a.anios + " años en el club";
    w.setAttribute("aria-label", w.title);
    w.appendChild(sv);
    return w;
  }
  window.abAntiguedad = textoAntiguedad;
  window.abGalones = galones;
})();
