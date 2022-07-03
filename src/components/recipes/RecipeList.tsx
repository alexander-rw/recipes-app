import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { loadRecipesAsync, selectRecipes } from "../../features/recipes/recipeSlice";

import Grid from '@mui/material/Grid';
import { SingleRecipe } from './SingleRecipe';

export const RecipeList = () => {
  const { recipes } = useAppSelector(selectRecipes);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(loadRecipesAsync());
  }, [dispatch]);

  return (
    <Grid container item xs={12} spacing={1}>
      {recipes.map(r => (
        <Grid container item xs={4} justifyContent="space-evenly" alignItems="stretch" key={r.name}>
          <SingleRecipe href={r.href} timeTakenToCook={r.timeTakenToCook} name={r.name} />
        </Grid>
      ))}
    </Grid>
  );
};