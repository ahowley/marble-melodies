import { createSignal, type Component, createEffect } from "solid-js";
import { A } from "@solidjs/router";
import { useUserContext } from "../user_context/UserContext";
import { useGameContext } from "../game_context/GameContext";
import "./Hamburger.scss";

export const Hamburger: Component = () => {
  const {
    jwt: [jwt, _setJwt],
  } = useUserContext();
  const {
    playing: [playing, _setPlaying],
  } = useGameContext();
  const [isOpen, setIsOpen] = createSignal(false);
  const [isLoggedIn, setIsLoggedIn] = createSignal(false);

  const toggleOpen = () => {
    setIsLoggedIn(!!jwt());
    setIsOpen(!isOpen());
  };

  createEffect(() => {
    if (playing() && isOpen()) {
      setIsOpen(false);
    }
  });

  return (
    <nav class={`hamburger ${!isOpen() ? "hidden" : ""}`}>
      <button class="button" onClick={toggleOpen}>
        <span class="bun" />
        <span class="bun" />
        <span class="bun" />
        <span class="hidden-label">Menu</span>
      </button>
      <ul class="nav-items">
        {isLoggedIn() ? (
          <>
            <li class="nav-item" onClick={toggleOpen}>
              <A class="link" href="/account">
                Your Account
              </A>
            </li>
            <li class="nav-item" onClick={toggleOpen}>
              <A class="link" href="/logout">
                Log Out
              </A>
            </li>
          </>
        ) : (
          <>
            <li class="nav-item" onClick={toggleOpen}>
              <A class="link" href="/login">
                Log In
              </A>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};
