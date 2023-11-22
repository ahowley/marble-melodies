import { Component, createSignal } from "solid-js";
import { useGameContext } from "../game_context/GameContext";
import { DraggableBody } from "../draggable/DraggableBody";
import { Shape } from "../draggable/Shape";
import "./Toolbar.scss";
import { Marble } from "../../game/canvas";

export const Toolbar: Component = () => {
  const {
    playing: [playing, _setPlaying],
    singleBodySelected: [singleBodySelected, _setSingleBodySelected],
  } = useGameContext();
  let [openState, setOpenState] = createSignal<"open" | "closing" | "closed">("closed");
  let [selectedTab, setSelectedTab] = createSignal(0);
  let details: HTMLDetailsElement;

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
      class={`toolbar ${openState() === "open" ? "open" : "closed"} ${playing() ? "hidden" : ""}`}
      open={["open", "closing"].includes(openState())}
      ref={details!}
    >
      <summary class="summary">
        <button onClick={handleOpen} class={`tab ${selectedTab() === 0 ? "selected" : ""}`}>
          Drag + Drop
        </button>
        <button
          onClick={handleOpen}
          class={`tab ${selectedTab() === 1 ? "selected" : ""} ${
            !singleBodySelected() ? "hidden" : ""
          }`}
        >
          Edit {singleBodySelected() instanceof Marble ? "Marble" : "Block"}
        </button>
        <button onClick={handleOpen} class={`tab ${selectedTab() === 2 ? "selected" : ""}`}>
          Settings
        </button>
      </summary>

      <div class={`content ${selectedTab() === 0 ? "bodies" : selectedTab() === 1 ? "edit" : ""}`}>
        {selectedTab() === 0 && (
          <>
            <DraggableBody id="marble">
              <Shape type="marble" />
            </DraggableBody>
            <DraggableBody id="track-block">
              <Shape type="track-block" />
            </DraggableBody>
            <DraggableBody id="note-block">
              <Shape type="note-block" />
            </DraggableBody>
          </>
        )}
        {selectedTab() === 1 && singleBodySelected() && (
          <>Editing {singleBodySelected() instanceof Marble ? "marble" : "block"}</>
        )}
      </div>
    </details>
  );
};
