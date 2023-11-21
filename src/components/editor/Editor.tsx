import { type Component, onMount, onCleanup, createSignal, Accessor, Setter } from "solid-js";
import { createDroppable } from "@thisbeyond/solid-dnd";
import { WorkspaceEditor, GameState } from "../../game/canvas";
import { Playback } from "../playback/Playback";
import "./Editor.scss";

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

  const editorStopCallback = () => {
    setPlaying(false);
  };

  onMount(() => {
    props.setEditor(new WorkspaceEditor(container, editorStopCallback, props.initialState));
    const resizeListener = () => {
      props.editor()?.sizeToContainer();
    };
    addEventListener("resize", resizeListener);

    onCleanup(() => {
      removeEventListener("resize", resizeListener);
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
