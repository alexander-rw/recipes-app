import { useEffect, useRef } from "react";
import Grid from '@mui/material/Grid';
import { Button, MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  CountryProgress,
  loadMealsAsync,
  selectContinentFilter,
  selectCountryProgress,
  selectFilteredCountries,
  selectSearch,
  selectStatusFilter,
  selectTotalProgress,
  setContinentFilter,
  setSearch,
  setStatusFilter,
  StatusFilter,
} from "../../features/world/worldSlice";
import { Continent, CONTINENTS } from "../../features/world/countries";
import { CountryCard } from "./CountryCard";
import { WorldMap } from "./WorldMap";
import { WorldProgress } from "./WorldProgress";

export const WorldView = () => {
  const dispatch = useAppDispatch();
  const allCountries = useAppSelector(selectCountryProgress);
  const countries = useAppSelector(selectFilteredCountries);
  const progress = useAppSelector(selectTotalProgress);
  const search = useAppSelector(selectSearch);
  const statusFilter = useAppSelector(selectStatusFilter);
  const continentFilter = useAppSelector(selectContinentFilter);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(loadMealsAsync());
  }, [dispatch]);

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: "all", label: `All ${progress.total}` },
    { value: "eaten", label: `Eaten ${progress.eaten}` },
    { value: "planned", label: `Planned ${progress.planned}` },
    { value: "todo", label: `Not yet ${progress.total - progress.eaten - progress.planned}` },
  ];

  const isFiltered = search !== "" || statusFilter !== "all" || continentFilter != null;

  const clearFilters = () => {
    dispatch(setSearch(""));
    dispatch(setStatusFilter("all"));
    dispatch(setContinentFilter(null));
  };

  // Clicking a country on the map shows just that country in the list
  const selectCountry = (country: CountryProgress) => {
    dispatch(setStatusFilter("all"));
    dispatch(setContinentFilter(null));
    dispatch(setSearch(country.name));
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <Grid container item xs={12} spacing={{ xs: 3, md: 6 }}>
      <Grid item xs={12} md={4} lg={3}>
        <WorldProgress />
      </Grid>
      <Grid item xs={12} md={8} lg={9}>
        <WorldMap countries={allCountries} onSelect={selectCountry} />
      </Grid>

      <Grid container item xs={12} spacing={1} ref={listRef} sx={{ scrollMarginTop: 16 }}>
        <Grid item xs={12} sx={{ mb: 1 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
            <TextField
              size="small"
              color="secondary"
              label="Search countries or dishes"
              value={search}
              onChange={e => dispatch(setSearch(e.target.value))}
              sx={{ minWidth: { md: 260 } }}
            />
            <ToggleButtonGroup
              size="small"
              color="secondary"
              exclusive
              value={statusFilter}
              onChange={(_, value: StatusFilter | null) => value && dispatch(setStatusFilter(value))}
              sx={{ flexWrap: "wrap" }}
            >
              {statusOptions.map(o => (
                <ToggleButton value={o.value} key={o.value} sx={{ textTransform: "none", px: 1.5 }}>
                  {o.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <TextField
              select
              size="small"
              color="secondary"
              label="Continent"
              value={continentFilter ?? ""}
              onChange={e => dispatch(setContinentFilter((e.target.value || null) as Continent | null))}
              sx={{ minWidth: { md: 180 } }}
            >
              <MenuItem value="">All continents</MenuItem>
              {CONTINENTS.map(c => <MenuItem value={c} key={c}>{c}</MenuItem>)}
            </TextField>
            {isFiltered && <Button color="secondary" onClick={clearFilters}>Clear filters</Button>}
          </Stack>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body2">Showing {countries.length} of {progress.total} countries</Typography>
        </Grid>
        {countries.map(c => (
          <Grid container item xs={12} sm={6} md={4} lg={3} alignItems="stretch" key={c.code}>
            <CountryCard {...c} />
          </Grid>
        ))}
      </Grid>
    </Grid>
  );
};
