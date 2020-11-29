import React, { useEffect, useState } from "react";

import { createStyles, Theme, makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import Fab from "@material-ui/core/Fab";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Typography from "@material-ui/core/Typography";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";

import firebase from "firebase";

import AddIcon from "@material-ui/icons/Add";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: "100%",
    },
    fab: {
      position: "absolute",
      bottom: theme.spacing(4),
      right: theme.spacing(4),
    },
    postHeading: {
      fontSize: theme.typography.pxToRem(15),
      flexBasis: "33.33%",
      flexShrink: 0,
    },
    postStatus: {
      fontSize: theme.typography.pxToRem(15),
      color: theme.palette.text.secondary,
      fontStyle: "italic",
    },
  })
);

const PostItem = (props: { id: string; data: any }) => {
  const classes = useStyles();

  const [postStatus, setPostStatus] = useState();

  const createPost = () => {
    var facebookPost = firebase.functions().httpsCallable("makeFacebookPost");
    facebookPost({ postID: props.id }).then(function (result) {
      setPostStatus(result.data.permalink_url);
    });
  };

  let status = "Draft";
  if (props.data.postedOn) {
    status = `Posted on ${props.data.postedOn.toDate()}`;
  } else if (props.data.scheduledFor) {
    status = `Scheduled for ${props.data.scheduledFor.toDate()}`;
  }

  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const [content, setContent] = React.useState(props.data.content);

  return (
    <>
      <ListItem button onClick={handleClickOpen}>
        <ListItemText primary={props.data.title} secondary={status} />
      </ListItem>
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth={true}
        maxWidth="sm"
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">
          Edit {props.data.title}
        </DialogTitle>
        <DialogContent>
          {/* <DialogContentText>
            Editing 
          </DialogContentText> */}
          <TextField
            autoFocus
            margin="dense"
            id="content"
            label="Post Content"
            multiline
            rows={6}
            rowsMax={12}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          {postStatus}
        </DialogContent>
        <DialogActions>
          <Button onClick={createPost}>Send FB Post</Button>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleClose} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const PostsPage = () => {
  const classes = useStyles();

  const [postList, setPostList] = useState<{ id: string; data: any }[]>();

  const loadPosts = async () => {
    const userUid = firebase.auth().currentUser?.uid;

    const postsRef = firebase.firestore().collection("posts");
    const snapshot = await postsRef.where("ownerID", "==", userUid).get();

    const data = snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
    setPostList(data);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  return (
    <>
      <Typography variant="h4">Posts</Typography>
      <List className={classes.root}>
        {postList?.map((item) => (
          <PostItem {...item} />
        ))}
      </List>
      <Fab className={classes.fab} color="primary" aria-label="add">
        <AddIcon />
      </Fab>
    </>
  );
};

export default PostsPage;
