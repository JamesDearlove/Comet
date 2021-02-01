import React, { useEffect, useState } from "react";
import { Redirect } from "react-router-dom";
import firebase from "firebase";

import { useQuery } from "./index";

import CircularProgress from "@material-ui/core/CircularProgress";
import Typography from "@material-ui/core/Typography";
import { useSnackbar } from "notistack";

const TwitterAuth = () => {
  const [loading, setLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();
  let query = useQuery();

  const oauth_token = query.get("oauth_token");
  const oauth_verifier = query.get("oauth_verifier");

  useEffect(() => {
    var twitterLogin = firebase.functions().httpsCallable("twitterUserLogin");
    twitterLogin({
      oauth_token: oauth_token,
      oauth_verifier: oauth_verifier,
    })
      .then((result) => {
        if (result.data === "Success") {
          enqueueSnackbar("Successfully authenticated with Twitter.", {
            variant: "success",
          });
        } else {
          enqueueSnackbar(
            "Failed to authenticated with Twitter. Please try again.",
            {
              variant: "error",
            }
          );
        }
        setLoading(false);
      })
      .catch((result) => {
        //TODO: Make more verbose
        console.log(result);
        enqueueSnackbar(
          "Failed to authenticated with Twitter. Please try again.",
          {
            variant: "error",
          }
        );

        setLoading(false);
      });
  }, []);

  return (
    <>
      {loading ? (
        <>
          <Typography variant="h5">Authenticating with Twitter</Typography>
          <CircularProgress />
        </>
      ) : (
        <Redirect to="/settings" />
      )}
    </>
  );
};

export default TwitterAuth;
