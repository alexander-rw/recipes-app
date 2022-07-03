import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import { Box, Button, CardActions, Divider, Grid, Stack, Typography } from '@mui/material';
import { Recipe } from '../../types/Recipe';

export const SingleRecipe = (recipe: Recipe) => (
  <Card variant="outlined" style={{ width: "100%" }}>
    <CardHeader title={recipe.name} titleTypographyProps={{
      fontWeight: "bold",
      minHeight: "70px",
    }} />
    <CardContent >
      <Typography variant="h6">
        {recipe.timeTakenToCook} mins
      </Typography>
    </CardContent>
    <Button variant="contained" fullWidth href={recipe.href} target="_blank">Open Page</Button>
  </Card>
);