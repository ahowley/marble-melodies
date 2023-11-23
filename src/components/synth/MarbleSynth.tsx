import { Component, createEffect, onCleanup, onMount } from "solid-js";
import * as Tone from "tone";
import { useGameContext } from "../game_context/GameContext";
import "./MarbleSynth.scss";
import { Music } from "../../game/music";

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
      currentEditor.music = new Music(synth);
    }
  });

  return (
    <section class={`synth ${!props.showing ? "hidden" : ""}`}>
      {singleBodySelected()?.name() === "note-block" ? (
        <>
          <form class="controls"></form>
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
        </>
      ) : (
        <p class="no-selection">Select a note block to get started!</p>
      )}
    </section>
  );
};
