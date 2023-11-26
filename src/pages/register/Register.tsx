import { type Component } from "solid-js";
import { A } from "@solidjs/router";
import { useUserContext } from "../../components/user_context/UserContext";
import "./Register.scss";

export const Register: Component = () => {
  const {
    userId: [userId, setUserId],
  } = useUserContext();

  return (
    <form class="registration">
      <div class="marble" />
      <div class="fields">
        <h2 class="heading">Create an Account</h2>
        <label class="label">
          Username
          <input class="input" type="text" name="username" />
        </label>
        <label class="label">
          Password
          <input class="input" type="password" name="password" />
        </label>
        <label class="label">
          Confirm Password
          <input class="input" type="password" name="confirm" />
        </label>
        <button class="button">Register</button>
        <A class="create-account" href="/login">
          I already have an account
        </A>
      </div>
    </form>
  );
};
