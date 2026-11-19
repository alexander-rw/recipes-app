// MapLibre's CSP build has the same API as the main entry, but loads its worker from a URL
declare module "maplibre-gl/dist/maplibre-gl-csp" {
  export * from "maplibre-gl";
  import maplibregl from "maplibre-gl";
  export default maplibregl;
}
