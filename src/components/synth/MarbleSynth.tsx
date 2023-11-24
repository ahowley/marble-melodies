import { Component, createEffect, onCleanup, onMount } from "solid-js";
import * as Tone from "tone";
import { useGameContext } from "../game_context/GameContext";
import "./MarbleSynth.scss";
import { Music } from "../../game/music";
import { NoteBlock } from "../../game/canvas";

type MarbleSynthProps = {
  showing: boolean;
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
      setMarbleSynth(new Tone.PolySynth().toDestination());
    };

    document.addEventListener("pointerup", interactListener);
    onCleanup(() => {
      document.removeEventListener("pointerup", interactListener);
    });
  });

  createEffect(() => {
    const currentEditor = editor();
    const synth = marbleSynth();
    if (currentEditor && synth) {
      currentEditor.music = new Music(synth, 0.5);
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
              />
            </label>
            <div class="note-selection">
              <label class="label">
                Note
                <select
                  name="note"
                  class="dropdown"
                  value={(singleBodySelected() as NoteBlock)?.note ?? "auto"}
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
        <button
          type="button"
          class="preview"
          onClick={() => {
            marbleSynth()?.triggerAttack("C4", Tone.now(), 0.5);
            marbleSynth()?.triggerRelease("C4", Tone.now() + 0.1);
          }}
        >
          Preview
        </button>
      </form>
    </section>
  );
};
