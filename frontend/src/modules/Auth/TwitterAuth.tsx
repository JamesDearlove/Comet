import React, { useEffect, useState } from "react";
import { Redirect } from "react-router-dom";
import firebase from "firebase";

import { useQuery } from "./index";

import LinearProgress from "@material-ui/core/LinearProgress";
import Typography from "@material-ui/core/Typography";

const TwitterAuth = () => {
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  let query = useQuery();

  const oauth_token = query.get("oauth_token");
  const oauth_verifier = query.get("oauth_verifier");

  useEffect(() => {
    var twitterLogin = firebase.functions().httpsCallable("userTwitterLogin");
    twitterLogin({
      oauth_token: oauth_token,
      oauth_verifier: oauth_verifier,
    })
      .then((result) => {
        if (result.data === "Success") {
          setSuccess(true);
        }
        setLoading(false);
      })
      .catch((result) => {
        //TODO: Make more verbose

        setLoading(false);
      });
  }, []);

  return (
    <>
      {loading ? (
        <>
          <LinearProgress />
          <Typography variant="h5">Authenticating with Twitter</Typography>
        </>
      ) : success ? (
        <>
          <Typography variant="h5">
            Successfully authenticated with Twitter
          </Typography>
          <Redirect to="/settings" />
        </>
      ) : (
        <Typography>Failed to authenticate with Twitter</Typography>
      )}
    </>
  );
};

export default TwitterAuth;
