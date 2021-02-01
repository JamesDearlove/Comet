import React, { useState, useEffect } from "react";
import firebase from "firebase";

import { makeStyles, Theme, createStyles } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import Step from "@material-ui/core/Step";
import StepContent from "@material-ui/core/StepContent";
import StepLabel from "@material-ui/core/StepLabel";
import Stepper from "@material-ui/core/Stepper";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";

import CheckIcon from "@material-ui/icons/Check";
import InfoIcon from "@material-ui/icons/Info";

import FacebookLogin from "react-facebook-login/dist/facebook-login-render-props";

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
    facebookButton: {},
  })
);

/**
 * Custom styled Facebook button because I didn't want to add the
 * Facebook SDK to the project. To be used with the facebook-react-login
 * package.
 * @param renderProps.onClick The Click Handler.
 */
const FacebookLoginButton = (renderProps: { onClick: () => void }) => {
  return (
    <Button
      style={{
        backgroundColor: "#1877f2",
        color: "white",
        paddingLeft: "1em",
        paddingRight: "1em",
        marginTop: "1em",
        marginBottom: "1em",
      }}
      onClick={renderProps.onClick}
    >
      Login with Facebook
    </Button>
  );
};

/**
 * Handles the Facebook Onboarding process. Displays a button that allows
 * you to configure Facebook for the user with a dialog and wizard.
 * @param props.setupState State to set to true when setup is successful
 */
const FacebookSetup = (props: {
  setupState: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const classes = useStyles();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [activeStep, setActiveStep] = React.useState(0);
  const [status, setStatus] = useState("");
  const [pages, setPages] = useState<any[]>([]);
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [selectedPage, setSelectedPage] = useState("");

  // Dialog event handlers
  const handleOpen = () => {
    setDialogOpen(true);
    setActiveStep(0);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setUserName("");
    setUserId("");
    setSelectedPage("");
    setStatus("");
  };
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleFinish = () => {
    handleNext();
    setUserPage();
  };

  // Facebook API functions

  // Get the user's pages.
  const getUserPages = async () => {
    const userPages = await firebase
      .functions()
      .httpsCallable("facebookGetUserPages")();
    setPages(userPages.data);
  };

  // Set the page that the user selected.
  const setUserPage = async () => {
    const setUserPage = await firebase
      .functions()
      .httpsCallable("facebookSetUserPage");
    setUserPage({ pageID: selectedPage }).then(() => {
      props.setupState(true);
      handleClose();
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
        .httpsCallable("facebookUserLogin");

      setupUserLogin({ userToken: response.accessToken })
        .then(() => {
          setStatus(`Hello, ${response.name}. Click next to continue`);
          setUserName(response.name);
          setUserId(response.id);
          getUserPages();
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
    `Choose post location ${
      activeStep > 1
        ? `- ${pages.find((x) => x.id === selectedPage)?.name}`
        : ""
    }`,
    "Confirm connection",
  ];

  const stepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <>
            <Typography>
              Please log in to Facebook and give Comet permission to post on
              your selected page.
            </Typography>
            <FacebookLogin
              appId="224158632347699"
              fields="name,email,picture"
              scope="pages_show_list,pages_read_engagement,pages_read_user_content,pages_manage_posts,pages_manage_engagement"
              render={FacebookLoginButton}
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
              Select where you would like Comet to post on Facebook.
            </Typography>
            <FormControl component="fieldset">
              <RadioGroup
                aria-label="facebookFeed"
                name="feed1"
                value={selectedPage}
                onChange={(e) => setSelectedPage(e.target.value)}
              >
                {pages.map((item) => (
                  <FormControlLabel
                    value={item.id}
                    control={<Radio color="primary" />}
                    label={item.name}
                  />
                ))}
              </RadioGroup>
            </FormControl>
            <div className={classes.actionsContainer}>
              <div>
                <Button onClick={handleBack} className={classes.button}>
                  Back
                </Button>
                <Button
                  disabled={!selectedPage || selectedPage === ""}
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
              This is how Comet will link to Facebook. If you are happy with how
              these settings look, click finish.
            </Typography>
            <br />
            <Typography>Authorised Facebook user: {userName}</Typography>
            <Typography>
              Linked to Facebook page:{" "}
              {pages.find((x) => x.id === selectedPage)?.name}
            </Typography>
            <div className={classes.actionsContainer}>
              <div>
                <Button onClick={handleBack} className={classes.button}>
                  Back
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleFinish}
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

  return (
    <div>
      <Button variant="outlined" color="primary" onClick={handleOpen}>
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
            </Paper>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

/**
 * The Facebook settings panel. Displays the current status of the user's
 * Facebook configuration and allows the user to manage their Facebook connection.
 */
// TODO: Add ability to log out of Facebook.
const FacebookSettings = () => {
  const [userData, setUserData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const [newSetup, setNewSetup] = useState(false);

  const loadData = () => {
    firebase
      .functions()
      .httpsCallable("facebookVerifyToken")()
      .then((res) => {
        setUserData(res.data);
        setLoading(false);
      });
  };

  useEffect(loadData, [newSetup]);

  return (
    <>
      <Typography variant="h5">Facebook Connector</Typography>

      {loading ? (
        <CircularProgress />
      ) : (
        <>
          {userData ? (
            <>
              <Typography variant="body1">
                {userData.setup ? <CheckIcon /> : <InfoIcon />}{" "}
                {userData.reason}
              </Typography>
              {userData.user && (
                <Typography variant="body1">
                  Authenticated as: {userData.user}
                </Typography>
              )}
              {userData.page && (
                <Typography variant="body1">
                  Connected to page: {userData.page}
                </Typography>
              )}
            </>
          ) : (
            <>
              <Typography variant="body1">
                <InfoIcon /> {userData.reasn}
              </Typography>
            </>
          )}
          <FacebookSetup setupState={setNewSetup} />
        </>
      )}
    </>
  );
};

export default FacebookSettings;
