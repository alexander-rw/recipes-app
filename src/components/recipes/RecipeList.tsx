import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { loadRecipesAsync, selectFilteredRecipes, selectRecipeLoading } from "../../features/recipes/recipeSlice";

import Grid from '@mui/material/Grid';
import { Typography } from '@mui/material';
import { SingleRecipe } from './SingleRecipe';

export const RecipeList = () => {
  const recipes = useAppSelector(selectFilteredRecipes);
  const isLoaded = useAppSelector(selectRecipeLoading);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(loadRecipesAsync());
  }, [dispatch]);

  return (
    <Grid container item xs={12} spacing={1}>
      {isLoaded && recipes.length === 0 && (
        <Grid item xs={12}>
          <Typography variant="h6">No recipes match these filters</Typography>
        </Grid>
      )}
      {recipes.map(r => (
        <Grid container item xs={4} justifyContent="space-evenly" alignItems="stretch" key={r.name}>
          <SingleRecipe href={r.href} timeTakenToCook={r.timeTakenToCook} name={r.name} mealType={r.mealType} />
        </Grid>
      ))}
    </Grid>
  );
};