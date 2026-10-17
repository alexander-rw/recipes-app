import { useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../app/hooks"
import { randomizeRecipe, selectChosenRecipe, selectFilteredRecipes } from "../../features/recipes/recipeSlice";

import { SingleRecipe } from "../recipes/SingleRecipe";

export const RandomRecipe = () => {
  const dispatch = useAppDispatch();
  const chosenRecipe = useAppSelector(selectChosenRecipe);
  const matchingCount = useAppSelector(selectFilteredRecipes).length;
  const [isOpen, setIsOpen] = useState(false);

  const pick = () => {
    dispatch(randomizeRecipe());
    setIsOpen(true);
  };

  return (
    <>
      <Button variant="contained" disabled={matchingCount === 0} onClick={pick} sx={{ whiteSpace: "nowrap", flexShrink: 0 }}>
        Random Recipe
      </Button>
      <Dialog open={isOpen && chosenRecipe != null} onClose={() => setIsOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          Picked from {matchingCount} recipe{matchingCount === 1 ? "" : "s"}
        </DialogTitle>
        <DialogContent>
          {/* Keyed so a new pick resets the card's image state */}
          {chosenRecipe && <SingleRecipe key={chosenRecipe.href} {...chosenRecipe} />}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="secondary" onClick={() => setIsOpen(false)}>Close</Button>
          <Button variant="contained" disabled={matchingCount < 2} onClick={pick}>Pick Another</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
