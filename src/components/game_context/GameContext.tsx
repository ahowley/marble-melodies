import {
  createSignal,
  createContext,
  useContext,
  Accessor,
  Setter,
  ParentComponent,
} from "solid-js";
import { SetStoreFunction, createStore } from "solid-js/store";
import { Body, GameSettings, GameState } from "../../game/canvas";
import { OpenStates } from "../toolbar/Toolbar";

type GameStateContext = {
  initialState: [get: GameState, SetStoreFunction<GameState>];
  settings: [get: GameSettings, SetStoreFunction<GameSettings>];
  playing: [Accessor<boolean>, Setter<boolean>];
  stopped: [Accessor<boolean>, Setter<boolean>];
  singleBodySelected: [Accessor<null | Body>, Setter<null | Body>];
  openState: [Accessor<OpenStates>, Setter<OpenStates>];
  selectedTab: [Accessor<number>, Setter<number>];
};

const gameStateContext: GameStateContext = {
  initialState: createStore<GameState>([]),
  settings: createStore<GameSettings>({
    previewOnPlayback: false,
  }),
  playing: createSignal(false),
  stopped: createSignal(true),
  singleBodySelected: createSignal<Body | null>(null),
  openState: createSignal<OpenStates>("closed"),
  selectedTab: createSignal(0),
};

const GameContext = createContext<GameStateContext>(gameStateContext);

export const GameProvider: ParentComponent = (props) => {
  return <GameContext.Provider value={gameStateContext}>{props.children}</GameContext.Provider>;
};

export const useGameContext = () => useContext<GameStateContext>(GameContext);
