import React, { useEffect, useState } from "react";

import Typography from "@material-ui/core/Typography";

import firebase from "firebase";

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
