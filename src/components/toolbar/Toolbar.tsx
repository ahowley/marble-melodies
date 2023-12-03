import { Component, Ref } from "solid-js";
import { A, useNavigate } from "@solidjs/router";
import { useUserContext } from "../user_context/UserContext";
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
  handleSave: (event: SubmitEvent) => void;
  handleDeleteTrack: () => void;
  userOwnsTrack: boolean;
  failureMessage: string;
  isSaving: boolean;
  saveWasSuccessful: boolean;
  trackName: string | null;
};
export const Toolbar: Component<ToolbarProps> = (props) => {
  const navigate = useNavigate();
  const {
    userId: [userId, _setUserId],
    unsavedChangesSignal: [unsavedChangesSignal, _setUnsavedChangesSignal],
  } = useUserContext();
  const {
    editor: [editor, _setEditor],
    initialState: [initialState, _setInitialState],
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
      class={`toolbar ${openState() === "open" ? "open" : "closed"} ${!stopped() ? "hidden" : ""} ${
        props.isSaving ? "is-saving" : ""
      }`}
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
          File
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
          <form class="checkboxes" action="" onSubmit={props.handleSave}>
            <label class="label">
              <input
                type="checkbox"
                name="previewOnPlayback"
                checked={settings.previewOnPlayback}
                onClick={(event) => changeSetting("previewOnPlayback", event.currentTarget.checked)}
              />
              Preview during playback
            </label>
            {userId() ? (
              <label class="text-label">
                Name
                <input type="text" class="input" name="trackname" value={props.trackName || ""} />
              </label>
            ) : (
              <p class="login-prompt">
                <A href="/login">Log in</A> to name & save your track!
              </p>
            )}
            <div class="buttons">
              {userId() && initialState?.length && unsavedChangesSignal() && (
                <button type="submit" class="button">
                  Save{!props.userOwnsTrack ? " as" : ""}
                </button>
              )}
              {props.userOwnsTrack && (
                <button type="button" class="button" onClick={props.handleDeleteTrack}>
                  Delete track
                </button>
              )}
              <button
                type="button"
                class="button"
                onClick={() => {
                  navigate("/track/new");
                  window.location.replace("/track/new");
                }}
              >
                Start new track
              </button>
              {props.failureMessage && (
                <p class={`failure-message ${props.saveWasSuccessful ? "success-message" : ""}`}>
                  {props.failureMessage}
                </p>
              )}
            </div>
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
