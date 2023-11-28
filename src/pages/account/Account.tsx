import { Suspense, type Component } from "solid-js";
import { TrackGrid, TrackGridLoading } from "../../components/track_grid/TrackGrid";
import { A } from "@solidjs/router";
import "./Account.scss";

export const Account: Component = () => {
  return (
    <Suspense fallback={<TrackGridLoading />}>
      <main class="account">
        <h2 class="heading">Your Tracks</h2>
        <TrackGrid userOnly={true} />
        <A inactiveClass="link" href="/logout">
          <button type="button" class="button">
            Log out
          </button>
        </A>
      </main>
    </Suspense>
  );
};
