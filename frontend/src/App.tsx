import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import firebase from "firebase";
import "firebase/auth";
import StyledFirebaseAuth from "react-firebaseui/StyledFirebaseAuth";

import {
  createMuiTheme,
  ThemeProvider,
  makeStyles,
  Theme,
  createStyles,
} from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import CssBaseline from "@material-ui/core/CssBaseline";
import blue from "@material-ui/core/colors/blue";

import Sidebar from "./components/Sidebar";
import { Avatar, Box, Container } from "@material-ui/core";
import LockOutlined from "@material-ui/icons/LockOutlined";
import Pages from "./components/Pages";

const drawerWidth = 240;

const theme = createMuiTheme({
  palette: {
    primary: blue,
    secondary: blue,
  },
});

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: "flex",
    },
    toolbar: theme.mixins.toolbar,
    drawerPaper: {
      width: drawerWidth,
    },
    content: {
      flexGrow: 1,
      padding: theme.spacing(3),
    },
    signInPaper: {
      marginTop: theme.spacing(8),
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    },
    signInAvatar: {
      margin: theme.spacing(1),
      backgroundColor: theme.palette.primary.main,
    },
    signInOptions: {
      marginTop: theme.spacing(6),
    },
  })
);

function App() {
  const uiConfig = {
    signInFlow: "popup",
    signInOptions: [
      firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      firebase.auth.EmailAuthProvider.PROVIDER_ID,
    ],
    callbacks: {
      signInSuccessWithAuthResult: () => false,
    },
  };

  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    firebase.auth().onAuthStateChanged((user) => {
      setIsSignedIn(!!user);
    });
  });

  const classes = useStyles();

  if (isSignedIn === false) {
    return (
      <ThemeProvider theme={theme}>
        <Container component="main" maxWidth="xs">
          <CssBaseline />
          <div className={classes.signInPaper}>
            <Avatar className={classes.signInAvatar}>
              <LockOutlined />
            </Avatar>
            <Typography component="h1" variant="h5">
              JimmySocial
            </Typography>
            <StyledFirebaseAuth
              uiConfig={uiConfig}
              firebaseAuth={firebase.auth()}
              className={classes.signInOptions}
            />
          </div>
          <Box mt={8}>
            <Typography variant="body2" color="textSecondary" align="center">
              {"Copyright © James Dearlove "}
              {new Date().getFullYear()}
              {"."}
            </Typography>
          </Box>
        </Container>
      </ThemeProvider>
    );
  }
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <div className={classes.root}>
          <CssBaseline />
          <Sidebar />
          <main className={classes.content}>
            <div className={classes.toolbar} />
            <Switch>
              {Pages.map((item) => (
                <Route {...item.routeProps} path={item.path} />
              ))}
            </Switch>
          </main>
        </div>
      </ThemeProvider>
    </Router>
  );
}

export default App;
