import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  loadRecipesAsync,
  RecipeSort,
  selectRecipeLoading,
  selectRecipes,
  selectSortBy,
  selectSortedRecipes,
  setSortBy,
} from "../../features/recipes/recipeSlice";

import Grid from '@mui/material/Grid';
import { MenuItem, TextField, Typography } from '@mui/material';
import { SingleRecipe } from './SingleRecipe';

const SORT_OPTIONS: { value: RecipeSort; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "nameAsc", label: "Name (A–Z)" },
  { value: "nameDesc", label: "Name (Z–A)" },
  { value: "timeAsc", label: "Cook time (shortest)" },
  { value: "timeDesc", label: "Cook time (longest)" },
];

export const RecipeList = () => {
  const recipes = useAppSelector(selectSortedRecipes);
  const totalCount = useAppSelector(selectRecipes).recipes.length;
  const isLoaded = useAppSelector(selectRecipeLoading);
  const sortBy = useAppSelector(selectSortBy);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(loadRecipesAsync());
  }, [dispatch]);

  return (
    <Grid container item xs={12} spacing={1}>
      <Grid container item xs={12} justifyContent="space-between" alignItems="center" rowGap={1} sx={{ mb: 1 }}>
        <Typography variant="body2">
          Showing {recipes.length} of {totalCount} recipes
        </Typography>
        <TextField
          select
          size="small"
          color="secondary"
          label="Sort by"
          value={sortBy}
          onChange={e => dispatch(setSortBy(e.target.value as RecipeSort))}
          sx={{ minWidth: 200 }}
        >
          {SORT_OPTIONS.map(o => (
            <MenuItem value={o.value} key={o.value}>{o.label}</MenuItem>
          ))}
        </TextField>
      </Grid>
      {isLoaded && recipes.length === 0 && (
        <Grid item xs={12}>
          <Typography variant="h6">No recipes match these filters</Typography>
        </Grid>
      )}
      {recipes.map(r => (
        <Grid container item xs={12} sm={6} md={4} lg={3} justifyContent="space-evenly" alignItems="stretch" key={r.name}>
          <SingleRecipe {...r} />
        </Grid>
      ))}
    </Grid>
  );
};
