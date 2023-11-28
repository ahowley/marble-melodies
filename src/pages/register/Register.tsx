import { createSignal, type Component } from "solid-js";
import { A, useNavigate } from "@solidjs/router";
import { useUserContext } from "../../components/user_context/UserContext";
import "./Register.scss";

export const Register: Component = () => {
  const [submitting, setSubmitting] = createSignal(false);
  const [invalidMessage, setInvalidMessage] = createSignal("");
  const [invalid, setInvalid] = createSignal("");
  const {
    server: { register },
  } = useUserContext();
  const navigate = useNavigate();

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault();

    const formData = new FormData(event.target as HTMLFormElement);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const confirm = formData.get("confirm") as string;

    if (!username) return setInvalid("username");
    if (!password) return setInvalid("password");
    if (!confirm) return setInvalid("confirm");
    if (password !== confirm) {
      setInvalidMessage("Your password and confirmation don't match!");
      return setInvalid("confirm");
    }

    setSubmitting(true);
    const { status, data } = await register({ username, password });
    if (status === 400 || status === 500) {
      const firstError = data.errors?.length && data.errors[0];
      if (!firstError || status === 500) {
        setSubmitting(false);
        return setInvalidMessage("Something went wrong - sorry! Wait a few seconds and try again.");
      }

      setInvalidMessage(firstError.msg);
      setSubmitting(false);
      return setInvalid(firstError.path);
    }

    setSubmitting(false);
    setInvalid("");
    setInvalidMessage("");
    navigate("/login");
  };

  return (
    <form class={`registration ${submitting() ? "submitting" : ""}`} onSubmit={handleSubmit}>
      <div class="fields">
        <h2 class="heading">Create an Account</h2>
        <p class="description">
          {invalidMessage() ||
            "Creating an account lets you save your tracks and share them with others!"}
        </p>
        <label class="label">
          Username
          <input
            class={`input ${invalid() === "username" ? "invalid" : ""}`}
            type="text"
            name="username"
          />
        </label>
        <p class="password-byline">
          Your password should be 10+ characters and contain at least 1 of each of the following:
        </p>
        <ul class="list">
          <li class="password-rule">lowercase and uppercase letter</li>
          <li class="password-rule">number</li>
          <li class="password-rule">special character</li>
        </ul>
        <label class="label">
          Password
          <input
            class={`input ${invalid() === "password" ? "invalid" : ""}`}
            type="password"
            name="password"
          />
        </label>
        <label class="label">
          Confirm Password
          <input
            class={`input ${invalid() === "confirm" ? "invalid" : ""}`}
            type="password"
            name="confirm"
          />
        </label>
        <button class="button">Register</button>
        <A class="create-account" href="/login">
          I already have an account
        </A>
      </div>
    </form>
  );
};
