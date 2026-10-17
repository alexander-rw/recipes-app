import { useMemo } from "react";
import { Box, Tooltip } from "@mui/material";
import { Recipe } from "../../types/Recipe";

const HEIGHT_PX = 56;

type CookTimeHistogramProps = {
  recipes: Recipe[];
  min: number;
  max: number;
  step: number;
  selectedRange: [number, number];
  // When true, the last bar also holds every recipe longer than `max`
  isCapped: boolean;
};

// One bar per slider step, centred on that step so the bars line up with the
// slider below. Each recipe counts towards the step nearest its cook time.
export const CookTimeHistogram = ({ recipes, min, max, step, selectedRange, isCapped }: CookTimeHistogramProps) => {
  const counts = useMemo(() => {
    const bins = new Array(Math.floor((max - min) / step) + 1).fill(0);
    recipes.forEach(r => {
      const bin = Math.min(Math.round((r.timeTakenToCook - min) / step), bins.length - 1);
      if (bin >= 0) {
        bins[bin] += 1;
      }
    });
    return bins as number[];
  }, [recipes, min, max, step]);

  const span = max - min;
  if (span <= 0) {
    return null;
  }

  const tallest = Math.max(1, ...counts);
  const binWidth = (step / span) * 100;
  const [from, to] = selectedRange;

  return (
    <Box
      role="img"
      aria-label={`Distribution of cook times for ${recipes.length} recipes`}
      sx={{ position: "relative", height: HEIGHT_PX, borderBottom: 1, borderColor: "divider" }}
    >
      {counts.map((count, i) => {
        if (count === 0) {
          return null;
        }
        const minutes = min + i * step;
        const label = isCapped && i === counts.length - 1 ? `${minutes}+` : `${minutes}`;
        const isSelected = minutes >= from && minutes <= to;
        return (
          <Tooltip
            key={minutes}
            title={`${label} mins: ${count} recipe${count === 1 ? "" : "s"}`}
            placement="top"
            disableInteractive
          >
            {/* Full-height hit area so short bars are easy to hover */}
            <Box
              sx={{
                position: "absolute",
                bottom: 0,
                height: "100%",
                left: `${((minutes - min) / span) * 100 - binWidth / 2}%`,
                width: `${binWidth}%`,
                display: "flex",
                alignItems: "flex-end",
                px: "1px",
                "&:hover > div": { opacity: 0.75 },
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  height: `${Math.max(2, (count / tallest) * HEIGHT_PX)}px`,
                  borderRadius: "2px 2px 0 0",
                  bgcolor: isSelected ? "secondary.main" : "divider",
                }}
              />
            </Box>
          </Tooltip>
        );
      })}
    </Box>
  );
};
