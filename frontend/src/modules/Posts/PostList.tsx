import React, { useEffect, useState } from "react";
import { useHistory, Link } from "react-router-dom";

import { createStyles, Theme, makeStyles } from "@material-ui/core/styles";
import Fab from "@material-ui/core/Fab";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Typography from "@material-ui/core/Typography";

import firebase from "firebase/app";

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
  const history = useHistory();

  const [postList, setPostList] = useState<IPostItem[]>();

  useEffect(() => {
    const loadPosts = async () => {
      const userUid = firebase.auth().currentUser?.uid;
      const postsRef = firebase.firestore().collection("posts");

      const snapshot = await postsRef
        .where("ownerID", "==", userUid)
        .limit(20)
        .get();

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        data: doc.data(),
      }));
      setPostList(data);
    };

    loadPosts();
  }, []);

  const newPostClick = () => {
    history.push("posts/new");
  };

  return (
    <>
      <Typography variant="h4">Posts</Typography>
      {!postList ? (
        <LinearProgress />
      ) : (
        <List className={classes.list}>
          {postList?.map((item) => (
            <PostItem key={item.id} {...item} />
          ))}
        </List>
      )}
      <Fab
        className={classes.fab}
        color="primary"
        aria-label="add"
        onClick={newPostClick}
      >
        <AddIcon />
      </Fab>
    </>
  );
};

export default PostList;
