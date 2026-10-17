import { alpha, createTheme, responsiveFontSizes, ThemeOptions } from '@mui/material/styles';

const red = '#b80c09';
const brown = '#6b2b06';
const ink = '#141301';
const blue = '#247ba0';
const blush = '#eee5e5';

export const bodyFont = '"Commissioner", "Helvetica Neue", Arial, sans-serif';
export const headerFont = '"Bagel Fat One", "Arial Black", sans-serif';

const themeOptions: ThemeOptions = {
  palette: {
    mode: "light",
    primary: {
      main: red,
      contrastText: '#ffffff',
    },
    secondary: {
      main: blue,
      contrastText: '#ffffff',
    },
    background: {
      default: blush,
      // Cards sit a step lighter than the page so they stand out from it
      paper: '#f8f4f4',
    },
    text: {
      primary: ink,
      secondary: brown,
    },
    divider: alpha(brown, 0.2),
  },
  typography: {
    fontFamily: bodyFont,
  },
};

// Scale headings down on smaller screens
export const theme = responsiveFontSizes(createTheme(themeOptions));
