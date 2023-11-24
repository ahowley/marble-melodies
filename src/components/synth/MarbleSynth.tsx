import { Component, createEffect, onCleanup, onMount } from "solid-js";
import * as Tone from "tone";
import { useGameContext } from "../game_context/GameContext";
import { NoteBlock } from "../../game/canvas";
import { Music, Notes, Octaves } from "../../game/music";
import "./MarbleSynth.scss";

type MarbleSynthProps = {
  showing: boolean;
  saveStateToLocalStorage: () => void;
};
export const MarbleSynth: Component<MarbleSynthProps> = (props) => {
  const {
    editor: [editor, _setEditor],
    singleBodySelected: [singleBodySelected, _setSingleBodySelected],
    marbleSynth: [marbleSynth, setMarbleSynth],
  } = useGameContext();
  let userInteracted = false;

  onMount(() => {
    const interactListener = async () => {
      if (userInteracted) return;
      userInteracted = true;

      await Tone.start();
      const synth = new Tone.PolySynth().toDestination();
      setMarbleSynth(new Music(synth, 0.5));
    };

    document.addEventListener("pointerup", interactListener);
    onCleanup(() => {
      document.removeEventListener("pointerup", interactListener);
    });
  });

  const previewNote = () => {
    const noteBlock = singleBodySelected();
    if (!noteBlock || !(noteBlock instanceof NoteBlock)) {
      marbleSynth()?.playPreviewNote();
    } else {
      marbleSynth()?.playNote(noteBlock.serialize());
    }
  };

  const handleChangeNote = (event: Event) => {
    const select = event.currentTarget as HTMLSelectElement;
    const noteBlock = singleBodySelected();
    if (!noteBlock || !(noteBlock instanceof NoteBlock) || !select) return;

    noteBlock.changeNote(select.value as Notes);
    props.saveStateToLocalStorage();
  };

  const handleChangeOctave = (event: Event) => {
    const select = event.currentTarget as HTMLSelectElement;
    const noteBlock = singleBodySelected();
    if (!noteBlock || !(noteBlock instanceof NoteBlock) || !select) return;

    noteBlock.changeOctave(select.value as Octaves);
    props.saveStateToLocalStorage();
  };

  const handleChangeVolume = (event: Event) => {
    const range = event.currentTarget as HTMLInputElement;
    const noteBlock = singleBodySelected();
    if (!noteBlock || !(noteBlock instanceof NoteBlock) || !range) return;

    noteBlock.changeVolume(parseFloat(range.value));
    props.saveStateToLocalStorage();
  };

  createEffect(() => {
    const currentEditor = editor();
    const synth = marbleSynth();
    if (currentEditor && synth) {
      currentEditor.music = synth;
    }
  });

  return (
    <section class={`marble-synth ${!props.showing ? "hidden" : ""}`}>
      <form class="controls">
        <fieldset class="synth settings">
          <legend class="legend">Global</legend>
          <label class="label">
            Volume
            <input
              class="slider"
              type="range"
              min="0"
              max="1"
              step="0.01"
              name="volume"
              value="0.5"
            />
          </label>
        </fieldset>

        {singleBodySelected()?.name() === "note-block" && (
          <fieldset class="note settings">
            <legend class="legend">Block</legend>
            <label class="label">
              Volume
              <input
                class="slider"
                type="range"
                min="0"
                max="1"
                step="0.01"
                name="volume"
                value={(singleBodySelected() as NoteBlock)?.volume ?? "0.5"}
                onChange={handleChangeVolume}
              />
            </label>
            <div class="note-selection">
              <label class="label">
                Note
                <select
                  name="note"
                  class="dropdown"
                  value={(singleBodySelected() as NoteBlock)?.note ?? "auto"}
                  onChange={handleChangeNote}
                >
                  <option value="auto">Auto</option>
                  <option value="A">A</option>
                  <option value="A#">A#</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="C#">C#</option>
                  <option value="D">D</option>
                  <option value="D#">D#</option>
                  <option value="E">E</option>
                  <option value="F">F</option>
                  <option value="F#">F#</option>
                  <option value="G">G</option>
                  <option value="G#">G#</option>
                </select>
              </label>
              <label class="label">
                Octave
                <select
                  name="note"
                  class="dropdown"
                  value={(singleBodySelected() as NoteBlock)?.octave ?? "auto"}
                  onChange={handleChangeOctave}
                >
                  <option value="auto">Auto</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                  <option value="8">8</option>
                </select>
              </label>
            </div>
          </fieldset>
        )}
        <button type="button" class="preview" onClick={previewNote}>
          Preview
        </button>
      </form>
    </section>
  );
};
