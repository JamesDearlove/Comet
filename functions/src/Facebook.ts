import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

import axios from "axios";

const instance = axios.create({
  baseURL: "https://graph.facebook.com/v9.0/",
});

export const userFacebookLogin = functions.https.onCall(
  async (data, context) => {
    const userShortToken = data.userToken;

    if (!userShortToken) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid token. No token"
      );
    }

    const tokenRequest = await instance.get("oauth/access_token", {
      params: {
        grant_type: "fb_exchange_token",
        client_id: functions.config().facebook.clientid,
        client_secret: functions.config().facebook.clientsecret,
        fb_exchange_token: userShortToken,
      },
    });

    if (!tokenRequest.data.access_token) {
      if (!tokenRequest.data.error) {
        throw new functions.https.HttpsError(
          "internal",
          "An unkown error occurred with the Facebook API."
        );
      } else {
        throw new functions.https.HttpsError(
          "permission-denied",
          `Recieved error ${tokenRequest.data.error.code}: ${tokenRequest.data.error.message}`
        );
      }
    } else {
      await admin
        .firestore()
        .doc(`users/${context.auth?.uid}`)
        .update({ facebookUserToken: tokenRequest.data.access_token });
    }

    return tokenRequest.data.access_token;
  }
);

export const userFacebookLogout = functions.https.onCall((data, context) => {
  throw new functions.https.HttpsError("unimplemented", "Not implemented.");
});

export const getUserFacebookPages = functions.https.onCall((data, context) => {
  throw new functions.https.HttpsError("unimplemented", "Not implemented.");
});

export const setUserFacebookPage = functions.https.onCall((data, context) => {
  throw new functions.https.HttpsError("unimplemented", "Not implemented.");
});

export const publishFacebookPost = functions.https.onCall(
  async (data, context) => {
    const postID = data.postID;

    const postDataRef = admin.firestore().doc(`posts/${postID}`);
    const postData = await postDataRef.get();

    if (!postData) {
      throw new functions.https.HttpsError("not-found", "Post not found.");
    }

    const creationResult = await instance.post(
      "me/feed",
      {
        access_token: postData.data()?.facebook.token,
        message: postData.data()?.content,
        fields: "permalink_url",
      }
    );

    if (creationResult.status == 200) {
      await postDataRef.update({ postedOn: new Date() });
    }

    return creationResult.data;
});
