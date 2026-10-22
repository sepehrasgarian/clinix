"use client";

import { useEffect, useRef } from "react";
import type { CompetitorCandidate } from "@clinix/contracts";
import "leaflet/dist/leaflet.css";

type Marker = import("leaflet").CircleMarker;
const style = (selected: boolean, active: boolean) => ({ radius: active ? 10 : 7, color: active ? "#4f46e5" : "#ffffff", weight: active ? 3 : 2, fillColor: selected ? "#4f46e5" : "#ffffff", fillOpacity: 1 });

/**
 * The candidates on a pale street map around the owner's clinic. A marker is filled when chosen and enlarged when its card is
 * active; clicking one reports it so the list can scroll to its card. Built once; later changes only restyle the markers.
 */
export function CompetitorMap({ center, candidates, selectedIds, activeId, onPick, name }: { center: { lat: number; lng: number }; candidates: CompetitorCandidate[]; selectedIds: string[]; activeId: string | null; onPick: (placeId: string) => void; name: string }) {
  const host = useRef<HTMLDivElement>(null);
  const markers = useRef(new Map<string, Marker>());
  const pick = useRef(onPick);
  pick.current = onPick;
  const latest = useRef({ selectedIds, activeId });
  latest.current = { selectedIds, activeId };

  useEffect(() => {
    let map: import("leaflet").Map | undefined;
    let cancelled = false;
    const own = markers.current;
    (async () => {
      try {
        const L = (await import("leaflet")).default;
        if (cancelled || !host.current) return;
        map = L.map(host.current, { center: [center.lat, center.lng], zoom: 12, zoomControl: false, scrollWheelZoom: false });
        L.control.zoom({ position: "topright" }).addTo(map);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, className: "clinx-pale-tiles", attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
        const points: [number, number][] = [[center.lat, center.lng]];
        for (const c of candidates) {
          const { selectedIds: sel, activeId: act } = latest.current;
          const tip = document.createElement("div");
          tip.textContent = c.place.name;
          const m = L.circleMarker([c.place.lat, c.place.lng], style(sel.includes(c.place.placeId), act === c.place.placeId)).bindTooltip(tip).on("click", () => pick.current(c.place.placeId)).addTo(map);
          own.set(c.place.placeId, m);
          points.push([c.place.lat, c.place.lng]);
        }
        const label = document.createElement("div");
        label.className = "clinx-pin";
        label.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 26 34"><path d="M13 0C5.8 0 0 5.6 0 12.6 0 22 13 34 13 34s13-12 13-21.4C26 5.6 20.2 0 13 0Z" fill="#161a3a"/><circle cx="13" cy="12.5" r="5" fill="#fff"/></svg>`;
        L.marker([center.lat, center.lng], { icon: L.divIcon({ html: label, className: "", iconSize: [30, 40], iconAnchor: [15, 40] }), keyboard: false, zIndexOffset: 1000 }).addTo(map);
        map.fitBounds(L.latLngBounds(points), { padding: [28, 28], maxZoom: 14 });
      } catch {
        /* without the map the list still works */
      }
    })();
    return () => { cancelled = true; own.clear(); map?.remove(); };
  }, [center.lat, center.lng, candidates]);

  useEffect(() => {
    for (const [id, m] of markers.current) {
      m.setStyle(style(selectedIds.includes(id), activeId === id));
      if (activeId === id) m.bringToFront();
    }
  }, [selectedIds, activeId, candidates]);

  return <div ref={host} role="img" aria-label={`Map of competitor candidates near ${name}`} className="h-[240px] w-full overflow-hidden rounded-2xl border border-[#ecedf5] bg-[#eef0f6]" />;
}
