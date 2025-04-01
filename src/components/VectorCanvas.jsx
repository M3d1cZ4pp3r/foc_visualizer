import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export default function VectorCanvas({ params }) {
  const svgRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      const container = svgRef.current.parentElement;
      setDimensions({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };
    window.addEventListener("resize", updateSize);
    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    const { width, height } = dimensions;
    if (width === 0 || height === 0) return;

    const svg = d3.select(svgRef.current);
    renderCanvas(svg, width, height, params);
  }, [params, dimensions]);

  return (
    <div className="canvas">
      <svg ref={svgRef} />
    </div>
  );
}

// Haupt-Render-Funktion
function renderCanvas(svg, width, height, params) {
  svg.attr("width", width)
    .attr("height", height)
    .style("background", "white");

  svg.selectAll("*").remove();

  const centerX = width / 2;
  const centerY = height / 2;
  const { u_alpha, u_beta, Udc, boxSizeV, showPhases, showSVM } = params;

  // Ziel: Das Hexagon passt komplett ins Fenster (inkl. Text)
  const padding = 40; // px, Platz für Labels außerhalb
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  const maxRadiusPx = Math.min(usableWidth, usableHeight) / 2;

  // Jetzt kommt die Magie: voltsToPixels muss den **Umkreis** berücksichtigen
  const hexagonOuterToInRadius = 1 / Math.cos(Math.PI / 6); // ≈ 1.1547
  const voltsToPixels = maxRadiusPx / (Udc * hexagonOuterToInRadius / Math.sqrt(3));

  // => Der Inkreis (für deinen SVM-Kreis) ist jetzt:
  const circleRadius = (Udc / Math.sqrt(3)) * voltsToPixels;
  const hexagonOuterRadius = circleRadius * hexagonOuterToInRadius;

  const boxSize_px = boxSizeV * voltsToPixels;

  drawGrid(svg, centerX, centerY, width, height, boxSize_px);
  drawAxes(svg, centerX, centerY, width, height);
  if (showPhases) drawPhases(svg, centerX, centerY, circleRadius);
  drawDCLinkCircle(svg, centerX, centerY, circleRadius);

  if (showSVM) {
    drawSVMHexagon(svg, centerX, centerY, circleRadius);
    drawSVMSector(svg, centerX, centerY, u_alpha, u_beta, voltsToPixels, hexagonOuterRadius);
    drawSVMDecomposition(svg, centerX, centerY, u_alpha, u_beta, Udc, voltsToPixels, getSVMSector(u_alpha, u_beta));
  }

  drawVector(svg, centerX, centerY, u_alpha, u_beta, voltsToPixels);

}

// Einzelne Teilfunktionen

function drawGrid(svg, centerX, centerY, width, height, boxSize_px) {
  const xLines = Math.ceil(width / boxSize_px);
  const yLines = Math.ceil(height / boxSize_px);

  for (let i = -xLines; i <= xLines; i++) {
    svg.append("line")
      .attr("x1", centerX + i * boxSize_px)
      .attr("y1", 0)
      .attr("x2", centerX + i * boxSize_px)
      .attr("y2", height)
      .attr("stroke", "#000")
      .attr("stroke-width", 0.5);
  }

  for (let j = -yLines; j <= yLines; j++) {
    svg.append("line")
      .attr("x1", 0)
      .attr("y1", centerY + j * boxSize_px)
      .attr("x2", width)
      .attr("y2", centerY + j * boxSize_px)
      .attr("stroke", "#000")
      .attr("stroke-width", 0.5);
  }
}

function drawAxes(svg, centerX, centerY, width, height) {
  svg.append("line")
    .attr("x1", centerX)
    .attr("y1", 0)
    .attr("x2", centerX)
    .attr("y2", height)
    .attr("stroke", "black")
    .attr("stroke-width", 2);

  svg.append("line")
    .attr("x1", 0)
    .attr("y1", centerY)
    .attr("x2", width)
    .attr("y2", centerY)
    .attr("stroke", "black")
    .attr("stroke-width", 2);

  svg.append("text")
    .text("α")
    .attr("x", width - 20)
    .attr("y", centerY - 10)
    .attr("font-size", 16)
    .attr("fill", "black");

  svg.append("text")
    .text("β")
    .attr("x", centerX + 10)
    .attr("y", 20)
    .attr("font-size", 16)
    .attr("fill", "black");
}

