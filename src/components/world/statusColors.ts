import { CountryStatus } from "../../types/Meal";

// A light-to-dark blue ramp (not yet → planned → eaten), with eaten matching
// the theme's secondary blue. Checked for colour-blind separation.
export const STATUS_COLORS: Record<CountryStatus, string> = {
  todo: "#ddd3d2",
  planned: "#7ab3cc",
  eaten: "#247ba0",
};

export const STATUS_LABELS: Record<CountryStatus, string> = {
  eaten: "Eaten",
  planned: "Planned",
  todo: "Not yet",
};

// Land that isn't one of the 195 (Greenland, Taiwan, Western Sahara, ...)
export const UNCOUNTED_LAND = "#e9e1e0";
