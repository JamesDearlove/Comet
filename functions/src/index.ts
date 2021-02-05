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

/**
 * Publishes a post.
 *
 * This method handles publishing to the respective platforms selected in a post.
 * @param postID The post ID.
 * @param postData The Firestore DocumentData for the post.
 */
const postPublisher = async (
  postID: string,
  postData: FirebaseFirestore.DocumentData | undefined
) => {
  if (!postData || postData?.posted) {
    return;
  }
  functions.logger.log("Publishing post:", postID);

  if (postData?.postTo?.facebook) {
    await facebookPublishPost(postID);
  }

  if (postData?.postTo?.twitter) {
    await twitterPublishPost(postID);
  }

  if (postData?.postTo?.slack) {
    await slackPublishPost(postID);
  }

  const postRef = admin.firestore().doc(`posts/${postID}`);
  await postRef.set(
    { posted: true, postedOn: new Date(), scheduled: false },
    { merge: true }
  );
  functions.logger.debug("Post published", postID);
};

export const publishPost = functions.https.onCall(async (data, context) => {
  const postID = data.postID;

  if (!postID) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "No post ID provided"
    );
  }

  const postRef = admin.firestore().doc(`posts/${postID}`);
  const postData = await postRef.get();

  // Check if the post actually exists
  if (postData.exists && postData && context.auth) {
    if (postData.data()?.postedOn) {
      throw new functions.https.HttpsError(
        "already-exists",
        "Post was already published."
      );
    }

    // Check if the caller is the owner of the post
    if (postData.data()?.ownerID !== context.auth?.uid) {
      throw new functions.https.HttpsError("not-found", "Post not found");
    }

    await postPublisher(postID, postData.data());
  } else {
    throw new functions.https.HttpsError("not-found", "Post not found");
  }

  return "Success";
});

export const scheduledPublishPost = functions.pubsub
  .schedule("*/5 * * * *")
  .onRun(async (context) => {
    functions.logger.debug("Running publish post schedule task.");
    const postRef = admin.firestore().collection("posts");

    const timeRange = new Date();
    timeRange.setMinutes(timeRange.getMinutes() - 30);
    const currentTime = new Date();

    const scheduledPosts = await postRef
      .where("scheduled", "==", true)
      .where("scheduledFor", "<=", currentTime);

    const getP = await scheduledPosts.get();
    getP.docs.forEach((post) => postPublisher(post.id, post.data()));
    functions.logger.debug("Finished publish post schedule task.");

    return null;
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
