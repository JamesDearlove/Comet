import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

import * as slack from "@slack/web-api";

const CLIENT_ID = functions.config().slack.clientid;
const CLIENT_SECRET = functions.config().slack.clientsecret;
// const SIGNING_SECRET = functions.config().slack.signingsecret;

// TODO: Enable OAuth
const getClient = async (authUid?: string) => {
  if (!authUid) {
    return { client: new slack.WebClient() };
  }
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

/**
 * Complete OAuth flow with provided user code.
 */
export const slackUserLogin = functions.https.onCall(async (data, context) => {
  const oauth_code = data.oauth_code;

  if (!oauth_code) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invalid code provided."
    );
  }

  const client = new slack.WebClient();
  const result = await client.oauth.v2.access({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code: oauth_code,
  });

  if (result.error) {
    functions.logger.debug("Slack auth failed ", result.error);
    throw new functions.https.HttpsError(
      "permission-denied",
      "Slack denied the request."
    );
  }

  // TODO: Update to not default to announcements channel
  const access_token = (result as any).authed_user.access_token;
  if (access_token) {
    admin
      .firestore()
      .doc(`tokens/${context.auth?.uid}`)
      .update({
        slack: { token: access_token, defaultChannel: "announcements" },
      });
  }

  return "Success";
});

export const slackUserLogout = functions.https.onCall(() => {
  throw new functions.https.HttpsError("unimplemented", "Unimplemented");
});

export const slackVerifyToken = functions.https.onCall(
  async (data, context) => {
    const { client } = await getClient(context.auth?.uid);

    let result;
    try {
      result = await client.auth.test();
    } catch {
      return { setup: false, reason: "Your Slack token is no longer valid." };
    }

    return {
      setup: true,
      reason: "Your Slack token is valid",
      team: result.team,
      user: result.user,
    };
  }
);

export const slackPublishPost = async (postID: string) => {
  const postRef = admin.firestore().doc(`posts/${postID}`);
  const postData = await postRef.get();

  if (postData.exists) {
    const { client, defaultChannel } = await getClient(
      postData.data()?.ownerID
    );

    let result;
    try {
      result = client.chat.postMessage({
        channel: defaultChannel,
        text: postData.data()?.content,
      });
    } catch {
      functions.logger.warn("Error posting to Slack, ", result);
      throw new functions.https.HttpsError(
        "permission-denied",
        "Unable to post to Slack"
      );
    }
  } else {
    throw new functions.https.HttpsError("not-found", "Post not found");
  }
};
