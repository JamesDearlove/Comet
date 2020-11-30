import React, { useState, useEffect } from "react";

import Typography from "@material-ui/core/Typography";

import firebase from "firebase";
import FacebookLogin from "react-facebook-login";
import axios from "axios";

import CheckIcon from "@material-ui/icons/Check";
import InfoIcon from "@material-ui/icons/Info";

const FacebookSetup = () => {
  return <></>;
};

const FacebookSettings = () => {
  const userUid = firebase.auth().currentUser?.uid;
  const [status, setStatus] = useState("Loading data");
  const [pages, setPages] = useState([]);
  const [userData, setUserData] = useState<firebase.firestore.DocumentData>();
  const [userId, setUserId] = useState("");

  const [setup, setSetup] = useState(false);

  const savePageToken = (page: any) => {
    firebase.firestore().doc(`users/${userUid}`).update({
      facebookPageName: page.name,
      facebookPageID: page.id,
      facebookPageToken: page.access_token,
    });
  };

  const getUserPages = (userLongToken: string) => {
    axios({
      method: "get",
      url: `https://graph.facebook.com/v9.0/${userId}/accounts`,
      params: {
        access_token: userLongToken,
        fields: "name,id,access_token",
      },
    }).then((result) => {
      const pages = result.data.data;
      if (pages.length === 1) {
        savePageToken(pages[0]);
      }
      setPages(result.data.data);
    });
  };

  const getPageToken = (userShortToken: string) => {
    const longTokenFunc = firebase
      .functions()
      .httpsCallable("updateFacebookUserToken");
    longTokenFunc({ userToken: userShortToken }).then((result) => {
      getUserPages(result.data);
    });
  };

  useEffect(() => {
    firebase
      .firestore()
      .doc(`users/${userUid}`)
      .get()
      .then((data) => {
        const db = data.data();
        setUserData(data.data());
        if (data.data()?.facebookPageToken) {
          setStatus(
            `Authenticated as ${db?.facebookUserName}, connected to Page: ${db?.facebookPageName}.`
          );
        } else {
          setStatus("No token stored.");
        }
        if (data.data()?.facebookUserID) {
          setUserId(data.data()?.facebookUserID);
        }
        if (
          db?.facebookUserToken &&
          db?.facebookPageToken &&
          db?.facebookUserID &&
          db?.facebookPageID
        ) {
          setSetup(true);
        }
      });
  }, []);

  const responseFacebook = (response: any) => {
    if (!response || response.status === "unknown") {
      setStatus("Failed to get token");
    } else {
      setStatus(`Authenticated as ${response.name}`);
      firebase.firestore().doc(`users/${userUid}`).set(
        {
          facebookUserID: response.id,
          facebookUserName: response.name,
        },
        { merge: true }
      );
      setUserId(response.id);
      getPageToken(response.accessToken);
    }
  };

  return (
    <>
      <Typography variant="h5">Facebook Connection</Typography>

      {userData ? (
        <>
          {setup ? (
            <Typography variant="body1">
              <CheckIcon /> Everything looks ok
            </Typography>
          ) : (
            <Typography variant="body1">
              <InfoIcon /> There might be a problem
            </Typography>
          )}
          <Typography variant="body1">
            Authenticated as: {userData?.facebookUserName} (ID:{" "}
            {userData?.facebookUserID})
          </Typography>
          <Typography variant="body1">
            Posting to page: {userData?.facebookPageName} (ID:{" "}
            {userData?.facebookPageID})
          </Typography>
        </>
      ) : (
        <>
          <Typography variant="body1">
            <InfoIcon /> Not setup
          </Typography>
        </>
      )}
      {/* {status} */}

      <FacebookLogin
        appId="224158632347699"
        fields="name,email,picture"
        scope="pages_show_list,pages_read_engagement,pages_read_user_content,pages_manage_posts,pages_manage_engagement"
        callback={responseFacebook}
      />
      {/* <button onClick={() => getUserPages(userData?.facebookUserToken)} >Get Pages</button> */}
      <br />
      <br />
      {pages.length > 0 && (
        <span>
          Pages:{" "}
          {pages.map((item: any) => (
            <span>{item.name}</span>
          ))}
        </span>
      )}
    </>
  );
};

export default FacebookSettings;
