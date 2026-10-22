"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

const PIN = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="34" viewBox="0 0 26 34"><path d="M13 0C5.8 0 0 5.6 0 12.6 0 22 13 34 13 34s13-12 13-21.4C26 5.6 20.2 0 13 0Z" fill="#e5484d"/><circle cx="13" cy="12.5" r="5" fill="#fff"/></svg>`;

/** A small, still map centred on the clinic with a red pin. Leaflet and OpenStreetMap tiles; no key needed. */
export function LiveMap({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let map: import("leaflet").Map | undefined;
    let cancelled = false;
    (async () => {
      try {
        const L = (await import("leaflet")).default;
        if (cancelled || !host.current) return;
        map = L.map(host.current, { center: [lat, lng], zoom: 15, zoomControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false, touchZoom: false, attributionControl: true });
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);
        L.marker([lat, lng], { icon: L.divIcon({ html: PIN, className: "", iconSize: [26, 34], iconAnchor: [13, 34] }), interactive: false, keyboard: false }).addTo(map);
      } catch {
        /* the map is a nicety: without it the tile stays an empty grey box */
      }
    })();
    return () => { cancelled = true; map?.remove(); };
  }, [lat, lng]);
  return <div ref={host} role="img" aria-label={label} className="h-[110px] w-full overflow-hidden rounded-xl bg-[#eef2ec]" />;
}
