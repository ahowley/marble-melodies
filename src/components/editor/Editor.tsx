import { type Component, onMount, onCleanup, Accessor } from "solid-js";
import { WorkspaceEditor } from "../../game/canvas";
import { SerializedBody } from "../../game/physics";
import "./Editor.scss";

type EditorProps = {
  initialState: Omit<SerializedBody, "canvasId">[];
  playing: Accessor<boolean>;
};

export const Editor: Component<EditorProps> = (props) => {
  let container: HTMLDivElement;

  onMount(() => {
    const editor = new WorkspaceEditor(container, props.initialState);
    const resizeListener = () => {
      editor.sizeToContainer();
    };
    addEventListener("resize", resizeListener);

    onCleanup(() => {
      removeEventListener("resize", resizeListener);
    });
  });

  return <div class="konva-container" ref={container!} onContextMenu={(event) => event.preventDefault()} />;
};
