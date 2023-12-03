import { type Component, onMount, onCleanup } from "solid-js";
import { createDroppable } from "@thisbeyond/solid-dnd";
import { GameState, useGameContext } from "../game_context/GameContext";
import { Playback } from "../playback/Playback";
import { WorkspaceEditor, Body } from "../../game/canvas";
import { SerializedBody } from "../../game/physics";
import { UNDO_CACHE_SIZE } from "../../game/config";
import "./Editor.scss";

type EditorProps = {
  saveStateToLocalStorage: () => void;
  handleSave: () => void;
  triggerUnsavedChanges: () => void;
  closeToolbar: () => void;
  editHistory: GameState[];
  editFuture: GameState[];
};
export const Editor: Component<EditorProps> = (props) => {
  const {
    initialState: [initialState, _setInitialState],
    settings: [settings, _setSettings],
    playing: [playing, setPlaying],
    stopped: [stopped, setStopped],
    singleBodySelected: [_singleBodySelected, setSingleBodySelected],
    openState: [openState, _setOpenState],
    selectedTab: [selectedTab, _setSelectedTab],
    editor: [editor, setEditor],
  } = useGameContext();
  const droppable = createDroppable(0);
  let container: HTMLDivElement;
  let interactableElements: Element[] = [];
  let help: HTMLDetailsElement;
  let copiedBodies: SerializedBody[] = [];

  const triggerUnsavedChanges = () => {
    props.editFuture = [];
    props.editHistory.push([...initialState]);
    if (props.editHistory.length > UNDO_CACHE_SIZE) {
      props.editHistory.shift();
    }
    props.triggerUnsavedChanges();
  };

  const togglePlay = () => {
    if (playing()) {
      editor()?.pause(editor() as WorkspaceEditor);
    } else {
      if (!editor()?.music) {
        return setTimeout(togglePlay, 200);
      }
      editor()?.play(editor() as WorkspaceEditor);
      setStopped(false);
      props.saveStateToLocalStorage();
      editor()?.transformer.nodes([]);
      setTimeout(() => setSingleBodySelected(null));
    }
    setPlaying(!playing());
  };

  const handleStop = () => {
    editor()?.stop(editor() as WorkspaceEditor);
    setStopped(true);
  };

  const editorStopCallback = () => {
    setPlaying(false);
  };

  const handleDelete = () => {
    const bodiesToDelete = editor()
      ?.transformer.nodes()
      .map((node) => node.id());
    if (bodiesToDelete?.length) {
      editor()?.transformer.nodes([]);
      setSingleBodySelected(null);
      const newState = (editor()?.initialState as SerializedBody[])?.filter(
        (body) => !bodiesToDelete.includes(body.canvasId),
      );
      if (newState) {
        editor()?.initialize(newState);
        triggerUnsavedChanges();
        props.saveStateToLocalStorage();
      }
    }
  };

  const resizeListener = () => {
    editor()?.sizeToContainer();
  };

  const pointerDownListener = (event: PointerEvent) => {
    const element = event.target as Element;

    const toolbar = document.querySelector(".toolbar");
    toolbar && interactableElements.push(...(toolbar.querySelectorAll("*") || []));

    if (
      !(element instanceof HTMLCanvasElement) &&
      !(element instanceof HTMLButtonElement) &&
      !(element instanceof HTMLImageElement) &&
      !interactableElements.includes(element)
    ) {
      editor()?.transformer.nodes([]);
    }

    if (
      help.open &&
      !element.classList.contains("question-mark") &&
      !element.classList.contains("help")
    ) {
      const helpChildren = [...(help?.querySelectorAll("*") || [])];

      if (!helpChildren.includes(element)) help.open = false;
    }
  };

  const pointerMoveListener = (event: PointerEvent) => {
    const draggingBodies = editor()?.draggingBodies;
    if (event.target instanceof HTMLCanvasElement && draggingBodies?.length) {
      draggingBodies.map((draggingBody) => (draggingBody.initialState = draggingBody.serialize()));
      editor()?.initialize();
    }
  };

  const pointerUpListener = (event: PointerEvent) => {
    setTimeout(() => {
      const bodiesSelected = editor()?.transformer.nodes();
      if (bodiesSelected?.length === 1) {
        setSingleBodySelected(bodiesSelected[0] as Body);
      } else {
        setSingleBodySelected(null);
      }
      if (openState() === "open" && selectedTab() === 1 && !editor()?.transformer.nodes().length) {
        props.closeToolbar();
      }
    });

    if (event.target instanceof HTMLCanvasElement) {
      const draggingBodies = editor()?.draggingBodies;
      if (draggingBodies?.length) {
        draggingBodies.forEach(
          (draggingBody) => (draggingBody.initialState = draggingBody.serialize()),
        );
        editor()?.initialize();
        triggerUnsavedChanges();
        props.saveStateToLocalStorage();
      }

      if (editor()?.transformer.nodes().length) {
        triggerUnsavedChanges();
        props.saveStateToLocalStorage();
      }
    }
  };

  const keyDownListener = (event: KeyboardEvent) => {
    if (event.ctrlKey) {
      if (event.key === "s") {
        event.preventDefault();
      }
    }
  };

  const keyUpListener = (event: KeyboardEvent) => {
    if (event.key === "Backspace" || event.key === "Delete") {
      handleDelete();
    }
    if ((event.key === " " || event.key === "Enter") && openState() !== "open") {
      togglePlay();
    }
    if (event.key === "Escape") {
      handleStop();
    }
    if (event.ctrlKey) {
      if (event.key === "s") {
        props.handleSave();
      }
      if (event.key === "c") {
        const selectedBodies = editor()?.transformer.nodes() as Body[] | undefined;
        if (selectedBodies?.length) {
          copiedBodies = selectedBodies.map((body) => {
            const serialized = body.serialize();
            serialized.x = serialized.x + 50;
            serialized.y = serialized.y + 50;
            if (serialized.cameraTracking) {
              serialized.cameraTracking = false;
            }
            return serialized;
          });
        }
      }
      if (event.key === "v") {
        const workspace = editor();
        if (!workspace) return;

        const newState = workspace.initialState as SerializedBody[];
        if (newState?.length) {
          newState.push(...copiedBodies);

          workspace.initialize(newState);
          const newBodies = workspace.bodies.slice(-copiedBodies.length);
          workspace.transformer.nodes(newBodies);
          copiedBodies = [];
          triggerUnsavedChanges();
          props.saveStateToLocalStorage();
        }
      }
      if (event.key === "z") {
        const workspace = editor();
        if (!workspace) return;
        if (!props.editHistory.length) return;

        const currentState = props.editHistory.pop() as GameState;
        props.editFuture.push([...initialState]);

        workspace.transformer.nodes([]);
        workspace.initialize(currentState);
        props.triggerUnsavedChanges();
        props.saveStateToLocalStorage();
      }
      if (event.key === "y") {
        const workspace = editor();
        if (!workspace) return;
        if (!props.editFuture.length) return;

        const currentState = props.editFuture.pop() as GameState;
        props.editHistory.push([...initialState]);

        workspace.transformer.nodes([]);
        workspace.initialize(currentState);
        props.triggerUnsavedChanges();
        props.saveStateToLocalStorage();
      }
    }
  };

  onMount(() => {
    setEditor(new WorkspaceEditor(container, settings, editorStopCallback, initialState));
    addEventListener("resize", resizeListener);
    addEventListener("pointerdown", pointerDownListener);
    addEventListener("pointermove", pointerMoveListener);
    addEventListener("pointerup", pointerUpListener);
    document.addEventListener("keydown", keyDownListener);
    document.addEventListener("keyup", keyUpListener);

    onCleanup(() => {
      removeEventListener("resize", resizeListener);
      removeEventListener("pointerdown", pointerDownListener);
      removeEventListener("pointermove", pointerMoveListener);
      removeEventListener("pointerup", pointerUpListener);
      document.removeEventListener("keydown", keyDownListener);
      document.removeEventListener("keyup", keyUpListener);
      editor()?.destroy();
      setEditor(null);
    });
  });

  return (
    <main
      id="workspace"
      ref={droppable.ref}
      class="droppable"
      classList={{ "!droppable-accept": droppable.isActiveDroppable }}
    >
      <Playback
        playing={playing()}
        stopped={stopped()}
        togglePlay={togglePlay}
        handleStop={handleStop}
        handleDelete={handleDelete}
      />
      <div
        class="konva-container"
        ref={container!}
        onContextMenu={(event) => event.preventDefault()}
      />
      <details ref={help!} class="help">
        <summary class="question-mark">?</summary>
        <h2 class="heading">Editor How-To</h2>
        <ul class="instructions">
          <li class="list-item">
            Drag + drop <strong>marbles</strong>, <strong>track blocks</strong>, and{" "}
            <strong>note blocks</strong> into the workspace to add them to your track.
          </li>
          <li class="list-item">
            Click or tap blocks to <strong>resize and rotate</strong> them.
          </li>
          <li class="list-item">
            Click or tap and drag to <strong>move blocks</strong> around, or to{" "}
            <strong>pan the entire editor</strong>.
          </li>
          <li class="list-item">
            Right click and drag to <strong>box-select</strong>, or shift+click to{" "}
            <strong>multi-select blocks</strong> (desktop only).
          </li>
          <li class="list-item">
            Press delete or backspace, or the delete button if you're on your phone, to{" "}
            <strong>delete a block</strong>.
          </li>
          <li class="list-item">
            Double-click to <strong>return to the starting position of the stage</strong>.
          </li>
          <li class="list-item">
            Select a single marble and check the "Edit Marble" tab for additional playback options.
          </li>
          <li class="list-item">
            Select a single note block and check the "Synth" tab for additional note options, like
            pitch and volume per-note.
          </li>
          <li class="list-item keyboard-shortcuts">
            <strong>Keyboard Shortcuts:</strong>
            <ul class="instructions">
              <li class="list-item">
                <strong>ctrl + s</strong> - Save track
              </li>
              <li class="list-item">
                <strong>ctrl + c</strong> - Copy selection
              </li>
              <li class="list-item">
                <strong>ctrl + v</strong> - Paste
              </li>
              <li class="list-item">
                <strong>ctrl + z</strong> - Undo
              </li>
              <li class="list-item">
                <strong>ctrl + y</strong> - Redo
              </li>
              <li class="list-item">
                <strong>Space/Enter</strong> - Play/Pause
              </li>
              <li class="list-item">
                <strong>Esc</strong> - Stop
              </li>
            </ul>
          </li>
        </ul>
      </details>
    </main>
  );
};
