import { type Component, onMount, onCleanup, createSignal } from "solid-js";
import { WorkspaceEditor } from "../../game/canvas";
import { SerializedBody } from "../../game/physics";
import { Playback } from "../playback/Playback";
import "./Editor.scss";

type EditorProps = {
  initialState: Omit<SerializedBody, "canvasId">[];
};

export const Editor: Component<EditorProps> = (props) => {
  const [playing, setPlaying] = createSignal(false);
  const [editor, setEditor] = createSignal<WorkspaceEditor>();
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
    <>
      <Playback playing={playing} togglePlay={togglePlay} handleStop={handleStop} />
      <div class="konva-container" ref={container!} onContextMenu={(event) => event.preventDefault()} />
    </>
  );
};
