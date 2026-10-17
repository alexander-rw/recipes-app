import React from "react";
import Grid from '@mui/material/Grid';
import { Stack, Typography } from "@mui/material";

export const BeanHeader = () => (
  <Grid item xs={12}>
    <Stack
      direction={{ xs: "column", sm: "row" }}
      alignItems="center"
      justifyContent="center"
      spacing={{ xs: 1, sm: 4 }}
    >
      <img src="./android-chrome-192x192.png" alt="a white cat called Bean" style={{ maxWidth: "100%" }} />
      <Typography variant="h2">My Recipes</Typography>
    </Stack>
  </Grid>
);
