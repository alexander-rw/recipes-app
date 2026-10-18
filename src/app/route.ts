import { useEffect, useState } from "react";

export type View = "recipes" | "world" | "display";

// Where the app is, kept in the URL hash so it can be bookmarked and survives a refresh:
// "" is the recipe list, "world" the meal tracker, "display" the kitchen slideshow and
// "display/all" its recipe browser. "/recipe/<id>" on the end opens a recipe over any of them.
export interface Route {
  view: View;
  browsing: boolean;
  recipeId: string | null;
}

const ROUTE_CHANGE = "routechange";

export const routeFromHash = (hash = window.location.hash): Route => {
  const parts = hash.replace(/^#/, "").split("/").filter(Boolean);
  const recipeAt = parts.indexOf("recipe");
  const base = recipeAt >= 0 ? parts.slice(0, recipeAt) : parts;
  const view: View = base[0] === "world" || base[0] === "display" ? base[0] : "recipes";
  return {
    view,
    browsing: view === "display" && base[1] === "all",
    recipeId: recipeAt >= 0 ? parts[recipeAt + 1] ?? null : null,
  };
};

const hashFor = ({ view, browsing, recipeId }: Route) =>
  [view !== "recipes" && view, view === "display" && browsing && "all", recipeId && `recipe/${recipeId}`]
    .filter(Boolean)
    .join("/");

export const navigate = (route: Route, { replace = false } = {}) => {
  const hash = hashFor(route);
  // No hash at all for the recipe list, rather than a bare "#"
  const url = window.location.pathname + window.location.search + (hash ? `#${hash}` : "");
  // Marks history entries made inside the app, so closing a recipe knows "back" stays on the site
  const state = { inApp: true };
  if (replace) {
    window.history.replaceState(state, "", url);
  } else {
    window.history.pushState(state, "", url);
  }
  window.dispatchEvent(new Event(ROUTE_CHANGE));
};

export const openRecipe = (recipeId: string) => navigate({ ...routeFromHash(), recipeId });

// Back to wherever the recipe was opened from, keeping its scroll position and filters
export const closeRecipe = () => {
  if (window.history.state?.inApp) {
    window.history.back();
  } else {
    // Opened from a link or bookmark, so there's nothing on the site to go back to
    navigate({ ...routeFromHash(), recipeId: null }, { replace: true });
  }
};

export const useRoute = () => {
  const [route, setRoute] = useState(routeFromHash);
  useEffect(() => {
    const update = () => setRoute(routeFromHash());
    const events = ["popstate", "hashchange", ROUTE_CHANGE];
    events.forEach(e => window.addEventListener(e, update));
    return () => events.forEach(e => window.removeEventListener(e, update));
  }, []);
  return route;
};
