import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

import axios from "axios";

const URN_PREFIX = {
  person: "urn:li:person:",
  org: "urn:li:organization:",
};

const CLIENT_ID = functions.config().linkedin.clientid;
const CLIENT_SECRET = functions.config().linkedin.clientsecret;

const REDIRECT_URI = "https://comet.jimmyd.dev/auth/linkedin";

const axiosClient = axios.create({ baseURL: "https://api.linkedin.com/v2/" });

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

    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("code", oauth_code);
    params.append("redirect_uri", REDIRECT_URI);
    params.append("client_id", CLIENT_ID);
    params.append("client_secret", CLIENT_SECRET);

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
        "linkedin.token": result.data.access_token,
      });
    return "Success";
  }
);

export const linkedinGetOrganisations = functions.https.onCall(() => {
  // APIs to call:
  // Get list of managed organisations: https://api.linkedin.com/v2/organizationAcls?q=roleAssignee
  // Get the details of each organisation: https://api.linkedin.com/v2/organizations/{companyid}

  throw new functions.https.HttpsError("unimplemented", "Unimplemented");
});

export const linkedinSetOrganisation = functions.https.onCall(
  async (data, context) => {
    const orgid = data.org;

    if (!orgid) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Organisation ID not provided."
      );
    }

    await admin
      .firestore()
      .doc(`tokens/${context.auth?.uid}`)
      .update({ "linkedin.org": orgid });

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

    const result = await axiosClient.get("me", {
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
  const postRef = admin.firestore().doc(`posts/${postID}`);
  const postData = await postRef.get();

  const userData = await admin
    .firestore()
    .doc(`tokens/${postData.data()?.ownerID}`)
    .get();

  // TODO: Kenton's great idea of using assertions
  if (
    !userData.exists ||
    !userData.data()?.linkedin?.token ||
    !userData.data()?.linkedin.org
  ) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User has not connected to LinkedIn."
    );
  }

  const shareText = {
    text: postData.data()?.content,
  };

  const result = await axiosClient.post(
    "shares",
    {
      owner: `${URN_PREFIX.org}${userData.data()?.linkedin.org}`,
      text: shareText,
      distribution: {
        linkedInDistributionTarget: {},
      },

      // subject: SUBJECTHERE
      // content: content like links with thumbnails and images here
    },
    { headers: { Authorization: `Bearer ${userData.data()?.linkedin.token}` } }
  );

  const permalink = `https://www.linkedin.com/feed/update/${result.data.activity}`;

  await postRef.update({
    "permalink.linkedin": permalink,
  });
};
