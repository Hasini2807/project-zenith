"use client";

import { useStore } from "@/store/useStore";
import { useEffect, useState } from "react";

function getMoonPhase(date: Date): { phase: string; emoji: string; illumination: number } {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const c =
    1.0 *
      255.1443 *
      (1.0 +
        Math.sin(
          ((2 * Math.PI * ((d + (m < 3 ? (y - 2000) : (y - 2000))) % 29.53058867)) / 29.53058867) *
            2 *
            Math.PI
        ));
  const ill = Math.abs(Math.sin(((d + 1) / 29.53058867) * 2 * Math.PI));
  const age = ((d + 1) % 29.53058867) / 29.53058867;
  if (age < 0.03) return { phase: "New Moon", emoji: "🌑", illumination: 0 };
  if (age < 0.15) return { phase: "Waxing Crescent", emoji: "🌒", illumination: ill };
  if (age < 0.25) return { phase: "First Quarter", emoji: "🌓", illumination: 0.5 };
  if (age < 0.38) return { phase: "Waxing Gibbous", emoji: "🌔", illumination: ill };
  if (age < 0.47) return { phase: "Full Moon", emoji: "🌕", illumination: 1 };
  if (age < 0.53) return { phase: "Full Moon", emoji: "🌕", illumination: 1 };
  if (age < 0.65) return { phase: "Waning Gibbous", emoji: "🌖", illumination: ill };
  if (age < 0.75) return { phase: "Last Quarter", emoji: "🌗", illumination: 0.5 };
  if (age < 0.88) return { phase: "Waning Crescent", emoji: "🌘", illumination: ill };
  return { phase: "New Moon", emoji: "🌑", illumination: 0 };
}

const EVENTS = [
  { date: "Jun 21", title: "Summer Solstice", icon: "☀" },
  { date: "Jul 5", title: "Earth at Aphelion", icon: "🌍" },
  { date: "Jul 28", title: "Delta Aquariids Peak", icon: "☄" },
  { date: "Aug 12", title: "Perseids Meteor Shower", icon: "☄" },
  { date: "Sep 7", title: "Saturn at Opposition", icon: "♄" },
];

export default function SkyInfo() {
  const location = useStore((s) => s.location);
  const locationName = useStore((s) => s.locationName);
  const activeLayers = useStore((s) => s.activeLayers);
  const toggleLayer = useStore((s) => s.toggleLayer);
  const [satCount, setSatCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/celestrak?group=active")
      .then((r) => r.json())
      .then((d) => setSatCount(d.count || d.satellites?.length || null))
      .catch(() => setSatCount(null));
  }, []);

  const planets = [
    { name: "Jupiter", alt: "45°", az: "120°", visible: true, icon: "♃" },
    { name: "Venus", alt: "25°", az: "260°", visible: true, icon: "♀" },
    { name: "Mars", alt: "60°", az: "30°", visible: true, icon: "♂" },
    { name: "Saturn", alt: "15°", az: "190°", visible: true, icon: "♄" },
    { name: "Mercury", alt: "5°", az: "280°", visible: false, icon: "☿" },
  ];

  const now = new Date();
  const moon = getMoonPhase(now);
  const isDaytime = now.getHours() >= 7 && now.getHours() < 20;

  return (
    <div className="h-full overflow-y-auto space-y-3 p-3">
      <div className="bg-[#0d0d2b]/80 rounded-xl p-3 border border-[#2a2a5a]">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Location</h3>
        <p className="text-sm font-medium text-white truncate">{locationName || "Not set"}</p>
        {location && (
          <p className="text-xs text-zinc-400 mt-0.5">
            {location.lat.toFixed(4)}°N, {location.lng.toFixed(4)}°E
          </p>
        )}
        <p className="text-xs text-zinc-500 mt-1">
          {now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          {" · "}
          {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#0d0d2b]/80 rounded-xl p-3 border border-[#2a2a5a]">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Moon</h3>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{moon.emoji}</span>
            <div>
              <p className="text-sm text-white font-medium">{moon.phase}</p>
              <p className="text-xs text-zinc-400">{Math.round(moon.illumination * 100)}% lit</p>
            </div>
          </div>
        </div>

        <div className="bg-[#0d0d2b]/80 rounded-xl p-3 border border-[#2a2a5a]">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Daylight</h3>
          <div className="flex items-center gap-2">
            <span className="text-xl">{isDaytime ? "☀" : "🌙"}</span>
            <div>
              <p className="text-sm text-white font-medium">{isDaytime ? "Daytime" : "Nighttime"}</p>
              <p className="text-xs text-zinc-400">↑ 06:42 · ↓ 19:53</p>
            </div>
          </div>
          <div className="w-full bg-[#1a1a3a] rounded-full h-1 mt-2">
            <div className="h-1 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500" style={{ width: isDaytime ? "65%" : "35%" }} />
          </div>
        </div>
      </div>

      {satCount !== null && (
        <div className="bg-[#0d0d2b]/80 rounded-xl p-3 border border-[#2a2a5a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#44ffaa] animate-pulse" />
            <span className="text-xs text-zinc-400">Tracked Satellites</span>
          </div>
          <span className="text-lg font-bold text-white">{satCount.toLocaleString()}</span>
        </div>
      )}

      <div className="bg-[#0d0d2b]/80 rounded-xl p-3 border border-[#2a2a5a]">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
          Visible Planets
        </h3>
        <div className="space-y-1.5">
          {planets.map((p) => (
            <div key={p.name} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <span className="text-base w-5 text-center">{p.icon}</span>
                <span className="text-sm text-white">{p.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">{p.alt} / {p.az}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${p.visible ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-500/20 text-zinc-400"}`}>
                  {p.visible ? "↑" : "↓"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0d0d2b]/80 rounded-xl p-3 border border-[#2a2a5a]">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
          Upcoming Events
        </h3>
        <div className="space-y-1.5">
          {EVENTS.slice(0, 4).map((ev, i) => (
            <div key={i} className="flex items-center gap-2 py-1">
              <span className="text-sm w-5 text-center">{ev.icon}</span>
              <span className="text-xs text-zinc-500 w-14">{ev.date}</span>
              <span className="text-sm text-white">{ev.title}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0d0d2b]/80 rounded-xl p-3 border border-[#2a2a5a]">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
          Map Layers
        </h3>
        <div className="space-y-1.5">
          {[
            { key: "planets" as const, label: "Planets", color: "#88ccff" },
            { key: "iss" as const, label: "ISS", color: "#ffaa00" },
            { key: "satellites" as const, label: "Satellites", color: "#44ffaa" },
            { key: "constellations" as const, label: "Constellations", color: "#ff66aa" },
          ].map((layer) => (
            <button key={layer.key} onClick={() => toggleLayer(layer.key)}
              className="flex items-center justify-between w-full py-1.5 px-2 rounded-lg hover:bg-[#1a1a3a] transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm border" style={{ backgroundColor: activeLayers[layer.key] ? layer.color : "transparent", borderColor: layer.color }} />
                <span className="text-sm text-zinc-300">{layer.label}</span>
              </div>
              <span className={`text-[10px] ${activeLayers[layer.key] ? "text-emerald-400" : "text-zinc-500"}`}>
                {activeLayers[layer.key] ? "ON" : "OFF"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {location && (
        <a href="/" className="block text-center text-xs text-zinc-500 hover:text-zinc-300 transition-colors py-2">
          ← Change location
        </a>
      )}
    </div>
  );
}
