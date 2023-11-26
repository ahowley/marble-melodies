import {
  createSignal,
  createContext,
  useContext,
  Accessor,
  Setter,
  ParentComponent,
} from "solid-js";

type AuthContext = {
  userId: [Accessor<number | null>, Setter<number | null>];
};

const authContext: AuthContext = {
  userId: createSignal<number | null>(null),
};

const UserContext = createContext<AuthContext>(authContext);

export const UserProvider: ParentComponent = (props) => {
  return <UserContext.Provider value={authContext}>{props.children}</UserContext.Provider>;
};

export const useUserContext = () => useContext<AuthContext>(UserContext);
