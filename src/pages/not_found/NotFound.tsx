import { type Component } from "solid-js";
import { A } from "@solidjs/router";
import "./NotFound.scss";

export const NotFound: Component = () => {
  return (
    <main class="not-found">
      <p class="status">404</p>
      <h2 class="subheading">Sorry, we couldn't find what you were looking for.</h2>
      <p class="description">
        Feel free to <A href="/">return home</A> and get back to creating!
      </p>
    </main>
  );
};
