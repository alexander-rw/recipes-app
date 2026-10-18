import { createAsyncThunk, createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { RootState } from '../../app/store';
import { Diet, Recipe } from '../../types/Recipe';
import { sample, uniq } from "lodash";

const recipesUrl = "./recipes-dinner.json";

// Cook times above this are grouped together at the top of the slider ("160+"),
// so a few very long recipes don't squash the rest of the range
export const COOK_TIME_CAP = 160;

// Vegan recipes count as vegetarian too
export type DietFilter = Exclude<Diet, "meat">;

const DIETS_MATCHING: Record<DietFilter, Diet[]> = {
  vegetarian: ["vegetarian", "vegan"],
  vegan: ["vegan"],
};

// [from, to]; a null `to` means there is no upper limit
export type CookTimeRange = [number, number | null];

export interface RecipeFilters {
  // Matched against recipe names; empty shows everything
  search: string;
  // An empty list means every meal type is shown
  mealTypes: string[];
  // null shows every recipe, including ones with no diet set yet
  diet: DietFilter | null;
  // null means the full range of cook times is shown
  cookTimeRange: CookTimeRange | null;
}

export interface RecipeState {
  recipes: Recipe[];
  selectedRecipe: Recipe | null;
  isLoaded: boolean;
  filters: RecipeFilters;
  sortBy: RecipeSort;
}

export type RecipeSort = "nameAsc" | "nameDesc" | "timeAsc" | "timeDesc";

const initialFilters: RecipeFilters = {
  search: "",
  mealTypes: [],
  diet: null,
  cookTimeRange: null,
};

const initialState: RecipeState = {
  recipes: [],
  isLoaded: false,
  selectedRecipe: null,
  filters: initialFilters,
  sortBy: "nameAsc",
};

const byName = (a: Recipe, b: Recipe) =>
  a.name.trim().localeCompare(b.name.trim(), undefined, { sensitivity: "base" });

// Ties on cook time fall back to name order
const recipeComparators: Record<RecipeSort, (a: Recipe, b: Recipe) => number> = {
  nameAsc: byName,
  nameDesc: (a, b) => byName(b, a),
  timeAsc: (a, b) => a.timeTakenToCook - b.timeTakenToCook || byName(a, b),
  timeDesc: (a, b) => b.timeTakenToCook - a.timeTakenToCook || byName(a, b),
};

// Accent-insensitive, so "creme" finds Crème Brûlée
const normalise = (text: string) =>
  text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const filterRecipes = (recipes: Recipe[], { search, mealTypes, diet, cookTimeRange }: RecipeFilters) => {
  const query = normalise(search.trim());
  return recipes.filter(r =>
    (query === "" || normalise(r.name).includes(query))
    && (mealTypes.length === 0 || mealTypes.includes(r.mealType))
    && (diet == null || (r.diet != null && DIETS_MATCHING[diet].includes(r.diet)))
    && (cookTimeRange == null
      || (r.timeTakenToCook >= cookTimeRange[0]
        && (cookTimeRange[1] == null || r.timeTakenToCook <= cookTimeRange[1])))
  );
};

// The function below is called a thunk and allows us to perform async logic. It
// can be dispatched like a regular action: `dispatch(incrementAsync(10))`. This
// will call the thunk with the `dispatch` function as the first argument. Async
// code can then be executed and other actions can be dispatched. Thunks are
// typically used to make async requests.
export const loadRecipesAsync = createAsyncThunk(
  'recipes/loadRecipes',
  async (): Promise<Recipe[]> => {
    const response = await axios.get(recipesUrl);
    // The value we return becomes the `fulfilled` action payload
    return response.data.recipes as Recipe[];
  },
  // Several views ask for the recipes; once they're loaded there's no need to fetch them again
  { condition: (_, { getState }) => !(getState() as RootState).recipes.isLoaded }
);

export const recipeSlice = createSlice({
  name: 'recipes',
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: {
    // Use the PayloadAction type to declare the contents of `action.payload`
    setRecipes: (state, action: PayloadAction<Recipe[]>) => {
      state.recipes = action.payload;
      state.selectedRecipe = null;
      state.isLoaded = true;
    },
    randomizeRecipe: (state) => {
      const { recipes, filters, selectedRecipe } = state;
      const matching = filterRecipes(recipes, filters);
      // Avoid picking the same recipe twice in a row when there's a choice
      const candidates = matching.length > 1
        ? matching.filter(r => r.href !== selectedRecipe?.href)
        : matching;
      state.selectedRecipe = sample(candidates) ?? null;
    },
    setSearch: (state, action: PayloadAction<string>) => {
      state.filters.search = action.payload;
    },
    setMealTypeFilter: (state, action: PayloadAction<string[]>) => {
      state.filters.mealTypes = action.payload;
    },
    setDietFilter: (state, action: PayloadAction<DietFilter | null>) => {
      state.filters.diet = action.payload;
    },
    setCookTimeRange: (state, action: PayloadAction<CookTimeRange | null>) => {
      state.filters.cookTimeRange = action.payload;
    },
    clearFilters: (state) => {
      state.filters = initialFilters;
    },
    setSortBy: (state, action: PayloadAction<RecipeSort>) => {
      state.sortBy = action.payload;
    },
  },
  // The `extraReducers` field lets the slice handle actions defined elsewhere,
  // including actions generated by createAsyncThunk or in other slices.
  extraReducers: (builder) => {
    builder
      .addCase(loadRecipesAsync.pending, (state) => {
        state.isLoaded = false;
      })
      .addCase(loadRecipesAsync.fulfilled, (state, action) => {
        state.isLoaded = true;
        state.recipes = action.payload;
        state.selectedRecipe = null;
      })
      .addCase(loadRecipesAsync.rejected, (state) => {
        state.isLoaded = false;
      });
  },
});

export const {
  setRecipes,
  randomizeRecipe,
  setSearch,
  setMealTypeFilter,
  setDietFilter,
  setCookTimeRange,
  clearFilters,
  setSortBy,
} = recipeSlice.actions;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state: RootState) => state.counter.value)`
export const selectRecipes = (state: RootState) => state.recipes;
export const selectRecipeLoading = (state: RootState) => state.recipes.isLoaded;
export const selectChosenRecipe = (state: RootState) => state.recipes.selectedRecipe;
export const selectFilters = (state: RootState) => state.recipes.filters;

const selectAllRecipes = (state: RootState) => state.recipes.recipes;

export const selectFilteredRecipes = createSelector(
  [selectAllRecipes, selectFilters],
  filterRecipes
);

export const selectSortBy = (state: RootState) => state.recipes.sortBy;

// The filtered recipes in the chosen display order
export const selectSortedRecipes = createSelector(
  [selectFilteredRecipes, selectSortBy],
  (recipes, sortBy) => [...recipes].sort(recipeComparators[sortBy])
);

// Recipes matching every filter except cook time, so the cook time
// distribution shows what the slider can choose from
export const selectRecipesForCookTimeFilter = createSelector(
  [selectAllRecipes, selectFilters],
  (recipes, filters) => filterRecipes(recipes, { ...filters, cookTimeRange: null })
);

export const selectMealTypes = createSelector(
  [selectAllRecipes],
  (recipes) => uniq(recipes.map(r => r.mealType))
);

export interface CookTimeBounds {
  min: number;
  max: number;
  // True when some recipes take longer than `max`, so `max` means "max+"
  isCapped: boolean;
}

export const selectCookTimeBounds = createSelector(
  [selectAllRecipes],
  (recipes): CookTimeBounds => {
    if (recipes.length === 0) {
      return { min: 0, max: 0, isCapped: false };
    }
    const times = recipes.map(r => r.timeTakenToCook);
    const longest = Math.max(...times);
    return {
      min: Math.min(...times),
      max: Math.min(longest, COOK_TIME_CAP),
      isCapped: longest > COOK_TIME_CAP,
    };
  }
);

export default recipeSlice.reducer;
