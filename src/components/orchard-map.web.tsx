import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import type * as Leaflet from 'leaflet';

import type { OrchardMapProps } from '@/types/orchard';

type MapMode = 'streets' | 'satellite' | 'hybrid';

const osmAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>';
const imageryAttribution = 'Tiles &copy; Esri — Sources: Esri, Maxar, Earthstar Geographics, and the GIS User Community';

export default function OrchardMap({ orchards, selectedFolio, onSelect }: OrchardMapProps) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const markersRef = useRef<Leaflet.LayerGroup | null>(null);
  const imageryRef = useRef<Leaflet.TileLayer | null>(null);
  const labelsRef = useRef<Leaflet.TileLayer | null>(null);
  const [mode, setMode] = useState<MapMode>('streets');

  useEffect(() => {
    let disposed = false;
    let map: Leaflet.Map | null = null;

    // Leaflet touches `window` as soon as its module loads, so load it only
    // after mount to keep Expo web's server render safe.
    void import('leaflet').then((L) => {
      if (disposed || !elementRef.current) return;

      map = L.map(elementRef.current, { zoomControl: true, scrollWheelZoom: true }).setView([19.42, -102.06], 9);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: osmAttribution,
      }).addTo(map);

      const imagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: imageryAttribution,
      });
      const labels = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: imageryAttribution,
        pane: 'overlayPane',
      });

      markersRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      imageryRef.current = imagery;
      labelsRef.current = labels;
      renderOrchardMarkers(L, map, markersRef.current, orchards, selectedFolio, onSelect);
      requestAnimationFrame(() => map?.invalidateSize());
    });

    return () => {
      disposed = true;
      map?.remove();
      mapRef.current = null;
      markersRef.current = null;
      imageryRef.current = null;
      labelsRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const imagery = imageryRef.current;
    const labels = labelsRef.current;
    if (!map || !imagery || !labels) return;

    map.removeLayer(imagery);
    map.removeLayer(labels);
    if (mode === 'satellite' || mode === 'hybrid') imagery.addTo(map);
    if (mode === 'hybrid') labels.addTo(map);
  }, [mode]);

  useEffect(() => {
    const map = mapRef.current;
    const markerGroup = markersRef.current;
    if (!map || !markerGroup) return;

    void import('leaflet').then((L) => renderOrchardMarkers(L, map, markerGroup, orchards, selectedFolio, onSelect));
  }, [orchards, selectedFolio, onSelect]);

  const modes: { key: MapMode; label: string }[] = [
    { key: 'streets', label: 'Mapa' },
    { key: 'satellite', label: 'Satélite' },
    { key: 'hybrid', label: 'Híbrido' },
  ];

  return (
    <div className="guavalink-map-shell">
      <div className="guavalink-map-toolbar" role="group" aria-label="Tipo de mapa">
        {modes.map((item) => (
          <button key={item.key} type="button" onClick={() => setMode(item.key)} aria-pressed={mode === item.key} className={mode === item.key ? 'is-active' : ''}>
            {item.label}
          </button>
        ))}
      </div>
      <div ref={elementRef} className="guavalink-leaflet-map" aria-label="Mapa de huertas en Michoacán" />
      <style>{`
        .guavalink-map-shell { position: relative; width: 100%; height: 340px; overflow: hidden; border-radius: 20px; border: 1px solid #333336; background: #101713; z-index: 0; }
        .guavalink-leaflet-map { width: 100%; height: 100%; background: #101713; }
        .guavalink-map-toolbar { position: absolute; z-index: 500; right: 14px; top: 14px; display: flex; gap: 3px; padding: 4px; border: 1px solid rgba(134,134,139,.36); border-radius: 9999px; background: rgba(29,29,31,.94); }
        .guavalink-map-toolbar button { border: 0; border-radius: 9999px; padding: 8px 12px; color: #cccccc; background: transparent; font: 12px system-ui, sans-serif; cursor: pointer; }
        .guavalink-map-toolbar button.is-active { color: #ffffff; background: #0071e3; }
        .guavalink-map-shell .leaflet-control-attribution { color: #555; font-size: 10px; }
        .guavalink-map-shell .leaflet-control-attribution a { color: #333; }
        .guavalink-orchard-marker-wrap { background: none; border: 0; }
        .guavalink-orchard-marker { display: flex; justify-content: center; align-items: center; width: 30px; height: 38px; position: relative; }
        .guavalink-orchard-marker::before { content: ''; position: absolute; top: 1px; width: 24px; height: 24px; border: 2px solid white; border-radius: 50% 50% 50% 0; background: #0071e3; transform: rotate(-45deg); box-shadow: 0 0 0 5px rgba(0,113,227,.2); }
        .guavalink-orchard-marker span { z-index: 1; width: 7px; height: 7px; border-radius: 50%; background: white; margin-top: -12px; }
        .guavalink-orchard-marker.is-selected::before { background: #2997ff; box-shadow: 0 0 0 8px rgba(41,151,255,.28); }
        @media (max-width: 560px) { .guavalink-map-shell { height: 290px; } .guavalink-map-toolbar { top: 9px; right: 9px; } .guavalink-map-toolbar button { padding: 7px 9px; font-size: 11px; } }
      `}</style>
    </div>
  );
}

function renderOrchardMarkers(
  L: typeof import('leaflet'),
  map: Leaflet.Map,
  markerGroup: Leaflet.LayerGroup,
  orchards: OrchardMapProps['orchards'],
  selectedFolio: OrchardMapProps['selectedFolio'],
  onSelect: OrchardMapProps['onSelect'],
) {
  markerGroup.clearLayers();
  orchards.forEach((orchard) => {
    const selected = orchard.folio === selectedFolio;
    const icon = L.divIcon({
      className: 'guavalink-orchard-marker-wrap',
      html: `<span class="guavalink-orchard-marker${selected ? ' is-selected' : ''}"><span></span></span>`,
      iconSize: [30, 38],
      iconAnchor: [15, 32],
      popupAnchor: [0, -30],
    });
    const marker = L.marker([orchard.latitude, orchard.longitude], { icon, title: orchard.name }).addTo(markerGroup);
    marker.bindPopup(`<strong>${escapeHtml(orchard.name)}</strong><br>${orchard.hectares} ha · ${orchard.tenure}<br>${orchard.latitude.toFixed(5)}, ${orchard.longitude.toFixed(5)}`);
    marker.on('click', () => onSelect(orchard.folio));
    if (selected) marker.openPopup();
  });

  if (selectedFolio) {
    const selected = orchards.find((orchard) => orchard.folio === selectedFolio);
    if (selected) map.panTo([selected.latitude, selected.longitude], { animate: true });
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character] ?? character);
}
