import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const Twitter = require("twitter-lite");

const API_SUBDOMAIN = "api";
const API_VERSION = "1.1";
const CONSUMER_KEY = functions.config().twitter.consumerkey;
const CONSUMER_SECRET = functions.config().twitter.consumersecret;

const OAUTH_CALLBACK_URL = "https://comet.jimmyd.dev/auth/twitter";

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
      !tokenData.data()?.twitter?.token ||
      !tokenData.data()?.twitter?.tokenSecret
    ) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User has not connected to Twitter."
      );
    }

    clientConfig = {
      ...clientConfig,
      access_token_key: tokenData.data()?.twitter?.token,
      access_token_secret: tokenData.data()?.twitter?.tokenSecret,
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
      throw new functions.https.HttpsError(
        "permission-denied",
        "Unable to request login token from Twitter."
      );
    }

    await admin
      .firestore()
      .doc(`tokens/${context.auth?.uid}`)
      .set(
        {
          twitter: {
            oauthToken: response.oauth_token,
            oauthTokenSecret: response.oauth_token_secret,
          },
        },
        { merge: true }
      );

    return response.oauth_token;
  }
);

export const twitterUserLogin = functions.https.onCall(
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

    if (tokenData.data()?.twitter?.oauthToken !== oauth_token) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Given token did not match requested token."
      );
    }

    const response = await client.getAccessToken({
      oauth_token: oauth_token,
      oauth_verifier: oauth_verifier,
    });

    await admin
      .firestore()
      .doc(`tokens/${context.auth?.uid}`)
      .update({
        twitter: {
          token: response.oauth_token,
          tokenSecret: response.oauth_token_secret,
        },
      });

    return "Success";
  }
);

export const twitterUserLogout = functions.https.onCall((data, context) => {
  throw new functions.https.HttpsError("unimplemented", "Not implemented.");
});

export const twitterVerifyToken = functions.https.onCall(
  async (data, context) => {
    const tokenData = await admin
      .firestore()
      .doc(`tokens/${context.auth?.uid}`)
      .get();

    if (
      !tokenData ||
      !(
        tokenData.data()?.twitter?.token &&
        tokenData.data()?.twitter?.tokenSecret
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

export const twitterPublishPost = async (postID: string) => {
  const postRef = admin.firestore().doc(`posts/${postID}`);
  const postData = await postRef.get();

  if (postData.exists) {
    const client = await getClient(true, postData.data()?.ownerID);

    let content = postData.data()?.twitter.content
    ? postData.data()?.twitter.content
    : postData.data()?.content;

    let tweet;

    try {
      tweet = await client.post("statuses/update", {
        status: content,
      });
    } catch {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Unable to post to Twitter"
      );
    }

    // TODO: This is sketch, fix this later
    await postRef.update({
      permalink: {
        ...postData.data()?.permalink,
        twitter: `https://twitter.com/i/web/status/${tweet.id_str}`,
      },
    });
  } else {
    throw new functions.https.HttpsError("not-found", "Post not found");
  }
};
