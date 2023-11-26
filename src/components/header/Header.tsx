import { Component } from "solid-js";
import { A } from "@solidjs/router";
import { Hamburger } from "../hamburger/Hamburger";
import "./Header.scss";

export const Header: Component = () => (
  <header class="header">
    <A href="/">
      <h1 class="heading">Marble Melodies</h1>
    </A>
    <Hamburger />
  </header>
);
