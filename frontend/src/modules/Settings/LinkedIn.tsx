import React, { useEffect, useState } from "react";

import firebase from "firebase/app";

import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";

import CheckIcon from "@material-ui/icons/Check";
import InfoIcon from "@material-ui/icons/Info";

const LinkedInSettings = () => {
  const [loading, setLoading] = useState(true);
  const [loadingRequestToken, setLoadingRequestToken] = useState(false);

  const [userData, setUserData] = useState<any>({});

  useEffect(() => {
    firebase
      .functions()
      .httpsCallable("linkedinVerifyToken")()
      .then((res) => {
        setUserData(res.data);
        setLoading(false);
      });
  }, []);

  //TODO: Fires twice
  const startLogin = async () => {
    const clientId = process.env.REACT_APP_LINKEDIN_ID;
    const scope =
      "rw_organization_admin,r_organization_social,w_organization_social,r_liteprofile";
    const redirectURI = "https://comet.jimmyd.dev/auth/linkedin";
    window.location.href = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectURI}&scope=${scope}`;
  };

  console.log(userData?.firstname, userData?.lastname);

  return (
    <>
      <Typography variant="h5">LinkedIn Connector</Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <>
          <Typography variant="body1">
            {userData.setup ? <CheckIcon /> : <InfoIcon />} {userData?.reason}
          </Typography>
          {userData?.firstname && (
            <Typography variant="body1">
              Logged in as {userData?.firstname.toString()}{" "}
              {userData?.lastname.toString()}
            </Typography>
          )}
          <Button
            variant="outlined"
            color="primary"
            onClick={startLogin}
            disabled={loadingRequestToken}
          >
            Configure LinkedIn
          </Button>
          {loadingRequestToken && <CircularProgress />}
        </>
      )}
    </>
  );
};

export default LinkedInSettings;
