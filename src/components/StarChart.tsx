"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface Star {
  x: number;
  y: number;
  r: number;
  opacity: number;
  name?: string;
}

interface Constellation {
  stars: [number, number][];
}

const CONSTELLATIONS: Constellation[] = [
  { stars: [[82, 45], [95, 52], [110, 58], [125, 55], [140, 48]] },
  { stars: [[200, 80], [195, 95], [185, 115], [175, 130], [170, 145]] },
  { stars: [[220, 160], [235, 150], [250, 145], [260, 155], [255, 170]] },
  { stars: [[130, 170], [145, 165], [160, 172], [150, 185]] },
  { stars: [[50, 120], [65, 115], [80, 118], [75, 130], [55, 128]] },
  { stars: [[180, 40], [192, 50], [205, 48], [198, 35]] },
  { stars: [[60, 200], [75, 210], [90, 205], [85, 195], [70, 192]] },
  { stars: [[240, 80], [248, 92], [260, 88], [255, 75]] },
];

export default function StarChart() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth || 300;
    const height = svgRef.current.clientHeight || 300;
    const cx = width / 2;
    const cy = height / 2;
    const r = Math.min(width, height) / 2 - 20;

    svg.selectAll("*").remove();

    const defs = svg.append("defs");
    const bgGrad = defs.append("radialGradient").attr("id", "sc-bg");
    bgGrad.append("stop").attr("offset", "0%").attr("stop-color", "#1a1a4a");
    bgGrad.append("stop").attr("offset", "100%").attr("stop-color", "#0a0a1a");

    const glowGrad = defs.append("radialGradient").attr("id", "sc-glow");
    glowGrad.append("stop").attr("offset", "0%").attr("stop-color", "#6c63ff").attr("stop-opacity", 0.3);
    glowGrad.append("stop").attr("offset", "100%").attr("stop-color", "#6c63ff").attr("stop-opacity", 0);

    svg.append("circle").attr("cx", cx).attr("cy", cy).attr("r", r).attr("fill", "url(#sc-bg)").attr("stroke", "#3a3a6a").attr("stroke-width", 1);

    const tickVals = d3.range(0, 360, 30);
    tickVals.forEach((deg) => {
      const rad = (deg - 90) * (Math.PI / 180);
      svg.append("line")
        .attr("x1", cx + (r - 10) * Math.cos(rad)).attr("y1", cy + (r - 10) * Math.sin(rad))
        .attr("x2", cx + r * Math.cos(rad)).attr("y2", cy + r * Math.sin(rad))
        .attr("stroke", "#4a4a7a").attr("stroke-width", 1);
    });

    [0.25, 0.5, 0.75, 1].forEach((ratio) => {
      svg.append("circle").attr("cx", cx).attr("cy", cy).attr("r", r * ratio)
        .attr("fill", "none").attr("stroke", "#2a2a5a").attr("stroke-width", 0.5).attr("stroke-dasharray", "3,3");
    });

    CONSTELLATIONS.forEach((constellation) => {
      const points = constellation.stars.map(([az, alt]) => {
        const rad = (az - 90) * (Math.PI / 180);
        const dist = (alt / 90) * r * 0.85;
        return { x: cx + dist * Math.cos(rad), y: cy + dist * Math.sin(rad) };
      });

      svg.append("path")
        .attr("d", points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" "))
        .attr("fill", "none").attr("stroke", "#6c63ff").attr("stroke-width", 0.8).attr("opacity", 0.5);

      points.forEach((p) => {
        svg.append("circle").attr("cx", p.x).attr("cy", p.y).attr("r", 2)
          .attr("fill", "#aab").attr("opacity", 0.6);
      });
    });

    const planets = [
      { name: "Jupiter", alt: 45, az: 120, mag: -2.5 },
      { name: "Venus", alt: 25, az: 260, mag: -4.2 },
      { name: "Mars", alt: 60, az: 30, mag: -0.5 },
      { name: "Saturn", alt: 15, az: 190, mag: 0.7 },
      { name: "Mercury", alt: 5, az: 280, mag: -0.3 },
    ];

    planets.forEach((p) => {
      const rad = ((p.az - 90) % 360) * (Math.PI / 180);
      const dist = (p.alt / 90) * r * 0.85;
      const px = cx + dist * Math.cos(rad);
      const py = cy + dist * Math.sin(rad);
      const size = Math.max(3, 6 + (p.mag || 0) * -0.5);

      svg.append("circle").attr("cx", px).attr("cy", py).attr("r", size)
        .attr("fill", p.name === "Mars" ? "#ff6644" : p.name === "Venus" ? "#ffdd88" : "#88ccff")
        .attr("opacity", p.alt > 10 ? 1 : 0.4);
      svg.append("text").attr("x", px + 10).attr("y", py + 4)
        .attr("fill", "#aab").attr("font-size", 8).text(p.name);
    });

    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const dist = Math.random() * r * 0.9;
      const sz = 0.3 + Math.random() * 1.5;
      svg.append("circle").attr("cx", cx + dist * Math.cos(angle)).attr("cy", cy + dist * Math.sin(angle))
        .attr("r", sz).attr("fill", "#fff").attr("opacity", 0.2 + Math.random() * 0.8);
    }

    svg.append("text").attr("x", cx).attr("y", 14)
      .attr("fill", "#6c63ff").attr("font-size", 10).attr("text-anchor", "middle").attr("font-weight", 600)
      .text("STAR CHART");

    ["N", "E", "S", "W"].forEach((dir, i) => {
      const angle = i * 90 - 90;
      const rad = angle * (Math.PI / 180);
      svg.append("text").attr("x", cx + (r + 15) * Math.cos(rad)).attr("y", cy + (r + 15) * Math.sin(rad))
        .attr("fill", "#6a6a9a").attr("font-size", 9).attr("text-anchor", "middle").attr("dy", "0.3em").text(dir);
    });
  }, []);

  return (
    <svg ref={svgRef} className="w-full h-full" style={{ minHeight: 260 }} viewBox="0 0 300 300" preserveAspectRatio="xMidYMid meet" />
  );
}
