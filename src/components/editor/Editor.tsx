import { type Component, onMount, onCleanup, createSignal, Accessor, Setter } from "solid-js";
import { createDroppable } from "@thisbeyond/solid-dnd";
import { useGameContext } from "../game_context/GameContext";
import { Playback } from "../playback/Playback";
import { WorkspaceEditor, GameState, Body } from "../../game/canvas";
import { SerializedBody } from "../../game/physics";
import "./Editor.scss";

type EditorProps = {
  editor: Accessor<WorkspaceEditor | undefined>;
  setEditor: Setter<WorkspaceEditor | undefined>;
  initialState: GameState;
  handleSave: (newState: GameState) => void;
};

export const Editor: Component<EditorProps> = (props) => {
  const {
    playing: [playing, setPlaying],
    stopped: [stopped, setStopped],
    singleBodySelected: [singleBodySelected, setSingleBodySelected],
  } = useGameContext();
  const droppable = createDroppable(1);
  let container: HTMLDivElement;

  const saveStateToLocalStorage = () => {
    const initialState = props.editor()?.initialState;
    if (initialState?.length) {
      localStorage.setItem("lastTrackState", JSON.stringify(initialState));
    }
  };

  const togglePlay = () => {
    if (playing()) {
      props.editor()?.pause(props.editor() as WorkspaceEditor);
    } else {
      props.editor()?.play(props.editor() as WorkspaceEditor);
      setStopped(false);
      saveStateToLocalStorage();
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
    if (
      !(event.target instanceof HTMLCanvasElement) &&
      !(event.target instanceof HTMLButtonElement)
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
    });

    const draggingBodies = props.editor()?.draggingBodies;
    if (event.target instanceof HTMLCanvasElement && draggingBodies?.length) {
      draggingBodies.map((draggingBody) => (draggingBody.initialState = draggingBody.serialize()));
      props.editor()?.initialize();
    }
  };

  const keyUpListener = (event: KeyboardEvent) => {
    if (event.key === "Backspace" || event.key === "Delete") {
      console.log("deleting");
      handleDelete();
    }
    if (event.key === " " || event.key === "Enter") {
      console.log("play/pausing");
      togglePlay();
    }
    if (event.key === "Escape") {
      console.log("stopping");
      handleStop();
    }
  };

  onMount(() => {
    props.setEditor(new WorkspaceEditor(container, editorStopCallback, props.initialState));
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
