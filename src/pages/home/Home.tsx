import { Suspense, type Component, createSignal, createEffect, onMount, onCleanup } from "solid-js";
import { A, useLocation } from "@solidjs/router";
import { useUserContext } from "../../components/user_context/UserContext";
import { TrackGrid, TrackGridLoading } from "../../components/track_grid/TrackGrid";
import { Shape } from "../../components/draggable/Shape";
import "./Home.scss";

export const Home: Component = () => {
  const location = useLocation();
  const { logout } = useUserContext();
  const [hasTrackInLocalStorage, setHasTrackInLocalStorage] = createSignal(false);

  createEffect(() => {
    if (location.pathname.includes("logout")) {
      logout();
      window.location.replace("/");
    }
  });

  onMount(() => {
    if (localStorage.getItem("lastTrackState")) {
      setHasTrackInLocalStorage(true);
    }

    onCleanup(() => {
      setHasTrackInLocalStorage(false);
    });
  });

  return (
    <Suspense fallback={<TrackGridLoading />}>
      <main class="home">
        <Shape type="marble" />
        <h2 class="heading">Marble Melodies</h2>
        <p class="description">A tool for making music with nothing but gravity and marbles.</p>

        <nav class="track-buttons">
          <A href="/track/new">
            <button type="button" class="button">
              Create new track
            </button>
          </A>
          {hasTrackInLocalStorage() && (
            <A href="/track">
              <button type="button" class="button">
                Dive back in
              </button>
            </A>
          )}
        </nav>
        <h3 class="subheading">Get Rolling</h3>
        <TrackGrid userOnly={false} />
        <A inactiveClass="about-link" href="/about">
          About me
        </A>
      </main>
    </Suspense>
  );
};
