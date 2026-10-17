import { useEffect, useMemo, useState } from "react";
import { geoEqualEarth, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";
import { Box, Skeleton, Tooltip } from "@mui/material";
import { CountryProgress } from "../../features/world/worldSlice";
import { flagEmoji } from "../../features/world/countries";
import { STATUS_COLORS, STATUS_LABELS, UNCOUNTED_LAND } from "./statusColors";

const WIDTH = 960;
const HEIGHT = 470;
const ANTARCTICA = "010";
// Countries smaller than this (in px² of the 960px-wide map) also get a dot,
// so places like Singapore and Malta can be seen and clicked
const DOT_AREA_THRESHOLD = 12;
// Tuvalu is too small to be in the map data at all
const MISSING_LOCATIONS: Record<string, [number, number]> = { "798": [179.2, -8.5] };

type CountryFeature = Feature<Geometry, { name: string }>;

const loadCountryShapes = async (): Promise<CountryFeature[]> => {
  // ~750kB, so it's split out and only loaded when the map is shown
  const topology = (await import("world-atlas/countries-50m.json")).default as unknown as Topology<{
    countries: GeometryCollection<{ name: string }>;
  }>;
  const collection = feature(topology, topology.objects.countries) as FeatureCollection<Geometry, { name: string }>;
  return collection.features.filter(f => f.id !== ANTARCTICA);
};

interface WorldMapProps {
  countries: CountryProgress[];
  onSelect: (country: CountryProgress) => void;
}

export const WorldMap = ({ countries, onSelect }: WorldMapProps) => {
  const [shapes, setShapes] = useState<CountryFeature[] | null>(null);

  useEffect(() => {
    loadCountryShapes().then(setShapes);
  }, []);

  const byId = useMemo(() => new Map(countries.map(c => [c.id, c])), [countries]);

  const drawn = useMemo(() => {
    if (shapes == null) {
      return null;
    }
    const projection = geoEqualEarth().fitSize([WIDTH, HEIGHT], { type: "FeatureCollection", features: shapes });
    const path = geoPath(projection);
    const paths = shapes.map(shape => ({
      key: `${shape.id ?? shape.properties.name}`,
      id: shape.id as string | undefined,
      d: path(shape) ?? "",
      area: path.area(shape),
      centroid: path.centroid(shape),
    }));
    // One dot per tiny country, at its largest shape
    const dots = new Map<string, [number, number]>();
    paths
      .filter(p => p.id != null && p.area < DOT_AREA_THRESHOLD)
      .forEach(p => dots.set(p.id!, p.centroid));
    paths
      .filter(p => p.id != null && dots.has(p.id) && p.area >= DOT_AREA_THRESHOLD)
      .forEach(p => dots.delete(p.id!));
    Object.entries(MISSING_LOCATIONS).forEach(([id, lonLat]) => {
      const point = projection(lonLat);
      if (point) {
        dots.set(id, point);
      }
    });
    return { paths, dots: Array.from(dots.entries()) };
  }, [shapes]);

  if (drawn == null) {
    return <Skeleton variant="rectangular" sx={{ borderRadius: 1, width: "100%", height: "auto", aspectRatio: `${WIDTH} / ${HEIGHT}` }} />;
  }

  const tooltip = (country: CountryProgress) =>
    `${flagEmoji(country.code)} ${country.name} · ${STATUS_LABELS[country.status]}`;

  const interactive = (country: CountryProgress) => ({
    onClick: () => onSelect(country),
    style: { cursor: "pointer" },
  });

  return (
    <Box
      component="svg"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="World map coloured by which countries you've eaten from"
      sx={{
        width: "100%",
        height: "auto",
        display: "block",
        "& .country": { transition: "opacity 120ms" },
        "& .country:hover": { opacity: 0.75 },
      }}
    >
      {drawn.paths.map(p => {
        const country = p.id != null ? byId.get(p.id) : undefined;
        if (country == null) {
          return <path key={p.key} d={p.d} fill={UNCOUNTED_LAND} stroke="#f8f4f4" strokeWidth={0.5} />;
        }
        return (
          <Tooltip key={p.key} title={tooltip(country)} followCursor>
            <path
              className="country"
              d={p.d}
              fill={STATUS_COLORS[country.status]}
              stroke="#f8f4f4"
              strokeWidth={0.5}
              {...interactive(country)}
            />
          </Tooltip>
        );
      })}
      {drawn.dots.map(([id, [x, y]]) => {
        const country = byId.get(id);
        return country && (
          <Tooltip key={`dot-${id}`} title={tooltip(country)}>
            <circle
              className="country"
              cx={x}
              cy={y}
              r={3.5}
              fill={STATUS_COLORS[country.status]}
              // A faint outline so not-yet dots still show against the page
              stroke="rgba(107, 43, 6, 0.35)"
              strokeWidth={0.75}
              {...interactive(country)}
            />
          </Tooltip>
        );
      })}
    </Box>
  );
};
