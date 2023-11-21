import { type Component } from "solid-js";
import { createStore } from "solid-js/store";
import {
  DragDropProvider,
  DragDropSensors,
  DragOverlay,
  DragEventHandler,
} from "@thisbeyond/solid-dnd";
import { Editor } from "../../components/editor/Editor";
import { GameState } from "../../game/canvas";
import { Toolbar } from "../../components/toolbar/Toolbar";
import "./Workspace.scss";

export const Workspace: Component = () => {
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

  let transform = { x: 0, y: 0 };
  const onDragMove: DragEventHandler = ({ overlay }) => {
    if (overlay) {
      transform = { ...overlay.transform };
    }
  };

  const onDragEnd: DragEventHandler = ({ draggable, droppable }) => {
    console.log(draggable, droppable);
  };

  const handleSave = (newState: GameState) => {
    setInitialState(newState);
  };

  return (
    <DragDropProvider onDragMove={onDragMove} onDragEnd={onDragEnd}>
      <DragDropSensors />
      <Editor initialState={initialState} handleSave={handleSave} />
      <DragOverlay>{(draggable) => <div class={`${draggable ? draggable.id : ""}`} />}</DragOverlay>
      <Toolbar />
    </DragDropProvider>
  );
};
