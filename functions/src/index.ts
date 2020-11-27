import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

export const facebookPost = functions.https.onCall((request, response) => {
  const postID = request.body.postID;

  admin
    .firestore()
    .doc(`posts/${postID}`)
    .get()
    .then((item) => {
      const result = item.data();
      if (!result) {
        throw new functions.https.HttpsError("not-found", "Post not found.");
      } else {
        return item.data();
      }
    })
    .catch((error) => {
      functions.logger.error(error);
      throw new functions.https.HttpsError("unknown", "An error has occurred.")
    });
});
