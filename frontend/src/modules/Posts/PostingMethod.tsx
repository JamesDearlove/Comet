import React from "react";

import Checkbox from "@material-ui/core/Checkbox";
import Collapse from "@material-ui/core/Collapse";
import FormLabel from "@material-ui/core/FormLabel";
import FormControl from "@material-ui/core/FormControl";
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import firebase from "firebase/app";

import DateFnsUtils from "@date-io/date-fns";
import {
  MuiPickersUtilsProvider,
  KeyboardDateTimePicker,
} from "@material-ui/pickers";

interface PostingMethodProps {
  disabled: boolean;
  post: firebase.firestore.DocumentData;
  setPost: React.Dispatch<
    React.SetStateAction<firebase.firestore.DocumentData | undefined>
  >;
}

const PostingMethod = ({ disabled, post, setPost }: PostingMethodProps) => {
  const scheduledForOnChecked = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.checked) {
      setPost({ ...post, scheduledFor: new Date() });
    } else {
      setPost({ ...post, scheduledFor: undefined });
    }
  };

  return (
    <div>
      <FormControl margin="dense" component="fieldset" disabled={disabled}>
        <FormLabel component="legend">Posting Method</FormLabel>
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                name="scheduledFor"
                checked={post.scheduledFor !== undefined}
                onChange={scheduledForOnChecked}
              />
            }
            label="Schedule Post"
          />
        </FormGroup>
        <Collapse in={post.scheduledFor !== undefined}>
          <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <KeyboardDateTimePicker
              margin="dense"
              id="date-picker-dialog"
              label="Date"
              format="dd/MM/yyyy hh:mm a"
              value={post.scheduledFor}
              disabled={disabled}
              onChange={(date) =>
                setPost({
                  ...post,
                  scheduledFor: date,
                })
              }
              KeyboardButtonProps={{
                "aria-label": "change date",
              }}
            />
          </MuiPickersUtilsProvider>
        </Collapse>
      </FormControl>
    </div>
  );
};

export default PostingMethod;
