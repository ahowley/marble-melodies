import {
  createSignal,
  createContext,
  useContext,
  Accessor,
  Setter,
  ParentComponent,
} from "solid-js";
import { SetStoreFunction, createStore } from "solid-js/store";
import { Body, WorkspaceEditor } from "../../game/canvas";
import { OpenStates } from "../toolbar/Toolbar";
import { Music } from "../../game/music";
import { SerializedBody } from "../../game/physics";

export type GameState = Omit<SerializedBody, "canvasId">[];
export type GameSettings = {
  previewOnPlayback: boolean;
};
export type SynthSettings = {
  volume: number;
};

type GameStateContext = {
  initialState: [get: GameState, SetStoreFunction<GameState>];
  settings: [get: GameSettings, SetStoreFunction<GameSettings>];
  synthSettings: [get: SynthSettings, SetStoreFunction<SynthSettings>];
  editor: [Accessor<WorkspaceEditor | null>, Setter<WorkspaceEditor | null>];
  playing: [Accessor<boolean>, Setter<boolean>];
  stopped: [Accessor<boolean>, Setter<boolean>];
  singleBodySelected: [Accessor<null | Body>, Setter<null | Body>];
  openState: [Accessor<OpenStates>, Setter<OpenStates>];
  selectedTab: [Accessor<number>, Setter<number>];
  marbleSynth: [Accessor<null | Music>, Setter<null | Music>];
};

const gameStateContext: GameStateContext = {
  initialState: createStore<GameState>([]),
  settings: createStore<GameSettings>({
    previewOnPlayback: false,
  }),
  synthSettings: createStore<SynthSettings>({
    volume: 0.5,
  }),
  editor: createSignal<WorkspaceEditor | null>(null),
  playing: createSignal(false),
  stopped: createSignal(true),
  singleBodySelected: createSignal<Body | null>(null),
  openState: createSignal<OpenStates>("closed"),
  selectedTab: createSignal(0),
  marbleSynth: createSignal<null | Music>(null),
};

const GameContext = createContext<GameStateContext>(gameStateContext);

export const GameProvider: ParentComponent = (props) => {
  return <GameContext.Provider value={gameStateContext}>{props.children}</GameContext.Provider>;
};

export const useGameContext = () => useContext<GameStateContext>(GameContext);
