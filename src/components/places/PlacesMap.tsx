import { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
// The CSP build loads its worker from a file instead of a blob. In the main build, CRA's Babel
// rewrites the inlined worker code so it fails with "_ is not defined" in production.
import maplibregl, { GeoJSONSource, LngLatBoundsLike, Map as MapLibreMap } from "maplibre-gl/dist/maplibre-gl-csp";
import "maplibre-gl/dist/maplibre-gl.css";
import { Place, PlaceType } from "../../types/Place";
import { placeEmoji, priceLabel, TYPE_COLORS, TYPE_LABELS } from "./placeStyle";

// OpenFreeMap's pale Positron style: free, with no key or sign-up (https://openfreemap.org)
const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

// Copied into public/ by the prestart and prebuild scripts
maplibregl.setWorkerUrl(`${process.env.PUBLIC_URL}/maplibre-gl-csp-worker.js`);

// Central London, for before there's anything to fit the map to
const LONDON: [number, number] = [-0.118, 51.509];

// Positron, toned to the site's blush and with the clutter taken out: no road names, road
// numbers, railways or airport icon, leaving just the streets, parks, water and area names
const HIDDEN_LAYERS = [
  "highway-name-path", "highway-name-minor", "highway-name-major", "highway-shield-non-us",
  "highway-shield-us-interstate", "road_shield_us", "airport", "aeroway-taxiway",
  "aeroway-runway-casing", "aeroway-area", "aeroway-runway", "railway_transit",
  "railway_transit_dashline", "railway_service", "railway_service_dashline", "railway",
  "railway_dashline", "waterway_line_label", "boundary_3", "label_city_capital", "label_state",
];
const PAINT: [string, string, string][] = [
  ["background", "background-color", "#f4eeee"],
  ["water", "fill-color", "#d5e4ec"],
  ["waterway", "line-color", "#d5e4ec"],
  ["park", "fill-color", "#e3ebdc"],
  ["landcover_wood", "fill-color", "#e3ebdc"],
  ["landuse_residential", "fill-color", "#f1e9e9"],
  ["building", "fill-color", "#ebe2e2"],
];

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

const popupHtml = (place: Place) => {
  const details = [place.type && TYPE_LABELS[place.type], place.cuisine, priceLabel(place.price)].filter(Boolean).join(" · ");
  return `<strong>${placeEmoji(place)} ${escapeHtml(place.name)}</strong><br>${escapeHtml(details)}` +
    (place.area ? `<br><span style="opacity:.7">${escapeHtml(place.area)}</span>` : "");
};

const toGeoJson = (places: Place[]): GeoJSON.FeatureCollection<GeoJSON.Point> => ({
  type: "FeatureCollection",
  features: places.map(place => ({
    type: "Feature",
    id: Number(BigInt(place.id) % BigInt(Number.MAX_SAFE_INTEGER)),
    geometry: { type: "Point", coordinates: [place.lng, place.lat] },
    properties: { id: place.id, type: place.type ?? "other" },
  })),
});

// Pin colour by kind of place, as a MapLibre expression
const colorExpression = [
  "match", ["get", "type"],
  ...(Object.entries(TYPE_COLORS) as [PlaceType, string][]).flat(),
  TYPE_COLORS.other,
] as unknown as maplibregl.ExpressionSpecification;

interface Props {
  places: Place[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  here?: { lat: number; lng: number } | null;
}

// A map of London with a pin for each place in the list, coloured by kind of place
const PlacesMap = ({ places, selectedId, onSelect, here }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const hereRef = useRef<maplibregl.Marker | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const placesRef = useRef(places);
  placesRef.current = places;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: LONDON,
      zoom: 10.5,
      attributionControl: { compact: true },
      // Scrolling the page shouldn't zoom the map; pinch and the buttons still do
      scrollZoom: false,
      dragRotate: false,
      pitchWithRotate: false,
    });
    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");
    map.on("click", () => map.scrollZoom.enable());
    map.on("mouseout", () => map.scrollZoom.disable());

    map.on("load", () => {
      HIDDEN_LAYERS.forEach(id => map.getLayer(id) && map.setLayoutProperty(id, "visibility", "none"));
      PAINT.forEach(([id, property, value]) => map.getLayer(id) && map.setPaintProperty(id, property, value));
      // The map credits start open and cover the bottom of a small map; they stay one tap away on the (i)
      map.getContainer().querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show");

      map.addSource("places", { type: "geojson", data: toGeoJson(placesRef.current) });
      map.addLayer({
        id: "places",
        type: "circle",
        source: "places",
        paint: {
          "circle-color": colorExpression,
          // Bigger as you zoom in, and bigger still for the chosen place
          "circle-radius": [
            "interpolate", ["linear"], ["zoom"],
            10, ["case", ["boolean", ["feature-state", "selected"], false], 9, 4.5],
            14, ["case", ["boolean", ["feature-state", "selected"], false], 12, 7],
          ],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": ["case", ["boolean", ["feature-state", "selected"], false], 3, 1.5],
          "circle-opacity": 0.9,
        },
      });
      map.on("click", "places", e => {
        const id = e.features?.[0]?.properties?.id;
        if (id) onSelectRef.current(String(id));
      });
      map.on("mouseenter", "places", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "places", () => (map.getCanvas().style.cursor = ""));
      setReady(true);
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, []);

  // Redraw the pins and fit the map to them whenever the list changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    (map.getSource("places") as GeoJSONSource | undefined)?.setData(toGeoJson(places));
    if (places.length === 1) {
      map.easeTo({ center: [places[0].lng, places[0].lat], zoom: 15 });
    } else if (places.length > 1) {
      // Fit to the middle 95% of places, so one far-out place (Croydon, Cheam) doesn't shrink everything else
      const lngs = places.map(p => p.lng).sort((a, b) => a - b);
      const lats = places.map(p => p.lat).sort((a, b) => a - b);
      const cut = places.length >= 20 ? Math.floor(places.length * 0.025) : 0;
      const bounds: LngLatBoundsLike = [[lngs[cut], lats[cut]], [lngs[lngs.length - 1 - cut], lats[lats.length - 1 - cut]]];
      map.fitBounds(bounds, { padding: 32, maxZoom: 15, duration: 600 });
    }
  }, [places, ready]);

  // Show where you are, once "Nearest to me" knows
  useEffect(() => {
    const map = mapRef.current;
    hereRef.current?.remove();
    if (!map || !here) return;
    const dot = document.createElement("div");
    dot.style.cssText = "width:14px;height:14px;border-radius:50%;background:#1a73e8;border:3px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.2)";
    dot.title = "You are here";
    hereRef.current = new maplibregl.Marker({ element: dot }).setLngLat([here.lng, here.lat]).addTo(map);
  }, [here, ready]);

  // Make the chosen place's pin bigger and open its label
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const highlight = () => {
      if (!map.getSource("places")) return;
      map.removeFeatureState({ source: "places" });
      popupRef.current?.remove();
      const place = places.find(p => p.id === selectedId);
      if (!place) return;
      map.setFeatureState({ source: "places", id: Number(BigInt(place.id) % BigInt(Number.MAX_SAFE_INTEGER)) }, { selected: true });
      popupRef.current = new maplibregl.Popup({ closeButton: false, offset: 12, maxWidth: "260px" })
        .setLngLat([place.lng, place.lat])
        .setHTML(popupHtml(place))
        .addTo(map);
      const point = map.project([place.lng, place.lat]);
      const { clientWidth, clientHeight } = map.getContainer();
      if (point.x < 40 || point.y < 40 || point.x > clientWidth - 40 || point.y > clientHeight - 40) {
        map.easeTo({ center: [place.lng, place.lat] });
      }
    };
    // New pins may still be going in, which MapLibre won't take feature states during
    if (map.isStyleLoaded()) {
      highlight();
    } else {
      map.once("idle", highlight);
      return () => {
        map.off("idle", highlight);
      };
    }
  }, [selectedId, places, ready]);

  return (
    <Box
      ref={containerRef}
      sx={{
        width: "100%",
        height: "100%",
        borderRadius: 1,
        overflow: "hidden",
        border: 1,
        borderColor: "divider",
        bgcolor: "#f4eeee",
        "& .maplibregl-popup-content": {
          fontFamily: "inherit",
          fontSize: "0.875rem",
          padding: "8px 12px",
          borderRadius: "8px",
          boxShadow: "0 4px 14px rgba(0,0,0,.15)",
        },
      }}
    />
  );
};

// Loaded on its own (React.lazy), so the map library only downloads on this tab
export default PlacesMap;
