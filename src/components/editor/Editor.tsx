import { type Component, onMount, onCleanup, createSignal, Accessor, Setter } from "solid-js";
import { createDroppable } from "@thisbeyond/solid-dnd";
import { WorkspaceEditor, GameState } from "../../game/canvas";
import { Playback } from "../playback/Playback";
import "./Editor.scss";
import { SerializedBody } from "../../game/physics";

type EditorProps = {
  editor: Accessor<WorkspaceEditor | undefined>;
  setEditor: Setter<WorkspaceEditor | undefined>;
  initialState: GameState;
  handleSave: (newState: GameState) => void;
};

export const Editor: Component<EditorProps> = (props) => {
  const [playing, setPlaying] = createSignal(false);
  const [stopped, setStopped] = createSignal(true);
  const droppable = createDroppable(1);
  let container: HTMLDivElement;

  const togglePlay = () => {
    if (playing()) {
      props.editor()?.pause(props.editor() as WorkspaceEditor);
    } else {
      props.editor()?.play(props.editor() as WorkspaceEditor);
      setStopped(false);
    }
    setPlaying(!playing());
  };

  const handleStop = () => {
    props.editor()?.stop(props.editor() as WorkspaceEditor);
    setStopped(true);
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

  const editorStopCallback = () => {
    setPlaying(false);
  };

  const resizeListener = () => {
    props.editor()?.sizeToContainer();
  };

  const pointerDownListener = (event: PointerEvent) => {
    if (!(event.target instanceof HTMLCanvasElement)) {
      props.editor()?.transformer.nodes([]);
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
    document.addEventListener("keyup", keyUpListener);

    onCleanup(() => {
      removeEventListener("resize", resizeListener);
      removeEventListener("pointerdown", pointerDownListener);
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
        playing={playing}
        stopped={stopped}
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
