import { alpha, createTheme, PaletteColorOptions, responsiveFontSizes, ThemeOptions } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    leaf: Palette['primary'];
    mustard: Palette['primary'];
  }
  interface PaletteOptions {
    leaf?: PaletteColorOptions;
    mustard?: PaletteColorOptions;
  }
}

declare module '@mui/material/Chip' {
  interface ChipPropsColorOverrides {
    leaf: true;
    mustard: true;
  }
}

const red = '#b80c09';
const brown = '#6b2b06';
const ink = '#141301';
const blue = '#247ba0';
const blush = '#eee5e5';
// Herb green and mustard yellow to sit alongside the red and blue, used for diet labels
const leaf = '#3d7a3a';
const mustard = '#e8b10d';

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
    leaf: {
      main: leaf,
      contrastText: '#ffffff',
    },
    mustard: {
      main: mustard,
      contrastText: ink,
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
    // One step lighter than MUI's defaults (300 / 400 / 500 / 700)
    fontWeightLight: 200,
    fontWeightRegular: 300,
    fontWeightMedium: 400,
    fontWeightBold: 600,
  },
};

// Scale headings down on smaller screens
export const theme = responsiveFontSizes(createTheme(themeOptions));
