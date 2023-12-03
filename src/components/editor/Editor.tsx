import { type Component, onMount, onCleanup } from "solid-js";
import { createDroppable } from "@thisbeyond/solid-dnd";
import { useGameContext } from "../game_context/GameContext";
import { Playback } from "../playback/Playback";
import { WorkspaceEditor, Body } from "../../game/canvas";
import { SerializedBody } from "../../game/physics";
import "./Editor.scss";

type EditorProps = {
  saveStateToLocalStorage: () => void;
  handleSave: () => void;
  triggerUnsavedChanges: () => void;
  closeToolbar: () => void;
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
        props.saveStateToLocalStorage();
        props.triggerUnsavedChanges();
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
        props.saveStateToLocalStorage();
        props.triggerUnsavedChanges();
      }

      if (editor()?.transformer.nodes().length) {
        props.saveStateToLocalStorage();
        props.triggerUnsavedChanges();
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
        console.log("copying");
      }
      if (event.key === "v") {
        console.log("pasting");
      }
      if (event.key === "z") {
        console.log("undoing");
      }
      if (event.key === "y") {
        console.log("redoing");
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
        </ul>
      </details>
    </main>
  );
};
