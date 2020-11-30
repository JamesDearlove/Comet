import React from "react";
import { Switch, Route, useRouteMatch } from "react-router-dom";

import EditPost from "./EditPost";
import PostList from "./PostList";

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
