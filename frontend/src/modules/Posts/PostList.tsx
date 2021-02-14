import React, { useEffect, useState } from "react";
import { useHistory, Link } from "react-router-dom";

import { createStyles, Theme, makeStyles } from "@material-ui/core/styles";
import Fab from "@material-ui/core/Fab";
import LinearProgress from "@material-ui/core/LinearProgress";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemText from "@material-ui/core/ListItemText";
import Typography from "@material-ui/core/Typography";

import firebase from "firebase/app";

import AddIcon from "@material-ui/icons/Add";
import ExtraActions from "./ExtraActions";

interface IPostItem {
  id: string;
  data: any;
  dataRef: any;
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

const PostItem = ({ id, data, dataRef }: IPostItem) => {
  // TODO: Better detection for when a post is deleted.
  const [deleted, setDeleted] = useState(false);

  const onDeleted = () => {
    setDeleted(true);
  };

  if (deleted) {
    return <></>;
  }

  let status = "Draft";
  if (data.postedOn) {
    status = `Posted on ${data.postedOn.toDate()}`;
  } else if (data.scheduledFor) {
    status = `Scheduled for ${data.scheduledFor.toDate()}`;
  }

  return (
    <ListItem button component={Link} to={`posts/${id}`}>
      <ListItemText primary={data.title} secondary={status} />
      <ListItemSecondaryAction>
        <ExtraActions postRef={dataRef} postData={data} onDeleted={onDeleted} />
      </ListItemSecondaryAction>
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
      const postCollectionRef = firebase.firestore().collection("posts");

      const snapshot = await postCollectionRef
        .where("ownerID", "==", userUid)
        .limit(20)
        .get();

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        data: doc.data(),
        dataRef: doc.ref,
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
