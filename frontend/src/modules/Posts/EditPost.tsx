import React, { useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";

import { createStyles, Theme, makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import Checkbox from "@material-ui/core/Checkbox";
import FormLabel from "@material-ui/core/FormLabel";
import FormControl from "@material-ui/core/FormControl";
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Grid from "@material-ui/core/Grid";
import LinearProgress from "@material-ui/core/LinearProgress";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";

import { useSnackbar } from "notistack";

import firebase from "firebase";

import SendIcon from "@material-ui/icons/Send";
import CancelIcon from "@material-ui/icons/Cancel";
import SaveIcon from "@material-ui/icons/Save";

interface IPostParams {
  postID: string;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: "100%",
    },
    button: {
      margin: theme.spacing(1),
    },
  })
);

const EditPost = () => {
  const classes = useStyles();
  const history = useHistory();
  const { postID } = useParams<IPostParams>();
  const { enqueueSnackbar } = useSnackbar();

  const [post, setPost] = useState<firebase.firestore.DocumentData>();
  const [postLoadError, setPostLoadError] = useState(false);

  const postsRef = firebase.firestore().collection("posts").doc(postID);

  const [disabled, setDisabled] = useState(false);

  const createPost = () => {
    var facebookPost = firebase.functions().httpsCallable("publishToFacebook");
    facebookPost({ postID: postID })
      .then((result) => {
        enqueueSnackbar(
          <a target="_blank" rel="noreferrer" href={result.data.permalink_url}>
            Posted to Facebook
          </a>,
          { variant: "success" }
        );
      })
      .catch((result) =>
        enqueueSnackbar(`Failed to post to Facebook, ${result}`, {
          variant: "error",
        })
      );
  };

  const cancelClick = () => {
    history.push("/posts");
  };

  const saveClick = async () => {
    await postsRef.update({ ...post });
    history.push("/posts");
    enqueueSnackbar("Post saved", { variant: "success" });
    // Send notification that it was saved
  };

  const postNowClick = async () => {
    setDisabled(true);
    await postsRef.update({ ...post });
    createPost();
  };

  const loadPost = async () => {
    postsRef
      .get()
      .then((doc) => setPost(doc.data()))
      .catch(() => setPostLoadError(true));
  };

  useEffect(() => {
    loadPost();
  }, []);

  return (
    <>
      {!post ? (
        !postLoadError ? (
          <LinearProgress />
        ) : (
          <Typography>Not found</Typography>
        )
      ) : (
        <>
          <Typography variant="h4">
            Editing {post.title ? post.title : "Untitled Post"}
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <TextField
                margin="normal"
                variant="outlined"
                fullWidth
                id="title"
                label="Post Title"
                value={post.title}
                onChange={(e) => setPost({ ...post, title: e.target.value })}
              />
              <TextField
                margin="normal"
                variant="outlined"
                fullWidth
                id="content"
                label="Post Content"
                multiline
                rows={12}
                value={post.content}
                onChange={(e) => setPost({ ...post, content: e.target.value })}
                helperText={`${post.content.length}/280 (Twitter Character Limit)`}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <div>
                <FormControl component="fieldset">
                  <FormLabel component="legend">Post Locations</FormLabel>
                  <FormGroup>
                    <FormControlLabel
                      // control={<Checkbox checked={gilad} onChange={handleChange} name="gilad" />}
                      control={
                        <Checkbox
                          name="facebook"
                          checked={post.postTo?.facebook}
                          onChange={(e) =>
                            setPost({
                              ...post,
                              postTo: {
                                ...post.postTo,
                                facebook: e.target.checked,
                              },
                            })
                          }
                        />
                      }
                      label="Facebook"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="twitter"
                          checked={post.postTo?.twitter}
                          onChange={(e) =>
                            setPost({
                              ...post,
                              postTo: {
                                ...post.postTo,
                                twitter: e.target.checked,
                              },
                            })
                          }
                        />
                      }
                      label="Twitter"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="linkedin"
                          checked={post.postTo?.linkedin}
                          onChange={(e) =>
                            setPost({
                              ...post,
                              postTo: {
                                ...post.postTo,
                                linkedin: e.target.checked,
                              },
                            })
                          }
                        />
                      }
                      label="Linkedin"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="slack"
                          checked={post.postTo?.slack}
                          onChange={(e) =>
                            setPost({
                              ...post,
                              postTo: {
                                ...post.postTo,
                                slack: e.target.checked,
                              },
                            })
                          }
                        />
                      }
                      label="Slack"
                    />
                  </FormGroup>
                </FormControl>
              </div>
              <div>
                <FormControl margin="dense" component="fieldset">
                  <FormLabel component="legend">Posting Method</FormLabel>
                  <FormGroup>
                    <FormControlLabel
                      control={<Checkbox name="scheduled" />}
                      label="Schedule Post"
                    />
                  </FormGroup>
                </FormControl>
              </div>
              <Button
                variant="contained"
                className={classes.button}
                endIcon={<SendIcon />}
                onClick={postNowClick}
                disabled={disabled}
              >
                Post Now
              </Button>
            </Grid>
            <Grid xs={12}>
              <div>
                <Button
                  variant="contained"
                  className={classes.button}
                  endIcon={<CancelIcon />}
                  onClick={cancelClick}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  className={classes.button}
                  endIcon={<SaveIcon />}
                  onClick={saveClick}
                >
                  Save Draft
                </Button>
              </div>
            </Grid>
          </Grid>
        </>
      )}
    </>
  );
};

export default EditPost;
