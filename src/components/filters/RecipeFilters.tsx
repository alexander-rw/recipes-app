import { Box, Button, Slider, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import Grid from '@mui/material/Grid';
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  clearFilters,
  selectCookTimeBounds,
  selectFilters,
  selectMealTypes,
  selectRecipesForCookTimeFilter,
  setCookTimeRange,
  setMealTypeFilter,
} from "../../features/recipes/recipeSlice";
import { CookTimeHistogram } from "./CookTimeHistogram";

const COOK_TIME_STEP = 5;

export const RecipeFilters = () => {
  const dispatch = useAppDispatch();
  const mealTypes = useAppSelector(selectMealTypes);
  const cookTimeRecipes = useAppSelector(selectRecipesForCookTimeFilter);
  const { min: minTime, max: maxTime, isCapped } = useAppSelector(selectCookTimeBounds);
  const { mealTypes: selectedMealTypes, cookTimeRange } = useAppSelector(selectFilters);

  const [fromTime, toTime] = cookTimeRange ?? [minTime, null];
  const sliderTo = toTime ?? maxTime;
  const hasFilters = selectedMealTypes.length > 0 || cookTimeRange != null;

  const formatMinutes = (value: number) => (isCapped && value >= maxTime ? `${maxTime}+` : `${value}`);

  const onCookTimeChange = (_: Event, value: number | number[]) => {
    const [from, to] = value as number[];
    // The top of a capped slider ("160+") has no upper limit
    const upper = isCapped && to >= maxTime ? null : to;
    // Covering the whole range is the same as having no cook time filter
    const isFullRange = from <= minTime && (upper == null || upper >= maxTime);
    dispatch(setCookTimeRange(isFullRange ? null : [from, upper]));
  };

  return (
    <Grid container item xs={12} spacing={2} alignItems="flex-end">
      <Grid item xs={12} sm={6}>
        <Typography gutterBottom>Meal type</Typography>
        <ToggleButtonGroup
          color="secondary"
          size="small"
          value={selectedMealTypes}
          onChange={(_, value: string[]) => dispatch(setMealTypeFilter(value))}
          aria-label="meal type"
        >
          {mealTypes.map(mealType => (
            <ToggleButton value={mealType} key={mealType}>{mealType}</ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography gutterBottom id="cook-time-label">
          Cook time: {formatMinutes(fromTime)}–{formatMinutes(sliderTo)} mins
        </Typography>
        <Box sx={{ px: 1 }}>
          <CookTimeHistogram
            recipes={cookTimeRecipes}
            min={minTime}
            max={maxTime}
            step={COOK_TIME_STEP}
            selectedRange={[fromTime, sliderTo]}
            isCapped={isCapped}
          />
          <Slider
            color="secondary"
            value={[fromTime, sliderTo]}
            min={minTime}
            max={maxTime}
            step={COOK_TIME_STEP}
            onChange={onCookTimeChange}
            valueLabelDisplay="auto"
            valueLabelFormat={formatMinutes}
            getAriaValueText={value => `${formatMinutes(value)} mins`}
            aria-labelledby="cook-time-label"
            disableSwap
          />
        </Box>
      </Grid>
      <Grid container item xs={12} justifyContent="flex-end">
        <Button color="secondary" disabled={!hasFilters} onClick={() => dispatch(clearFilters())}>
          Clear filters
        </Button>
      </Grid>
    </Grid>
  );
};
