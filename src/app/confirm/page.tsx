"use client";

import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { useEffect, useState } from "react";

export default function ConfirmPage() {
  const router = useRouter();
  const location = useStore((s) => s.location);
  const locationName = useStore((s) => s.locationName);
  const setDateTime = useStore((s) => s.setDateTime);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 16));
  const [timezone, setTimezone] = useState("");

  useEffect(() => {
    if (!location) {
      router.replace("/");
      return;
    }
    try {
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch {
      setTimezone("UTC");
    }
  }, [location, router]);

  function handleConfirm() {
    setDateTime(new Date(selectedDate));
    router.push("/dashboard");
  }

  if (!location) return null;

  return (
    <div className="h-full flex flex-col">
      <header className="flex items-center gap-3 px-6 py-4 bg-[#0a0a1a]/90 backdrop-blur-md border-b border-[#1a1a3a]">
        <button
          onClick={() => router.push("/")}
          className="text-zinc-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-white">Confirm Location</h1>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="bg-[#0d0d2b] rounded-2xl p-6 border border-[#2a2a5a]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#6c63ff]/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#6c63ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-white font-semibold">{locationName}</h2>
                <p className="text-sm text-zinc-400">
                  {location.lat.toFixed(4)}°N, {location.lng.toFixed(4)}°E
                </p>
              </div>
            </div>

            <div className="h-40 rounded-xl bg-[#1a1a3a] overflow-hidden mb-4 border border-[#2a2a5a]">
              <iframe
                title="Map preview"
                width="100%"
                height="100%"
                frameBorder="0"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.lng - 5},${location.lat - 5},${location.lng + 5},${location.lat + 5}&layer=mapnik&marker=${location.lat},${location.lng}`}
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1.5">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-[#1a1a3a] border border-[#3a3a6a] text-white focus:outline-none focus:border-[#6c63ff] transition-colors text-sm"
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Timezone: <span className="text-zinc-300">{timezone || "Loading..."}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Stargazing: <span className="text-emerald-400">Good conditions</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleConfirm}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#6c63ff] to-[#4a42d4] hover:from-[#5a52e0] hover:to-[#3a32c4] transition-all font-semibold text-white shadow-lg shadow-[#6c63ff]/20"
          >
            View Sky from Here
          </button>

          <p className="text-center text-xs text-zinc-500">
            Defaults to &ldquo;now.&rdquo; Adjust time to preview the sky at a different moment.
          </p>
        </div>
      </main>
    </div>
  );
}
