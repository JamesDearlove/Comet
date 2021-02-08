import React from "react";

import Typography from "@material-ui/core/Typography";

import FacebookSettings from "./Facebook";
import TwitterSettings from "./Twitter";
import SlackSettings from "./Slack";

const SettingsPage = () => {
  return (
    <>
      <Typography variant="h4">Settings</Typography>
      <FacebookSettings />
      <TwitterSettings />
      <SlackSettings />
    </>
  );
};

export default SettingsPage;
