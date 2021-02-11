import React from "react";

import Typography from "@material-ui/core/Typography";

import FacebookSettings from "./Facebook";
import TwitterSettings from "./Twitter";
import SlackSettings from "./Slack";
import LinkedInSettings from "./LinkedIn";

const SettingsPage = () => {
  return (
    <>
      <Typography variant="h4">Settings</Typography>
      <FacebookSettings />
      <TwitterSettings />
      <SlackSettings />
      <LinkedInSettings />
    </>
  );
};

export default SettingsPage;
