import { type Component } from "solid-js";
import { Editor } from "../../components/editor/Editor";
import "./Workspace.scss";

export const Workspace: Component = () => {
  return (
    <main id="workspace">
      <Editor />
    </main>
  );
};