function drawPhases(svg, centerX, centerY, radius) {
  const angles = [0, 120, 240];
  const labels = ["U", "V", "W"];

  angles.forEach((deg, i) => {
    const rad = deg * Math.PI / 180;
    const x = centerX + radius * Math.cos(rad);
    const y = centerY - radius * Math.sin(rad);

    svg.append("line")
  .attr("x1", centerX)
  .attr("y1", centerY)
  .attr("x2", x)
  .attr("y2", y)
  .attr("stroke", "black")
  .attr("stroke-width", 6)
  .attr("stroke-opacity", 0.3);  // transparenter Look

    svg.append("text")
      .text(labels[i])
      .attr("x", x + 5)
      .attr("y", y - 5)
      .attr("font-size", 14)
      .attr("fill", "black")
      .attr("font-family", "serif");
  });
}

function drawDCLinkCircle(svg, centerX, centerY, radius) {
  svg.append("circle")
    .attr("cx", centerX)
    .attr("cy", centerY)
    .attr("r", radius)
    .attr("stroke", "blue")
    .attr("stroke-width", 1.5)
    .attr("fill", "none");
}

function drawVector(svg, centerX, centerY, u_alpha, u_beta, scale) {
  const x2 = centerX + u_alpha * scale;
  const y2 = centerY - u_beta * scale;

  // Marker definieren (einmalig)
  svg.select("defs").remove();
  svg.append("defs").append("marker")
    .attr("id", "arrow")
    .attr("viewBox", "0 0 10 10")
    .attr("refX", 6)
    .attr("refY", 5)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M 0 0 L 10 5 L 0 10 z")
    .attr("fill", "red");

  svg.append("line")
    .attr("x1", centerX)
    .attr("y1", centerY)
    .attr("x2", x2)
    .attr("y2", y2)
    .attr("stroke", "red")
    .attr("stroke-width", 2)
    .attr("marker-end", "url(#arrow)");

  svg.append("text")
    .text(`(${u_alpha}, ${u_beta})`)
    .attr("x", x2 + 5)
    .attr("y", y2 - 5)
    .attr("font-size", 14)
    .attr("fill", "red")
    .attr("font-family", "serif");


  const magnitude = Math.sqrt(u_alpha ** 2 + u_beta ** 2);
  const labelX = (centerX + x2) / 2;
  const labelY = (centerY + y2) / 2;

  svg.append("text")
    .text(`${magnitude.toFixed(2)} V`)
    .attr("x", labelX + 5)
    .attr("y", labelY - 5)
    .attr("font-size", 14)
    .attr("fill", "red")
    .attr("font-family", "serif");
}

function drawSVMHexagon(svg, cx, cy, radius) {
    const sides = 6;
    const angleStep = (2 * Math.PI) / sides;
    const outerRadius = radius / Math.cos(Math.PI / sides); // Umkreisradius für das Hexagon
  
    // Die 6 PWM-Stellungen im Uhrzeigersinn
    const pwmStates = ["100", "110", "010", "011", "001", "101"];
  
    const points = [];
  
    for (let i = 0; i < sides; i++) {
      const angle = i * angleStep;
      const x = cx + outerRadius * Math.cos(angle);
      const y = cy - outerRadius * Math.sin(angle);
      points.push([x, y]);
  
      // Beschriftung der Ecke (leicht nach außen versetzt)
      const labelOffset = 20;
      const lx = cx + (outerRadius + labelOffset) * Math.cos(angle);
      const ly = cy - (outerRadius + labelOffset) * Math.sin(angle);
  
      svg.append("text")
        .text(pwmStates[i])
        .attr("x", lx)
        .attr("y", ly)
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle")
        .attr("font-size", 14)
        .attr("fill", "black")
        .attr("font-family", "monospace");
    }
  
    // Verbinde alle Punkte zum Hexagon
    const pathData = points.map(p => p.join(",")).join(" ");
    svg.append("polygon")
      .attr("points", pathData)
      .attr("stroke", "black")
      .attr("stroke-width", 2)
      .attr("fill", "none");
}

function getSVMSector(u_alpha, u_beta) {
  let angle = Math.atan2(u_beta, u_alpha); // -π bis π
  if (angle < 0) angle += 2 * Math.PI; // umrechnen auf [0, 2π)

  const sector = Math.floor(angle / (Math.PI / 3)) + 1; // 60° pro Sektor
  return sector > 6 ? 6 : sector; // clamp falls exakt 2π
}

function getHexagonPoints(cx, cy, radius) {
  const points = [];
  const angleStep = (2 * Math.PI) / 6;

  for (let i = 0; i < 6; i++) {
    const angle = i * angleStep;
    const x = cx + radius * Math.cos(angle);
    const y = cy - radius * Math.sin(angle);
    points.push([x, y]);
  }

  return points;
}

