import React, { useEffect, useState } from "react";

import firebase from "firebase/app";

import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";

import CheckIcon from "@material-ui/icons/Check";
import InfoIcon from "@material-ui/icons/Info";

const TwitterSettings = () => {
  const [loading, setLoading] = useState(true);
  const [loadingRequestToken, setLoadingRequestToken] = useState(false);

  const [userData, setUserData] = useState<any>({});

  useEffect(() => {
    firebase
      .functions()
      .httpsCallable("twitterVerifyToken")()
      .then((res) => {
        setUserData(res.data);
        setLoading(false);
      });
  }, []);

  const twitterLogin = firebase
    .functions()
    .httpsCallable("twitterLoginRequest");

  //TODO: Fires twice
  const startLogin = async () => {
    setLoadingRequestToken(true);
    const response = await twitterLogin();
    if (response.data) {
      window.location.href = `https://api.twitter.com/oauth/authorize?oauth_token=${response.data}`;
    } else {
      setLoadingRequestToken(false);
    }
  };

  return (
    <>
      <Typography variant="h5">Twitter Connector</Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <>
          <Typography variant="body1">
            {userData.setup ? <CheckIcon /> : <InfoIcon />} {userData?.reason}
          </Typography>
          {userData?.screen_name && (
            <Typography variant="body1">
              Logged in as: @{userData?.screen_name}
            </Typography>
          )}
          <Button
            variant="outlined"
            color="primary"
            onClick={startLogin}
            disabled={loadingRequestToken}
          >
            Configure Twitter
          </Button>
          {loadingRequestToken && <CircularProgress />}
        </>
      )}
    </>
  );
};

export default TwitterSettings;
