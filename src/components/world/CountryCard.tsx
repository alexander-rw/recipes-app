import { Box, Button, Card, CardContent, Divider, Stack, Typography } from "@mui/material";
import { CountryProgress } from "../../features/world/worldSlice";
import { flagEmoji } from "../../features/world/countries";
import { Meal } from "../../types/Meal";
import { STATUS_COLORS, STATUS_LABELS } from "./statusColors";

const formatDate = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

const MealRow = ({ meal }: { meal: Meal }) => {
  const isRestaurant = meal.where === "restaurant";
  const link = isRestaurant ? meal.mapsUrl : meal.recipeUrl;
  const details = [
    isRestaurant ? meal.place ?? "Restaurant" : "Home cooked",
    meal.status === "planned" ? "Planned" : meal.date && formatDate(meal.date),
  ].filter(Boolean).join(" · ");

  return (
    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body1" fontWeight="fontWeightMedium">{meal.dish ?? "Dish to be decided"}</Typography>
        <Typography variant="body2" color="text.secondary">{details}</Typography>
        {meal.notes && <Typography variant="body2" sx={{ mt: 0.5 }}>{meal.notes}</Typography>}
      </Box>
      {link && (
        <Button size="small" variant="outlined" color="secondary" href={link} target="_blank" sx={{ flexShrink: 0 }}>
          {isRestaurant ? "Map" : "Recipe"}
        </Button>
      )}
    </Stack>
  );
};

export const CountryCard = (country: CountryProgress) => (
  <Card
    variant="outlined"
    id={`country-${country.code}`}
    // The status shows as a coloured edge as well as in words
    sx={{ width: "100%", borderLeft: 6, borderLeftColor: STATUS_COLORS[country.status] }}
  >
    <CardContent>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Typography component="span" sx={{ fontSize: "2rem", lineHeight: 1 }} aria-hidden>
          {flagEmoji(country.code)}
        </Typography>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" fontWeight="fontWeightBold" lineHeight={1.2}>{country.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {country.continent} · {STATUS_LABELS[country.status]}
          </Typography>
        </Box>
      </Stack>
      {country.meals.length > 0 && (
        <Stack spacing={1.5} sx={{ mt: 2 }} divider={<Divider flexItem />}>
          {country.meals.map((meal, i) => <MealRow meal={meal} key={i} />)}
        </Stack>
      )}
    </CardContent>
  </Card>
);
