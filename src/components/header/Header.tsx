import { Component, createEffect, onMount } from "solid-js";
import { A, useLocation } from "@solidjs/router";
import { useUserContext } from "../user_context/UserContext";
import { Hamburger } from "../hamburger/Hamburger";
import "./Header.scss";

export const Header: Component = () => {
  const {
    unsavedChangesSignal: [unsavedChangesSignal, _setUnsavedChangesSignal],
  } = useUserContext();
  const location = useLocation();
  let normalTitle = "Marble Melodies";

  const handlePageTitle = (hasUnsavedChanges: boolean, inEditor: boolean) => {
    if (hasUnsavedChanges && !document.title.includes("*") && inEditor) {
      normalTitle = document.title;
      document.title = "* Marble Melodies";
    } else {
      document.title = normalTitle;
    }
  };

  createEffect(() => {
    handlePageTitle(unsavedChangesSignal(), location.pathname.includes("track"));
  });

  return (
    <header class="header">
      <A href="/">
        <h1 class="heading">
          {unsavedChangesSignal() && location.pathname.includes("track") && "* "}Marble Melodies
        </h1>
      </A>
      <Hamburger />
    </header>
  );
};
