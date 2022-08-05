import React from "react";
import Grid from '@mui/material/Grid';
import { Button, Typography } from "@mui/material";
import { randomizeRecipe } from "../../features/recipes/recipeSlice";
import { useAppDispatch } from "../../app/hooks";

export const BeanHeader = () => {
  const dispatch = useAppDispatch();
  return (
    <Grid container justifyContent="center" alignItems="center" item xs={12}>
      <Grid item xs={3}>
        <img src="./android-chrome-192x192.png" alt="a white cat called Bean" />
      </Grid>
      <Grid container item xs={6}>
        <Grid item xs={12}>
          <Typography gutterBottom variant="h2">My Recipes</Typography>
        </Grid>
        <Grid item xs={12}>
          <Button fullWidth variant="contained" style={{padding: "1.2rem" }}
            onClick={() => dispatch(randomizeRecipe())}
          >
            <Typography variant="h5">Random Recipe</Typography>
          </Button>
        </Grid>
      </Grid>
    </Grid>
  );
};