import React, { ReactNode } from "react";
import { RouteProps } from "react-router-dom";

import CreateIcon from "@material-ui/icons/Create";
import HomeIcon from "@material-ui/icons/Home";
import SettingsIcon from "@material-ui/icons/Settings";
import DeveloperModeIcon from "@material-ui/icons/DeveloperMode";

import HomePage from "./HomePage";
import PostsPage from "../modules/Posts";
import SettingsPage from "../modules/Settings";
import TestPage from "./TestPage";

interface IPage {
  name: string;
  icon: ReactNode;
  path: string;
  routeProps: RouteProps;
}

const Pages: IPage[] = [
  {
    name: "Home",
    icon: <HomeIcon />,
    path: "/",
    routeProps: {
      component: HomePage,
      exact: true,
    },
  },
  {
    name: "Posts",
    icon: <CreateIcon />,
    path: "/posts",
    routeProps: {
      component: PostsPage,
    },
  },
  {
    name: "Settings",
    icon: <SettingsIcon />,
    path: "/settings",
    routeProps: {
      component: SettingsPage,
    },
  },
  {
    name: "Testing",
    icon: <DeveloperModeIcon />,
    path: "/testing",
    routeProps: {
      component: TestPage,
    },
  },
];

export default Pages;