function drawSVMSector(svg, cx, cy, u_alpha, u_beta, voltsToPixels, hexRadius) {
  const sector = getSVMSector(u_alpha, u_beta);

  const points = getHexagonPoints(cx, cy, hexRadius);
  const i = (sector - 1) % 6;
  const j = (i + 1) % 6;

  const p1 = points[i];
  const p2 = points[j];

  // 1. Graue Fläche zwischen Zentrum und zwei Eckpunkten
  svg.append("polygon")
    .attr("points", `${cx},${cy} ${p1[0]},${p1[1]} ${p2[0]},${p2[1]}`)
    .attr("fill", "gray")
    .attr("fill-opacity", 0.3);

  // 2. Zeichne Vektoren zu den beiden Eckpunkten
  svg.append("line")
    .attr("x1", cx)
    .attr("y1", cy)
    .attr("x2", p1[0])
    .attr("y2", p1[1])
    .attr("stroke", "black")
    .attr("stroke-width", 3);

  svg.append("line")
    .attr("x1", cx)
    .attr("y1", cy)
    .attr("x2", p2[0])
    .attr("y2", p2[1])
    .attr("stroke", "black")
    .attr("stroke-width", 3);
}

function calculateSVMTimeShares(u_alpha, u_beta, sector, hexPoints, centerX, centerY) {
  const i = (sector - 1) % 6;
  const j = (i + 1) % 6;

  const p1 = hexPoints[i];
  const p2 = hexPoints[j];

  // Basisvektoren als Einheitsvektoren
  const v1 = [p1[0] - centerX, centerY - p1[1]]; // Y invertiert!
  const v2 = [p2[0] - centerX, centerY - p2[1]];

  // Spannungsvektor
  const us = [u_alpha, u_beta];

  // 2D-Vektorzerlegung → solve: us = T1 * v1 + T2 * v2
  const det = v1[0] * v2[1] - v1[1] * v2[0];

  if (Math.abs(det) < 1e-6) return { T1: 0, T2: 0 }; // numerische Sicherheit

  const T1 = (us[0] * v2[1] - us[1] * v2[0]) / det;
  const T2 = (v1[0] * us[1] - v1[1] * us[0]) / det;

  return { T1, T2, v1, v2 };
}

function drawSVMDecomposition(svg, cx, cy, u_alpha, u_beta, Udc, voltsToPixels, sector) {
  const arcRadius = 30;

  // 1. Hol dir die 6 Basisvektoren im Spannungsraum
  const basisVectors = getBasisVectorsInVolts(Udc);

  // 2. Zerlege Spannungszeiger in Basis-Vektoren T1, T2
  const { T1, T2, v1, v2 } = calculateSVMTimeSharesPhysical(u_alpha, u_beta, sector, basisVectors);

  // 3. Wandle Zerlegungspfeile in Canvas (Pixel) um
  const T1VecPx = [v1[0] * T1 * voltsToPixels, -v1[1] * T1 * voltsToPixels];
  const T2VecPx = [v2[0] * T2 * voltsToPixels, -v2[1] * T2 * voltsToPixels];

  const P1 = [cx + T1VecPx[0], cy + T1VecPx[1]];
  const P2 = [P1[0] + T2VecPx[0], P1[1] + T2VecPx[1]];

  // 4. Zeichne Vektoren
  svg.append("line")
    .attr("x1", cx)
    .attr("y1", cy)
    .attr("x2", P1[0])
    .attr("y2", P1[1])
    .attr("stroke", "darkgreen")
    .attr("stroke-width", 3)
    .attr("marker-end", "url(#arrow-green)");

  svg.append("line")
    .attr("x1", P1[0])
    .attr("y1", P1[1])
    .attr("x2", P2[0])
    .attr("y2", P2[1])
    .attr("stroke", "darkgreen")
    .attr("stroke-width", 3)
    .attr("marker-end", "url(#arrow-green)");

  // Für T1
  const T1_percent = Math.round(T1 * 100);
  svg.append("text")
    .text(`${T1_percent}%`)
    .attr("x", (cx + P1[0]) / 2 + 5)
    .attr("y", (cy + P1[1]) / 2 - 5)
    .attr("font-size", 12)
    .attr("fill", "darkgreen")
    .attr("font-family", "serif");

  // Für T2
  const T2_percent = Math.round(T2 * 100);
  svg.append("text")
    .text(`${T2_percent}%`)
    .attr("x", (P1[0] + P2[0]) / 2 + 5)
    .attr("y", (P1[1] + P2[1]) / 2 - 5)
    .attr("font-size", 12)
    .attr("fill", "darkgreen")
    .attr("font-family", "serif");

  // 5. Roter Winkelbogen + Beschriftung
  const angle1 = Math.atan2(v1[1], v1[0]);
  const angle2 = Math.atan2(u_beta, u_alpha);
  let angleDiff = angle2 - angle1;
  if (angleDiff < 0) angleDiff += 2 * Math.PI;

  const largeArcFlag = angleDiff > Math.PI ? 1 : 0;
  const sweepFlag = 0; // Gegen Uhrzeigersinn = mathematisch korrekt

  const arcStart = cx + arcRadius * Math.cos(angle1);
  const arcStartY = cy - arcRadius * Math.sin(angle1);
  const arcEnd = cx + arcRadius * Math.cos(angle2);
  const arcEndY = cy - arcRadius * Math.sin(angle2);

  svg.append("path")
    .attr("d", `M${arcStart},${arcStartY} A${arcRadius},${arcRadius} 0 ${largeArcFlag} ${sweepFlag} ${arcEnd},${arcEndY}`)
    .attr("stroke", "red")
    .attr("fill", "none")
    .attr("stroke-width", 2);

  const midAngle = angle1 + angleDiff / 2;
  const labelX = cx + (arcRadius + 10) * Math.cos(midAngle);
  const labelY = cy - (arcRadius + 10) * Math.sin(midAngle);

  svg.append("text")
    .text(`${Math.round((angleDiff * 180) / Math.PI)}°`)
    .attr("x", labelX)
    .attr("y", labelY)
    .attr("fill", "red")
    .attr("font-size", 14)
    .attr("font-family", "serif");


    const pwmPhases = getPhasePWM(T1, T2, sector); // [U%, V%, W%]

    svg.append("text")
      .text(`PWM U: ${pwmPhases[0]}%`)
      .attr("x", 20)
      .attr("y", 30)
      .attr("font-size", 14)
      .attr("fill", "black")
      .attr("font-family", "serif");
    
    svg.append("text")
      .text(`PWM V: ${pwmPhases[1]}%`)
      .attr("x", 20)
      .attr("y", 50)
      .attr("font-size", 14)
      .attr("fill", "black")
      .attr("font-family", "serif");
    
    svg.append("text")
      .text(`PWM W: ${pwmPhases[2]}%`)
      .attr("x", 20)
      .attr("y", 70)
      .attr("font-size", 14)
      .attr("fill", "black")
      .attr("font-family", "serif");
}

