import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";

import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import "firebase/functions";
import "firebase/storage";
import StyledFirebaseAuth from "react-firebaseui/StyledFirebaseAuth";

import {
  createMuiTheme,
  ThemeProvider,
  makeStyles,
  Theme,
  createStyles,
} from "@material-ui/core/styles";
import Avatar from "@material-ui/core/Avatar";
import blue from "@material-ui/core/colors/blue";
import blueGrey from "@material-ui/core/colors/blueGrey";
import Box from "@material-ui/core/Box";
import CircularProgress from "@material-ui/core/CircularProgress";
import Container from "@material-ui/core/Container";
import CssBaseline from "@material-ui/core/CssBaseline";
import Typography from "@material-ui/core/Typography";

import LockOutlined from "@material-ui/icons/LockOutlined";

import { SnackbarProvider } from "notistack";

import Sidebar from "./components/Sidebar";
import Pages from "./components/Pages";
import Auth from "./modules/Auth";

const drawerWidth = 240;

const theme = createMuiTheme({
  palette: {
    primary: blue,
    secondary: blueGrey,
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

  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    firebase.auth().onAuthStateChanged((user) => {
      setIsSignedIn(!!user);
      setLoadingAuth(false);
    });
  });

  // firebase.functions().useEmulator("localhost", 5001);

  const classes = useStyles();

  const LoginScreen = () => (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <div className={classes.signInPaper}>
        <Avatar className={classes.signInAvatar}>
          <LockOutlined />
        </Avatar>
        <Typography component="h1" variant="h5">
          Comet
        </Typography>
        {loadingAuth ? (
          <CircularProgress className={classes.signInOptions} />
        ) : (
          <StyledFirebaseAuth
            uiConfig={uiConfig}
            firebaseAuth={firebase.auth()}
            className={classes.signInOptions}
          />
        )}
      </div>
      <Box mt={8}>
        <Typography variant="body2" align="center">
          Comet is early in development is not currently accepting user signups.
          Follow @JimmyDearlove on Twitter for future updates.
        </Typography>
        <br />
        <Typography variant="body2" color="textSecondary" align="center">
          {"Copyright © James Dearlove "}
          {new Date().getFullYear()}
          {"."}
        </Typography>
      </Box>
    </Container>
  );

  return (
    <ThemeProvider theme={theme}>
      <SnackbarProvider maxSnack={3}>
        {isSignedIn ? (
          <Router>
            <div className={classes.root}>
              <CssBaseline />
              <Sidebar />
              <main className={classes.content}>
                <div className={classes.toolbar} />
                <Switch>
                  {Pages.map((item) => (
                    <Route
                      key={item.name}
                      {...item.routeProps}
                      path={item.path}
                    />
                  ))}
                  <Route path="/auth">
                    <Auth />
                  </Route>
                  <Route>
                    <Typography variant="h4">You seem lost</Typography>
                    {/* <br /> */}
                    <Typography>
                      We are not sure how you navigated here, but let us help
                      you get back to the right path.
                    </Typography>
                    <br />
                    <Typography>
                      <Link to="/">Go home</Link>
                    </Typography>
                    <Typography>
                      <Link to="/posts">View your posts</Link>
                    </Typography>
                  </Route>
                </Switch>
              </main>
            </div>
          </Router>
        ) : (
          <LoginScreen />
        )}
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
