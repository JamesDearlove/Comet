import React, { useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";

import { createStyles, Theme, makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import Checkbox from "@material-ui/core/Checkbox";
import Collapse from "@material-ui/core/Collapse";
import FormLabel from "@material-ui/core/FormLabel";
import FormControl from "@material-ui/core/FormControl";
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Grid from "@material-ui/core/Grid";
import Link from "@material-ui/core/Link";
import LinearProgress from "@material-ui/core/LinearProgress";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import red from "@material-ui/core/colors/red";

import { useSnackbar } from "notistack";

import firebase from "firebase/app";

import CancelIcon from "@material-ui/icons/Cancel";
import SaveIcon from "@material-ui/icons/Save";
import ScheduleIcon from "@material-ui/icons/Schedule";
import SendIcon from "@material-ui/icons/Send";

import DateFnsUtils from "@date-io/date-fns";
import {
  MuiPickersUtilsProvider,
  KeyboardDateTimePicker,
} from "@material-ui/pickers";
import ExtraActions from "./ExtraActions";

import twitter from "twitter-text";

interface IPostParams {
  postIDParam: string;
}

const fieldValue = firebase.firestore.FieldValue;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: "100%",
    },
    button: {
      margin: theme.spacing(1),
    },
    redText: {
      color: red[400],
    },
  })
);

interface twitterCharCountProps {
  tweet: string;
}

const TwitterCharCount = ({ tweet }: twitterCharCountProps) => {
  const classes = useStyles();

  const tweetLength = twitter.getTweetLength(tweet);
  const tweetStyle = tweetLength > 280 ? classes.redText : "";

  return (
    <Typography variant="caption" className={tweetStyle}>
      Twitter character limit: {tweetLength}/280
    </Typography>
  );
};

