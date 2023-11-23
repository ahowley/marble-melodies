import { Component, onCleanup, onMount } from "solid-js";
import * as Tone from "tone";
import { useGameContext } from "../game_context/GameContext";
import "./MarbleSynth.scss";

export const MarbleSynth: Component = (props) => {
  const {
    singleBodySelected: [singleBodySelected, setSingleBodySelected],
  } = useGameContext();
  let userInteracted = false;
  let synth: Tone.PolySynth;

  onMount(() => {
    const interactListener = async () => {
      if (userInteracted) return;
      userInteracted = true;

      await Tone.start();
      synth = new Tone.PolySynth().toDestination();
    };

    addEventListener("pointerup", interactListener);
    onCleanup(() => {
      removeEventListener("pointerup", interactListener);
    });
  });

  return (
    <section class="synth">
      {singleBodySelected()?.name() === "note-block" ? (
        <>
          <form class="controls"></form>
          <button
            type="button"
            class="preview"
            onClick={() => {
              synth.triggerAttack("C4", Tone.now(), 0.5);
              synth.triggerRelease("C4", Tone.now() + 0.1);
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
