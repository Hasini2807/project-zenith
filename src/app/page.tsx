"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { useState } from "react";

const LocationMap = dynamic(() => import("@/components/LocationMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0a0a1a] rounded-xl">
      <div className="text-center">
        <svg className="animate-spin w-8 h-8 text-[#6c63ff] mx-auto mb-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-zinc-400 text-sm">Loading map...</p>
      </div>
    </div>
  ),
});

export default function LandingPage() {
  const router = useRouter();
  const setLocation = useStore((s) => s.setLocation);
  const [selected, setSelected] = useState<{ lat: number; lng: number; name: string } | null>(null);

  function handleLocationSelect(lat: number, lng: number, name: string) {
    setSelected({ lat, lng, name });
  }

  function handleContinue() {
    if (!selected) return;
    setLocation({ lat: selected.lat, lng: selected.lng }, selected.name);
    router.push("/confirm");
  }

  return (
    <div className="h-full flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 bg-[#0a0a1a]/90 backdrop-blur-md border-b border-[#1a1a3a] z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6c63ff] to-[#4a42d4] flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Project Zenith</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Celestial Awareness</p>
          </div>
        </div>
      </header>

      <main className="flex-1 relative p-4 pt-2">
        <div className="w-full h-full rounded-xl overflow-hidden border border-[#2a2a5a] relative">
          <LocationMap onLocationSelect={handleLocationSelect} />
        </div>
      </main>

      <footer className="px-6 py-4 bg-[#0a0a1a]/90 backdrop-blur-md border-t border-[#1a1a3a] flex items-center justify-between">
        <div>
          {selected ? (
            <p className="text-sm text-zinc-300 truncate max-w-[300px] sm:max-w-md">
              📍 {selected.name}
            </p>
          ) : (
            <p className="text-sm text-zinc-500">Click a location on the map or search above</p>
          )}
        </div>
        <button
          onClick={handleContinue}
          disabled={!selected}
          className="px-6 py-2.5 rounded-lg bg-[#6c63ff] hover:bg-[#5a52e0] disabled:opacity-30 disabled:cursor-not-allowed transition-all font-medium text-sm flex items-center gap-2"
        >
          Continue
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </footer>
    </div>
  );
}
