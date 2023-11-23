import { Component } from "solid-js";
import "./Synth.scss";
import { useGameContext } from "../game_context/GameContext";

export const Synth: Component = (props) => {
  const {
    singleBodySelected: [singleBodySelected, setSingleBodySelected],
  } = useGameContext();

  return (
    <section class="synth">
      {singleBodySelected()?.name() === "note-block" ? (
        <></>
      ) : (
        <p class="no-selection">Select a note block to get started!</p>
      )}
    </section>
  );
};
