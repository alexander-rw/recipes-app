import { useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CardMedia from '@mui/material/CardMedia';
import { Box, Button, CardActions, Typography } from '@mui/material';
import { Recipe } from '../../types/Recipe';

const IMAGE_ASPECT_RATIO = "16 / 10";

const NoPreview = () => (
  <Box sx={{
    aspectRatio: IMAGE_ASPECT_RATIO,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    bgcolor: "divider",
  }}>
    <Typography variant="body2" color="text.secondary">No preview</Typography>
  </Box>
);

export const SingleRecipe = (recipe: Recipe) => {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <Card variant="outlined" sx={{ width: "100%", display: "flex", flexDirection: "column" }}>
      {recipe.image && !imageFailed
        ? <CardMedia
            component="img"
            image={recipe.image}
            alt=""
            loading="lazy"
            // Some sites block images requested from other sites' pages
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            sx={{ aspectRatio: IMAGE_ASPECT_RATIO, objectFit: "cover" }}
          />
        : <NoPreview />}
      <CardHeader title={recipe.name} subheader={recipe.mealType} titleTypographyProps={{
        fontWeight: "bold",
        minHeight: "70px",
      }} />
      <CardContent sx={{ py: 0 }}>
        <Typography variant="h6">
          {recipe.timeTakenToCook} mins
        </Typography>
      </CardContent>
      <CardActions sx={{ mt: "auto" }}>
        <Button variant="outlined" fullWidth href={recipe.href} target="_blank">Open Page</Button>
      </CardActions>
    </Card>
  );
};
