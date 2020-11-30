import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { createStyles, Theme, makeStyles } from "@material-ui/core/styles";
import Fab from "@material-ui/core/Fab";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Typography from "@material-ui/core/Typography";

import firebase from "firebase";

import AddIcon from "@material-ui/icons/Add";
import { LinearProgress } from "@material-ui/core";

interface IPostItem {
  id: string;
  data: any;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    list: {
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
  let status = "Draft";
  if (props.data.postedOn) {
    status = `Posted on ${props.data.postedOn.toDate()}`;
  } else if (props.data.scheduledFor) {
    status = `Scheduled for ${props.data.scheduledFor.toDate()}`;
  }

  return (
    <ListItem button component={Link} to={`posts/${props.id}`}>
      <ListItemText primary={props.data.title} secondary={status} />
    </ListItem>
  );
};

const PostList = () => {
  const classes = useStyles();

  const [postList, setPostList] = useState<IPostItem[]>();

  const userUid = firebase.auth().currentUser?.uid;
  const postsRef = firebase.firestore().collection("posts");

  const loadPosts = async () => {
    const snapshot = await postsRef
      .where("ownerID", "==", userUid)
      .limit(20)
      .get();

    const data = snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
    console.log(snapshot.docs.entries());
    setPostList(data);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  return (
    <>
      <Typography variant="h4">Posts</Typography>
      {!postList ? (
        <LinearProgress />
      ) : (
        <List className={classes.list}>
          {postList?.map((item) => (
            <PostItem {...item} />
          ))}
        </List>
      )}
      <Fab className={classes.fab} color="primary" aria-label="add">
        <AddIcon />
      </Fab>
    </>
  );
};

export default PostList;
