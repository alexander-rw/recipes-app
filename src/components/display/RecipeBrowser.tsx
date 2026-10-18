import { useEffect, useState } from "react";
import { Box, Button, Collapse, Container, Grid, Stack, Typography } from "@mui/material";
import { useAppSelector } from "../../app/hooks";
import { selectFilters } from "../../features/recipes/recipeSlice";
import { RecipeFilters } from "../filters/RecipeFilters";
import { RecipeList } from "../recipes/RecipeList";
import { headerFont } from "../../styles/mui/theme";

// Left alone this long, the screen goes back to the slideshow
const IDLE_TIMEOUT_MS = 3 * 60 * 1000;

// Every recipe with the usual filters, laid over the slideshow on the kitchen screen
export const RecipeBrowser = ({ onClose, covered }: { onClose: () => void; covered: boolean }) => {
  // Filters start tucked away, as on a small kitchen screen they'd hide every recipe
  const [showFilters, setShowFilters] = useState(false);
  const { mealTypes, diet, cookTimeRange } = useAppSelector(selectFilters);
  const activeFilters = mealTypes.length + (diet ? 1 : 0) + (cookTimeRange ? 1 : 0);

  useEffect(() => {
    // No timeout while a recipe is open on top, as someone's probably cooking from it
    if (covered) {
      return;
    }
    let timer = window.setTimeout(onClose, IDLE_TIMEOUT_MS);
    const restart = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(onClose, IDLE_TIMEOUT_MS);
    };
    const events = ["pointerdown", "keydown", "scroll", "wheel"];
    // Capture, so scrolling inside the panel counts as well as the page
    events.forEach(e => window.addEventListener(e, restart, true));
    return () => {
      window.clearTimeout(timer);
      events.forEach(e => window.removeEventListener(e, restart, true));
    };
  }, [onClose, covered]);

  return (
    <Box sx={{
      position: "fixed",
      inset: 0,
      // Under MUI's menus and dialogs, so the sort menu and random pick still show
      zIndex: 1200,
      bgcolor: "background.default",
      overflowY: "auto",
      WebkitOverflowScrolling: "touch",
      // Bigger touch targets than the normal page
      "& .MuiToggleButton-root": { minHeight: 48, px: 2.5, fontSize: "1rem" },
      "& .MuiSlider-thumb": { width: 28, height: 28 },
      "& .MuiButton-root": { minHeight: 48 },
    }}>
      <Box sx={{
        position: "sticky",
        top: 0,
        zIndex: 1,
        bgcolor: "background.default",
        borderBottom: 1,
        borderColor: "divider",
      }}>
        <Container maxWidth="xl">
          <Stack direction="row" alignItems="center" spacing={2} sx={{ py: 1.5 }}>
            <Button variant="contained" color="secondary" onClick={onClose} sx={{ fontSize: "1.1rem", flexShrink: 0 }}>
              ‹ Slideshow
            </Button>
            <Typography variant="h4" component="h1" color="primary" sx={{ fontFamily: headerFont, flex: 1 }} noWrap>
              All recipes
            </Typography>
            <Button
              variant={showFilters ? "contained" : "outlined"}
              color="secondary"
              onClick={() => setShowFilters(s => !s)}
              aria-expanded={showFilters}
              sx={{ fontSize: "1.1rem", flexShrink: 0 }}
            >
              Filters{activeFilters > 0 && ` (${activeFilters})`}
            </Button>
          </Stack>
        </Container>
      </Box>
      <Container maxWidth="xl" sx={{ pb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sx={{ pt: "0 !important" }}>
            <Collapse in={showFilters}>
              <Grid container sx={{ pt: 3 }}>
                <RecipeFilters />
              </Grid>
            </Collapse>
          </Grid>
          <RecipeList />
        </Grid>
      </Container>
    </Box>
  );
};
