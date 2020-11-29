import React, { useEffect, useState } from "react";

import { createStyles, Theme, makeStyles } from "@material-ui/core/styles";
import Collapse from "@material-ui/core/Collapse";
import Fab from "@material-ui/core/Fab";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Typography from "@material-ui/core/Typography";

import firebase from "firebase";

import AddIcon from "@material-ui/icons/Add";
import ExpandLess from "@material-ui/icons/ExpandLess";
import ExpandMore from "@material-ui/icons/ExpandMore";

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
  })
);

const PostItem = (props: { id: string; data: any }) => {
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    setOpen(!open);
  };

  return (
    <>
      <ListItem button onClick={handleClick}>
        <ListItemText primary={props.data.name} secondary="Draft" />
        {open ? <ExpandLess /> : <ExpandMore />}
      </ListItem>
      <Collapse in={open} unmountOnExit>
        {props.data.content}
      </Collapse>
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
