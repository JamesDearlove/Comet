import React from "react";

import { createStyles, Theme, makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import red from "@material-ui/core/colors/red";

import twitter from "twitter-text";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    redText: {
      color: red[400],
    },
  })
);

interface TwitterCharCountProps {
  tweet: string;
}

const TwitterCharCount = ({ tweet }: TwitterCharCountProps) => {
  const classes = useStyles();

  const tweetLength = twitter.getTweetLength(tweet);
  const tweetStyle = tweetLength > 280 ? classes.redText : "";

  return (
    <Typography variant="caption" className={tweetStyle}>
      Twitter character limit: {tweetLength}/280
    </Typography>
  );
};

export default TwitterCharCount;
