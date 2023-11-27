import { createResource, type Component, Suspense, For, Show } from "solid-js";
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
    <Show
      when={tracks()?.length}
      fallback={
        <div class="track-grid-fallback">
          You haven't made any tracks yet!
          <button type="button" class="fallback-button">
            <A href="/track/new">Get started</A>
          </button>
        </div>
      }
    >
      <ul class="track-grid">
        <For each={tracks()}>
          {(track) => (
            <li>
              <A inactiveClass="grid-item" href={`/track/${track.id}`}>
                <p class="subheading">
                  {track.id}. {track.name}
                </p>
                <p class="byline">by {track.username}</p>
              </A>
            </li>
          )}
        </For>
      </ul>
    </Show>
  );
};

export const TrackGridLoading: Component = () => (
  <div class="track-grid-loading">
    <div class="marble" />
    Loading tracks...
  </div>
);
