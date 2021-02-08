import React, { useEffect, useState } from "react";
import { Redirect } from "react-router-dom";
import firebase from "firebase/app";

import { useQuery } from "./index";

import CircularProgress from "@material-ui/core/CircularProgress";
import Typography from "@material-ui/core/Typography";
import { useSnackbar } from "notistack";

const SlackAuth = () => {
  const [loading, setLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();
  let query = useQuery();

  useEffect(() => {
    const performAuth = () => {
      const oauth_code = query.get("code");

      var slackLogin = firebase.functions().httpsCallable("slackUserLogin");
      slackLogin({
        oauth_code: oauth_code,
      })
        .then((result) => {
          if (result.data === "Success") {
            enqueueSnackbar("Successfully authenticated with Slack.", {
              variant: "success",
            });
          } else {
            enqueueSnackbar(
              "Failed to authenticated with Slack. Please try again.",
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
            "Failed to authenticated with Slack. Please try again.",
            {
              variant: "error",
            }
          );

          setLoading(false);
        });
    };

    performAuth();
  }, []);

  return (
    <>
      {loading ? (
        <>
          <Typography variant="h5">Authenticating with Slack</Typography>
          <CircularProgress />
        </>
      ) : (
        <Redirect to="/settings" />
      )}
    </>
  );
};

export default SlackAuth;
