# Marble Melodies

A capstone project from the September 2023 cohort of [BrainStation's](https://brainstation.io/) Software Engineering
bootcamp. This is the frontend repo - you can find the server [here](https://github.com/ahowley/marble-melodies-server).

## Installation

For information on how to install the backend, see the server's
[README](https://github.com/ahowley/marble-melodies-server). It's probably easiest to get that one up and running first.

- Install dependencies:

```bash
npm i
```

- Create and configure .env file based on .env.example
- Run development server

```bash
npm run dev
```

## Tech Stack

- TypeScript
- Sass
- [Solid.js](https://www.solidjs.com/) + JSX + Vite
- [Konva](https://konvajs.org/)
- [matter.js](https://brm.io/matter-js/)
- [Tone.js](https://tonejs.github.io/)

## Features to Try

I haven't had time to implement a tutorial yet, so here's some notes worth mentioning:

- The Drag + Drop toolbar has 3 blocks: in order, they're marbles, tracks, and note blocks
- Marbles roll and fall, note blocks are bouncy and play notes on collision, and tracks are heavier and slow things down
- You can select, resize, rotate, and drag any block in the track
- Right click and drag to box select multiple blocks
- If you click and select a single marble, you'll get an extra toolbar menu where you can choose whether to have the
  camera follow one marble
- If you click and select a single note block, you'll get extra options in the synth tab for note selection and volume
  - "auto" is misleading for the time being - I haven't finished the auto-note-picking feature yet, so it's manual only,
    unless you really like middle C
- If you haven't saved, you won't lose progress if you navigate away (for example, to log in or out) - all your edits
  are autosaved in localStorage and will persist until you open or create a new track
- Double-click to return to the origin of the stage
- Mousewheel or trackpad pinch to zoom in/out
- Spacebar and Enter to play/pause, esc to stop
- ctrl+c to copy current selection, ctrl+v to paste
- Delete or backspace (or the delete button on mobile) to delete your currently selected blocks
- All tracks are public, but if you're logged in and viewing your own track, you'll have the option to save over it or
  delete it. If you're viewing someone elses, you can "save as" to make your own copy

## Original Proposal

This website was created in a couple of weeks as my capstone project. I'm including my original proposal below for
posterity.

# Marble Melodies

## Overview

Marble Melodies is a creative tool that lets users generate music in a playful way by dropping marbles in physics-based
tracks they create.

### Problem

Making shareable musical creations and visuals with technology is fun, but hard, and expensive. This is meant to be a
simple and fun tool that lets anyone make something creative and fun, whether they have a few seconds or a few hours to
tinker.

### User Profile

Non-musicians can use Marble Melodies to create something musical they can show others, with no music theory knowledge
or musical skills required.

### Features

- An interactive editor for creating, editing, and saving playable tracks with a drag-and-drop focus
- A player that can play back created tracks in a reproducible way
- Automatically generated notes based on a small set of randomizable criteria
- A lightweight UI for users to login, save and load tracks, and view tracks others have created

### Tech Stack

- Vite
- Sass
- Solid.js
  - Solid Drag & Drop
- TypeScript
- Konva for graphics & canvas-based interactions
- Tone.js for sound
- Matter-js for physics
- Express
  - Knex
  - express-validator
  - cors
  - jsonwebtoken
  - bcrypt
- MySQL

### Sitemap

- Homepage - a simple, visually engaging landing page with a simple overview of what the app is and does
- Editor - a workspace for creating and modifying tracks
- Player - an HTML canvas-based environment for rendering, viewing, and playing back tracks
- Account - A simple, one-page account section for accessing user data and previously created tracks

### Mockups

- https://app.diagrams.net/#G1uashYfh3XqkXBgUhAXolH8HcopaTUp16
- Mockups of basic user interactions and rendering have been done in code

### Data

The below list contains only database information for the "1.0" version of the product, not including
"nice-to-haves"/stretch goals.

- Rigid Bodies (Marbles) - the starting locations, type, and any other necessary starting state information for a rigid
  body, with a foreign key referencing the track this body is for.
- Static Bodies (Note blocks & tracks) - Same as above for static bodies in a given track.
- Tracks - metadata for a given track, including (at a minimum) an id and a runtime, as well as a foreign key
  referencing a track's owner.
- Users - users with any necessary authorization and authentication data.

### Endpoints

- POST user/register
- POST user/login
- GET track
- POST track
- PUT track
- DELETE track

### Auth

Implement client-based session authorization using sessionStorage and localStorage, JSON web tokens, and bcrypt for
password encrpytion, allowing users to have a profile page where they can view their previously created tracks and
re-access them.

## Roadmap

- By 11/19
  - Frontend and backend repo setups, with all dependencies, and initial commits
  - Create responsive player component that can play back pre-rendered tracks and allows for scrolling around the canvas
  - Lay out and style editor page and components without functionality
  - Create and test reusable framework for creating draggable (and droppable) elements using solid-dnd
- 11/20
  - Allow for dragging and dropping of preset bodies, including marbles, note blocks, non-note track blocks, and an
    "end" block that removes marbles on collision
- 11/21
  - Create glue behavior for transitioning properly between the editor and player using the same serialized data, add
    play/pause/stop button(s)
- 11/22
  - Add sound with Tone.js, and basic note-picking algorithm
  - Add local persistence where appropriate using sessionStorage and localStorage
- 11/23
  - Consolidate and Test MVP in frontend-only environment
- 11/24
  - Create & text express server & MySQL database with necessary endpoints
  - Add remaining frontend behavior & connect frontend + backend
- 11/25
  - Test core product & merge to main
  - Nice-to-haves
- 11/26
  - Nice-to-haves
  - Final testing & final commit
  - Prepare presentation

## Nice-to-haves

- Private Tracks
- Editable details for sounds, pitches, and other note properties
- Extended set of track objects for more user options, including drawable track “lines” or a \* curve-based pen tool
- An interactive mode that renders in real time
- The ability to collaboratively edit tracks via web socket
- The ability to export audio and/or video renders of a track
