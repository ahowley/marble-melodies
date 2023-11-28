import { Component } from "solid-js";
import { useGameContext } from "../game_context/GameContext";
import play from "../../assets/site/play.svg";
import pause from "../../assets/site/pause.svg";
import stop from "../../assets/site/stop.svg";
import trash from "../../assets/site/trash.svg";
import "./Playback.scss";

type PlaybackProps = {
  playing: boolean;
  stopped: boolean;
  togglePlay: () => void;
  handleStop: () => void;
  handleDelete: () => void;
};
export const Playback: Component<PlaybackProps> = (props) => {
  const {
    singleBodySelected: [singleBodySelected, _setSingleBodySelected],
  } = useGameContext();

  return (
    <form class="playback">
      <button
        type="button"
        class={`button ${props.playing ? "hidden" : ""}`}
        onClick={props.togglePlay}
      >
        Play <img src={play} alt="A play icon - tap or click to play the current track." />
      </button>
      <button
        type="button"
        class={`button ${!props.playing ? "hidden" : ""}`}
        onClick={props.togglePlay}
      >
        Pause <img src={pause} alt="A pause icon - tap or click to pause the current track." />
      </button>
      <button
        type="button"
        class={`button ${props.stopped && !props.playing ? "hidden" : ""}`}
        onClick={props.handleStop}
      >
        Stop <img src={stop} alt="A stop icon - tap or click to stop the current track." />
      </button>
      <button
        class={`button trash ${!singleBodySelected() ? "hidden" : ""}`}
        type="button"
        onClick={props.handleDelete}
      >
        Delete
        <img
          class="delete-icon"
          src={trash}
          alt="A trash icon - tap or click to delete the selected block."
        />
      </button>
    </form>
  );
};
