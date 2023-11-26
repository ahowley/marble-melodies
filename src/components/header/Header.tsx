import { Component } from "solid-js";
import { A } from "@solidjs/router";
import "./Header.scss";

export const Header: Component = () => (
  <header class="header">
    <A href="/">
      <h1 class="heading">Home</h1>
    </A>
  </header>
);
