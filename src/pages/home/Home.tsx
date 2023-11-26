import { type Component } from "solid-js";
import { useLocation, useNavigate } from "@solidjs/router";
import { useUserContext } from "../../components/user_context/UserContext";
import "./Home.scss";

export const Home: Component = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logout } = useUserContext();

  if (pathname.includes("logout")) {
    logout();
    navigate("/");
  }

  return (
    <main class="home">
      <div class="marble" />
      <h2 class="heading">Marble Melodies</h2>
      <p class="description">A tool for making music with nothing but gravity and marbles.</p>
      <button class="button">Get started</button>
    </main>
  );
};
