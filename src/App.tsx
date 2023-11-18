import "./App.scss";
import { Header } from "./components/header/Header";
import { Workspace } from "./pages/workspace/Workspace";

import type { Component } from "solid-js";

export const App: Component = () => {
  return (
    <>
      <Header />
      <Workspace />
    </>
  );
};
