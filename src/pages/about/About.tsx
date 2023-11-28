import { Component } from "solid-js";
import { Shape } from "../../components/draggable/Shape";
import "./About.scss";

export const About: Component = () => (
  <main class="about-page">
    <Shape type="marble" />
    <h2 class="heading">About Me</h2>
    <p class="about">
      My name is <strong>Alex Howley</strong>. I'm a musician-turned-software-engineer who grew up
      on classic web games like Line Rider, and created this fun little tool after seeing animations
      of marbles rolling down tracks in sync with music.
    </p>
    <p class="about">I thought it'd be fun to be able to make them yourself - so here we are!</p>
    <h3 class="subheading">Where to find me:</h3>
    <ul class="links">
      <li>
        <strong>LinkedIn</strong>:{" "}
        <a class="link" href="https://www.linkedin.com/in/alex-howley/" target="_blank">
          linkedin.com/in/alex-howley
        </a>
      </li>
      <li>
        <strong>GitHub</strong>:{" "}
        <a class="link" href="https://github.com/ahowley" target="_blank">
          github.com/ahowley
        </a>
      </li>
    </ul>
  </main>
);
