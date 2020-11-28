import React, { useEffect, useState } from "react";

import Typography from "@material-ui/core/Typography";

import firebase from "firebase";

const GetPost = () => {
  let functions = firebase.functions();

  const [res, setRes] = useState("");

  useEffect(() => {
    var facebookPost = functions.httpsCallable("getPost");
    facebookPost({ postID: "hv18A6djx389U3dm1pZS" }).then(function (result) {
      setRes(result.data.content);
    });
  }, []);

  return (
    <>
      <Typography variant="body1">Here is the result:</Typography>
      {res}
    </>
  );
};

const TestFB = () => {};

const TestPage = () => {
  return <>{/* <GetPost />
      <br /> */}</>;
};

export default TestPage;
