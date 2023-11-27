import { createResource, type Component, Suspense, For } from "solid-js";
import { A } from "@solidjs/router";
import { useUserContext } from "../user_context/UserContext";
import "./TrackGrid.scss";

export type Track = {
  id: number;
  name: string;
  username: string;
};

type TrackGridProps = {
  userOnly: boolean;
};
export const TrackGrid: Component<TrackGridProps> = (props) => {
  const {
    server: { getHomeTracks, getUserTracks },
  } = useUserContext();
  const [tracks] = createResource(async () => {
    let trackArray: Track[];
    if (props.userOnly) {
      const { status, tracks } = await getUserTracks();
      if (!status || !tracks || status === 401) {
        return [];
      }

      trackArray = tracks;
    } else {
      const { status, tracks } = await getHomeTracks();
      if (!status || !tracks || status === 401) {
        return [];
      }

      trackArray = tracks;
    }

    return trackArray;
  });

  return (
    <ul class="track-grid">
      <For each={tracks()}>
        {(track) => (
          <li>
            <A inactiveClass="grid-item" href={`/track/{track.id}`}>
              <p class="subheading">
                {track.id}. {track.name}
              </p>
              <p class="byline">by {track.username}</p>
            </A>
          </li>
        )}
      </For>
    </ul>
  );
};

export const TrackGridLoading: Component = () => (
  <main class="track-grid-loading">
    <div class="marble" />
    Loading tracks...
  </main>
);
