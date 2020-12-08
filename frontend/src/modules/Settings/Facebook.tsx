import React, { useState, useEffect } from "react";

import Typography from "@material-ui/core/Typography";

import firebase from "firebase";
import FacebookLogin from "react-facebook-login";
import axios from "axios";

import CheckIcon from "@material-ui/icons/Check";
import InfoIcon from "@material-ui/icons/Info";

import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";

import StepContent from "@material-ui/core/StepContent";
import Paper from "@material-ui/core/Paper";

import { makeStyles, Theme, createStyles } from "@material-ui/core/styles";
import Stepper from "@material-ui/core/Stepper";
import Step from "@material-ui/core/Step";
import StepLabel from "@material-ui/core/StepLabel";
import CircularProgress from "@material-ui/core/CircularProgress";

import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormControl from "@material-ui/core/FormControl";
import FormLabel from "@material-ui/core/FormLabel";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: "100%",
    },
    button: {
      marginTop: theme.spacing(1),
      marginRight: theme.spacing(1),
    },
    actionsContainer: {
      marginBottom: theme.spacing(2),
    },
    resetContainer: {
      padding: theme.spacing(3),
    },
  })
);

const FacebookSetup = () => {
  const classes = useStyles();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [activeStep, setActiveStep] = React.useState(0);
  const [stepComplete, setStepComplete] = React.useState({
    0: false,
    1: false,
    2: true,
  });

  const handleClickOpen = () => {
    setDialogOpen(true);
    setActiveStep(0);
  };

  const handleClose = () => {
    setDialogOpen(false);
  };

  const userUid = firebase.auth().currentUser?.uid;
  const [status, setStatus] = useState("");
  const [pages, setPages] = useState([]);
  const [userData, setUserData] = useState<firebase.firestore.DocumentData>();
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");

  const [setup, setSetup] = useState(false);

  const savePageToken = (page: any) => {
    firebase.firestore().doc(`users/${userUid}`).update({
      facebookPageName: page.name,
      facebookPageID: page.id,
      facebookPageToken: page.access_token,
    });
  };

  const getUserPages = (userLongToken: string) => {
    axios({
      method: "get",
      url: `https://graph.facebook.com/v9.0/${userId}/accounts`,
      params: {
        access_token: userLongToken,
        fields: "name,id,access_token",
      },
    }).then((result) => {
      const pages = result.data.data;
      if (pages.length === 1) {
        savePageToken(pages[0]);
      }
      setPages(result.data.data);
    });
  };

  const getPageToken = (userShortToken: string) => {
    const longTokenFunc = firebase
      .functions()
      .httpsCallable("updateFacebookUserToken");
    longTokenFunc({ userToken: userShortToken }).then((result) => {
      getUserPages(result.data);
    });
  };

  // Handle the Facebook login. If successful, send off short-lived token
  // to the server to be upgraded to a long-lived token.
  const callbackResponse = (response: any) => {
    if (!response || response.status === "unknown") {
      setStatus(
        "We didn't receive a successful login from Facebook. Please try again."
      );
    } else {
      const setupUserLogin = firebase
        .functions()
        .httpsCallable("userFacebookLogin");
      setupUserLogin({ userToken: response.accessToken })
        .then(() => {
          setStatus(`Hello, ${response.name}. Click next to continue`);
          setUserName(response.name);
          setUserId(response.id);
        })
        .catch(() =>
          setStatus(
            "Sorry, we were unable to authenticate with your Facebook account. Please try again."
          )
        );
    }
  };

  const steps = [
    `Facebook authorisation ${activeStep > 0 ? `- ${userName}` : ""}`,
    "Choose post location",
    "Confirm connection",
  ];

  const stepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <>
            <Typography>
              Please log in to Facebook and give JimmySocial permission to post
              on your selected page.
            </Typography>
            <FacebookLogin
              appId="224158632347699"
              fields="name,email,picture"
              scope="pages_show_list,pages_read_engagement,pages_read_user_content,pages_manage_posts,pages_manage_engagement"
              callback={callbackResponse}
            />
            <Typography>{status}</Typography>
            <div className={classes.actionsContainer}>
              <div>
                <Button onClick={handleClose} className={classes.button}>
                  Cancel
                </Button>
                <Button
                  disabled={!userId}
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                  className={classes.button}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        );
      case 1:
        return (
          <>
            <Typography>
              Select where you would like JimmySocial to post on Facebook.
            </Typography>
            <FormControl component="fieldset">
              {/* <RadioGroup aria-label="gender" name="gender1" value={value} onChange={handleChange}> */}
              <RadioGroup aria-label="facebookFeed" name="feed1" value="page">
                {/* <FormControlLabel value="user" control={<Radio />} label={userName} disabled/> */}
                <FormControlLabel
                  value="page"
                  control={<Radio />}
                  label="(Page name to go here)"
                />
              </RadioGroup>
            </FormControl>
            <div className={classes.actionsContainer}>
              <div>
                <Button onClick={handleBack} className={classes.button}>
                  Back
                </Button>
                <Button
                  disabled={!userId}
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                  className={classes.button}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        );
      case 2:
        return (
          <>
            <Typography>
              This is how JimmySocial will link to Facebook. If you are happy
              with how these settings look, click finish.
            </Typography>
            <br />
            <Typography>Authorised Facebook user: {userName}</Typography>
            <Typography>Linked to Facebook page: (Page name here)</Typography>
            <div className={classes.actionsContainer}>
              <div>
                <Button onClick={handleBack} className={classes.button}>
                  Back
                </Button>
                <Button
                  disabled={!userId}
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                  className={classes.button}
                >
                  Finish
                </Button>
              </div>
            </div>
          </>
        );
      default:
        return "Something is not right here.";
    }
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    if (activeStep === 0) {
      handleClose();
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep - 1);
    }
  };

  return (
    <div>
      <Button variant="outlined" color="primary" onClick={handleClickOpen}>
        Configure Facebook
      </Button>
      <Dialog
        open={dialogOpen}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
        disableBackdropClick
      >
        <DialogTitle id="form-dialog-title">Connect to Facebook</DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((label, index) => (
              <Step key={index}>
                <StepLabel>{label}</StepLabel>
                <StepContent>{stepContent(index)}</StepContent>
              </Step>
            ))}
          </Stepper>
          {activeStep === steps.length && (
            <Paper square elevation={0} className={classes.resetContainer}>
              <Typography>
                <CircularProgress />
                Saving
              </Typography>
              <Button onClick={handleClose} className={classes.button}>
                Close
              </Button>
            </Paper>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const FacebookSettings = () => {
  const userUid = firebase.auth().currentUser?.uid;
  const [status, setStatus] = useState("Loading data");
  const [pages, setPages] = useState([]);
  const [userData, setUserData] = useState<firebase.firestore.DocumentData>();
  const [userId, setUserId] = useState("");

  const [setup, setSetup] = useState(false);

  const savePageToken = (page: any) => {
    firebase.firestore().doc(`users/${userUid}`).update({
      facebookPageName: page.name,
      facebookPageID: page.id,
      facebookPageToken: page.access_token,
    });
  };

  const getUserPages = (userLongToken: string) => {
    axios({
      method: "get",
      url: `https://graph.facebook.com/v9.0/${userId}/accounts`,
      params: {
        access_token: userLongToken,
        fields: "name,id,access_token",
      },
    }).then((result) => {
      const pages = result.data.data;
      if (pages.length === 1) {
        savePageToken(pages[0]);
      }
      setPages(result.data.data);
    });
  };

  const getPageToken = (userShortToken: string) => {
    const longTokenFunc = firebase
      .functions()
      .httpsCallable("updateFacebookUserToken");
    longTokenFunc({ userToken: userShortToken }).then((result) => {
      getUserPages(result.data);
    });
  };

  useEffect(() => {
    firebase
      .firestore()
      .doc(`users/${userUid}`)
      .get()
      .then((data) => {
        const db = data.data();
        setUserData(data.data());
        if (data.data()?.facebookPageToken) {
          setStatus(
            `Authenticated as ${db?.facebookUserName}, connected to Page: ${db?.facebookPageName}.`
          );
        } else {
          setStatus("No token stored.");
        }
        if (data.data()?.facebookUserID) {
          setUserId(data.data()?.facebookUserID);
        }
        if (
          db?.facebookUserToken &&
          db?.facebookPageToken &&
          db?.facebookUserID &&
          db?.facebookPageID
        ) {
          setSetup(true);
        }
      });
  }, []);

  const responseFacebook = (response: any) => {
    if (!response || response.status === "unknown") {
      setStatus("Failed to get token");
    } else {
      setStatus(`Authenticated as ${response.name}`);
      firebase.firestore().doc(`users/${userUid}`).set(
        {
          facebookUserID: response.id,
          facebookUserName: response.name,
        },
        { merge: true }
      );
      setUserId(response.id);
      getPageToken(response.accessToken);
    }
  };

  return (
    <>
      <Typography variant="h5">Facebook Connection</Typography>

      {userData ? (
        <>
          {setup ? (
            <Typography variant="body1">
              <CheckIcon /> Everything looks ok
            </Typography>
          ) : (
            <Typography variant="body1">
              <InfoIcon /> There might be a problem
            </Typography>
          )}
          <Typography variant="body1">
            Authenticated as: {userData?.facebookUserName} (ID:{" "}
            {userData?.facebookUserID})
          </Typography>
          <Typography variant="body1">
            Posting to page: {userData?.facebookPageName} (ID:{" "}
            {userData?.facebookPageID})
          </Typography>
        </>
      ) : (
        <>
          <Typography variant="body1">
            <InfoIcon /> Not setup
          </Typography>
        </>
      )}
      {/* {status} */}

      <FacebookLogin
        appId="224158632347699"
        fields="name,email,picture"
        scope="pages_show_list,pages_read_engagement,pages_read_user_content,pages_manage_posts,pages_manage_engagement"
        callback={responseFacebook}
      />
      <FacebookSetup />
      {/* <button onClick={() => getUserPages(userData?.facebookUserToken)} >Get Pages</button> */}
      <br />
      <br />
      {pages.length > 0 && (
        <span>
          Pages:{" "}
          {pages.map((item: any) => (
            <span>{item.name}</span>
          ))}
        </span>
      )}
    </>
  );
};

export default FacebookSettings;
