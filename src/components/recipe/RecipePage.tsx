import { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Container,
  Dialog,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { closeRecipe } from "../../app/route";
import { loadRecipesAsync, selectRecipes } from "../../features/recipes/recipeSlice";
import { headerFont } from "../../styles/mui/theme";
import { Recipe, RecipeDetails } from "../../types/Recipe";

type DetailsState =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "loaded"; details: RecipeDetails };

const useRecipeDetails = (id: string): DetailsState => {
  const [state, setState] = useState<DetailsState>({ status: "loading" });

  useEffect(() => {
    let current = true;
    setState({ status: "loading" });
    axios.get(`./recipes/${id}.json`)
      // The dev server answers unknown paths with the app's HTML, so check it's really a recipe
      .then(({ data }) => current && setState(
        Array.isArray(data?.ingredients) ? { status: "loaded", details: data } : { status: "missing" }
      ))
      .catch(() => current && setState({ status: "missing" }));
    return () => { current = false; };
  }, [id]);

  return state;
};

const hostname = (href: string) => {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return "the creator's site";
  }
};

const sectionHeading = (text: string) => (
  <Typography variant="h5" component="h2" color="primary" sx={{ fontFamily: headerFont, mb: 1.5 }}>
    {text}
  </Typography>
);

const groupTitle = (title?: string) => title && (
  <Typography variant="subtitle1" fontWeight="fontWeightBold" sx={{ mt: 2, mb: 0.5 }}>{title}</Typography>
);

// Tapping an ingredient ticks it off, so it's easy to see what's been added
const Ingredients = ({ groups }: { groups: RecipeDetails["ingredients"] }) => {
  const [ticked, setTicked] = useState<Set<string>>(new Set());
  const toggle = (key: string) => setTicked(current => {
    const next = new Set(current);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });

  return (
    <Box>
      {groups.map((group, g) => (
        <Box key={g}>
          {groupTitle(group.title)}
          {group.items.map((item, i) => {
            const key = `${g}-${i}`;
            const done = ticked.has(key);
            return (
              <Stack
                key={key}
                direction="row"
                alignItems="flex-start"
                onClick={() => toggle(key)}
                sx={{ cursor: "pointer", py: 0.25, opacity: done ? 0.5 : 1 }}
              >
                <Checkbox
                  checked={done}
                  color="secondary"
                  size="small"
                  sx={{ p: 0.5, mr: 0.5 }}
                  inputProps={{ "aria-label": item }}
                />
                <Typography sx={{ pt: 0.5, fontSize: "1.05rem", textDecoration: done ? "line-through" : "none" }}>
                  {item}
                </Typography>
              </Stack>
            );
          })}
        </Box>
      ))}
    </Box>
  );
};

// Tapping a step marks it done, to keep your place while cooking
const Method = ({ groups }: { groups: RecipeDetails["method"] }) => {
  const [done, setDone] = useState<Set<string>>(new Set());
  const toggle = (key: string) => setDone(current => {
    const next = new Set(current);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });

  return (
    <Box>
      {groups.map((group, g) => (
        <Box key={g}>
          {groupTitle(group.title)}
          <Stack component="ol" spacing={1.5} sx={{ listStyle: "none", p: 0, m: 0 }}>
            {group.steps.map((step, i) => {
              const key = `${g}-${i}`;
              const isDone = done.has(key);
              return (
                <Stack
                  component="li"
                  key={key}
                  direction="row"
                  spacing={1.5}
                  onClick={() => toggle(key)}
                  sx={{ cursor: "pointer", opacity: isDone ? 0.45 : 1, transition: "opacity 150ms" }}
                >
                  <Box sx={{
                    flexShrink: 0,
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: isDone ? "text.disabled" : "secondary.main",
                    color: "secondary.contrastText",
                    fontWeight: "fontWeightBold",
                  }}>
                    {isDone ? "✓" : i + 1}
                  </Box>
                  <Typography sx={{ fontSize: "1.1rem", lineHeight: 1.6, pt: 0.25 }}>{step}</Typography>
                </Stack>
              );
            })}
          </Stack>
        </Box>
      ))}
    </Box>
  );
};

