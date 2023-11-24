import { type Component, onMount, onCleanup } from "solid-js";
import { createDroppable } from "@thisbeyond/solid-dnd";
import { GameState, useGameContext } from "../game_context/GameContext";
import { Playback } from "../playback/Playback";
import { WorkspaceEditor, Body } from "../../game/canvas";
import { SerializedBody } from "../../game/physics";
import "./Editor.scss";

type EditorProps = {
  handleSave: (newState: GameState) => void;
  saveStateToLocalStorage: () => void;
  closeToolbar: () => void;
};

export const Editor: Component<EditorProps> = (props) => {
  const {
    initialState: [initialState, _setInitialState],
    settings: [settings, _setSettings],
    playing: [playing, setPlaying],
    stopped: [stopped, setStopped],
    singleBodySelected: [_singleBodySelected, setSingleBodySelected],
    openState: [openState, _setOpenState],
    selectedTab: [selectedTab, _setSelectedTab],
    editor: [editor, setEditor],
  } = useGameContext();
  const droppable = createDroppable(0);
  let container: HTMLDivElement;
  let interactableElements: Element[] = [];

  const togglePlay = () => {
    if (playing()) {
      editor()?.pause(editor() as WorkspaceEditor);
    } else {
      editor()?.play(editor() as WorkspaceEditor);
      setStopped(false);
      props.saveStateToLocalStorage();
    }
    setPlaying(!playing());
  };

  const handleStop = () => {
    editor()?.stop(editor() as WorkspaceEditor);
    setStopped(true);
  };

  const editorStopCallback = () => {
    setPlaying(false);
  };

  const handleDelete = () => {
    const bodiesToDelete = editor()
      ?.transformer.nodes()
      .map((node) => node.id());
    if (bodiesToDelete?.length) {
      editor()?.transformer.nodes([]);
      const newState = (editor()?.initialState as SerializedBody[])?.filter(
        (body) => !bodiesToDelete.includes(body.canvasId),
      );
      if (newState) {
        editor()?.initialize(newState);
      }
    }
  };

  const resizeListener = () => {
    editor()?.sizeToContainer();
  };

  const pointerDownListener = (event: PointerEvent) => {
    const element = event.target as Element;

    const toolbar = document.querySelector(".toolbar");
    toolbar && interactableElements.push(...(toolbar.querySelectorAll("*") || []));

    if (
      !(event.target instanceof HTMLCanvasElement) &&
      !(event.target instanceof HTMLButtonElement) &&
      !interactableElements.includes(element)
    ) {
      editor()?.transformer.nodes([]);
    }
  };

  const pointerMoveListener = (event: PointerEvent) => {
    const draggingBodies = editor()?.draggingBodies;
    if (event.target instanceof HTMLCanvasElement && draggingBodies?.length) {
      draggingBodies.map((draggingBody) => (draggingBody.initialState = draggingBody.serialize()));
      editor()?.initialize();
    }
  };

  const pointerUpListener = (event: PointerEvent) => {
    setTimeout(() => {
      const bodiesSelected = editor()?.transformer.nodes();
      if (bodiesSelected?.length === 1) {
        setSingleBodySelected(bodiesSelected[0] as Body);
      } else {
        setSingleBodySelected(null);
      }
      if (openState() === "open" && selectedTab() === 1 && !editor()?.transformer.nodes().length) {
        props.closeToolbar();
      }
    });

    const draggingBodies = editor()?.draggingBodies;
    if (event.target instanceof HTMLCanvasElement && draggingBodies?.length) {
      draggingBodies.map((draggingBody) => (draggingBody.initialState = draggingBody.serialize()));
      editor()?.initialize();
    }
  };

  const keyUpListener = (event: KeyboardEvent) => {
    if (event.key === "Backspace" || event.key === "Delete") {
      handleDelete();
    }
    if (event.key === " " || event.key === "Enter") {
      togglePlay();
    }
    if (event.key === "Escape") {
      handleStop();
    }
  };

  onMount(() => {
    setEditor(new WorkspaceEditor(container, settings, editorStopCallback, initialState));
    addEventListener("resize", resizeListener);
    addEventListener("pointerdown", pointerDownListener);
    addEventListener("pointermove", pointerMoveListener);
    addEventListener("pointerup", pointerUpListener);
    document.addEventListener("keyup", keyUpListener);

    onCleanup(() => {
      removeEventListener("resize", resizeListener);
      removeEventListener("pointerdown", pointerDownListener);
      removeEventListener("pointermove", pointerMoveListener);
      removeEventListener("pointerup", pointerUpListener);
      document.removeEventListener("keyup", keyUpListener);
    });
  });

  return (
    <main
      id="workspace"
      ref={droppable.ref}
      class="droppable"
      classList={{ "!droppable-accept": droppable.isActiveDroppable }}
    >
      <Playback
        playing={playing()}
        stopped={stopped()}
        togglePlay={togglePlay}
        handleStop={handleStop}
      />
      <div
        class="konva-container"
        ref={container!}
        onContextMenu={(event) => event.preventDefault()}
      />
    </main>
  );
};
