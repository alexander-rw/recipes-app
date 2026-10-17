import { Box, Button, Typography } from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../app/hooks"
import { randomizeRecipe, selectChosenRecipe, selectFilteredRecipes } from "../../features/recipes/recipeSlice";

import Grid from '@mui/material/Grid';
import { SingleRecipe } from "../recipes/SingleRecipe";

const Placeholder = () => (
  <Box sx={{
    width: "100%",
    minHeight: 320,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    p: 3,
    border: 2,
    borderStyle: "dashed",
    borderColor: "divider",
    borderRadius: 1,
  }}>
    <Typography color="text.secondary">Your random recipe will appear here</Typography>
  </Box>
);

export const SelectedRecipe = () => {
  const dispatch = useAppDispatch();
  const currentlySelectedRecipe = useAppSelector(selectChosenRecipe);
  const matchingCount = useAppSelector(selectFilteredRecipes).length;

  return (
    <Grid container item xs={12} spacing={3} alignItems="center">
      <Grid container item xs={12} sm={6} md={4} lg={3} order={{ xs: 2, sm: 1 }}>
        {currentlySelectedRecipe == null
          ? <Placeholder />
          // Keyed so a new pick resets the card's image state
          : <SingleRecipe key={currentlySelectedRecipe.href} {...currentlySelectedRecipe} />}
      </Grid>
      <Grid item xs={12} sm={6} md={5} lg={4} order={{ xs: 1, sm: 2 }}>
        <Button fullWidth variant="contained" style={{ padding: "1.2rem" }}
          disabled={matchingCount === 0}
          onClick={() => dispatch(randomizeRecipe())}
        >
          <Typography variant="h5">
            {currentlySelectedRecipe == null ? "Random Recipe" : "Pick Another"}
          </Typography>
        </Button>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: "center" }}>
          {matchingCount === 0
            ? "No recipes match your filters"
            : `Picks from ${matchingCount} recipe${matchingCount === 1 ? "" : "s"} matching your filters`}
        </Typography>
      </Grid>
    </Grid>
  );
}
