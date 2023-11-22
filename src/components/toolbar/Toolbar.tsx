import { Component, Ref, createSignal } from "solid-js";
import { useGameContext } from "../game_context/GameContext";
import { DraggableBody } from "../draggable/DraggableBody";
import { Shape } from "../draggable/Shape";
import { Marble } from "../../game/canvas";
import "./Toolbar.scss";

export type OpenStates = "open" | "closing" | "closed";

type ToolbarProps = {
  ref: Ref<HTMLDetailsElement>;
  toggleToolbarOpen: (event: MouseEvent) => void;
};
export const Toolbar: Component<ToolbarProps> = (props) => {
  const {
    stopped: [stopped, _setStopped],
    singleBodySelected: [singleBodySelected, _setSingleBodySelected],
    openState: [openState, _setOpenState],
    selectedTab: [selectedTab, _setSelectedTab],
  } = useGameContext();

  return (
    <details
      class={`toolbar ${openState() === "open" ? "open" : "closed"} ${!stopped() ? "hidden" : ""}`}
      open={["open", "closing"].includes(openState())}
      ref={props.ref!}
    >
      <summary class="summary">
        <button
          onClick={props.toggleToolbarOpen}
          class={`tab ${selectedTab() === 0 ? "selected" : ""}`}
        >
          Drag + Drop
        </button>
        <button
          onClick={props.toggleToolbarOpen}
          class={`tab ${selectedTab() === 1 ? "selected" : ""} ${
            !singleBodySelected() ? "hidden" : ""
          }`}
        >
          Edit {singleBodySelected() instanceof Marble ? "Marble" : "Block"}
        </button>
        <button
          onClick={props.toggleToolbarOpen}
          class={`tab ${selectedTab() === 2 ? "selected" : ""}`}
        >
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
