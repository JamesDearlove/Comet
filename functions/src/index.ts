import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

import { publishPostFacebook } from "./Facebook";
import { publishPostTwitter } from "./Twitter";

export * from "./Facebook";
export * from "./Twitter";

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
      await publishPostFacebook(postID);
    }

    if (postToLocations.twitter) {
      await publishPostTwitter(postID);
    }
  } else {
    throw new functions.https.HttpsError("not-found", "Post not found");
  }

  return "Success";
});
