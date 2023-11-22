import "./App.scss";
import { GameProvider } from "./components/game_context/GameContext";
import { Header } from "./components/header/Header";
import { Workspace } from "./pages/workspace/Workspace";

import type { Component } from "solid-js";

export const App: Component = () => {
  return (
    <>
      <Header />
      <GameProvider>
        <Workspace />
      </GameProvider>
    </>
  );
};