function getBasisVectorsInVolts(Udc) {
  const magnitude = (2 / 3) * Udc;
  const angleStep = (2 * Math.PI) / 6;
  const vectors = [];

  for (let i = 0; i < 6; i++) {
    const angle = i * angleStep;
    const vx = magnitude * Math.cos(angle);
    const vy = magnitude * Math.sin(angle);
    vectors.push([vx, vy]);
  }

  return vectors;
}

function calculateSVMTimeSharesPhysical(u_alpha, u_beta, sector, basisVectors) {
  const i = (sector - 1) % 6;
  const j = (i + 1) % 6;

  const v1 = basisVectors[i];
  const v2 = basisVectors[j];
  const us = [u_alpha, u_beta];

  const det = v1[0] * v2[1] - v1[1] * v2[0];

  if (Math.abs(det) < 1e-6) return { T1: 0, T2: 0, v1, v2 };

  const T1 = (us[0] * v2[1] - us[1] * v2[0]) / det;
  const T2 = (v1[0] * us[1] - v1[1] * us[0]) / det;

  return { T1, T2, v1, v2 };
}

function getPhasePWM(T1, T2, sector) {
  const T0 = 1 - (T1 + T2);

  // Basiszustände nach Sektor (wie SVM-Standard)
  // Jeder Sektor liegt zwischen zwei aktiven Vektoren
  // Vektorzustände [U, V, W] für Basis 1 und 2:
  const baseMap = {
    1: [[1, 0, 0], [1, 1, 0]], // 100, 110
    2: [[1, 1, 0], [0, 1, 0]], // 110, 010
    3: [[0, 1, 0], [0, 1, 1]], // 010, 011
    4: [[0, 1, 1], [0, 0, 1]], // 011, 001
    5: [[0, 0, 1], [1, 0, 1]], // 001, 101
    6: [[1, 0, 1], [1, 0, 0]], // 101, 100
  };

  const [b1, b2] = baseMap[sector];

  // PWM = T1 * Vektor1 + T2 * Vektor2 + T0/2 * Nullvektor
  const pwm = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    pwm[i] = T1 * b1[i] + T2 * b2[i] + T0 / 2;
  }

  return pwm.map(v => Math.round(v * 100));
}