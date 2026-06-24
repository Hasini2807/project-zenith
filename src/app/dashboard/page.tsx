"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";

const Globe3D = dynamic(() => import("@/components/Globe3D"), { ssr: false });
const StarChart = dynamic(() => import("@/components/StarChart"), { ssr: false });
const SatelliteTimeline = dynamic(() => import("@/components/SatelliteTimeline"), { ssr: false });
const SkyInfo = dynamic(() => import("@/components/SkyInfo"), { ssr: false });

export default function DashboardPage() {
  const location = useStore((s) => s.location);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-full flex flex-col bg-[#0a0a1a]">
      <header className="flex items-center justify-between px-4 py-2.5 bg-[#0a0a1a]/95 backdrop-blur-md border-b border-[#1a1a3a] z-20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6c63ff] to-[#4a42d4] flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" />
            </svg>
          </div>
          <span className="font-bold text-white text-sm">Project Zenith</span>
          <span className="hidden sm:inline text-xs text-zinc-500 ml-2">
            {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </span>
          {location && (
            <span className="hidden md:inline text-xs text-zinc-500">
              {location.lat.toFixed(2)}°N, {location.lng.toFixed(2)}°E
            </span>
          )}
          <a href="/" className="text-xs text-zinc-400 hover:text-white transition-colors">
            Change
          </a>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-0 overflow-hidden">
        <div className="lg:col-span-3 relative flex flex-col overflow-hidden">
          <div className="flex-1 relative min-h-[45vh] lg:min-h-0">
            <Globe3D />
          </div>

          <div className="hidden lg:block border-t border-[#1a1a3a]">
            <div className="bg-[#0a0a1a] px-2 py-1.5">
              <SatelliteTimeline />
            </div>
          </div>
        </div>

        <aside className="lg:col-span-1 border-t lg:border-t-0 lg:border-l border-[#1a1a3a] overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <SkyInfo />
          </div>

          <div className="border-t border-[#1a1a3a] bg-[#0a0a1a]">
            <div className="p-1.5">
              <StarChart />
            </div>
          </div>

          <div className="lg:hidden border-t border-[#1a1a3a] bg-[#0a0a1a] px-2 py-1.5">
            <SatelliteTimeline />
          </div>
        </aside>
      </main>
    </div>
  );
}
