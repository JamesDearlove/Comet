import * as functions from "firebase-functions";
// import * as admin from "firebase-admin";

import * as slack from "@slack/web-api";

// const CLIENT_ID = functions.config().slack.clientid;

const TEMP_TOKEN = functions.config().slack.usertoken;

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

export const publishPostSlack = () => {
  return undefined;
};
