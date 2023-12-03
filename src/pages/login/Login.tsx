import { createSignal, type Component } from "solid-js";
import { A, useNavigate } from "@solidjs/router";
import { useUserContext } from "../../components/user_context/UserContext";
import { Shape } from "../../components/draggable/Shape";
import "./Login.scss";

export const Login: Component = () => {
  const [submitting, setSubmitting] = createSignal(false);
  const [invalidMessage, setInvalidMessage] = createSignal("");
  const [invalid, setInvalid] = createSignal("");
  const {
    userId: [userId, setUserId],
    jwt: [jwt, setJwt],
    server: { login },
    logout,
  } = useUserContext();
  const navigate = useNavigate();

  if (jwt() || userId()) {
    logout();
  }

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault();

    const formData = new FormData(event.target as HTMLFormElement);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    if (!username) return setInvalid("username");
    if (!password) return setInvalid("password");

    setSubmitting(true);
    const { status, data } = await login({ username, password });

    if (status === 400 || status === 401) {
      setInvalidMessage(
        "It looks like the username or password is incorrect - double-check and give it another try.",
      );
      setSubmitting(false);
      return setInvalid("password");
    }

    const { id, token } = data;

    if (!id || !token) {
      setInvalidMessage("Sorry, something went wrong - wait a few seconds and try again.");
      setSubmitting(false);
      return setInvalid("");
    }

    setUserId(id);
    setJwt(`Bearer ${token}`);
    navigate("/track");
  };

  return (
    <form class={`login ${submitting() ? "submitting" : ""}`} onSubmit={handleSubmit}>
      <Shape type="marble" />
      <div class="fields">
        <h2 class="heading">Log In</h2>
        <p class="description">
          {invalidMessage() ||
            "Sign into your account to see and edit the tracks you've saved - or save new ones!"}
        </p>
        <label class="label">
          Username
          <input
            class={`input ${invalid() === "username" ? "invalid" : ""}`}
            type="text"
            name="username"
          />
        </label>
        <label class="label">
          Password
          <input
            class={`input ${invalid() === "password" ? "invalid" : ""}`}
            type="password"
            name="password"
          />
        </label>
        <button class="button">Let's bounce</button>
        <A class="create-account" href="/register">
          Create an account
        </A>
      </div>
    </form>
  );
};
