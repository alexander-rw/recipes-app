import { Typography } from "@mui/material";
import { useAppSelector } from "../../app/hooks"
import { selectChosenRecipe } from "../../features/recipes/recipeSlice";

import Grid from '@mui/material/Grid';
import { SingleRecipe } from "../recipes/SingleRecipe";

export const SelectedRecipe = () => {
  const currentlySelectedRecipe = useAppSelector(selectChosenRecipe);

  const elemInfo = currentlySelectedRecipe == null 
    ? <Typography variant="h3">No Recipe Selected</Typography>
    : <SingleRecipe name={currentlySelectedRecipe.name} timeTakenToCook={currentlySelectedRecipe.timeTakenToCook} href={currentlySelectedRecipe.href} />

    return (
      <Grid container item xs={12}>
        {elemInfo}
      </Grid>
    )
}