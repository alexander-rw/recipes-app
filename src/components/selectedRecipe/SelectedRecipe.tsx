import { Typography } from "@mui/material";
import { useAppSelector } from "../../app/hooks"
import { selectChosenRecipe } from "../../features/recipes/recipeSlice";

import Grid from '@mui/material/Grid';
import { SingleRecipe } from "../recipes/SingleRecipe";

export const SelectedRecipe = () => {
  const currentlySelectedRecipe = useAppSelector(selectChosenRecipe);

  const elemInfo = currentlySelectedRecipe == null 
    ? <Typography variant="h3">No Recipe Selected</Typography>
    // Keyed so a new pick resets the card's image state
    : (
      <Grid container item xs={12} sm={6} md={4} lg={3}>
        <SingleRecipe key={currentlySelectedRecipe.href} {...currentlySelectedRecipe} />
      </Grid>
    );

    return (
      <Grid container item xs={12}>
        {elemInfo}
      </Grid>
    )
}