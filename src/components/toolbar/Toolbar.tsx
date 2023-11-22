import { Component, createSignal } from "solid-js";
import { DraggableBody } from "../draggable/DraggableBody";
import { Shape } from "../draggable/Shape";
import "./Toolbar.scss";

export const Toolbar: Component = (props) => {
  let details: HTMLDetailsElement;
  let [openState, setOpenState] = createSignal<"open" | "closing" | "closed">("closed");
  let [selectedTab, setSelectedTab] = createSignal(0);

  const handleOpen = (event: MouseEvent) => {
    event.preventDefault();
    const tabClicked = event.target as HTMLElement | null;
    const parentNode = tabClicked?.parentNode;
    if (!parentNode) return;

    const lastOpenTab = selectedTab();
    setSelectedTab([...parentNode.children].findIndex((child) => child === tabClicked));
    if (details.open && lastOpenTab === selectedTab()) {
      setOpenState("closing");
      setTimeout(() => {
        setOpenState("closed");
      }, 200);
    } else {
      setOpenState("open");
    }
  };

  return (
    <details
      class={`toolbar ${openState() === "open" ? "open" : "closed"}`}
      open={["open", "closing"].includes(openState())}
      ref={details!}
    >
      <summary class="summary">
        <button onClick={handleOpen} class={`tab ${selectedTab() === 0 ? "selected" : ""}`}>
          Drag + Drop
        </button>
        <button onClick={handleOpen} class={`tab ${selectedTab() === 1 ? "selected" : ""}`}>
          Options
        </button>
        <button onClick={handleOpen} class={`tab ${selectedTab() === 2 ? "selected" : ""}`}>
          Settings
        </button>
      </summary>

      <div class="content">
        <DraggableBody id="marble">
          <Shape type="marble" />
        </DraggableBody>
        <DraggableBody id="track-block">
          <Shape type="track-block" />
        </DraggableBody>
        <DraggableBody id="note-block">
          <Shape type="note-block" />
        </DraggableBody>
      </div>
    </details>
  );
};
