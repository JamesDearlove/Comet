import React, { useEffect, useState } from "react";

import firebase from "firebase/app";

import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";

import CheckIcon from "@material-ui/icons/Check";
import InfoIcon from "@material-ui/icons/Info";

const SlackSettings = () => {
  const [loading, setLoading] = useState(true);
  const [loadingRequestToken, setLoadingRequestToken] = useState(false);

  const [userData, setUserData] = useState<any>({});

  useEffect(() => {
    firebase
      .functions()
      .httpsCallable("slackVerifyToken")()
      .then((res) => {
        setUserData(res.data);
        setLoading(false);
      });
  }, []);

  //TODO: Fires twice
  const startLogin = async () => {
    const clientId = process.env.REACT_APP_SLACK_ID;
    const scope = "channels:read,chat:write,files:write";
    window.location.href = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&user_scope=${scope}`;
  };

  return (
    <>
      <Typography variant="h5">Slack Connector</Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <>
          <Typography variant="body1">
            {userData.setup ? <CheckIcon /> : <InfoIcon />} {userData?.reason}
          </Typography>
          {userData?.user && (
            <Typography variant="body1">
              Logged in as {userData?.user} to {userData?.team}
            </Typography>
          )}
          <Button
            variant="outlined"
            color="primary"
            onClick={startLogin}
            disabled={loadingRequestToken}
          >
            Configure Slack
          </Button>
          {loadingRequestToken && <CircularProgress />}
        </>
      )}
    </>
  );
};

export default SlackSettings;
