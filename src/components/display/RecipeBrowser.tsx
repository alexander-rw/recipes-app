import { useEffect } from "react";
import { Box, Button, Container, Grid, Stack, Typography } from "@mui/material";
import { RecipeFilters } from "../filters/RecipeFilters";
import { RecipeList } from "../recipes/RecipeList";
import { headerFont } from "../../styles/mui/theme";

// Left alone this long, the screen goes back to the slideshow
const IDLE_TIMEOUT_MS = 3 * 60 * 1000;

// Every recipe with the usual filters, laid over the slideshow on the kitchen screen
export const RecipeBrowser = ({ onClose }: { onClose: () => void }) => {
  useEffect(() => {
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
  }, [onClose]);

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
            <Typography variant="h4" component="h1" color="primary" sx={{ fontFamily: headerFont }} noWrap>
              All recipes
            </Typography>
          </Stack>
        </Container>
      </Box>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <RecipeFilters />
          <RecipeList />
        </Grid>
      </Container>
    </Box>
  );
};
