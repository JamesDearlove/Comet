import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

import * as slack from "@slack/web-api";

// const CLIENT_ID = functions.config().slack.clientid;

// TODO: Enable OAuth
const getClient = async (authUid: string) => {
  const tokenData = await admin.firestore().doc(`tokens/${authUid}`).get();

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

export const slackUserLogin = functions.https.onCall(() => {
  throw new functions.https.HttpsError("unimplemented", "Unimplemented");
});

export const slackUserLogout = functions.https.onCall(() => {
  throw new functions.https.HttpsError("unimplemented", "Unimplemented");
});

export const slackVerifyToken = functions.https.onCall(() => {
  throw new functions.https.HttpsError("unimplemented", "Unimplemented");
});

export const slackPublishPost = async (postID: string) => {
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
