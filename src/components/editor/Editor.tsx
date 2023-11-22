import { type Component, onMount, onCleanup, createSignal, Accessor, Setter } from "solid-js";
import { createDroppable } from "@thisbeyond/solid-dnd";
import { useGameContext } from "../game_context/GameContext";
import { Playback } from "../playback/Playback";
import { WorkspaceEditor, GameState, Body, GameSettings } from "../../game/canvas";
import { SerializedBody } from "../../game/physics";
import "./Editor.scss";

type EditorProps = {
  editor: Accessor<WorkspaceEditor | undefined>;
  setEditor: Setter<WorkspaceEditor | undefined>;
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
  } = useGameContext();
  const droppable = createDroppable(0);
  let container: HTMLDivElement;
  let interactableElements: Element[] = [];

  const togglePlay = () => {
    if (playing()) {
      props.editor()?.pause(props.editor() as WorkspaceEditor);
    } else {
      props.editor()?.play(props.editor() as WorkspaceEditor);
      setStopped(false);
      props.saveStateToLocalStorage();
    }
    setPlaying(!playing());
  };

  const handleStop = () => {
    props.editor()?.stop(props.editor() as WorkspaceEditor);
    setStopped(true);
  };

  const editorStopCallback = () => {
    setPlaying(false);
  };

  const handleDelete = () => {
    const bodiesToDelete = props
      .editor()
      ?.transformer.nodes()
      .map((node) => node.id());
    if (bodiesToDelete?.length) {
      props.editor()?.transformer.nodes([]);
      const newState = (props.editor()?.initialState as SerializedBody[])?.filter(
        (body) => !bodiesToDelete.includes(body.canvasId),
      );
      if (newState) {
        props.editor()?.initialize(newState);
      }
    }
  };

  const resizeListener = () => {
    props.editor()?.sizeToContainer();
  };

  const pointerDownListener = (event: PointerEvent) => {
    const element = event.target as Element;

    if (!interactableElements.length) {
      const toolbar = document.querySelector(".toolbar");
      toolbar && interactableElements.push(...(toolbar.querySelectorAll("*") || []));
    }

    if (
      !(event.target instanceof HTMLCanvasElement) &&
      !(event.target instanceof HTMLButtonElement) &&
      !interactableElements.includes(element)
    ) {
      props.editor()?.transformer.nodes([]);
    }
  };

  const pointerMoveListener = (event: PointerEvent) => {
    const draggingBodies = props.editor()?.draggingBodies;
    if (event.target instanceof HTMLCanvasElement && draggingBodies?.length) {
      draggingBodies.map((draggingBody) => (draggingBody.initialState = draggingBody.serialize()));
      props.editor()?.initialize();
    }
  };

  const pointerUpListener = (event: PointerEvent) => {
    setTimeout(() => {
      const bodiesSelected = props.editor()?.transformer.nodes();
      if (bodiesSelected?.length === 1) {
        setSingleBodySelected(bodiesSelected[0] as Body);
      } else {
        setSingleBodySelected(null);
      }
      if (
        openState() === "open" &&
        selectedTab() === 1 &&
        !props.editor()?.transformer.nodes().length
      ) {
        props.closeToolbar();
      }
    });

    const draggingBodies = props.editor()?.draggingBodies;
    if (event.target instanceof HTMLCanvasElement && draggingBodies?.length) {
      draggingBodies.map((draggingBody) => (draggingBody.initialState = draggingBody.serialize()));
      props.editor()?.initialize();
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
    props.setEditor(new WorkspaceEditor(container, settings, editorStopCallback, initialState));
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