const EditPost = () => {
  const classes = useStyles();
  const history = useHistory();
  const { postIDParam } = useParams<IPostParams>();
  const { enqueueSnackbar } = useSnackbar();

  const [post, setPost] = useState<firebase.firestore.DocumentData>();
  const [postID, setPostID] = useState("");
  const [postLoadError, setPostLoadError] = useState(false);
  // For new post state
  const [newPost, setNewPost] = useState(false);

  const [postRef, setPostRef] = useState<
    firebase.firestore.DocumentReference<firebase.firestore.DocumentData>
  >();

  const [disabled, setDisabled] = useState(false);
  const [addTwitterContent, setAddTwitterContent] = useState(false);

  useEffect(() => {
    const loadPost = async () => {
      const newPost = postIDParam === "new";
      const userID = firebase.auth().currentUser?.uid;

      const collectionRef = firebase.firestore().collection("posts");
      const postRef = newPost
        ? collectionRef.doc()
        : collectionRef.doc(postIDParam);

      setPostID(postRef.id);
      setPostRef(postRef);

      if (newPost) {
        setPost({ title: "", content: "", ownerID: userID });
        setNewPost(true);
      } else {
        try {
          const postData = await postRef?.get();
          setPost({
            ...postData.data(),
            scheduledFor: postData.data()?.scheduledFor?.toDate(),
          });
          setDisabled(postData.data()?.posted);
        } catch (error) {
          setPostLoadError(true);
        }
      }
    };

    loadPost();
  }, [postIDParam]);

  const createPost = () => {
    var facebookPost = firebase.functions().httpsCallable("publishPost");
    facebookPost({ postID: postID })
      .then((result) => {
        enqueueSnackbar("Successfully published post.", { variant: "success" });
      })
      .catch((result) =>
        enqueueSnackbar(`Failed to publish post, ${result}`, {
          variant: "error",
        })
      );
  };

  const saveScheduleClick = () => {
    // setPost({ ...post, scheduled: true });
    savePost({ scheduled: true });
    history.push("/posts");
  };

  const cancelClick = () => {
    history.push("/posts");
  };

  const savePost = async (additionalProps?: any) => {
    const scheduledFor =
      post?.scheduledFor === undefined
        ? fieldValue.delete()
        : post.scheduledFor;
    await postRef?.set(
      {
        ...post,
        ...additionalProps,
        scheduledFor: scheduledFor,
      },
      { merge: true }
    );
    enqueueSnackbar("Post saved", { variant: "success" });
  };

  const saveClick = async () => {
    await savePost();
    history.push("/posts");
  };

  const postNowClick = async () => {
    setDisabled(true);
    await savePost();
    if (newPost) {
      setNewPost(false);
    }
    createPost();
  };

  const twitterCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPost({
      ...post,
      postTo: {
        ...post?.postTo,
        twitter: e.target.checked,
      },
      twitter: {
        content: "",
      },
    });
    if (!e.target.checked) {
    }
  };

  const scheduledForChecked = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setPost({ ...post, scheduledFor: new Date() });
    } else {
      setPost({ ...post, scheduledFor: undefined });
    }
  };

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
            {disabled ? "Viewing" : "Editing"}{" "}
            {post.title ? post.title : "Untitled Post"}
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
                disabled={disabled}
              />
              <TextField
                margin="normal"
                variant="outlined"
                fullWidth
                id="content"
                label="Post Content"
                multiline
                rows={10}
                value={post.content}
                onChange={(e) => setPost({ ...post, content: e.target.value })}
                disabled={disabled}
                helperText={
                  <Collapse
                    in={
                      !addTwitterContent &&
                      !post.twitter?.content &&
                      post.postTo?.twitter
                    }
                  >
                    <>
                      <TwitterCharCount tweet={post.content} />
                      {" - "}
                      <Link href="#" onClick={() => setAddTwitterContent(true)}>
                        Create seperate Twitter content.
                      </Link>
                    </>
                  </Collapse>
                }
              />
              <Collapse
                in={
                  post.postTo?.twitter &&
                  (addTwitterContent || post.twitter?.content)
                }
              >
                <TextField
                  margin="normal"
                  variant="outlined"
                  fullWidth
                  id="content"
                  label="Twitter Post Content"
                  multiline
                  rows={6}
                  value={post.twitter?.content}
                  onChange={(e) =>
                    setPost({
                      ...post,
                      twitter: { ...post.twitter, content: e.target.value },
                    })
                  }
                  helperText={
                    <>
                      <TwitterCharCount tweet={post.twitter?.content} />
                      {" - "}
                      <Link
                        href="#"
                        onClick={() => {
                          setAddTwitterContent(false);
                          setPost({
                            ...post,
                            twitter: { ...post.twitter, content: "" },
                          });
                        }}
                      >
                        Remove seperate Twitter content.
                      </Link>
                    </>
                  }
                  disabled={disabled}
                />
              </Collapse>
            </Grid>
            <Grid item xs={12} md={4}>
              <div>
                <FormControl component="fieldset" disabled={disabled}>
                  <FormLabel component="legend">Post Locations</FormLabel>
                  <FormGroup>
                    <FormControlLabel
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
                          onChange={twitterCheck}
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
                <FormControl
                  margin="dense"
                  component="fieldset"
                  disabled={disabled}
                >
                  <FormLabel component="legend">Posting Method</FormLabel>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="scheduledFor"
                          checked={post.scheduledFor !== undefined}
                          onChange={scheduledForChecked}
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
            <Grid item xs={12}>
              {disabled ? (
                <Button
                  variant="contained"
                  className={classes.button}
                  endIcon={<CancelIcon />}
                  onClick={cancelClick}
                >
                  Close
                </Button>
              ) : (
                <>
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
                  <Button
                    variant="contained"
                    color="secondary"
                    className={classes.button}
                    endIcon={<ScheduleIcon />}
                    onClick={saveScheduleClick}
                  >
                    Save &amp; Schedule
                  </Button>
                </>
              )}
              {!newPost && (
                <ExtraActions
                  postData={post}
                  postRef={postRef}
                  onDeleted={() => {}}
                />
              )}
            </Grid>
          </Grid>
        </>
      )}
    </>
  );
};

export default EditPost;
