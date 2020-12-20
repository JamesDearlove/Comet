import React, { useState } from "react";

import firebase from "firebase";

import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";

const TwitterSettings = () => {
  const [loading, setLoading] = useState(false);

  const twitterLogin = firebase
    .functions()
    .httpsCallable("twitterLoginRequest");

  //TODO: Fires twice
  const startLogin = async () => {
    setLoading(true);
    const response = await twitterLogin();
    if (response.data) {
      window.location.href = `https://api.twitter.com/oauth/authorize?oauth_token=${response.data}`;
    } else {
      setLoading(false);
    }
  };

  return (
    <>
      <Typography variant="h5">Twitter Connection</Typography>
      <Typography variant="body1">Current Status Here</Typography>
      <Typography variant="body1">Logged in as: X</Typography>
      <Button
        variant="outlined"
        color="primary"
        onClick={startLogin}
        disabled={loading}
      >
        Configure Twitter
      </Button>
      {loading && <CircularProgress />}
    </>
  );
};

export default TwitterSettings;
