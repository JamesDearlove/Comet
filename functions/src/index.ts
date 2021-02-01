import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

import { facebookPublishPost } from "./Facebook";
import { twitterPublishPost } from "./Twitter";
import { slackPublishPost } from "./Slack";

export * from "./Facebook";
export * from "./Twitter";
export * from "./Slack";

admin.initializeApp();

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

export const publishPost = functions.https.onCall(async (data, context) => {
  const postID = data.postID;

  if (!postID) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "No post ID provided"
    );
  }

  const postRef = await admin.firestore().doc(`posts/${postID}`).get();
  const postData = postRef.data();

  // Check if the post actually exists
  if (postRef.exists && postData && context.auth) {
    // if (postData.data().postedOn) {
    //   throw new functions.https.HttpsError("already-exists", "Post was already published.");
    // }

    // Check if the caller is the owner of the post
    if (postData.ownerID !== context.auth?.uid) {
      throw new functions.https.HttpsError("not-found", "Post not found");
    }

    const postToLocations = postData.postTo;

    if (postToLocations.facebook) {
      await facebookPublishPost(postID);
    }

    if (postToLocations.twitter) {
      await twitterPublishPost(postID);
    }

    if (postToLocations.slack) {
      await slackPublishPost(postID);
    }
  } else {
    throw new functions.https.HttpsError("not-found", "Post not found");
  }

  return "Success";
});

// Disable user signups for now 
// https://stackoverflow.com/questions/38357554/how-to-disable-signup-in-firebase-3-x
export const blockSignup = functions.auth.user().onCreate((event) => {
  return admin
    .auth()
    .updateUser(event.uid, { disabled: true })
    .then((userRecord) =>
      console.log(`Auto blocked user: ${userRecord.toJSON()}`)
    )
    .catch((error) => console.log(`Error auto blocking: ${error}`));
});
