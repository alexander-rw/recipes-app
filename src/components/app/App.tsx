import { BeanHeader } from "../beanheader/BeanHeader";
import { RecipeList } from "../recipes/RecipeList";
import CssBaseline from '@mui/material/CssBaseline';
import Grid from '@mui/material/Grid';
import Container from '@mui/material/Container';

import { theme } from "../../styles/mui/theme";
import { ThemeProvider } from "@mui/material/styles";
import { SelectedRecipe } from "../selectedRecipe/SelectedRecipe";
import { RecipeFilters } from "../filters/RecipeFilters";

import "../../styles/index.css";

export const App = () => (
  <>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md">
        <Grid container spacing={8}>
          <BeanHeader />
          <RecipeFilters />
          <SelectedRecipe />
          <RecipeList />
        </Grid>
      </Container>
    </ThemeProvider>
  </>
);