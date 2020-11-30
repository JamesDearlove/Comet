import React, { useEffect, useState } from "react";
import {
  Switch,
  Route,
  useParams,
  useRouteMatch,
  Link,
} from "react-router-dom";

import { createStyles, Theme, makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import Fab from "@material-ui/core/Fab";
import Grid from "@material-ui/core/Grid";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Typography from "@material-ui/core/Typography";
import TextField from "@material-ui/core/TextField";

import FormLabel from "@material-ui/core/FormLabel";
import FormControl from "@material-ui/core/FormControl";
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import LinearProgress from "@material-ui/core/LinearProgress";
import Checkbox from "@material-ui/core/Checkbox";

import firebase from "firebase";

import AddIcon from "@material-ui/icons/Add";
import SendIcon from "@material-ui/icons/Send";
import CancelIcon from "@material-ui/icons/Cancel";
import SaveIcon from "@material-ui/icons/Save";

interface IPostParams {
  postID: string;
}

interface IPostItem {
  id: string;
  data: any;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: "100%",
    },
    button: {
      margin: theme.spacing(1),
    },
    fab: {
      position: "absolute",
      bottom: theme.spacing(4),
      right: theme.spacing(4),
    },
  })
);

const PostItem = (props: { id: string; data: any }) => {
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

  return (
    <>
      <ListItem button component={Link} to={`posts/${props.id}`}>
        <ListItemText primary={props.data.title} secondary={status} />
      </ListItem>
    </>
  );
};

const PostList = () => {
  const classes = useStyles();

  const [postList, setPostList] = useState<IPostItem[]>([]);

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

const EditPost = () => {
  const classes = useStyles();

  let { postID } = useParams<IPostParams>();

  const [post, setPost] = useState<firebase.firestore.DocumentData>();

  const userUid = firebase.auth().currentUser?.uid;
  const postsRef = firebase.firestore().collection("posts");

  const loadPost = async () => {
    postsRef
      .doc(postID)
      .get()
      .then((doc) => setPost(doc.data()));
  };

  useEffect(() => {
    loadPost();
  }, []);

  return (
    <>
      {!post ? (
        <LinearProgress />
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
                      control={<Checkbox name="facebook" />}
                      label="Facebook"
                    />
                    <FormControlLabel
                      control={<Checkbox name="twitter" />}
                      label="Twitter"
                    />
                    <FormControlLabel
                      control={<Checkbox name="linkedin" />}
                      label="Linkedin"
                    />
                    <FormControlLabel
                      control={<Checkbox name="slack" />}
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
                // color="secondary"
                // className={classes.button}
                endIcon={<SendIcon />}
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
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  className={classes.button}
                  endIcon={<SaveIcon />}
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

const PostsPage = () => {
  let { path } = useRouteMatch();

  return (
    <Switch>
      <Route path={`${path}/:postID`}>
        <EditPost />
      </Route>
      <Route path={`${path}`}>
        <PostList />
      </Route>
    </Switch>
  );
};

export default PostsPage;
