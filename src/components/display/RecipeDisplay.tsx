import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { shuffle } from "lodash";
import { Box, Button, Chip, LinearProgress, Stack, Typography } from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { loadRecipesAsync, selectRecipes } from "../../features/recipes/recipeSlice";
import { headerFont } from "../../styles/mui/theme";
import { Diet, Recipe } from "../../types/Recipe";
import { RecipeBrowser } from "./RecipeBrowser";
import { openRecipe } from "../../app/route";

// How long each recipe stays up, overridable with ?interval=<seconds>
const DEFAULT_INTERVAL_SECONDS = 30;
// The on-screen controls fade out after this long without a touch
const CONTROLS_TIMEOUT_MS = 5000;
const SWIPE_THRESHOLD_PX = 50;

// Recipes with meat or fish get no label
const DIET_LABELS: Partial<Record<Diet, { label: string; color: "leaf" | "mustard" }>> = {
  vegan: { label: "Vegan", color: "leaf" },
  vegetarian: { label: "Vegetarian", color: "mustard" },
};

const intervalFromUrl = () => {
  const seconds = Number(new URLSearchParams(window.location.search).get("interval"));
  return (Number.isFinite(seconds) && seconds >= 5 ? seconds : DEFAULT_INTERVAL_SECONDS) * 1000;
};

const useClock = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 10_000);
    return () => window.clearInterval(timer);
  }, []);
  return now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
};

