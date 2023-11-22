import {
  createSignal,
  createContext,
  useContext,
  Accessor,
  Setter,
  ParentComponent,
} from "solid-js";
import { Body } from "../../game/canvas";

type GameStateContext = {
  playing: [Accessor<boolean>, Setter<boolean>];
  stopped: [Accessor<boolean>, Setter<boolean>];
  singleBodySelected: [Accessor<null | Body>, Setter<null | Body>];
};
const gameStateContext = {
  playing: createSignal(false),
  stopped: createSignal(false),
  singleBodySelected: createSignal<null | Body>(null),
};
const GameContext = createContext<GameStateContext>(gameStateContext);

export const GameProvider: ParentComponent = (props) => {
  return <GameContext.Provider value={gameStateContext}>{props.children}</GameContext.Provider>;
};

export const useGameContext = () => useContext<GameStateContext>(GameContext);
