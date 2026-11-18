import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import Grid from "@mui/material/Grid";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Place, PlaceType, Region } from "../../types/Place";
import { placeEmoji, PRICE_HINTS, priceLabel, TYPE_COLORS, TYPE_LABELS, typeColor } from "./placeStyle";

// The map library is big, so it only downloads when this tab is opened
const PlacesMap = lazy(() => import("./PlacesMap"));

const placesUrl = "./places.json";
const listUrl = "https://maps.app.goo.gl/fgfBsvrhSPUmbPjD8";

// The filter buttons. Markets, shops and the odd one out share one, as there are only a few of each
type TypeFilter = "all" | "restaurant" | "cafe" | "bakery" | "bar" | "dessert" | "more";
const TYPE_FILTERS: { value: TypeFilter; label: string; types?: PlaceType[] }[] = [
  { value: "all", label: "All" },
  { value: "restaurant", label: "Restaurants", types: ["restaurant"] },
  { value: "cafe", label: "Cafés", types: ["cafe"] },
  { value: "bakery", label: "Bakeries", types: ["bakery"] },
  { value: "bar", label: "Bars", types: ["bar"] },
  { value: "dessert", label: "Sweet treats", types: ["dessert"] },
  { value: "more", label: "Markets & more", types: ["market", "shop", "other"] },
];

const REGIONS: Region[] = ["Central", "North", "East", "South", "West"];
const PRICES = [1, 2, 3, 4];

type Sort = "newest" | "name" | "nearest" | "cheapest";

// Lower case without accents, so "cafe" finds "Café"
const normalise = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const searchText = (p: Place) =>
  normalise([p.name, p.cuisine, p.type && TYPE_LABELS[p.type], p.area, p.address, p.outcode, p.region, p.note].join(" "));

// Straight-line distance in km
const distanceKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
};

const formatDistance = (km: number) => (km < 1 ? `${Math.round(km * 1000 / 50) * 50} m` : `${km.toFixed(1)} km`);

const mapsLink = (place: Place) => `https://maps.google.com/?cid=${place.id}`;

interface CardProps {
  place: Place;
  distance?: number;
  selected: boolean;
  onSelect: () => void;
}

const PlaceCard = ({ place, distance, selected, onSelect }: CardProps) => {
  const color = typeColor(place);
  return (
    <Card
      variant="outlined"
      id={`place-${place.id}`}
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        scrollMarginTop: 16,
        borderColor: selected ? color : "divider",
        boxShadow: selected ? `0 0 0 2px ${color}` : "none",
        transition: "box-shadow 150ms, transform 150ms",
        "&:hover": { transform: "translateY(-2px)", boxShadow: `0 6px 16px ${alpha(color, 0.18)}` },
      }}
    >
      <CardActionArea onClick={onSelect} sx={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "stretch" }}>
        {/* A band in the colour of the kind of place, with an emoji for its food */}
        <Box
          sx={{
            height: 72,
            px: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: `linear-gradient(135deg, ${alpha(color, 0.22)}, ${alpha(color, 0.08)})`,
            borderBottom: `3px solid ${color}`,
          }}
        >
          <Typography component="span" sx={{ fontSize: "2.4rem", lineHeight: 1 }} aria-hidden>
            {placeEmoji(place)}
          </Typography>
          {place.price && (
            <Tooltip title={PRICE_HINTS[place.price]}>
              <Typography
                component="span"
                sx={{ fontWeight: 600, color, bgcolor: "background.paper", borderRadius: 5, px: 1.25, py: 0.25, fontSize: "0.9rem" }}
              >
                {priceLabel(place.price)}
              </Typography>
            </Tooltip>
          )}
        </Box>
        <CardContent sx={{ flexGrow: 1, width: "100%" }}>
          <Typography variant="overline" sx={{ color, fontWeight: 600, lineHeight: 1.6, letterSpacing: "0.06em" }}>
            {[place.type && TYPE_LABELS[place.type], place.cuisine].filter(Boolean).join(" · ")}
          </Typography>
          <Typography variant="h6" fontWeight="fontWeightBold" lineHeight={1.2}>{place.name}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            📍 {[place.area, distance != null && `${formatDistance(distance)} away`].filter(Boolean).join(" · ")}
          </Typography>
          {place.address && (
            <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.8 }}>{place.address}</Typography>
          )}
          {place.note && <Typography variant="body2" sx={{ mt: 1 }}>{place.note}</Typography>}
        </CardContent>
      </CardActionArea>
      <Box sx={{ px: 2, pb: 2 }}>
        <Button size="small" variant="outlined" color="secondary" href={mapsLink(place)} target="_blank" rel="noopener">
          Open in Maps
        </Button>
      </Box>
    </Card>
  );
};

