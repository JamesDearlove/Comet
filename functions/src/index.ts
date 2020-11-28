import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

import axios from "axios";

admin.initializeApp();

// const BASE_FB_URL = "https://graph.facebook.com/v9.0/"

export const getPost = functions.https.onCall((data, context) => {
  const postID = data.postID;

  return admin
    .firestore()
    .doc(`posts/${postID}`)
    .get()
    .then((item) => {
      const result = item.data();

      if (!result) {
        throw new functions.https.HttpsError("not-found", "Post not found.");
      } else {
        return result;
      }
    })
    .catch((error) => {
      functions.logger.error(error);
      throw new functions.https.HttpsError("unknown", "An error has occurred.");
    });
});

export const updateFacebookUserToken = functions.https.onCall(
  async (data, context) => {
    const userShortToken = data.userToken;

    if (!userShortToken) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid token. No token"
      );
    }

    const tokenRequest = await axios({
      method: "get",
      url: "https://graph.facebook.com/v9.0/oauth/access_token",
      params: {
        grant_type: "fb_exchange_token",
        client_id: functions.config().facebook.clientid,
        client_secret: functions.config().facebook.clientsecret,
        fb_exchange_token: userShortToken,
      },
    });

    if (!tokenRequest.data.access_token) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid token, Facebook refused"
      );
    } else {
      await admin
        .firestore()
        .doc(`users/${context.auth?.uid}`)
        .update({ facebookUserToken: tokenRequest.data.access_token });
    }

    return tokenRequest.data.access_token;
  }
);

export const makeFacebookPost = functions.https.onCall(
  async (data, context) => {
    const postID = data.postID;

    const postData = await admin.firestore().doc(`posts/${postID}`).get();

    if (!postData) {
      throw new functions.https.HttpsError("not-found", "Post not found.");
    }

    const creationResult = await axios.post(
      "https://graph.facebook.com/v9.0/me/feed",
      {
        access_token: postData.data()!.facebookToken,
        message: postData.data()!.content,
      }
    );

    return creationResult.data;
  }
);
