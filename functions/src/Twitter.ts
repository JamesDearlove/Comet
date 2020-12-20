import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const Twitter = require("twitter-lite");

const client = new Twitter({
  consumer_key: functions.config().twitter.consumerkey,
  consumer_secret: functions.config().twitter.consumersecret,
});

const OAUTH_CALLBACK_URL = "https://localhost:3000/auth/twitter"

export const twitterLoginRequest = functions.https.onCall(
  async (data, context) => {
    const response = await client.getRequestToken(
      OAUTH_CALLBACK_URL
    );

    if (!response || !response.oauth_callback_confirmed) {
      // Something went wrong
    }

    // TODO: This must be stored where only the server can access it
    await admin.firestore().doc(`twitterAuth/${context.auth?.uid}`).update({
      oauth_token: response.oauth_token,
      oauth_token_secret: response.oauth_token_secret,
    });

    return response.oauth_token;
  }
);

export const userTwitterLogin = functions.https.onCall(
  async (data, context) => {
    const oauth_token = data.oauth_token;
    const oauth_verifier = data.oauth_verifier;

    if (!oauth_token || !oauth_verifier) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid token or verifier provided."
      );
    }

    const tempToken = await admin
      .firestore()
      .doc(`twitterAuth/${context.auth?.uid}`)
      .get();

    if (!tempToken) {
      throw new functions.https.HttpsError(
        "not-found",
        "Could not find record of requested token."
      );
    }

    if (tempToken.data()?.oauth_token !== oauth_token) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Given token did not match requested token."
      );
    }

    const response = await client.getAccessToken({
      oauth_token: oauth_token,
      oauth_verifier: oauth_verifier,
    });

    console.log(response);

    await admin.firestore().doc(`users/${context.auth?.uid}`).update({
      twitterOauthToken: response.oauth_token,
      twitterOauthSecret: response.oauth_token_secret,
      twitterUserID: response.user_id,
      twitterUsername: response.screen_name,
    });

    return "Success";
  }
);

export const userTwitterLogout = functions.https.onCall((data, context) => {
  throw new functions.https.HttpsError("unimplemented", "Not implemented.");
});

export const publishToTwitter = functions.https.onCall((data, context) => {
  throw new functions.https.HttpsError("unimplemented", "Not implemented.");
});
