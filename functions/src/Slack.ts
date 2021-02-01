import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

import * as slack from "@slack/web-api";

// const CLIENT_ID = functions.config().slack.clientid;

const TEMP_TOKEN = functions.config().slack.usertoken;

// TODO: Enable OAuth
const getClient = async (authUid: string) => {
  const tokenData = await admin.firestore().doc(`tokens/${authUid}`).get();

  console.log(tokenData.data()?.slack.token)

  if (!tokenData.data()?.slack?.token) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "user has not connected to a Slack Workspace."
    );
  }

  const client = new slack.WebClient(tokenData.data()?.slack?.token);
  return { client, defaultChannel: tokenData.data()?.slack?.defaultChannel };
};

export const slackLoginRequest = functions.https.onCall(() => {
  throw new functions.https.HttpsError("unimplemented", "Unimplemented");
});

export const userSlackLogin = functions.https.onCall(() => {
  throw new functions.https.HttpsError("unimplemented", "Unimplemented");
});

export const userSlackLogout = functions.https.onCall(() => {
  throw new functions.https.HttpsError("unimplemented", "Unimplemented");
});

export const publishToSlack = functions.https.onCall(() => {
  throw new functions.https.HttpsError("unimplemented", "Unimplemented");
});

export const verifySlackToken = functions.https.onCall(() => {
  throw new functions.https.HttpsError("unimplemented", "Unimplemented");
});

export const testSlack = functions.https.onCall(async (data, context) => {
  const message = data.message;
  const web = new slack.WebClient(TEMP_TOKEN);

  await web.chat.postMessage({
    channel: "#general",
    text: message,
  });

  return "Success";
});

export const publishPostSlack = async (postID: string) => {
  const postRef = admin.firestore().doc(`posts/${postID}`);
  const postData = await postRef.get();

  if (postData.exists) {
    const { client, defaultChannel } = await getClient(
      postData.data()?.ownerID
    );

    try {
      await client.chat.postMessage({
        channel: defaultChannel,
        text: postData.data()?.content,
      });
    } catch {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Unable to post to Slack"
      );
    }
  } else {
    throw new functions.https.HttpsError("not-found", "Post not found");
  }
};
