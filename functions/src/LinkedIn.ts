import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

import axios from "axios";

const CLIENT_ID = functions.config().linkedin.clientid;
const CLIENT_SECRET = functions.config().linkedin.clientsecret;

const REDIRECT_URI = "https://localhost:3000/auth/linkedin";

/**
 * Complete OAuth flow with provided user code.
 */
export const linkedinUserLogin = functions.https.onCall(
  async (data, context) => {
    const oauth_code = data.oauth_code;

    if (!oauth_code) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid code provided."
      );
    }

    const params = new URLSearchParams()
    params.append("grant_type", "authorization_code")
    params.append("code", oauth_code)
    params.append("redirect_uri", REDIRECT_URI)
    params.append("client_id", CLIENT_ID)
    params.append("client_secret", CLIENT_SECRET)

    const result = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      params,
      {
        headers: {
          "content-type": "application/x-www-form-urlencoded;charset=utf-8",
        },
      }
    );

    // TODO: Track token expiry
    if (result.status !== 200) {
      functions.logger.debug("LinkedIn auth failed ", result.data.error);
      throw new functions.https.HttpsError(
        "permission-denied",
        "LinkedIn denied the request."
      );
    }

    await admin
      .firestore()
      .doc(`tokens/${context.auth?.uid}`)
      .update({
        linkedin: { token: result.data.access_token },
      });
    return "Success";
  }
);

export const linkedinUserLogout = functions.https.onCall(() => {
  throw new functions.https.HttpsError("unimplemented", "Unimplemented");
});

export const linkedinVerifyToken = functions.https.onCall(
  async (data, context) => {
    const userData = await admin
      .firestore()
      .doc(`tokens/${context.auth?.uid}`)
      .get();

    if (!userData.exists || !userData.data()?.linkedin?.token) {
      return { setup: false, reason: "LinkedIn is not linked." };
    }

    const client = axios.create({ baseURL: "https://api.linkedin.com/v2/" });

    const result = await client.get("me", {
      headers: { Authorization: `Bearer ${userData.data()?.linkedin.token}` },
    });

    // Hi if you're reading this, it means that I want to burn the entire LinkedIn API because 
    // its reference guide is useless. Why is there the same endpoint documented in 3 different 
    // places with varying levels of up to dateness? Idk ask the shitty ass LinkedIn API
    if (result.status === 200) {
      return {
        setup: true,
        reason: "Your LinkedIn token is valid",
        firstname: result.data.localizedFirstName,
        lastname: result.data.localizedLastName,
      };
    } else {
      return {
        setup: false,
        reason: "Your LinkedIn token is no longer valid",
      };
    }
  }
);

export const linkedinPublishPost = async (postID: string) => {
  throw new functions.https.HttpsError("unimplemented", "Unimplemented");
};
