import { type Component, onMount, onCleanup, createSignal } from "solid-js";
import { createDroppable } from "@thisbeyond/solid-dnd";
import { WorkspaceEditor, GameState } from "../../game/canvas";
import { Playback } from "../playback/Playback";
import "./Editor.scss";

type EditorProps = {
  initialState: GameState;
  handleSave: (newState: GameState) => void;
};

export const Editor: Component<EditorProps> = (props) => {
  const [playing, setPlaying] = createSignal(false);
  const [editor, setEditor] = createSignal<WorkspaceEditor>();
  const droppable = createDroppable(1);
  let container: HTMLDivElement;

  const togglePlay = () => {
    if (playing()) {
      editor()?.pause(editor() as WorkspaceEditor);
    } else {
      editor()?.play(editor() as WorkspaceEditor);
    }
    setPlaying(!playing());
  };

  const handleStop = () => {
    editor()?.stop(editor() as WorkspaceEditor);
  };

  const editorStopCallback = () => {
    setPlaying(false);
  };

  onMount(() => {
    setEditor(new WorkspaceEditor(container, editorStopCallback, props.initialState));
    const resizeListener = () => {
      editor()?.sizeToContainer();
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
      <Playback playing={playing} togglePlay={togglePlay} handleStop={handleStop} />
      <div class="konva-container" ref={container!} onContextMenu={(event) => event.preventDefault()} />
    </main>
  );
};
