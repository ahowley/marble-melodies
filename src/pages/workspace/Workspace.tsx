import { createSignal, type Component } from "solid-js";
import { Editor } from "../../components/editor/Editor";
import { Playback } from "../../components/playback/Playback";
import "./Workspace.scss";

export const Workspace: Component = () => {
  const [playing, setPlaying] = createSignal(false);

  const togglePlay = () => setPlaying(!playing());

  return (
    <main id="workspace">
      <Playback playing={playing} togglePlay={togglePlay} handleStop={() => {}} />
      <Editor
        initialState={[
          {
            type: "marble",
            x: 400,
            y: 400,
            rotation: 0,
            radius: 20,
            gradientStart: "white",
            gradientEnd: "blue",
          },
          {
            type: "track-block",
            x: 100,
            y: 200,
            rotation: 1,
            width: 200,
            height: 10,
            frontColor: "lightgray",
            backColor: "gray",
          },
          {
            type: "note-block",
            x: 100,
            y: 400,
            rotation: -0.5,
            width: 100,
            height: 50,
            gradientStart: "blue",
            gradientEnd: "darkblue",
          },
        ]}
        playing={playing}
      />
    </main>
  );
};
