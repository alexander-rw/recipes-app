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

// The kitchen screen darkens reds and washes pale tints out to white, so the display gets a
// brighter red and a stronger blush. ?red=, ?page= and ?paper= (hex, no #) try other values.
const displayColour = (param: string, fallback: string) => {
  const value = new URLSearchParams(window.location.search).get(param);
  return value && /^[0-9a-f]{6}$/i.test(value) ? `#${value}` : fallback;
};

export const displayTheme = responsiveFontSizes(createTheme({
  ...themeOptions,
  palette: {
    ...themeOptions.palette,
    primary: { main: displayColour("red", '#d81b16'), contrastText: '#ffffff' },
    background: {
      default: displayColour("page", '#ead0cb'),
      paper: displayColour("paper", '#f2dfdb'),
    },
  },
}));
