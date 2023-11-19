import { type Component, onMount, onCleanup } from "solid-js";
import { WorkspaceEditor } from "../../game/canvas";
import "./Editor.scss";

export const Editor: Component = () => {
  let container: HTMLDivElement;

  onMount(() => {
    const editor = new WorkspaceEditor(container);
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
