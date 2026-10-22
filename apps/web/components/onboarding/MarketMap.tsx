"use client";

import { useEffect, useRef } from "react";
import type { NearbyClinic } from "@clinix/contracts";
import { distanceLabel, reviewsLabel } from "@/lib/overview";
import "leaflet/dist/leaflet.css";

const PIN = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 26 34"><path d="M13 0C5.8 0 0 5.6 0 12.6 0 22 13 34 13 34s13-12 13-21.4C26 5.6 20.2 0 13 0Z" fill="#4f46e5"/><circle cx="13" cy="12.5" r="5" fill="#fff"/></svg>`;

/** The clinic's neighbourhood: pale street map, a dashed circle for the search radius, a red dot per competitor, the clinic's own pin. */
export function MarketMap({ center, radiusKm, clinics, name }: { center: { lat: number; lng: number }; radiusKm: number; clinics: NearbyClinic[]; name: string }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let map: import("leaflet").Map | undefined;
    let cancelled = false;
    (async () => {
      try {
        const L = (await import("leaflet")).default;
        if (cancelled || !host.current) return;
        map = L.map(host.current, { center: [center.lat, center.lng], zoom: 12, minZoom: 10, maxZoom: 18, zoomControl: false, scrollWheelZoom: false });
        L.control.zoom({ position: "topright" }).addTo(map);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, className: "clinx-pale-tiles", attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
        const ring = L.circle([center.lat, center.lng], { radius: radiusKm * 1000, color: "#4f46e5", weight: 1.5, dashArray: "5 6", fillColor: "#4f46e5", fillOpacity: 0.07, interactive: false }).addTo(map);
        for (const c of clinics) {
          const tip = document.createElement("div");
          tip.textContent = [c.name, c.rating !== undefined ? `${c.rating.toFixed(1)}★${c.reviewCount !== undefined ? ` (${reviewsLabel(c.reviewCount)})` : ""}` : "", distanceLabel(c.distanceKm)].filter(Boolean).join(" · ");
          L.circleMarker([c.lat, c.lng], { radius: 6, color: "#ffffff", weight: 2, fillColor: "#e5484d", fillOpacity: 1 }).bindTooltip(tip).addTo(map);
        }
        const label = document.createElement("div");
        label.className = "clinx-pin";
        label.innerHTML = PIN;
        const text = document.createElement("span");
        text.textContent = "Your clinic";
        label.appendChild(text);
        L.marker([center.lat, center.lng], { icon: L.divIcon({ html: label, className: "", iconSize: [30, 40], iconAnchor: [15, 40] }), keyboard: false, zIndexOffset: 1000 }).addTo(map);
        map.fitBounds(ring.getBounds(), { padding: [16, 16] });
      } catch {
        /* without the map the card still has the numbers and the list */
      }
    })();
    return () => { cancelled = true; map?.remove(); };
  }, [center.lat, center.lng, radiusKm, clinics]);
  return <div ref={host} role="img" aria-label={`Map of the clinics near ${name}`} className="h-[300px] w-full overflow-hidden rounded-2xl border border-[#ecedf5] bg-[#eef0f6]" />;
}
