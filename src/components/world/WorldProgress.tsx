import { Box, Stack, Typography } from "@mui/material";
import { useAppSelector } from "../../app/hooks";
import { ProgressCount, selectContinentProgress, selectTotalProgress } from "../../features/world/worldSlice";
import { headerFont } from "../../styles/mui/theme";
import { STATUS_COLORS, STATUS_LABELS } from "./statusColors";

// Eaten then planned, as segments of one bar, with a 2px gap between them
const ProgressBar = ({ eaten, planned, total, height }: ProgressCount & { height: number }) => (
  <Box sx={{ display: "flex", gap: "2px", height, bgcolor: STATUS_COLORS.todo, borderRadius: 1, overflow: "hidden" }}>
    {eaten > 0 && <Box sx={{ width: `${(eaten / total) * 100}%`, bgcolor: STATUS_COLORS.eaten }} />}
    {planned > 0 && <Box sx={{ width: `${(planned / total) * 100}%`, bgcolor: STATUS_COLORS.planned }} />}
  </Box>
);

const LegendItem = ({ status, count }: { status: keyof typeof STATUS_COLORS; count: number }) => (
  <Stack direction="row" spacing={0.75} alignItems="center">
    <Box sx={{ width: 12, height: 12, borderRadius: "3px", bgcolor: STATUS_COLORS[status] }} />
    <Typography variant="body2">{STATUS_LABELS[status]} {count}</Typography>
  </Stack>
);

export const WorldProgress = () => {
  const total = useAppSelector(selectTotalProgress);
  const continents = useAppSelector(selectContinentProgress);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h3" component="p" color="secondary" sx={{ fontFamily: headerFont, fontWeight: 400 }}>
          {total.eaten} <Typography component="span" variant="h5" color="text.secondary">/ {total.total}</Typography>
        </Typography>
        <Typography variant="body1" sx={{ mb: 1.5 }}>
          countries eaten · {Math.round((total.eaten / total.total) * 100)}%
        </Typography>
        <ProgressBar {...total} height={14} />
        <Stack direction="row" sx={{ mt: 1, flexWrap: "wrap", columnGap: 2, rowGap: 0.5 }}>
          <LegendItem status="eaten" count={total.eaten} />
          <LegendItem status="planned" count={total.planned} />
          <LegendItem status="todo" count={total.total - total.eaten - total.planned} />
        </Stack>
      </Box>
      <Stack spacing={1.5}>
        {continents.map(c => (
          <Box key={c.continent}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Typography variant="body2" fontWeight="fontWeightMedium">{c.continent}</Typography>
              <Typography variant="body2" color="text.secondary">
                {c.eaten} / {c.total}{c.planned > 0 && ` · ${c.planned} planned`}
              </Typography>
            </Stack>
            <ProgressBar {...c} height={8} />
          </Box>
        ))}
      </Stack>
    </Stack>
  );
};
