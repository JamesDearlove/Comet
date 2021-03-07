import React, { useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";

import { createStyles, Theme, makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import Collapse from "@material-ui/core/Collapse";
import Grid from "@material-ui/core/Grid";
import Link from "@material-ui/core/Link";
import LinearProgress from "@material-ui/core/LinearProgress";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";

import { useSnackbar } from "notistack";

import firebase from "firebase/app";

import CancelIcon from "@material-ui/icons/Cancel";
import SaveIcon from "@material-ui/icons/Save";
import ScheduleIcon from "@material-ui/icons/Schedule";
import SendIcon from "@material-ui/icons/Send";

import ExtraActions from "./ExtraActions";
import PostLocations from "./PostLocations";
import PostingMethod from "./PostingMethod";
import TwitterCharCount from "./TwitterCharCount";
import PostAttachments from "./PostAttachments";

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
    customHelperParent: {
      marginBottom: theme.spacing(1),
    },
    customHelperTextField: {
      marginBottom: 0,
    },
  })
);

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

  const showTwitterContent: boolean =
    post?.postTo?.twitter &&
    (addTwitterContent || post?.twitter?.content !== "");

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
    await savePost({ scheduled: false });
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
              <div className={classes.customHelperParent}>
                <TextField
                  margin="normal"
                  variant="outlined"
                  fullWidth
                  id="content"
                  label="Post Content"
                  multiline
                  rows={10}
                  value={post.content}
                  onChange={(e) =>
                    setPost({ ...post, content: e.target.value })
                  }
                  disabled={disabled}
                  className={classes.customHelperTextField}
                />
                <Collapse
                  in={
                    !addTwitterContent &&
                    !post.twitter?.content &&
                    post.postTo?.twitter
                  }
                >
                  <div className="MuiFormHelperText-root MuiFormHelperText-contained">
                    <TwitterCharCount tweet={post.content} />
                    {!disabled && (
                      <>
                        {" - "}
                        <Link
                          href="#"
                          onClick={() => setAddTwitterContent(true)}
                        >
                          Create separate Twitter content.
                        </Link>
                      </>
                    )}
                  </div>
                </Collapse>
              </div>
              <Collapse in={showTwitterContent}>
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
                      {!disabled && (
                        <>
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
                            Remove separate Twitter content.
                          </Link>
                        </>
                      )}
                    </>
                  }
                  disabled={disabled}
                />
              </Collapse>
              <PostAttachments
                disabled={disabled}
                post={post}
                setPost={setPost}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <PostLocations
                disabled={disabled}
                post={post}
                setPost={setPost}
              />
              <PostingMethod
                disabled={disabled}
                post={post}
                setPost={setPost}
              />
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
                    disabled={!post.scheduledFor}
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
