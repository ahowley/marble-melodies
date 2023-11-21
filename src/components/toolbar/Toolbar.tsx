import { Component, JSX, createSignal } from "solid-js";
import { DraggableBody } from "../draggable/DraggableBody";
import { Shape } from "../draggable/Shape";
import "./Toolbar.scss";

export const Toolbar: Component = (props) => {
  let details: HTMLDetailsElement;
  let [openState, setOpenState] = createSignal<"open" | "closing" | "closed">("closed");

  return (
    <details
      class={`toolbar ${openState() === "open" ? "open" : "closed"}`}
      open={["open", "closing"].includes(openState())}
      ref={details!}
    >
      <summary
        class="summary"
        onClick={(event) => {
          event.preventDefault();
          if (details.open) {
            setOpenState("closing");
            setTimeout(() => {
              setOpenState("closed");
            }, 200);
          } else {
            setOpenState("open");
          }
        }}
      >
        Toolbar
      </summary>

      <div class="bodies">
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
