import { Component, Accessor } from "solid-js";
import "./Playback.scss";
import play from "../../assets/site/play.svg";
import pause from "../../assets/site/pause.svg";
import stop from "../../assets/site/stop.svg";

type PlaybackProps = {
  playing: Accessor<boolean>;
  togglePlay: () => void;
  handleStop: () => void;
};

export const Playback: Component<PlaybackProps> = (props) => {
  return (
    <form class="playback">
      {props.playing() ? (
        <button type="button" class="button" onClick={props.togglePlay}>
          Play <img src={play} alt="A play icon - tap or click to play the current track." />
        </button>
      ) : (
        <>
          <button type="button" class="button" onClick={props.togglePlay}>
            Pause <img src={pause} alt="A pause icon - tap or click to pause the current track." />
          </button>
          <button type="button" class="button" onClick={props.handleStop}>
            Stop <img src={stop} alt="A stop icon - tap or click to stop the current track." />
          </button>
        </>
      )}
    </form>
  );
};
