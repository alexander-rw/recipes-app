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
import { RecipePage } from "../recipe/RecipePage";
import { navigate, useRoute, View } from "../../app/route";

import "../../styles/index.css";

export const App = () => {
  const route = useRoute();
  const { view, recipeId } = route;

  const changeView = (next: View) => navigate({ view: next, browsing: false, recipeId: null });

  // Shown over the current view, which stays as it was underneath
  const recipePage = recipeId && <RecipePage recipeId={recipeId} />;

  if (view === "display") {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <RecipeDisplay
          browsing={route.browsing}
          onBrowse={browsing => navigate({ ...route, browsing })}
          covered={recipeId != null}
          onExit={() => changeView("recipes")}
        />
        {recipePage}
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
        {recipePage}
      </ThemeProvider>
    </>
  );
};
