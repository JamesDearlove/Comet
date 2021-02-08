import React from "react";
import { Switch, Route, useRouteMatch, useLocation } from "react-router-dom";

import TwitterAuth from "./TwitterAuth";
import SlackAuth from "./SlackAuth";

export function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const Auth = () => {
  let { path } = useRouteMatch();

  return (
    <Switch>
      <Route path={`${path}/twitter`}>
        <TwitterAuth />
      </Route>
      <Route path={`${path}/slack`}>
        <SlackAuth />
      </Route>
    </Switch>
  );
};

export default Auth;
