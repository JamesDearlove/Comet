import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const Twitter = require("twitter-lite");

const API_SUBDOMAIN = "api";
const API_VERSION = "1.1";
const CONSUMER_KEY = functions.config().twitter.consumerkey;
const CONSUMER_SECRET = functions.config().twitter.consumersecret;

const OAUTH_CALLBACK_URL = "https://localhost:3000/auth/twitter";

const getClient = async (authenticated: boolean, authUid?: string) => {
  let clientConfig: any = {
    subdomain: API_SUBDOMAIN,
    version: API_VERSION,
    consumer_key: CONSUMER_KEY,
    consumer_secret: CONSUMER_SECRET,
  };

  if (authenticated) {
    if (!authUid) {
      throw new functions.https.HttpsError(
        "internal",
        "Expected authentication data but received nothing."
      );
    }
    const tokenData = await admin.firestore().doc(`tokens/${authUid}`).get();

    if (
      !tokenData.data()?.twitterToken ||
      !tokenData.data()?.twitterSecret
    ) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User has not connected to Twitter."
      );
    }

    clientConfig = {
      ...clientConfig,
      access_token_key: tokenData.data()?.twitterToken,
      access_token_secret: tokenData.data()?.twitterSecret,
    };
  }

  return new Twitter(clientConfig);
};

export const twitterLoginRequest = functions.https.onCall(
  async (data, context) => {
    const client = await getClient(false);

    const response = await client.getRequestToken(OAUTH_CALLBACK_URL);

    if (!response || !response.oauth_callback_confirmed) {
      // Something went wrong
    }

    await admin.firestore().doc(`tokens/${context.auth?.uid}`).set({
      twitterOauthToken: response.oauth_token,
      twitterOauthTokenSecret: response.oauth_token_secret,
    }, {merge: true});

    return response.oauth_token;
  }
);

export const userTwitterLogin = functions.https.onCall(
  async (data, context) => {
    const oauth_token = data.oauth_token;
    const oauth_verifier = data.oauth_verifier;
    const client = await getClient(false);

    if (!oauth_token || !oauth_verifier) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid token or verifier provided."
      );
    }

    const tokenData = await admin
      .firestore()
      .doc(`tokens/${context.auth?.uid}`)
      .get();

    if (!tokenData) {
      throw new functions.https.HttpsError(
        "not-found",
        "Could not find record of requested token."
      );
    }

    if (tokenData.data()?.twitterOauthToken !== oauth_token) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Given token did not match requested token."
      );
    }

    const response = await client.getAccessToken({
      oauth_token: oauth_token,
      oauth_verifier: oauth_verifier,
    });

    const FieldValue = admin.firestore.FieldValue;

    await admin.firestore().doc(`tokens/${context.auth?.uid}`).update({
      twitterToken: response.oauth_token,
      twitterSecret: response.oauth_token_secret,
      twitterOauthToken: FieldValue.delete(),
      twitterOauthTokenSecret: FieldValue.delete(),
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

export const verifyTwitterToken = functions.https.onCall(
  async (data, context) => {
    const tokenData = await admin
      .firestore()
      .doc(`tokens/${context.auth?.uid}`)
      .get();

    if (
      !tokenData ||
      !(
        tokenData.data()?.twitterToken &&
        tokenData.data()?.twitterSecret
      )
    ) {
      return { setup: false, reason: "Twitter is not linked." };
    }

    const client = await getClient(true, context.auth?.uid);

    let response;
    try {
      response = await client.get("account/verify_credentials");
    } catch {
      // TODO: Take advantage of Twitter's error codes:
      // https://developer.twitter.com/en/support/twitter-api/error-troubleshooting
      return { setup: false, reason: "Your Twitter token is no longer valid." };
    }

    return {
      setup: true,
      reason: "Your Twitter token is valid.",
      screen_name: response.screen_name,
    };
  }
);
