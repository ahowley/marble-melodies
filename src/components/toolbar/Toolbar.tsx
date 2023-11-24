import { Component, Ref } from "solid-js";
import { GameSettings, useGameContext } from "../game_context/GameContext";
import { DraggableBody } from "../draggable/DraggableBody";
import { Shape } from "../draggable/Shape";
import { Marble } from "../../game/canvas";
import { MarbleSynth } from "../synth/MarbleSynth";
import "./Toolbar.scss";

export type OpenStates = "open" | "closing" | "closed";

type ToolbarProps = {
  ref: Ref<HTMLDetailsElement>;
  saveStateToLocalStorage: () => void;
  toggleToolbarOpen: (event: MouseEvent) => void;
};
export const Toolbar: Component<ToolbarProps> = (props) => {
  const {
    editor: [editor, _setEditor],
    settings: [settings, _setSettings],
    stopped: [stopped, _setStopped],
    singleBodySelected: [singleBodySelected, _setSingleBodySelected],
    openState: [openState, _setOpenState],
    selectedTab: [selectedTab, _setSelectedTab],
  } = useGameContext();
  const editableBodyTypes = ["marble"];

  const changeSetting = (setting: keyof GameSettings, value: any) => {
    editor()![setting] = value;
    props.saveStateToLocalStorage();
  };

  const cameraTrackSelectedBody = (track: boolean) => {
    if (singleBodySelected()?.name() === "marble") {
      const selectedBody = singleBodySelected() as Marble;
      selectedBody.setTrackCamera(track);
      props.saveStateToLocalStorage();
    }
  };

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
            !singleBodySelected() ||
            !editableBodyTypes.includes((singleBodySelected() as Marble).name())
              ? "hidden"
              : ""
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
        <button
          onClick={props.toggleToolbarOpen}
          class={`tab synth-tab ${selectedTab() === 3 ? "selected" : ""}`}
        >
          Synth
        </button>
      </summary>

      <div
        class={`content ${
          selectedTab() === 0
            ? "bodies"
            : selectedTab() === 1
            ? "edit"
            : selectedTab() === 2
            ? "settings"
            : selectedTab() === 3
            ? "synth"
            : ""
        }`}
      >
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
          <form class="checkboxes" action="">
            <label class="label">
              <input
                type="checkbox"
                name="trackCamera"
                checked={(singleBodySelected() as Marble)?.cameraTracking}
                onClick={(event) => cameraTrackSelectedBody(event.currentTarget.checked)}
              />
              Make camera follow this marble
            </label>
          </form>
        )}
        {selectedTab() === 2 && (
          <form class="checkboxes" action="">
            <label class="label">
              <input
                type="checkbox"
                name="previewOnPlayback"
                checked={settings.previewOnPlayback}
                onClick={(event) => changeSetting("previewOnPlayback", event.currentTarget.checked)}
              />
              Preview during playback
            </label>
          </form>
        )}
        <MarbleSynth
          saveStateToLocalStorage={props.saveStateToLocalStorage}
          showing={selectedTab() === 3}
        />
      </div>
    </details>
  );
};
