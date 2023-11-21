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
  const [initialState, setInitialState] = createStore<GameState>([]);

  const onDragMove: DragEventHandler = ({ overlay }) => {
    if (overlay) {
      transform = { ...overlay.transform };
    }
  };

  const onDragEnd: DragEventHandler = ({ draggable, droppable }) => {
    const workspaceEditor = editor();
    if (!workspaceEditor) return;

    if (droppable) {
      const nodeBounds = draggable.node.getBoundingClientRect();
      const radius = draggable.id === "marble" ? nodeBounds.width / 2 : 0;
      const newSerializedBody: Omit<SerializedBody, "canvasId"> = {
        type: draggable.id as BlockTypes,
        x: nodeBounds.x + transform.x - (workspaceEditor?.stageOffset.offsetX || 0) + radius,
        y: nodeBounds.y + transform.y - (workspaceEditor?.stageOffset.offsetY || 0) + radius,
        rotation: 0,
      };

      switch (draggable.id as BlockTypes) {
        case "marble":
          newSerializedBody.radius = radius;
          newSerializedBody.gradientStart = COLORS.accentSecondaryLight;
          newSerializedBody.gradientEnd = COLORS.accentSecondaryDark;
          break;
        case "track-block":
          newSerializedBody.width = nodeBounds.width;
          newSerializedBody.height = nodeBounds.height;
          newSerializedBody.frontColor = COLORS.highlightDark;
          newSerializedBody.backColor = COLORS.secondaryLight;
          break;
        case "note-block":
          newSerializedBody.width = nodeBounds.width;
          newSerializedBody.height = nodeBounds.height;
          newSerializedBody.gradientStart = COLORS.accentLight;
          newSerializedBody.gradientEnd = COLORS.accentDark;
          break;
      }

      if (!workspaceEditor.playing && !workspaceEditor.disableTransformer) {
        workspaceEditor.initialize([...workspaceEditor.initialState, newSerializedBody]);
      }
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
