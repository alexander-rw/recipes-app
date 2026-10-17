import { createAsyncThunk, createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { RootState } from '../../app/store';
import { CountryStatus, Meal } from '../../types/Meal';
import { Continent, CONTINENTS, COUNTRIES, Country } from './countries';

const mealsUrl = "./meals.json";

export type StatusFilter = "all" | CountryStatus;

export interface WorldState {
  meals: Meal[];
  isLoaded: boolean;
  search: string;
  statusFilter: StatusFilter;
  continentFilter: Continent | null;
}

const initialState: WorldState = {
  meals: [],
  isLoaded: false,
  search: "",
  statusFilter: "all",
  continentFilter: null,
};

export interface CountryProgress extends Country {
  status: CountryStatus;
  meals: Meal[];
}

export interface ProgressCount {
  eaten: number;
  planned: number;
  total: number;
}

export const loadMealsAsync = createAsyncThunk(
  'world/loadMeals',
  async (): Promise<Meal[]> => {
    const response = await axios.get(mealsUrl);
    return response.data.meals as Meal[];
  }
);

export const worldSlice = createSlice({
  name: 'world',
  initialState,
  reducers: {
    setSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
    },
    setStatusFilter: (state, action: PayloadAction<StatusFilter>) => {
      state.statusFilter = action.payload;
    },
    setContinentFilter: (state, action: PayloadAction<Continent | null>) => {
      state.continentFilter = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadMealsAsync.pending, (state) => {
        state.isLoaded = false;
      })
      .addCase(loadMealsAsync.fulfilled, (state, action) => {
        state.isLoaded = true;
        state.meals = action.payload;
      })
      .addCase(loadMealsAsync.rejected, (state) => {
        state.isLoaded = false;
      });
  },
});

export const { setSearch, setStatusFilter, setContinentFilter } = worldSlice.actions;

export const selectMealsLoaded = (state: RootState) => state.world.isLoaded;
export const selectSearch = (state: RootState) => state.world.search;
export const selectStatusFilter = (state: RootState) => state.world.statusFilter;
export const selectContinentFilter = (state: RootState) => state.world.continentFilter;

const selectMeals = (state: RootState) => state.world.meals;

// Every country with its meals, eaten ones first, then by date
export const selectCountryProgress = createSelector(
  [selectMeals],
  (meals): CountryProgress[] => COUNTRIES.map(c => {
    const countryMeals = meals
      .filter(m => m.country.toUpperCase() === c.code)
      .sort((a, b) => (a.status === b.status ? 0 : a.status === "eaten" ? -1 : 1)
        || (a.date ?? "").localeCompare(b.date ?? ""));
    const status: CountryStatus = countryMeals.some(m => m.status === "eaten")
      ? "eaten"
      : countryMeals.length > 0 ? "planned" : "todo";
    return { ...c, status, meals: countryMeals };
  })
);

const countProgress = (countries: CountryProgress[]): ProgressCount => ({
  eaten: countries.filter(c => c.status === "eaten").length,
  planned: countries.filter(c => c.status === "planned").length,
  total: countries.length,
});

export const selectTotalProgress = createSelector([selectCountryProgress], countProgress);

export const selectContinentProgress = createSelector(
  [selectCountryProgress],
  (countries) => CONTINENTS.map(continent => ({
    continent,
    ...countProgress(countries.filter(c => c.continent === continent)),
  }))
);

// Accent-insensitive, so "cote" finds Côte d'Ivoire
const normalise = (text: string) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export const selectFilteredCountries = createSelector(
  [selectCountryProgress, selectSearch, selectStatusFilter, selectContinentFilter],
  (countries, search, statusFilter, continentFilter) => {
    const query = normalise(search.trim());
    return countries
      .filter(c =>
        (statusFilter === "all" || c.status === statusFilter)
        && (continentFilter == null || c.continent === continentFilter)
        && (query === "" || normalise(c.name).includes(query)
          || c.meals.some(m => normalise(m.dish).includes(query))))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
);

export default worldSlice.reducer;
