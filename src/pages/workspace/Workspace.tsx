import { createSignal, type Component } from "solid-js";
import { createStore } from "solid-js/store";
import {
  DragDropProvider,
  DragDropSensors,
  DragOverlay,
  DragEventHandler,
} from "@thisbeyond/solid-dnd";
import { Editor } from "../../components/editor/Editor";
import { GameState, WorkspaceEditor } from "../../game/canvas";
import { SerializedBody, BlockTypes } from "../../game/physics";
import { Toolbar } from "../../components/toolbar/Toolbar";
import "./Workspace.scss";
import { COLORS } from "../../game/config";

export const Workspace: Component = () => {
  let transform = { x: 0, y: 0 };
  const [editor, setEditor] = createSignal<WorkspaceEditor>();
  const [initialState, setInitialState] = createStore<GameState>([
    {
      type: "marble",
      x: 400,
      y: 400,
      rotation: 0,
      radius: 20,
      gradientStart: "white",
      gradientEnd: "blue",
    },
    {
      type: "marble",
      x: 500,
      y: 400,
      rotation: 0,
      radius: 20,
      gradientStart: "white",
      gradientEnd: "blue",
    },
    {
      type: "track-block",
      x: 100,
      y: 200,
      rotation: 1,
      width: 200,
      height: 10,
      frontColor: "lightgray",
      backColor: "gray",
    },
    {
      type: "track-block",
      x: 200,
      y: 200,
      rotation: -1,
      width: 300,
      height: 10,
      frontColor: "lightgray",
      backColor: "gray",
    },
    {
      type: "track-block",
      x: 100,
      y: 400,
      rotation: -1,
      width: 300,
      height: 10,
      frontColor: "lightgray",
      backColor: "gray",
    },
    {
      type: "note-block",
      x: 100,
      y: 400,
      rotation: -0.5,
      width: 100,
      height: 50,
      gradientStart: "blue",
      gradientEnd: "darkblue",
    },
    {
      type: "note-block",
      x: 800,
      y: 400,
      rotation: 0.5,
      width: 100,
      height: 50,
      gradientStart: "red",
      gradientEnd: "darkred",
    },
  ]);

  const onDragMove: DragEventHandler = ({ overlay }) => {
    if (overlay) {
      transform = { ...overlay.transform };
    }
  };

  const onDragEnd: DragEventHandler = ({ draggable, droppable }) => {
    if (droppable) {
      const nodeBounds = draggable.node.getBoundingClientRect();
      const radius = draggable.id === "marble" ? nodeBounds.width / 2 : 0;
      const newSerializedBody: Omit<SerializedBody, "canvasId"> = {
        x: nodeBounds.x + transform.x + radius,
        y: nodeBounds.y + transform.y + radius,
        rotation: 0,
      };

      switch (draggable.id as BlockTypes) {
        case "marble":
          newSerializedBody.radius = radius;
          newSerializedBody.gradientStart = COLORS.accentSecondary;
          newSerializedBody.gradientEnd = COLORS.accentSecondaryLight;
          break;
        case "track-block":
          newSerializedBody.width = nodeBounds.width;
          newSerializedBody.height = nodeBounds.height;
          newSerializedBody.frontColor = COLORS.highlight;
          newSerializedBody.gradientEnd = COLORS.secondary;
          break;
        case "note-block":
          newSerializedBody.width = nodeBounds.width;
          newSerializedBody.height = nodeBounds.height;
          newSerializedBody.gradientStart = COLORS.accent;
          newSerializedBody.gradientEnd = COLORS.accentDark;
          break;
      }

      console.log(editor(), newSerializedBody);
    }
  };

  const handleSave = (newState: GameState) => {
    setInitialState(newState);
  };

  return (
    <DragDropProvider onDragMove={onDragMove} onDragEnd={onDragEnd}>
      <DragDropSensors />
      <Editor
        initialState={initialState}
        handleSave={handleSave}
        editor={editor}
        setEditor={setEditor}
      />
      <DragOverlay>{(draggable) => <div class={`${draggable ? draggable.id : ""}`} />}</DragOverlay>
      <Toolbar />
    </DragDropProvider>
  );
};
