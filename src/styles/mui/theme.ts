import { createTheme, ThemeOptions } from '@mui/material/styles';

const themeOptions: ThemeOptions = {
  palette: {
    mode: "light",
    primary: {
      main: '#ffd54f',
    },
    secondary: {
      main: '#6f43d2',
    },
  },
};

export const theme = createTheme(themeOptions);

