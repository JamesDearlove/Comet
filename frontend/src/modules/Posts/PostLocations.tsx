import React from "react";

import Checkbox from "@material-ui/core/Checkbox";
import FormLabel from "@material-ui/core/FormLabel";
import FormControl from "@material-ui/core/FormControl";
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";

import firebase from "firebase/app";

interface LocationProp {
  name: string;
  checked: boolean;
  onChecked: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

interface PostLocationsProps {
  disabled: boolean;
  post: firebase.firestore.DocumentData;
  setPost: React.Dispatch<
    React.SetStateAction<firebase.firestore.DocumentData | undefined>
  >;
}

const PostLocations = ({ disabled, post, setPost }: PostLocationsProps) => {
  const updatePost = (
    location: string,
    checked: boolean,
    additionalProps?: any
  ) => {
    setPost({
      ...post,
      postTo: {
        ...post.postTo,
        [location]: checked,
      },
      ...additionalProps,
    });
  };

  const facebookOnCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    updatePost("facebook", e.target.checked);
  };

  const twitterOnCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    updatePost("twitter", e.target.checked, { twitter: { content: "" } });
  };

  const linkedinOnCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    updatePost("linkedin", e.target.checked);
  };

  const slackOnCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    updatePost("slack", e.target.checked);
  };

  const locations: LocationProp[] = [
    {
      name: "Facebook",
      checked: post.postTo?.facebook,
      onChecked: facebookOnCheck,
    },
    {
      name: "Twitter",
      checked: post.postTo?.twitter,
      onChecked: twitterOnCheck,
    },
    {
      name: "LinkedIn",
      checked: post.postTo?.linkedin,
      onChecked: linkedinOnCheck,
    },
    { name: "Slack", checked: post.postTo?.slack, onChecked: slackOnCheck },
  ];

  return (
    <div>
      <FormControl component="fieldset" disabled={disabled}>
        <FormLabel component="legend">Post Locations</FormLabel>
        <FormGroup>
          {locations.map((location) => (
            <FormControlLabel
              control={
                <Checkbox
                  name={location.name}
                  checked={location.checked}
                  onChange={location.onChecked}
                />
              }
              label={location.name}
            />
          ))}
        </FormGroup>
      </FormControl>
    </div>
  );
};

export default PostLocations;
