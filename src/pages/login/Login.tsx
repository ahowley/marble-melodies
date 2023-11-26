import "./Login.scss";
import { type Component } from "solid-js";
import { A } from "@solidjs/router";

export const Login: Component = () => {
  return (
    <form class="login">
      <div class="marble" />
      <div class="fields">
        <h2 class="heading">Log In</h2>
        <label class="label">
          Username
          <input class="input" type="text" name="username" />
        </label>
        <label class="label">
          Password
          <input class="input" type="password" name="password" />
        </label>
        <button class="button">Let's bounce</button>
        <A class="create-account" href="/register">
          Create an account
        </A>
      </div>
    </form>
  );
};
