import { useEffect, useState } from "react";
import { BeanHeader } from "../beanheader/BeanHeader";
import { RecipeList } from "../recipes/RecipeList";
import CssBaseline from '@mui/material/CssBaseline';
import Grid from '@mui/material/Grid';
import Container from '@mui/material/Container';
import { Tab, Tabs } from "@mui/material";

import { theme } from "../../styles/mui/theme";
import { ThemeProvider } from "@mui/material/styles";
import { RecipeFilters } from "../filters/RecipeFilters";
import { WorldView } from "../world/WorldView";
import { RecipeDisplay } from "../display/RecipeDisplay";

import "../../styles/index.css";

type View = "recipes" | "world" | "display";

// The view lives in the URL hash, so #world can be bookmarked and survives a refresh.
// #display is the full-screen slideshow for a kitchen screen
const viewFromHash = (): View => {
  const hash = window.location.hash.slice(1);
  return hash === "world" || hash === "display" ? hash : "recipes";
};

export const App = () => {
  const [view, setView] = useState<View>(viewFromHash);

  useEffect(() => {
    const onHashChange = () => setView(viewFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const changeView = (next: View) => {
    if (next !== "recipes") {
      window.location.hash = next;
    } else {
      // Drop the hash entirely rather than leaving a bare "#"
      window.history.pushState(null, "", window.location.pathname + window.location.search);
    }
    setView(next);
  };

  if (view === "display") {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <RecipeDisplay onExit={() => changeView("recipes")} />
      </ThemeProvider>
    );
  }

  return (
    <>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container maxWidth="xl">
          <Grid container spacing={{ xs: 3, md: 8 }}>
            <BeanHeader />
            <Grid item xs={12} sx={{ pt: "0 !important" }}>
              <Tabs
                value={view}
                onChange={(_, next: View) => changeView(next)}
                centered
                textColor="secondary"
                indicatorColor="secondary"
              >
                <Tab value="recipes" label="Recipes" />
                <Tab value="world" label="Around the world" />
              </Tabs>
            </Grid>
            {view === "recipes" ? (
              <>
                <RecipeFilters />
                <RecipeList />
              </>
            ) : (
              <WorldView />
            )}
          </Grid>
        </Container>
      </ThemeProvider>
    </>
  );
};