export const PlacesView = () => {
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [region, setRegion] = useState<Region | "">("");
  const [prices, setPrices] = useState<number[]>([]);
  const [sort, setSort] = useState<Sort>("newest");
  const [here, setHere] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Only scroll the list when a pin is clicked, not when a card is
  const scrollToCard = useRef(false);

  useEffect(() => {
    axios.get(placesUrl)
      .then(response => setPlaces(response.data.places as Place[]))
      .catch(() => setLoadFailed(true));
  }, []);

  const changeSort = (next: Sort) => {
    setSort(next);
    setLocationError(null);
    if (next !== "nearest" || here) return;
    if (!navigator.geolocation) {
      setLocationError("This browser can't share your location.");
      setSort("newest");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setHere({ lat: coords.latitude, lng: coords.longitude }),
      () => {
        setLocationError("Couldn't get your location. Allow location access for this site to sort by distance.");
        setSort("newest");
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 5 * 60 * 1000 },
    );
  };

  const indexed = useMemo(() => (places ?? []).map(place => ({ place, text: searchText(place) })), [places]);

  const results = useMemo(() => {
    const words = normalise(search).split(/\s+/).filter(Boolean);
    const types = TYPE_FILTERS.find(f => f.value === typeFilter)?.types;
    const matching = indexed
      .filter(({ place, text }) =>
        (!types || (place.type != null && types.includes(place.type))) &&
        (!region || place.region === region) &&
        (prices.length === 0 || (place.price != null && prices.includes(place.price))) &&
        words.every(word => text.includes(word)))
      .map(({ place }) => ({ place, distance: here ? distanceKm(here, place) : undefined }));

    if (sort === "nearest" && here) return matching.sort((a, b) => a.distance! - b.distance!);
    if (sort === "name") return matching.sort((a, b) => a.place.name.localeCompare(b.place.name));
    if (sort === "cheapest") return matching.sort((a, b) => (a.place.price ?? 5) - (b.place.price ?? 5));
    // The list comes newest first
    return matching;
  }, [indexed, search, typeFilter, region, prices, sort, here]);

  const resultPlaces = useMemo(() => results.map(r => r.place), [results]);

  // Cuisines to suggest under the search box, most common first
  const topCuisines = useMemo(() => {
    const counts = new Map<string, number>();
    (places ?? []).forEach(p => p.cuisine && counts.set(p.cuisine, (counts.get(p.cuisine) ?? 0) + 1));
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([cuisine]) => cuisine);
  }, [places]);

  // A pin was clicked: show its card
  useEffect(() => {
    if (!selectedId || !scrollToCard.current) return;
    scrollToCard.current = false;
    document.getElementById(`place-${selectedId}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedId]);

  const isFiltered = search !== "" || typeFilter !== "all" || region !== "" || prices.length > 0;
  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setRegion("");
    setPrices([]);
  };

  if (loadFailed) {
    return (
      <Grid item xs={12}>
        <Alert severity="error">Couldn't load the places. Try refreshing the page.</Alert>
      </Grid>
    );
  }
  if (!places) {
    return <Grid item xs={12}><Typography>Loading places…</Typography></Grid>;
  }

  return (
    <Grid container item xs={12} spacing={1}>
      <Grid item xs={12} sx={{ mb: 1 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
            <TextField
              size="small"
              color="secondary"
              label="Search name, food or area"
              placeholder="e.g. ramen soho"
              value={search}
              onChange={e => setSearch(e.target.value)}
              sx={{ minWidth: { md: 300 } }}
            />
            <TextField
              select
              size="small"
              color="secondary"
              label="Part of London"
              value={region}
              onChange={e => setRegion(e.target.value as Region | "")}
              sx={{ minWidth: { md: 160 } }}
            >
              <MenuItem value="">Anywhere</MenuItem>
              {REGIONS.map(r => <MenuItem value={r} key={r}>{r}</MenuItem>)}
            </TextField>
            <TextField
              select
              size="small"
              color="secondary"
              label="Sort by"
              value={sort}
              onChange={e => changeSort(e.target.value as Sort)}
              sx={{ minWidth: { md: 180 } }}
            >
              <MenuItem value="newest">Newest on the list</MenuItem>
              <MenuItem value="name">Name</MenuItem>
              <MenuItem value="cheapest">Cheapest first</MenuItem>
              <MenuItem value="nearest">Nearest to me</MenuItem>
            </TextField>
            {isFiltered && <Button color="secondary" onClick={clearFilters}>Clear filters</Button>}
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
            <ToggleButtonGroup
              size="small"
              color="secondary"
              exclusive
              value={typeFilter}
              onChange={(_, value: TypeFilter | null) => value && setTypeFilter(value)}
              sx={{ flexWrap: "wrap" }}
            >
              {TYPE_FILTERS.map(f => {
                const dot = f.types && TYPE_COLORS[f.types[0]];
                return (
                  <ToggleButton value={f.value} key={f.value} sx={{ textTransform: "none", px: 1.5, gap: 0.75 }}>
                    {dot && <Box component="span" sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: dot }} />}
                    {f.label}
                  </ToggleButton>
                );
              })}
            </ToggleButtonGroup>
            {/* Several prices can be picked at once, e.g. £ and ££ */}
            <ToggleButtonGroup
              size="small"
              color="secondary"
              value={prices}
              onChange={(_, value: number[]) => setPrices(value)}
              aria-label="Price"
            >
              {PRICES.map(price => (
                <ToggleButton value={price} key={price} title={PRICE_HINTS[price]} sx={{ px: 1.5, fontWeight: 600, letterSpacing: "0.02em" }}>
                  {priceLabel(price as Place["price"])}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap", rowGap: 1 }}>
            <Typography variant="body2" color="text.secondary">Try:</Typography>
            {topCuisines.map(cuisine => (
              <Button
                key={cuisine}
                size="small"
                color="secondary"
                onClick={() => setSearch(cuisine)}
                sx={{ textTransform: "none", minWidth: 0, px: 1 }}
              >
                {cuisine}
              </Button>
            ))}
          </Stack>
          {locationError && <Alert severity="warning" onClose={() => setLocationError(null)}>{locationError}</Alert>}
        </Stack>
      </Grid>

      <Grid item xs={12}>
        <Typography variant="body2">
          Showing {results.length} of {places.length} places from{" "}
          <a href={listUrl} target="_blank" rel="noopener noreferrer">our Google Maps list</a>
          {sort === "nearest" && !here && !locationError && " · finding your location…"}
        </Typography>
      </Grid>

      {/* The map sits above the list on phones and stays beside it on wider screens */}
      <Grid item xs={12} md={5} lg={4} sx={{ order: { md: 2 } }}>
        <Box sx={{ position: { md: "sticky" }, top: { md: 16 }, height: { xs: 320, md: "calc(100vh - 32px)" } }}>
          <Suspense fallback={null}>
            <PlacesMap
              places={resultPlaces}
              selectedId={selectedId}
              here={here}
              onSelect={id => {
                scrollToCard.current = true;
                setSelectedId(id);
              }}
            />
          </Suspense>
        </Box>
      </Grid>
      <Grid container item xs={12} md={7} lg={8} spacing={2} alignContent="flex-start" sx={{ order: { md: 1 } }}>
        {results.length === 0 && (
          <Grid item xs={12}>
            <Typography color="text.secondary" sx={{ py: 4 }}>Nothing matches. Try fewer filters.</Typography>
          </Grid>
        )}
        {results.map(({ place, distance }) => (
          <Grid container item xs={12} sm={6} lg={4} alignItems="stretch" key={place.id}>
            <PlaceCard
              place={place}
              distance={distance}
              selected={place.id === selectedId}
              onSelect={() => setSelectedId(place.id)}
            />
          </Grid>
        ))}
      </Grid>
    </Grid>
  );
};
