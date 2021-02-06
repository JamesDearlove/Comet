import React from "react";

import Typography from "@material-ui/core/Typography";

import firebase from "firebase/app";

const HomePage = () => {
  return (
    <>
      <Typography variant="h4">
        Welcome, {firebase.auth().currentUser?.displayName}!
      </Typography>
    </>
  );
};

export default HomePage;