const RecipeBody = ({ recipe }: { recipe: Recipe }) => {
  const details = useRecipeDetails(recipe.id);
  const [imageFailed, setImageFailed] = useState(false);
  const site = details.status === "loaded" ? details.details.source : hostname(recipe.href);
  const byline = details.status === "loaded" && details.details.author && details.details.author !== site
    ? `${details.details.author} · ${site}`
    : site;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <Box sx={{
        display: "grid",
        gap: { xs: 2, sm: 3, md: 4 },
        gridTemplateColumns: { xs: "1fr", sm: "3fr 2fr" },
        alignItems: "center",
      }}>
        {recipe.image && !imageFailed && (
          <Box
            component="img"
            src={recipe.image}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            sx={{ width: "100%", aspectRatio: "16 / 10", objectFit: "cover", borderRadius: 1, display: "block" }}
          />
        )}
        <Stack spacing={1.5}>
          <Box><Chip label={recipe.mealType} color="secondary" /></Box>
          <Typography variant="h3" component="h1" color="primary" sx={{ fontFamily: headerFont, lineHeight: 1.1 }}>
            {recipe.name}
          </Typography>
          <Typography variant="h6" color="text.secondary">
            {[`${recipe.timeTakenToCook} mins`, details.status === "loaded" && details.details.servings && `Serves ${details.details.servings.replace(/^serves\s*/i, "")}`]
              .filter(Boolean)
              .join(" · ")}
          </Typography>
          <Typography variant="body2" color="text.secondary">Recipe by {byline}</Typography>
        </Stack>
      </Box>

      <Divider sx={{ my: { xs: 3, md: 4 } }} />

      {details.status === "loading" && <Typography color="text.secondary">Loading recipe…</Typography>}

      {details.status === "missing" && (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>This recipe is only on {site}</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Its ingredients and method couldn't be saved from the original page.
          </Typography>
          <Button variant="contained" href={recipe.href} target="_blank" rel="noopener">
            Open on {site} ↗
          </Button>
        </Paper>
      )}

      {details.status === "loaded" && (
        <Box sx={{
          display: "grid",
          gap: { xs: 4, sm: 3, md: 6 },
          gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 2fr) minmax(0, 3fr)" },
          alignItems: "start",
        }}>
          <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
            {sectionHeading("Ingredients")}
            <Ingredients groups={details.details.ingredients} />
          </Paper>
          <Box>
            {sectionHeading("Method")}
            <Method groups={details.details.method} />
          </Box>
        </Box>
      )}
    </Container>
  );
};

// A recipe's ingredients and method on the site, opened over whichever page it was opened from
export const RecipePage = ({ recipeId }: { recipeId: string }) => {
  const dispatch = useAppDispatch();
  const { recipes, isLoaded } = useAppSelector(selectRecipes);
  const recipe = recipes.find(r => r.id === recipeId);

  useEffect(() => {
    dispatch(loadRecipesAsync());
  }, [dispatch]);

  return (
    <Dialog
      open
      fullScreen
      onClose={closeRecipe}
      transitionDuration={0}
      PaperProps={{ sx: { bgcolor: "background.default" } }}
    >
      <Box sx={{
        position: "sticky",
        top: 0,
        zIndex: 1,
        bgcolor: "background.default",
        borderBottom: 1,
        borderColor: "divider",
      }}>
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ py: 1.5 }}>
            <Button variant="contained" color="secondary" onClick={closeRecipe} sx={{ minHeight: 48, fontSize: "1.05rem", flexShrink: 0 }}>
              ‹ Home
            </Button>
            {recipe && (
              <Button
                variant="outlined"
                href={recipe.href}
                target="_blank"
                rel="noopener"
                sx={{ minHeight: 48, minWidth: 0 }}
              >
                <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  Original recipe ↗
                </Box>
              </Button>
            )}
          </Stack>
        </Container>
      </Box>
      {recipe
        ? <RecipeBody recipe={recipe} key={recipe.id} />
        : (
          <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              {isLoaded ? "This recipe isn't in the list any more" : "Loading recipe…"}
            </Typography>
          </Container>
        )}
    </Dialog>
  );
};
