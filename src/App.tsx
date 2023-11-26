import "./App.scss";
import type { Component } from "solid-js";
import { Router, Routes, Route } from "@solidjs/router";
import { UserProvider } from "./components/user_context/UserContext";
import { GameProvider } from "./components/game_context/GameContext";
import { Header } from "./components/header/Header";
import { Home } from "./pages/home/Home";
import { Login } from "./pages/login/Login";
import { Register } from "./pages/register/Register";
import { Account } from "./pages/account/Account";
import { Workspace } from "./pages/workspace/Workspace";
import { NotFound } from "./pages/not_found/NotFound";

const Game: Component = () => (
  <GameProvider>
    <Workspace />
  </GameProvider>
);

export const App: Component = () => {
  return (
    <Router>
      <UserProvider>
        <Header />
        <Routes>
          <Route path="/" component={Home} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/account" component={Account} />
          <Route path="/track/*" component={Game} />
          <Route path={["/404", "/*"]} component={NotFound} />
        </Routes>
      </UserProvider>
    </Router>
  );
};
