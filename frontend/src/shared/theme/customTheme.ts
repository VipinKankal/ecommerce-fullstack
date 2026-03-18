import { createTheme } from "@mui/material";

const customTheme = createTheme({
  palette: {
    primary: {
      main: "#00927c",
    },
    secondary: {
      main: "#f50057",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          "@media (max-width:600px)": {
            fontSize: "0.76rem",
            minHeight: 34,
            paddingLeft: 10,
            paddingRight: 10,
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          "@media (max-width:600px)": {
            padding: 6,
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          "@media (max-width:600px)": {
            fontSize: "0.82rem",
          },
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          "@media (max-width:600px)": {
            fontSize: "0.8rem",
          },
        },
      },
    },
  },
});

export default customTheme;
