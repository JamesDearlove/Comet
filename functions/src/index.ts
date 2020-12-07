import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export * from "./Facebook";

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
