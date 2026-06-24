"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
}

export default function LocationMap({
  onLocationSelect,
}: {
  onLocationSelect: (lat: number, lng: number, name: string) => void;
}) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState<"idle" | "locating" | "searching">("idle");
  const [feedback, setFeedback] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || mapRef.current) return;

    const map = L.map("map", {
      center: [20, 0],
      zoom: 2,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer(TILE_URL, { maxZoom: 19, attribution: TILE_ATTR }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.control.attribution({ position: "bottomright", prefix: false }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setFeedback("");
      setShowSuggestions(false);
      placeMarker(lat, lng);
      fetchLocationName(lat, lng);
    });

    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  function placeMarker(lat: number, lng: number) {
    if (!mapRef.current) return;
    if (markerRef.current) markerRef.current.remove();
    const icon = L.divIcon({
      className: "",
      html: `<div style="width:20px;height:20px;background:#6c63ff;border:3px solid #a8a2ff;border-radius:50%;box-shadow:0 0 20px #6c63ff;"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
    markerRef.current = L.marker([lat, lng], { icon }).addTo(mapRef.current);
    mapRef.current.setView([lat, lng], 5, { animate: true });
  }

  async function fetchLocationName(lat: number, lng: number) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,
        { headers: { "User-Agent": "ProjectZenith/1.0" } }
      );
      if (!res.ok) throw new Error("Reverse geocode failed");
      const data = await res.json();
      onLocationSelect(lat, lng, data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } catch {
      onLocationSelect(lat, lng, `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  }

  const doSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setStatus("searching");
    setFeedback("");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
        { headers: { "User-Agent": "ProjectZenith/1.0" } }
      );
      if (!res.ok) throw new Error(`Nominatim returned ${res.status}`);
      const data: Suggestion[] = await res.json();
      if (data.length > 0) {
        const { lat, lon, display_name } = data[0];
        placeMarker(parseFloat(lat), parseFloat(lon));
        onLocationSelect(parseFloat(lat), parseFloat(lon), display_name);
        setSuggestions([]);
        setShowSuggestions(false);
        setFeedback("");
      } else {
        setFeedback(`No results for "${query}"`);
      }
    } catch {
      setFeedback("Search failed — check connection or try a different query");
    } finally {
      setStatus("idle");
    }
  }, [onLocationSelect]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setShowSuggestions(false);
    doSearch(searchQuery);
  }

  function handleInputChange(value: string) {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5&addressdetails=1`,
          { headers: { "User-Agent": "ProjectZenith/1.0" } }
        );
        if (!res.ok) return;
        const data: Suggestion[] = await res.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch {
        // silent fail for suggestions
      }
    }, 300);
  }

  function selectSuggestion(s: Suggestion) {
    setSearchQuery(s.display_name);
    setShowSuggestions(false);
    placeMarker(parseFloat(s.lat), parseFloat(s.lon));
    onLocationSelect(parseFloat(s.lat), parseFloat(s.lon), s.display_name);
    setFeedback("");
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      setFeedback("Geolocation not supported in this browser");
      return;
    }
    setStatus("locating");
    setFeedback("");
    setShowSuggestions(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        placeMarker(pos.coords.latitude, pos.coords.longitude);
        fetchLocationName(pos.coords.latitude, pos.coords.longitude);
        setStatus("idle");
      },
      () => {
        setFeedback("Could not get your location — check permissions");
        setStatus("idle");
      }
    );
  }

  return (
    <div className="relative w-full h-full">
      <div id="map" className="w-full h-full rounded-xl" style={{ minHeight: "300px" }} />

      <div className="absolute top-4 left-4 right-4 z-[10000] flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              autoComplete="off"
              placeholder="Search city or place..."
              className="flex-1 px-4 py-3 rounded-lg bg-[#1a1a3a]/90 backdrop-blur-md border border-[#3a3a6a] text-white placeholder-zinc-400 focus:outline-none focus:border-[#6c63ff] transition-colors"
            />
            <button
              type="submit"
              disabled={status === "searching"}
              className="px-5 py-3 rounded-lg bg-[#6c63ff] hover:bg-[#5a52e0] disabled:opacity-50 transition-all font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            </button>
          </form>
          {showSuggestions && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-lg bg-[#1a1a3a]/95 backdrop-blur-md border border-[#3a3a6a] overflow-hidden shadow-xl">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onMouseDown={() => selectSuggestion(s)}
                  className="w-full text-left px-4 py-2.5 text-sm text-zinc-200 hover:bg-[#2a2a5a] transition-colors border-b border-[#2a2a5a] last:border-b-0 truncate"
                >
                  {s.display_name}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={handleUseMyLocation}
          disabled={status === "locating"}
          className="px-5 py-3 rounded-lg bg-[#2a2a5a]/90 backdrop-blur-md border border-[#3a3a6a] hover:bg-[#3a3a7a] disabled:opacity-50 transition-all font-medium flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {status === "locating" ? "Locating..." : "Use My Location"}
        </button>
      </div>

      {feedback && (
        <div className="absolute top-20 left-4 right-4 z-[10000] mx-auto max-w-md">
          <div className="px-4 py-2 rounded-lg bg-red-900/60 backdrop-blur-md border border-red-700/50 text-red-200 text-sm text-center">
            {feedback}
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 z-[10000] text-xs text-zinc-500 bg-[#1a1a3a]/70 backdrop-blur-sm px-3 py-1.5 rounded-lg">
        Click anywhere on the map to select a location
      </div>
    </div>
  );
}
