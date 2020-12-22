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
          `Recieved error when retrieving long-lived token. ${tokenRequest.data.error.code}: ${tokenRequest.data.error.message}`
        );
      }
    }

    await admin.firestore().doc(`tokens/${context.auth?.uid}`).set({
      facebookUser: tokenRequest.data.access_token,
    }, { merge: true });

    // TODO: Better way to signal success
    return "Success";
  }
);

export const userFacebookLogout = functions.https.onCall((data, context) => {
  throw new functions.https.HttpsError("unimplemented", "Not implemented.");
});

// TODO: Graceful handling of errors
export const getUserFacebookPages = functions.https.onCall(
  async (data, context) => {
    const userData = await admin
      .firestore()
      .doc(`tokens/${context.auth?.uid}`)
      .get();
    const userToken = userData.data()?.facebookUser;

    const pageListRequest = await instance.get("me/accounts", {
      params: {
        access_token: userToken,
        fields: "id,name",
      },
    });

    // if (!pageListRequest.data.error) {
    //   throw new functions.https.HttpsError(
    //     "internal",
    //     "An unkown error occurred with the Facebook API."
    //   );
    // }

    return pageListRequest.data.data;
  }
);

// TODO: Graceful handling of errors
export const setUserFacebookPage = functions.https.onCall(
  async (data, context) => {
    const pageID = data.pageID;

    const userData = await admin
      .firestore()
      .doc(`tokens/${context.auth?.uid}`)
      .get();
    const userToken = userData.data()?.facebookUser;

    const tokenRequest = await instance.get(`${pageID}/`, {
      params: {
        access_token: userToken,
        fields: "access_token",
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
          `Recieved error when retrieving page token. ${tokenRequest.data.error.code}: ${tokenRequest.data.error.message}`
        );
      }
    }

    await admin.firestore().doc(`tokens/${context.auth?.uid}`).update({
      facebookPage: tokenRequest.data.access_token,
    });

    return "Success";
  }
);

export const publishToFacebook = functions.https.onCall(
  async (data, context) => {
    const postID = data.postID;

    const postDataRef = admin.firestore().doc(`posts/${postID}`);
    const postData = await postDataRef.get();

    if (!postData) {
      throw new functions.https.HttpsError("not-found", "Post not found.");
    }

    const creationResult = await instance.post("me/feed", {
      access_token: postData.data()?.facebook.token,
      message: postData.data()?.content,
      fields: "permalink_url",
    });

    if (creationResult.status === 200) {
      await postDataRef.update({ postedOn: new Date() });
    }

    return creationResult.data;
  }
);

export const verifyFacebookToken = functions.https.onCall(
  async (data, context) => {
    const tokenDocument = await admin
      .firestore()
      .doc(`tokens/${context.auth?.uid}`)
      .get();
    const tokenData = tokenDocument.data();
    const userToken = tokenData?.facebookUser;
    const pageToken = tokenData?.facebookPage;

    if (!tokenData || (!userToken && !pageToken)) {
      return { setup: false, reason: "Facebook is not linked." };
    }

    let userFailed = false;
    let userRequest;
    try {
      userRequest = await instance.get("me", {
        params: {
          access_token: userToken,
          fields: "id,name",
        },
      });
    } catch {
      userFailed = true;
    }

    let pageFailed = false;
    let pageRequest;
    try {
      pageRequest = await instance.get("me", {
        params: {
          access_token: pageToken,
          fields: "id,name",
        },
      });
    } catch {
      pageFailed = true;
    }

    if (!pageFailed) {
      if (!userFailed) {
        return {
          setup: true,
          reason: "Your Facebook page and user tokens are valid.",
          user: userRequest?.data.name,
          page: pageRequest?.data.name,
        };
      } else {
        return {
          setup: true,
          reason:
            "Page token is valid but your user token is no longer valid.",
          page: pageRequest?.data.name,
        };
      }
    } else {
      return {
        setup: false,
        reason:
          "Your Facebook tokens are no longer valid.",
      };
    }
  }
);
