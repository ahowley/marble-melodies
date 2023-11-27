import { createSignal, type Component, Show } from "solid-js";
import { useNavigate, useParams } from "@solidjs/router";
import {
  DragDropProvider,
  DragDropSensors,
  DragOverlay,
  DragEventHandler,
} from "@thisbeyond/solid-dnd";
import { Editor } from "../../components/editor/Editor";
import { Toolbar } from "../../components/toolbar/Toolbar";
import {
  SaveTrackBody,
  ServerResponse,
  useUserContext,
} from "../../components/user_context/UserContext";
import {
  GameSettings,
  GameState,
  SynthSettings,
  useGameContext,
} from "../../components/game_context/GameContext";
import { SerializedBody, BlockTypes } from "../../game/physics";
import { COLORS } from "../../game/config";
import "./Workspace.scss";

export const Workspace: Component = () => {
  const navigate = useNavigate();
  const {
    userId: [userId, _setUserId],
    lastVisitedTrackId: [lastVisitedTrackId, setLastVisitedTrackId],
    server: { getTrack, postTrack, putTrack, deleteTrack },
  } = useUserContext();
  const {
    initialState: [_initialState, setInitialState],
    settings: [settings, setSettings],
    synthSettings: [synthSettings, setSynthSettings],
    editor: [editor, _setEditor],
    openState: [_openState, setOpenState],
    selectedTab: [selectedTab, setSelectedTab],
    marbleSynth: [marbleSynth, _setMarbleSynth],
  } = useGameContext();
  const [trackName, setTrackName] = createSignal<string | null>(null);
  const [isLoading, setIsLoading] = createSignal(true);
  const [isSaving, setIsSaving] = createSignal(false);
  const [userOwnsTrack, setUserOwnsTrack] = createSignal(false);
  const [failureMessage, setFailureMessage] = createSignal("");
  const [saveWasSuccessful, setSaveWasSuccessful] = createSignal(false);
  const params = useParams();
  let transform = { x: 0, y: 0 };
  let details: HTMLDetailsElement;

  const saveStateToLocalStorage = () => {
    const initialState = editor()?.initialState;
    if (initialState?.length) {
      localStorage.setItem("lastTrackState", JSON.stringify(initialState));
      setInitialState(initialState);
    } else if (initialState?.length === 0) {
      localStorage.removeItem("lastTrackState");
      setInitialState([]);
    }

    const settings: GameSettings = {
      previewOnPlayback: editor()?.previewOnPlayback ?? false,
    };
    localStorage.setItem("gameSettings", JSON.stringify(settings));
    setSettings(settings);

    const synthSettings: SynthSettings = {
      volume: marbleSynth()?.volume || 0.5,
    };
    localStorage.setItem("synthSettings", JSON.stringify(synthSettings));
    setSynthSettings(synthSettings);
  };

  const loadStateFromLocalStorage = async () => {
    const savedStateJSON = localStorage.getItem("lastTrackState");
    const savedState: GameState | null = savedStateJSON ? JSON.parse(savedStateJSON) : null;
    if (savedState) {
      setInitialState(savedState);
    }

    const savedSettingsJSON = localStorage.getItem("gameSettings");
    const savedSettings: GameSettings | null = savedSettingsJSON
      ? JSON.parse(savedSettingsJSON)
      : null;
    if (savedSettings) {
      setSettings(savedSettings);
    }

    const savedSynthSettingsJSON = localStorage.getItem("synthSettings");
    const savedSynthSettings: SynthSettings | null = savedSynthSettingsJSON
      ? JSON.parse(savedSynthSettingsJSON)
      : null;
    if (savedSynthSettings) {
      setSynthSettings(savedSynthSettings);
    }

    setUserOwnsTrack(false);
    setIsLoading(false);
  };

  const clearLocalStorage = () => {
    localStorage.removeItem("lastTrackState");
    localStorage.removeItem("gameSettings");
    localStorage.removeItem("synthSettings");
  };

  const loadStateFromServer = async (trackId: string) => {
    const { status, data } = await getTrack(trackId);
    if (status === 404) {
      setLastVisitedTrackId(null);
      navigate("/404");
      return loadStateFromLocalStorage();
    }

    if (data.previewOnPlayback) {
      setSettings({
        ...settings,
        previewOnPlayback: data.previewOnPlayback,
      });
    }
    if (data.volume !== undefined) {
      setSynthSettings({
        ...synthSettings,
        volume: data.volume,
      });
    }
    if (data.name) {
      setTrackName(data.name);
    }
    if (data.initialState) {
      setInitialState(data.initialState);
    }
    if (data.user_id === userId()) {
      setUserOwnsTrack(true);
    }

    saveStateToLocalStorage();
    setIsLoading(false);
  };

  const handleSave = async (event: SubmitEvent) => {
    event.preventDefault();

    const trackNameField = event.currentTarget as HTMLFormElement;
    const name = trackNameField.trackname.value as string;
    const initialState = editor()?.initialState;
    const previewOnPlayback = editor()?.previewOnPlayback ?? false;
    const volume = marbleSynth()?.volume || 0.5;

    if (!name) {
      return setFailureMessage("Please name your track before saving!");
    }

    const postBody: SaveTrackBody = {
      name,
      previewOnPlayback,
      volume,
      initialState: initialState as GameState,
    };

    setIsSaving(true);

    let response: Promise<ServerResponse>;
    if (params.id) {
      response = putTrack(params.id, postBody);
    } else {
      response = postTrack(postBody);
    }
    const { status, data } = await response;
    if (status === 401) {
      setIsSaving(false);
      return setFailureMessage("Sorry, it looks like you're not logged in!");
    }
    if (status === 400 || status === 500) {
      const firstError = data.errors?.length && data.errors[0];
      if (!firstError || status === 500) {
        setIsSaving(false);
        return setFailureMessage("Something went wrong - sorry! Wait a few seconds and try again.");
      }

      setIsSaving(false);
      return setFailureMessage(firstError.msg);
    }

    const { trackId, message } = data;
    if (!trackId || !message) {
      setIsSaving(false);
      return setFailureMessage("Something went wrong - sorry! Wait a few seconds and try again.");
    }

    setFailureMessage(message as string);
    setIsSaving(false);
    setSaveWasSuccessful(true);
    setLastVisitedTrackId(`${trackId}`);
    navigate(`/track/${trackId}`, { replace: true });
    window.location.replace(`/track/${trackId}`);
  };

  const handleDelete = async () => {
    setIsSaving(true);
    const { status } = await deleteTrack(params.id);
    if (!status || status === 500) {
      setIsSaving(false);
      return setFailureMessage("Something went wrong - sorry! Wait a few seconds and try again.");
    }

    if (status === 401) {
      setIsSaving(false);
      return setFailureMessage("Sorry, you need to be logged in to delete a track.");
    }
    if (status === 403) {
      setIsSaving(false);
      return setFailureMessage("This isn't your track to delete!");
    }
    if (status === 404) {
      setIsSaving(false);
      return setFailureMessage(
        "Sorry, we couldn't find the track in our database. Try refreshing, this track may have already been deleted.",
      );
    }

    setIsSaving(false);
    setSaveWasSuccessful(true);
    setFailureMessage("The track was successfully deleted!");
    clearLocalStorage();
    setLastVisitedTrackId(null);
    navigate("/track/new", { replace: true });
    window.location.replace("/track/new");
  };

  const closeToolbar = () => {
    setOpenState("closing");
    setTimeout(() => {
      setOpenState("closed");
    }, 200);
  };

  const toggleToolbarOpen = (event: MouseEvent) => {
    event.preventDefault();
    const tabClicked = event.target as HTMLElement | null;
    const parentNode = tabClicked?.parentNode;
    if (!parentNode) return;

    const lastOpenTab = selectedTab();
    setSelectedTab([...parentNode.children].findIndex((child) => child === tabClicked));
    if (details.open && lastOpenTab === selectedTab()) {
      setOpenState("closing");
      setTimeout(() => {
        closeToolbar();
      }, 200);
    } else {
      setOpenState("open");
    }
  };

  const onDragMove: DragEventHandler = ({ overlay }) => {
    if (overlay) {
      transform = { ...overlay.transform };
    }
  };

  const onDragEnd: DragEventHandler = ({ draggable, droppable }) => {
    const workspaceEditor = editor();
    if (!workspaceEditor) return;

    if (droppable) {
      const nodeBounds = draggable.node.getBoundingClientRect();
      const radius = draggable.id === "marble" ? nodeBounds.width / 2 : 0;
      const newSerializedBody: Omit<SerializedBody, "canvasId"> = {
        type: draggable.id as BlockTypes,
        x:
          (nodeBounds.x + transform.x - (workspaceEditor.stage.x() || 0) + radius) /
          workspaceEditor.stage.scaleX(),
        y:
          (nodeBounds.y + transform.y - (workspaceEditor.stage.y() || 0) + radius) /
          workspaceEditor.stage.scaleY(),
        rotation: 0,
      };

      switch (draggable.id as BlockTypes) {
        case "marble":
          newSerializedBody.radius = radius;
          newSerializedBody.gradientStart = COLORS.accentSecondaryLight;
          newSerializedBody.gradientEnd = COLORS.accentSecondaryDark;
          break;
        case "track-block":
          newSerializedBody.width = nodeBounds.width;
          newSerializedBody.height = nodeBounds.height;
          newSerializedBody.frontColor = COLORS.highlightDark;
          newSerializedBody.backColor = COLORS.secondaryLight;
          break;
        case "note-block":
          newSerializedBody.width = nodeBounds.width;
          newSerializedBody.height = nodeBounds.height;
          newSerializedBody.gradientStart = COLORS.accentLight;
          newSerializedBody.gradientEnd = COLORS.accentDark;
          newSerializedBody.note = "auto";
          newSerializedBody.octave = "auto";
          newSerializedBody.volume = 1;
          break;
      }

      if (!workspaceEditor.playing && !workspaceEditor.disableTransformer) {
        workspaceEditor.transformer.nodes([]);
        workspaceEditor.initialize([...workspaceEditor.initialState, newSerializedBody]);
        saveStateToLocalStorage();
      }
    }
  };

  const lastVisited = lastVisitedTrackId();
  if (params.id) {
    if (params.id === "new") {
      clearLocalStorage();
      setLastVisitedTrackId(null);
      navigate("/track");
      setIsLoading(false);
    } else {
      setLastVisitedTrackId(params.id);
      loadStateFromServer(params.id);
    }
  } else {
    if (lastVisited) {
      navigate(`/track/${lastVisited}`, { replace: true, resolve: false });
      setLastVisitedTrackId(null);
      loadStateFromServer(lastVisited);
    } else {
      loadStateFromLocalStorage();
    }
  }

  return (
    <Show
      when={!isLoading()}
      fallback={
        <main class="workspace-loading">
          <div class="marble" />
          Loading workspace...
        </main>
      }
    >
      <DragDropProvider onDragMove={onDragMove} onDragEnd={onDragEnd}>
        <DragDropSensors />
        <Editor saveStateToLocalStorage={saveStateToLocalStorage} closeToolbar={closeToolbar} />
        <Toolbar
          ref={details!}
          saveStateToLocalStorage={saveStateToLocalStorage}
          toggleToolbarOpen={toggleToolbarOpen}
          handleSave={handleSave}
          handleDelete={handleDelete}
          userOwnsTrack={userOwnsTrack()}
          failureMessage={failureMessage()}
          isSaving={isSaving()}
          saveWasSuccessful={saveWasSuccessful()}
          trackName={trackName()}
        />
        <DragOverlay>
          {(draggable) => <div class={`${draggable ? draggable.id : ""}`} />}
        </DragOverlay>
      </DragDropProvider>
    </Show>
  );
};