const Slide = ({ recipe }: { recipe: Recipe }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const diet = recipe.diet && DIET_LABELS[recipe.diet];

  return (
    <Box sx={{
      display: "grid",
      height: "100%",
      // Photo beside the text on a landscape screen, above it on a portrait one
      gridTemplateColumns: "3fr 2fr",
      "@media (orientation: portrait)": { gridTemplateColumns: "1fr", gridTemplateRows: "3fr 2fr" },
      animation: "slideIn 600ms ease-out",
      "@keyframes slideIn": { from: { opacity: 0 }, to: { opacity: 1 } },
    }}>
      <Box sx={{ minHeight: 0, bgcolor: "divider", overflow: "hidden" }}>
        {recipe.image && !imageFailed && (
          <Box
            component="img"
            src={recipe.image}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        )}
      </Box>
      <Stack justifyContent="center" spacing={{ xs: 1.5, md: 3 }} sx={{ p: { xs: 3, md: 6 }, minHeight: 0, overflow: "hidden" }}>
        <Stack direction="row" spacing={1}>
          <Chip label={recipe.mealType} color="secondary" sx={{ fontSize: { md: "1.1rem" } }} />
          {diet && <Chip label={diet.label} color={diet.color} sx={{ fontSize: { md: "1.1rem" } }} />}
        </Stack>
        <Typography
          variant="h2"
          component="h1"
          color="primary"
          sx={{
            fontFamily: headerFont,
            fontWeight: 400,
            lineHeight: 1.1,
            // Long names wrap to four lines at most rather than pushing the time off screen
            display: "-webkit-box",
            WebkitLineClamp: 4,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {recipe.name}
        </Typography>
        <Typography variant="h4" color="text.secondary">
          {recipe.timeTakenToCook} mins
        </Typography>
      </Stack>
    </Box>
  );
};

interface RecipeDisplayProps {
  // Whether the list of every recipe is open over the slideshow
  browsing: boolean;
  onBrowse: (browsing: boolean) => void;
  // A recipe is open on top, so the slideshow waits and leaves the keys alone
  covered: boolean;
  onExit: () => void;
}

// A full-screen slideshow of recipes for a kitchen screen, shown at #display
export const RecipeDisplay = ({ browsing, onBrowse, covered, onExit }: RecipeDisplayProps) => {
  const dispatch = useAppDispatch();
  const { recipes, isLoaded } = useAppSelector(selectRecipes);
  const intervalMs = useMemo(intervalFromUrl, []);
  const clock = useClock();

  // Recipes with a photo come first, each group in a fresh random order
  const order = useMemo(() => [
    ...shuffle(recipes.filter(r => r.image)),
    ...shuffle(recipes.filter(r => !r.image)),
  ], [recipes]);

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const hideTimer = useRef<number>();
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    dispatch(loadRecipesAsync());
  }, [dispatch]);

  const go = useCallback((step: number) => {
    setIndex(i => order.length === 0 ? 0 : (i + step + order.length) % order.length);
    setStartedAt(Date.now());
    setElapsed(0);
  }, [order.length]);

  // Advance on a timer, ticking often enough to drive the progress bar
  useEffect(() => {
    if (paused || browsing || covered || order.length < 2) {
      return;
    }
    const timer = window.setInterval(() => {
      const sinceStart = Date.now() - startedAt;
      if (sinceStart >= intervalMs) {
        go(1);
      } else {
        setElapsed(sinceStart);
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [paused, browsing, covered, order.length, startedAt, intervalMs, go]);

  // Load the next photo early so it doesn't pop in
  useEffect(() => {
    const next = order[(index + 1) % Math.max(order.length, 1)];
    if (next?.image) {
      const img = new Image();
      img.referrerPolicy = "no-referrer";
      img.src = next.image;
    }
  }, [order, index]);

  const revealControls = useCallback(() => {
    setShowControls(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setShowControls(false), CONTROLS_TIMEOUT_MS);
  }, []);

  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  const openBrowser = () => {
    onBrowse(true);
    setShowControls(false);
  };

  const closeBrowser = useCallback(() => onBrowse(false), [onBrowse]);

  // Back on the slideshow with a fresh timer, so the recipe showing gets its full time
  useEffect(() => {
    if (!browsing && !covered) {
      setStartedAt(Date.now());
      setElapsed(0);
    }
  }, [browsing, covered]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (covered) {
        return;
      }
      if (browsing) {
        if (e.key === "Escape") closeBrowser();
        return;
      }
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === " ") setPaused(p => !p);
      else if (e.key === "Escape") onExit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onExit, browsing, covered, closeBrowser]);

  const recipe = order[index];

  return (
    <>
      <Box
        onPointerDown={revealControls}
        onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={e => {
          const dx = e.changedTouches[0].clientX - (touchStartX.current ?? e.changedTouches[0].clientX);
          if (Math.abs(dx) > SWIPE_THRESHOLD_PX) {
            go(dx < 0 ? 1 : -1);
          }
          touchStartX.current = null;
        }}
        sx={{
          position: "fixed",
          inset: 0,
          bgcolor: "background.paper",
          overflow: "hidden",
          userSelect: "none",
          // No pointer on the wall screen unless someone is using a mouse
          cursor: showControls ? "auto" : "none",
        }}
      >
        {recipe
          ? <Slide recipe={recipe} key={recipe.href} />
          : (
            <Stack alignItems="center" justifyContent="center" sx={{ height: "100%" }}>
              <Typography variant="h4" color="text.secondary">
                {isLoaded ? "No recipes yet" : "Loading recipes…"}
              </Typography>
            </Stack>
          )}

        <Typography
          sx={{
            position: "absolute",
            top: 16,
            right: 20,
            px: 2,
            py: 0.5,
            borderRadius: 2,
            bgcolor: "rgba(248, 244, 244, 0.85)",
            fontWeight: "fontWeightMedium",
            // Readable from across the kitchen, growing with the screen
            fontSize: "clamp(2.25rem, 8vmin, 5rem)",
            lineHeight: 1.2,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {clock}
        </Typography>

        <LinearProgress
          variant="determinate"
          color="secondary"
          value={paused ? 0 : Math.min(100, (elapsed / intervalMs) * 100)}
          sx={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 6, bgcolor: "transparent" }}
        />

        <Stack
          direction="row"
          spacing={1.5}
          justifyContent="center"
          sx={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 24,
            px: 2,
            flexWrap: "wrap",
            opacity: showControls ? 1 : 0,
            pointerEvents: showControls ? "auto" : "none",
            transition: "opacity 300ms",
            "& .MuiButton-root": { minWidth: 96, minHeight: 56, fontSize: "1.1rem", boxShadow: 3 },
          }}
        >
          <Button variant="contained" color="secondary" onClick={() => go(-1)}>‹ Back</Button>
          <Button variant="contained" color="secondary" onClick={() => setPaused(p => !p)}>
            {paused ? "Play" : "Pause"}
          </Button>
          <Button variant="contained" color="secondary" onClick={() => go(1)}>Next ›</Button>
          {recipe && <Button variant="contained" onClick={() => openRecipe(recipe.id)}>Open recipe</Button>}
          <Button variant="contained" onClick={openBrowser}>All recipes</Button>
          <Button variant="contained" color="inherit" onClick={onExit}>Exit</Button>
        </Stack>
      </Box>
      {browsing && <RecipeBrowser onClose={closeBrowser} covered={covered} />}
    </>
  );
};
