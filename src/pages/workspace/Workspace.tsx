import { type Component, onMount } from "solid-js";
import {
  DragDropProvider,
  DragDropSensors,
  DragOverlay,
  DragEventHandler,
} from "@thisbeyond/solid-dnd";
import { Editor } from "../../components/editor/Editor";
import { Toolbar } from "../../components/toolbar/Toolbar";
import { useGameContext } from "../../components/game_context/GameContext";
import { GameSettings, GameState } from "../../game/canvas";
import { SerializedBody, BlockTypes } from "../../game/physics";
import { COLORS } from "../../game/config";
import "./Workspace.scss";

export const Workspace: Component = () => {
  let transform = { x: 0, y: 0 };
  const {
    initialState: [_initialState, setInitialState],
    settings: [_settings, setSettings],
    editor: [editor, _setEditor],
    openState: [_openState, setOpenState],
    selectedTab: [selectedTab, setSelectedTab],
  } = useGameContext();
  let details: HTMLDetailsElement;

  const closeToolbar = () => {
    setOpenState("closing");
    setTimeout(() => {
      setOpenState("closed");
    }, 200);
  };

  const toggleToolbarOpen = (event: MouseEvent) => {
    event.preventDefault();
    const tabClicked = event.target as HTMLElement | null;
    const parentNode = tabClicked?.parentNode;
    if (!parentNode) return;

    const lastOpenTab = selectedTab();
    setSelectedTab([...parentNode.children].findIndex((child) => child === tabClicked));
    if (details.open && lastOpenTab === selectedTab()) {
      setOpenState("closing");
      setTimeout(() => {
        closeToolbar();
      }, 200);
    } else {
      setOpenState("open");
    }
  };

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
        x:
          (nodeBounds.x + transform.x - (workspaceEditor.stage.x() || 0) + radius) /
          workspaceEditor.stage.scaleX(),
        y:
          (nodeBounds.y + transform.y - (workspaceEditor.stage.y() || 0) + radius) /
          workspaceEditor.stage.scaleY(),
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

  const saveStateToLocalStorage = () => {
    const initialState = editor()?.initialState;
    if (initialState?.length) {
      localStorage.setItem("lastTrackState", JSON.stringify(initialState));
    }

    const settings: GameSettings = {
      previewOnPlayback: editor()?.previewOnPlayback ?? false,
    };
    localStorage.setItem("gameSettings", JSON.stringify(settings));
  };

  const handleSave = (newState: GameState) => {
    setInitialState(newState);
  };

  onMount(() => {
    const savedStateJSON = localStorage.getItem("lastTrackState");
    const savedState: GameState | null = savedStateJSON ? JSON.parse(savedStateJSON) : null;
    if (savedState) {
      setInitialState(savedState);
    }

    const savedSettingsJSON = localStorage.getItem("gameSettings");
    const savedSettings: GameSettings | null = savedSettingsJSON
      ? JSON.parse(savedSettingsJSON)
      : null;
    if (savedSettings) {
      setSettings(savedSettings);
    }
  });

  return (
    <DragDropProvider onDragMove={onDragMove} onDragEnd={onDragEnd}>
      <DragDropSensors />
      <Editor
        handleSave={handleSave}
        saveStateToLocalStorage={saveStateToLocalStorage}
        closeToolbar={closeToolbar}
      />
      <Toolbar
        ref={details!}
        saveStateToLocalStorage={saveStateToLocalStorage}
        toggleToolbarOpen={toggleToolbarOpen}
      />
      <DragOverlay>{(draggable) => <div class={`${draggable ? draggable.id : ""}`} />}</DragOverlay>
    </DragDropProvider>
  );
};
