import { Autocomplete, Box, Button, Chip, Slider, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import Grid from '@mui/material/Grid';
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  clearFilters,
  DietFilter,
  selectCookTimeBounds,
  selectFilters,
  selectIngredientOptions,
  selectMealTypes,
  selectRecipesForCookTimeFilter,
  setCookTimeRange,
  setDietFilter,
  setIngredientFilter,
  setMealTypeFilter,
} from "../../features/recipes/recipeSlice";
import { CookTimeHistogram } from "./CookTimeHistogram";

const COOK_TIME_STEP = 5;

const DIET_OPTIONS: { value: DietFilter; label: string }[] = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
];

export const RecipeFilters = () => {
  const dispatch = useAppDispatch();
  const mealTypes = useAppSelector(selectMealTypes);
  const cookTimeRecipes = useAppSelector(selectRecipesForCookTimeFilter);
  const { min: minTime, max: maxTime, isCapped } = useAppSelector(selectCookTimeBounds);
  const ingredientOptions = useAppSelector(selectIngredientOptions);
  const { search, mealTypes: selectedMealTypes, diet, cookTimeRange, ingredients } = useAppSelector(selectFilters);
  const ingredientCounts = new Map(ingredientOptions.map(o => [o.name, o.count]));

  const [fromTime, toTime] = cookTimeRange ?? [minTime, null];
  const sliderTo = toTime ?? maxTime;
  const hasFilters = search !== "" || selectedMealTypes.length > 0 || diet != null || cookTimeRange != null
    || ingredients.length > 0;

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
      <Grid item xs={12} md={6}>
        <Stack spacing={2}>
          <Box>
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
          </Box>
          <Box>
            <Typography gutterBottom>Diet</Typography>
            <ToggleButtonGroup
              exclusive
              color="secondary"
              size="small"
              value={diet}
              onChange={(_, value: DietFilter | null) => dispatch(setDietFilter(value))}
              aria-label="diet"
            >
              {DIET_OPTIONS.map(o => (
                <ToggleButton value={o.value} key={o.value}>{o.label}</ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
          <Box>
            <Typography gutterBottom id="ingredients-label">Ingredients</Typography>
            <Autocomplete
              multiple
              filterSelectedOptions
              size="small"
              options={ingredientOptions.map(o => o.name)}
              value={ingredients}
              onChange={(_, value) => dispatch(setIngredientFilter(value))}
              noOptionsText="No other ingredients in these recipes"
              renderOption={(props, name) => (
                <li {...props} key={name}>
                  <Box component="span" sx={{ flex: 1 }}>{name}</Box>
                  <Typography component="span" variant="body2" color="text.secondary">
                    {ingredientCounts.get(name)}
                  </Typography>
                </li>
              )}
              renderTags={(value, getTagProps) =>
                value.map((name, index) => (
                  <Chip {...getTagProps({ index })} key={name} label={name} color="secondary" size="small" />
                ))
              }
              renderInput={params => (
                <TextField
                  {...params}
                  color="secondary"
                  placeholder={ingredients.length === 0 ? "e.g. chicken, tofu, spinach" : ""}
                  inputProps={{ ...params.inputProps, "aria-labelledby": "ingredients-label" }}
                />
              )}
              sx={{ maxWidth: 480 }}
            />
          </Box>
        </Stack>
      </Grid>
      <Grid item xs={12} md={6}>
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
