"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type * as L from "leaflet";
import { Bike, RefreshCw, Store } from "lucide-react";
import * as api from "@/lib/admin/api";
import { useAsync } from "@/lib/seller/useAsync";
import type { MapRider, MapVendor } from "@/lib/admin/types";
import { formatDateTime } from "@/lib/seller/format";
import { Card, ErrorBanner, PageHeader, StatCard, Tabs, btn } from "@/components/admin/ui";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "vendors", label: "Stores" },
  { key: "riders", label: "Riders" },
] as const;
const KATHMANDU: [number, number] = [27.7172, 85.324];
const valid = (p: { latitude: number; longitude: number }) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude) && !(p.latitude === 0 && p.longitude === 0);
const riderColor = (r: MapRider) => (r.isBusy ? "#F59E0B" : r.isOnline ? "#10B981" : "#94A3B8");

/** app: Screens/adminScreens/map.tsx — stores + riders on a live map (auto-refresh every 20s) */
export default function LiveFleetRadarPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const q = useAsync(() => api.getLiveMapData(), "live-map");
  const { reload } = q;
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const leafletRef = useRef<typeof L | null>(null);
  const [ready, setReady] = useState(false);
  const fitted = useRef(false);

  useEffect(() => {
    const id = window.setInterval(reload, 20000);
    return () => window.clearInterval(id);
  }, [reload]);

  // Create the map once (Leaflet touches window, so it is imported on the client only)
  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((mod) => {
      const Lf = (mod as unknown as { default?: typeof L }).default || (mod as unknown as typeof L);
      if (cancelled || !mapEl.current || mapRef.current) return;
      leafletRef.current = Lf;
      const map = Lf.map(mapEl.current, { zoomControl: true }).setView(KATHMANDU, 12);
      Lf.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors" }).addTo(map);
      layerRef.current = Lf.layerGroup().addTo(map);
      mapRef.current = map;
      setReady(true);
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  const vendors = useMemo(() => (q.data?.vendors || []).filter(valid), [q.data]);
  const riders = useMemo(() => (q.data?.riders || []).filter(valid), [q.data]);

  // Redraw markers whenever data or filter changes
  useEffect(() => {
    const Lf = leafletRef.current;
    const layer = layerRef.current;
    const map = mapRef.current;
    if (!ready || !Lf || !layer || !map) return;
    layer.clearLayers();
    const pts: Array<[number, number]> = [];
    const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
    if (filter !== "riders") {
      vendors.forEach((v: MapVendor) => {
        pts.push([v.latitude, v.longitude]);
        Lf.circle([v.latitude, v.longitude], { radius: (v.radiusKm || 5) * 1000, color: "#0284C7", weight: 1, fillOpacity: 0.04 }).addTo(layer);
        Lf.circleMarker([v.latitude, v.longitude], { radius: 8, color: "#fff", weight: 2, fillColor: v.isOpen ? "#0284C7" : "#64748B", fillOpacity: 1 })
          .bindPopup(`<b>${esc(v.name)}</b><br/>${v.isOpen ? "Open" : "Closed"} · ${v.radiusKm || 5} km radius${v.phone ? `<br/>${esc(v.phone)}` : ""}`)
          .addTo(layer);
      });
    }
    if (filter !== "vendors") {
      riders.forEach((r: MapRider) => {
        pts.push([r.latitude, r.longitude]);
        Lf.circleMarker([r.latitude, r.longitude], { radius: 6, color: "#fff", weight: 2, fillColor: riderColor(r), fillOpacity: 1 })
          .bindPopup(`<b>${esc(r.name)}</b><br/>${esc(r.availability || "")}${r.phone ? `<br/>${esc(r.phone)}` : ""}${r.lastUpdated ? `<br/>Updated ${esc(formatDateTime(r.lastUpdated))}` : ""}`)
          .addTo(layer);
      });
    }
    if (!fitted.current && pts.length) {
      map.fitBounds(Lf.latLngBounds(pts), { padding: [40, 40], maxZoom: 14 });
      fitted.current = true;
    }
  }, [ready, filter, vendors, riders]);

  return (
    <>
      <PageHeader
        title="Live Fleet Radar"
        subtitle={q.data?.timestamp ? `Last updated ${formatDateTime(q.data.timestamp)} · refreshes every 20 seconds` : "Stores and delivery partners in real time"}
        actions={<button type="button" onClick={reload} className={btn.outline}><RefreshCw className={`w-4 h-4 ${q.loading ? "animate-spin" : ""}`} /> Refresh</button>}
      />
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Stores on map" value={vendors.length} sub={`${vendors.filter((v) => v.isOpen).length} open`} icon={Store} />
          <StatCard label="Riders tracked" value={riders.length} icon={Bike} tone="teal" />
          <StatCard label="Online" value={riders.filter((r) => r.isOnline && !r.isBusy).length} tone="green" />
          <StatCard label="On delivery" value={riders.filter((r) => r.isBusy).length} tone="amber" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs tabs={FILTERS} active={filter} onChange={setFilter} />
          <div className="flex flex-wrap gap-3 text-xs text-slate-600">
            {[["#0284C7", "Open store"], ["#64748B", "Closed store"], ["#10B981", "Rider online"], ["#F59E0B", "Rider busy"], ["#94A3B8", "Rider offline"]].map(([c, l]) => (
              <span key={l} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />{l}</span>
            ))}
          </div>
        </div>
        {q.error && <ErrorBanner message={q.error} onRetry={reload} />}
        <Card className="overflow-hidden">
          <div ref={mapEl} className="h-[65vh] min-h-[420px] w-full z-0" role="region" aria-label="Live fleet map" />
        </Card>
      </div>
    </>
  );
}
