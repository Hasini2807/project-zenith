"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface PassEvent {
  satName: string;
  start: Date;
  end: Date;
  maxAlt: number;
  dir: string;
}

const passes: PassEvent[] = [
  { satName: "ISS (ZARYA)", start: new Date(Date.now() + 3600000 * 0.3), end: new Date(Date.now() + 3600000 * 0.7), maxAlt: 68, dir: "WSW" },
  { satName: "ISS (ZARYA)", start: new Date(Date.now() + 3600000 * 1.5), end: new Date(Date.now() + 3600000 * 1.9), maxAlt: 42, dir: "SW" },
  { satName: "NOAA 19", start: new Date(Date.now() + 3600000 * 2.2), end: new Date(Date.now() + 3600000 * 2.5), maxAlt: 35, dir: "SSW" },
  { satName: "NOAA 18", start: new Date(Date.now() + 3600000 * 3.0), end: new Date(Date.now() + 3600000 * 3.3), maxAlt: 28, dir: "S" },
  { satName: "Cosmos 2251", start: new Date(Date.now() + 3600000 * 4.5), end: new Date(Date.now() + 3600000 * 4.8), maxAlt: 52, dir: "W" },
];

export default function SatelliteTimeline() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const margin = { top: 20, right: 20, bottom: 30, left: 100 };
    const width = svgRef.current.clientWidth || 400;
    const height = 160;
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const now = new Date();
    const endTime = new Date(now.getTime() + 3600000 * 6);

    const xScale = d3.scaleTime().domain([now, endTime]).range([0, innerW]);
    const yScale = d3.scaleLinear().domain([0, 90]).range([innerH, 0]);

    const chart = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    chart
      .append("rect")
      .attr("width", innerW)
      .attr("height", innerH)
      .attr("fill", "#0d0d2b")
      .attr("rx", 6);

    chart
      .append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(
        (d3.axisBottom(xScale) as any)
          .ticks(6)
          .tickFormat((d: any) => {
            const t = new Date(d);
            return `${t.getHours()}:${String(t.getMinutes()).padStart(2, "0")}`;
          })
      )
      .selectAll("text")
      .attr("fill", "#6a6a9a")
      .attr("font-size", 9);

    chart
      .append("g")
      .call(d3.axisLeft(yScale).ticks(3))
      .selectAll("text")
      .attr("fill", "#6a6a9a")
      .attr("font-size", 9);

    passes.forEach((pass) => {
      const x1 = xScale(pass.start);
      const x2 = xScale(pass.end);
      const y1 = yScale(0);
      const y2 = yScale(pass.maxAlt);

      const gradientId = `pass-grad-${pass.satName.replace(/\s/g, "")}`;
      const grad = chart
        .append("defs")
        .append("linearGradient")
        .attr("id", gradientId)
        .attr("x1", "0%")
        .attr("y1", "100%")
        .attr("x2", "0%")
        .attr("y2", "0%");
      grad.append("stop").attr("offset", "0%").attr("stop-color", "#6c63ff").attr("stop-opacity", 0);
      grad.append("stop").attr("offset", "100%").attr("stop-color", "#6c63ff").attr("stop-opacity", 0.6);

      chart
        .append("path")
        .attr(
          "d",
          `M${x1},${y1} Q${(x1 + x2) / 2},${y2 * 0.3} ${x2},${y1}`
        )
        .attr("fill", "none")
        .attr("stroke", "#6c63ff")
        .attr("stroke-width", 2);

      chart
        .append("path")
        .attr(
          "d",
          `M${x1},${y1} Q${(x1 + x2) / 2},${y2 * 0.3} ${x2},${y1} L${x2},${y1 + 4} L${x1},${y1 + 4} Z`
        )
        .attr("fill", `url(#${gradientId})`)
        .attr("opacity", 0.3);

      const midX = (x1 + x2) / 2;
      chart
        .append("text")
        .attr("x", midX)
        .attr("y", y2 - 8)
        .attr("fill", "#aab")
        .attr("font-size", 8)
        .attr("text-anchor", "middle")
        .text(`${pass.maxAlt}° ${pass.dir}`);
    });

    const nowX = xScale(now);
    chart
      .append("line")
      .attr("x1", nowX)
      .attr("y1", 0)
      .attr("x2", nowX)
      .attr("y2", innerH)
      .attr("stroke", "#ff4466")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4,4");

    chart
      .append("text")
      .attr("x", 0)
      .attr("y", -6)
      .attr("fill", "#6c63ff")
      .attr("font-size", 10)
      .attr("font-weight", 600)
      .text("SATELLITE PASSES — NEXT 6 HOURS");
  }, []);

  return (
    <svg
      ref={svgRef}
      className="w-full"
      style={{ height: 160, minHeight: 160 }}
      preserveAspectRatio="xMidYMid meet"
    />
  );
}
