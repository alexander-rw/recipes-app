import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Grid from "@mui/material/Grid";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { Place, PlaceType, Region } from "../../types/Place";

const placesUrl = "./places.json";
const listUrl = "https://maps.app.goo.gl/fgfBsvrhSPUmbPjD8";

const TYPE_LABELS: Record<PlaceType, string> = {
  restaurant: "Restaurant",
  cafe: "Café",
  bakery: "Bakery",
  bar: "Bar",
  dessert: "Sweet treats",
  market: "Market",
  shop: "Shop",
  other: "Other",
};

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

type Sort = "newest" | "name" | "nearest";

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

const PlaceCard = ({ place, distance }: { place: Place; distance?: number }) => (
  <Card variant="outlined" sx={{ width: "100%", display: "flex", flexDirection: "column" }}>
    <CardContent sx={{ flexGrow: 1 }}>
      <Typography variant="h6" fontWeight="fontWeightBold" lineHeight={1.2}>{place.name}</Typography>
      <Typography variant="body2" color="secondary" fontWeight="fontWeightMedium" sx={{ mt: 0.5 }}>
        {[place.type && TYPE_LABELS[place.type], place.cuisine].filter(Boolean).join(" · ")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {[place.area, distance != null && `${formatDistance(distance)} away`].filter(Boolean).join(" · ")}
      </Typography>
      {place.address && <Typography variant="body2" color="text.secondary">{place.address}</Typography>}
      {place.note && <Typography variant="body2" sx={{ mt: 1 }}>{place.note}</Typography>}
    </CardContent>
    <Box sx={{ px: 2, pb: 2 }}>
      <Button size="small" variant="outlined" color="secondary" href={mapsLink(place)} target="_blank" rel="noopener">
        Open in Maps
      </Button>
    </Box>
  </Card>
);

export const PlacesView = () => {
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [region, setRegion] = useState<Region | "">("");
  const [sort, setSort] = useState<Sort>("newest");
  const [here, setHere] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

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
        words.every(word => text.includes(word)))
      .map(({ place }) => ({ place, distance: here ? distanceKm(here, place) : undefined }));

    if (sort === "nearest" && here) return matching.sort((a, b) => a.distance! - b.distance!);
    if (sort === "name") return matching.sort((a, b) => a.place.name.localeCompare(b.place.name));
    // The list comes newest first
    return matching;
  }, [indexed, search, typeFilter, region, sort, here]);

  // Cuisines to suggest under the search box, most common first
  const topCuisines = useMemo(() => {
    const counts = new Map<string, number>();
    (places ?? []).forEach(p => p.cuisine && counts.set(p.cuisine, (counts.get(p.cuisine) ?? 0) + 1));
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([cuisine]) => cuisine);
  }, [places]);

  const isFiltered = search !== "" || typeFilter !== "all" || region !== "";
  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setRegion("");
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
              <MenuItem value="nearest">Nearest to me</MenuItem>
            </TextField>
            {isFiltered && <Button color="secondary" onClick={clearFilters}>Clear filters</Button>}
          </Stack>
          <ToggleButtonGroup
            size="small"
            color="secondary"
            exclusive
            value={typeFilter}
            onChange={(_, value: TypeFilter | null) => value && setTypeFilter(value)}
            sx={{ flexWrap: "wrap" }}
          >
            {TYPE_FILTERS.map(f => (
              <ToggleButton value={f.value} key={f.value} sx={{ textTransform: "none", px: 1.5 }}>
                {f.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
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
      {results.map(({ place, distance }) => (
        <Grid container item xs={12} sm={6} md={4} lg={3} alignItems="stretch" key={place.id}>
          <PlaceCard place={place} distance={distance} />
        </Grid>
      ))}
    </Grid>
  );
};
