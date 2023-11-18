import "./Workspace.scss";
import type { Component } from "solid-js";

export const Workspace: Component = () => {
  return (
    <main id="workspace">
      <canvas class="canvas" id="workspace" />
    </main>
  );
};
